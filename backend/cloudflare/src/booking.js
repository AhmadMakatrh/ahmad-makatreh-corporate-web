// codeguard:components:start
// codeguard:defines: reply, failure, createBookingHandler
import { validateBooking as checkBooking, isKnownService as knownService } from './bookingValidation.js';
import { hashBookingIdentity as hashIdentity, createInquiry as makeInquiry } from './bookingCrypto.js';
import { storeInquiry as storeInquiryRef, recordNotification as logNotification } from './inquiries.js';
import { verifyTurnstile as checkTurnstile } from './turnstile.js';
import { sendInquiryNotification as sendInquiryNotificationRef } from './email.js';
import { readJson as parseJsonRequest } from './httpJson.js';
const respond = reply;
const fail = failure;

function reply(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}
function failure(message, status = 400, extra = {}, errors = [message]) {
  const headers = extra.retryAfterSeconds ? { 'Retry-After': String(extra.retryAfterSeconds) } : {};
  return respond({ success: false, referenceId: null, message, errors, ...extra }, status, headers);
}
/** @returns {(request:Request,env:object)=>Promise<Response>} */
export function createBookingHandler({ fetcher = fetch, now = Date.now, siteReader }) {
  return async (request, env) => {
    // Reserve response time inside the current client's 10s deadline; D1 writes cannot be cancelled.
    const responseDeadline = Date.now() + 9000;
    const remainingBudget = () => Math.max(0, responseDeadline - Date.now());
    const remainingBudgetRef = remainingBudget;
    if (!(request.headers.get('Content-Type') ?? '').toLowerCase().split(';')[0].trim().endsWith('/json')) return fail('Invalid request data.', 415);
    const body = await parseJsonRequest(request);
    if (body.oversized) return fail('Request body is too large.', 413);
    if (body.invalid) return fail('Validation failed for submitted data.');
    const validation = checkBooking(body.value, { allowPublishedService: true });
    if (!validation.input) return fail('Validation failed for submitted data.', 400, {}, validation.errors);
    const input = validation.input, allowedHostnames = (env.TURNSTILE_ALLOWED_HOSTNAMES ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (typeof env.DB?.batch !== 'function' || typeof env.DB?.prepare !== 'function'
      || typeof env.BOOKING_RATE_LIMITER?.limit !== 'function'
      || typeof env.BOOKING_HMAC_KEY !== 'string' || new TextEncoder().encode(env.BOOKING_HMAC_KEY).length < 32
      || !env.TURNSTILE_SECRET_KEY?.trim() || !allowedHostnames.length) {
      return fail('Unable to process your inquiry at this time. Please try again later.', 503);
    }
    let identity;
    try { identity = await hashIdentity(env.BOOKING_HMAC_KEY, request.headers.get('CF-Connecting-IP'), input); }
    catch { return fail('Unable to determine the client network address.'); }
    try {
      const limit = await env.BOOKING_RATE_LIMITER.limit({ key: identity.ipHash });
      if (limit.success !== true) return fail('Too many requests. Please try again later.', 429, { code: 'rate_limited', retryAfterSeconds: 60 });
      const verification = await checkTurnstile({ token: input.turnstileToken, clientIp: request.headers.get('CF-Connecting-IP'), secret: env.TURNSTILE_SECRET_KEY, allowedHostnames }, fetcher);
      if (!verification.valid) return fail(verification.error);
      if (input.serviceKey !== null && !knownService(input.serviceKey)) {
        const snapshot = await siteReader.read(env.DB);
        if (!snapshot.documents.pricing?.packages?.some(p => p.key === input.serviceKey && !p.hidden)) return fail('Validation failed for submitted data.', 400, {}, ['Please select a valid service.']);
      }
      let inquiry;
      for (let attempt = 0; attempt < 3; attempt++) {
        const candidate = makeInquiry(input, now());
        const candidateRef = candidate;
        let outcome;
        try { outcome = await storeInquiryRef(env.DB, candidateRef, identity.ipHash, identity.payloadHash, now()); }
        catch (error) {
          if (attempt < 2 && String(error?.message).includes('UNIQUE constraint failed: inquiries.reference_id')) continue;
          throw error;
        }
        if (outcome.disposition === 'duplicate') return fail('This request was already submitted.', 409, { code: 'duplicate_submission' });
        if (outcome.disposition === 'blocked') return fail('Submissions from this network are temporarily blocked after repeated identical requests.', 429, { code: 'ip_blocked', retryAfterSeconds: outcome.retryAfterSeconds });
        inquiry = candidateRef; break;
      }
      let notificationStatus = await sendInquiryNotificationRef(inquiry, {
        apiKey: env.BREVO_API_KEY, senderEmail: env.BREVO_SENDER_EMAIL, senderName: env.BREVO_SENDER_NAME, recipientEmail: env.BREVO_RECIPIENT_EMAIL,
      }, fetcher, { timeoutMs: remainingBudgetRef() });
      try { await logNotification(env.DB, inquiry.id, notificationStatus, new Date(now()).toISOString(), remainingBudgetRef()); }
      catch { console.warn('Booking notification outcome could not be recorded; inquiry remains saved.'); notificationStatus = 'unknown'; }
      return respond({ success: true, referenceId: inquiry.referenceId, message: 'Your inquiry has been received successfully. We will get back to you shortly.', errors: null, notificationStatus });
    } catch {
      console.error('Booking processing unavailable.');
      return fail('Unable to process your inquiry at this time. Please try again later.', 503);
    }
  };
}
// codeguard:components:end
