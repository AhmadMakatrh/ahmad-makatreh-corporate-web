// codeguard:components:start
// codeguard:defines: filters, createAdminHandler
import { createAdminAccess as makeAdminAccess } from './adminAccess.js';
import { readJson as parseJsonRequest } from './httpJson.js';
import { normalizeUtc as utcStamp, nextUpdatedAt as nextTimestamp, parseCursor as decodeCursor, utcNow as nowUtc } from './inquiryTime.js';
import { getCategoryDetails as categoryDetails } from './bookingValidation.js';
import { listInquiries as listInquiriesRef, getInquiry as readInquiry, updateInquiryStatus as updateInquiryStatusRef, updateInquiryNotes as updateInquiryNotesRef, inquiryStatus as inquiryStatusRef, inquiryId as inquiryIdRef, exportInquiries as exportInquiriesRef, validateInquiryBackup as checkInquiryBackup, importMissingInquiries as importMissingInquiriesRef } from './adminInquiries.js';
import { getReply as readReply, addReply as addReplyRef, completeReply as completeReplyRef, listReplies as listRepliesRef } from './inquiryReplies.js';
import { sendInquiryReply as sendInquiryReplyRef } from './email.js';
import { createAdminDocumentHandler as makeAdminDocumentHandler } from './adminDocuments.js';
import { createAdminMediaHandler as makeAdminMediaHandler } from './adminMedia.js';

const notificationStates = ['accepted', 'failed', 'disabled', 'timedOut', 'unknown'];
const notificationStatesRef = notificationStates;
const response = (body, status = 200, headers = {}) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
const respond = response;
const error = (message, status = 400) => respond({ message }, status);
const fail = error;
const rateRejected = () => respond({ success: false, code: 'rate_limited', message: 'Rate limit exceeded. Please wait a moment before submitting again.' }, 429, { 'Retry-After': '60' });
const throttled = rateRejected;
const inquiryFilters = filters;

function filters(query) {
  const search = (query.get('search') ?? '').replace(/^\p{White_Space}+|\p{White_Space}+$/gu, '');
  const category = query.get('category') ?? '', statusText = query.get('status') ?? '', notificationStatus = query.get('notificationStatus') ?? '';
  const status = statusText ? inquiryStatusRef(statusText) : null;
  if (statusText && !status) return { message: 'Invalid inquiry status.' };
  const size = query.get('pageSize'), pageSize = size === null ? 25 : Number(size);
  if (size !== null && !/^[+]?\d+$/.test(size.trim()) || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) return { message: 'Page size must be between 1 and 100.' };
  if (search.length > 100 || category.length > 30 || category && !categoryDetails(category) || notificationStatus && !notificationStatesRef.includes(notificationStatus)) return { message: 'Invalid inquiry filters.' };
  const cursor = query.get('cursor'), before = cursor ? decodeCursor(cursor) : null;
  if (cursor && !before) return { message: 'Invalid inquiry cursor.' };
  const date = value => !value ? null : /^\d{4}-\d{2}-\d{2}$/.test(value) ? utcStamp(`${value}T00:00:00Z`) : null;
  const dateRef = date;
  const from = query.get('from'), to = query.get('to'), fromUtc = dateRef(from), toUtc = dateRef(to);
  if (from && !fromUtc || to && (!toUtc || to === '9999-12-31') || fromUtc && toUtc && fromUtc > toUtc) return { message: 'Invalid date range.' };
  const toExclusiveUtc = toUtc ? utcStamp(new Date(Date.parse(toUtc) + 86400000).toISOString()) : null;
  return { search, category, status, notificationStatus, fromUtc, toExclusiveUtc, pageSize, ...before };
}

export function createAdminHandler({ fetcher = fetch, now = Date.now, siteReader } = {}) {
  const access = makeAdminAccess({ fetcher, now });
  const accessRef = access;
  const documents = makeAdminDocumentHandler({ now, siteReader });
  const documentsRef = documents;
  const media = makeAdminMediaHandler({ now, fetcher });
  const mediaRef = media;
  return async (request, env, ctx) => {
    try {
      const identity = await accessRef.authenticate(request, env);
      if (identity instanceof Response) return identity;
      if ((await env.ADMIN_RATE_LIMITER.limit({ key: identity.email.toLowerCase() })).success !== true) return throttled();
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/$/, '').slice('/api/admin'.length);
      if (path === '/session') return request.method === 'GET' ? accessRef.session(request, env, identity) : fail('Method not allowed.', 405);
      const documentResponse = await documentsRef(request, env, identity, accessRef);
      if (documentResponse) return documentResponse;
      const mediaResponse = await mediaRef(request, env, identity, accessRef, ctx);
      if (mediaResponse) return mediaResponse;
      const route = /^\/inquiries\/([^/]+)(?:\/(status|notes|replies))?$/.exec(path), id = route ? inquiryIdRef(route[1]) : null;
      const backupAction = path === '/inquiries/export' ? 'export' : path === '/inquiries/import' ? 'import' : null;
      if (path !== '/inquiries' && !backupAction && (!route || !id)) return fail('Not found.', 404);
      const mutation = route && route[2], isReply = mutation === 'replies';
      const methods = isReply ? ['GET', 'POST'] : [backupAction ? 'POST' : mutation ? 'PATCH' : 'GET'];
      if (!methods.includes(request.method)) return fail('Method not allowed.', 405);
      if (request.method === 'GET') {
        if (isReply) {
          const cursor = url.searchParams.get('cursor'), before = cursor ? decodeCursor(cursor) : null;
          if (cursor && !before) return fail('Invalid cursor.');
          return respond(await listRepliesRef(env.DB, id, before?.beforeUtc, before?.beforeId));
        }
        if (path === '/inquiries') {
          const filter = inquiryFilters(url.searchParams); if (filter.message) return fail(filter.message);
          return respond(await listInquiriesRef(env.DB, filter));
        }
        const inquiry = await readInquiry(env.DB, id);
        return inquiry ? respond({ ...inquiry, replyEnabled: Boolean(env.BREVO_API_KEY && env.BREVO_SENDER_EMAIL) }) : fail('Not found.', 404);
      }
      const denied = await accessRef.validateMutation(request, env, identity); if (denied) return denied;
      if (isReply && (await env.ADMIN_REPLY_RATE_LIMITER.limit({ key: identity.email.toLowerCase() })).success !== true) return throttled();
      const type = (request.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase();
      if (type !== 'application/json' && !type.endsWith('+json')) return fail('Invalid request data.', 415);
      // Each of 100 records has <15,000 UTF-16 value units; 6-byte escapes plus JSON overhead fit 10 MiB.
      const parsed = await parseJsonRequest(request, backupAction === 'import' ? 10 * 1024 * 1024 : 2097152);
      if (parsed.oversized) return fail('Request body is too large.', 413);
      const body = parsed.value;
      if (parsed.invalid || !body || typeof body !== 'object' || Array.isArray(body)) return fail('Invalid request data.');
      if (backupAction === 'export') {
        const ids = Array.isArray(body.ids) ? body.ids.map(inquiryIdRef) : [];
        if (!ids.length || ids.length > 100 || ids.includes(null) || new Set(ids).size !== ids.length) return fail('Export 1–100 unique inquiries per file.');
        return respond({ format: 'ahmad-site-inquiries', version: 1, exportedAtUtc: nowUtc(now()), items: await exportInquiriesRef(env.DB, ids) });
      }
      if (backupAction === 'import') {
        const validated = checkInquiryBackup(body); if (!validated.items) return fail(validated.message);
        return respond(await importMissingInquiriesRef(env.DB, validated.items));
      }
      if (isReply) {
        const operationId = inquiryIdRef(body.operationId), nonblank = text => typeof text === 'string' && /[^\p{White_Space}]/u.test(text);
        const nonblankRef = nonblank;
        if (!operationId || operationId === '00000000-0000-0000-0000-000000000000' || !nonblankRef(body.subject) || body.subject.length > 200
          || /\p{Cc}/u.test(body.subject) || !nonblankRef(body.body) || body.body.length > 10000) return fail('Invalid reply subject, body or operation ID.');
        const same = stored => stored.inquiryId === id && stored.subject === body.subject && stored.body === body.body;
        const sameRef = same;
        let existing = await readReply(env.DB, operationId);
        if (existing) return sameRef(existing) ? respond(existing) : fail('Reply ID was used for a different message.', 409);
        if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) return respond({ title: 'SMTP replies are not configured.', status: 503 }, 503);
        const inquiry = await readInquiry(env.DB, id); if (!inquiry) return fail('Not found.', 404);
        const reply = { id: operationId, inquiryId: id, subject: body.subject, body: body.body, actor: identity.email, status: 'pending', createdAtUtc: nowUtc(now()), completedAtUtc: null };
        if (!await addReplyRef(env.DB, reply)) {
          existing = await readReply(env.DB, operationId);
          return existing && sameRef(existing) ? respond(existing) : fail('Reply ID conflict.', 409);
        }
        const completion = (async () => {
          const status = await sendInquiryReplyRef(inquiry, reply, { apiKey: env.BREVO_API_KEY, senderEmail: env.BREVO_SENDER_EMAIL, senderName: env.BREVO_SENDER_NAME }, fetcher);
          const completedAtUtc = nowUtc(now());
          await completeReplyRef(env.DB, operationId, status, completedAtUtc);
          return { ...reply, status, completedAtUtc };
        })();
        // Protect the single claimed operation from Worker cancellation when the browser disconnects.
        ctx?.waitUntil(completion.catch(exception => console.error('Reply completion unconfirmed.', exception instanceof Error ? exception.name : 'Error')));
        return respond(await completion);
      }
      const expected = utcStamp(body.expectedUpdatedAtUtc);
      const status = mutation === 'status' ? inquiryStatusRef(body.status) : null;
      if (!expected || mutation === 'status' && !status) return fail('Invalid inquiry status or revision.');
      if (mutation === 'notes' && (typeof body.notes !== 'string' || body.notes.length > 10000)) return fail('Invalid notes or revision.');
      const updated = nextTimestamp(expected, now());
      if (!updated) return fail('The request changed. Reload its details before saving.', 409);
      const saved = mutation === 'status' ? await updateInquiryStatusRef(env.DB, id, status, expected, updated)
        : await updateInquiryNotesRef(env.DB, id, body.notes, identity.email, expected, updated);
      if (!saved) return fail(mutation === 'status' ? 'The request changed. Reload its details before saving.' : 'Inquiry changed. Reload before saving.', 409);
      return mutation === 'status' ? respond({ id, status, updatedAtUtc: updated }) : respond({ id, adminNotes: body.notes, notesUpdatedBy: identity.email, updatedAtUtc: updated });
    } catch (exception) {
      console.error('Admin operation failed.', exception instanceof Error ? exception.name : 'Error');
      return fail('The admin operation could not be completed.', 500);
    }
  };
}
// codeguard:components:end
