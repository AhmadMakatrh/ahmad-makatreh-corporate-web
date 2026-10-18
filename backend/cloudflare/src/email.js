// codeguard:components:start
// codeguard:defines: sendInquiryNotification, sendInquiryReply
import { getCategoryDetails as categoryDetails, getServiceName as serviceName } from './bookingValidation.js';
const sendEmailRef = sendEmail;

/** @typedef {'accepted'|'failed'|'disabled'|'timedOut'|'unknown'} NotificationStatus */

/** @param {import('./bookingCrypto.js').Inquiry} inquiry @returns {Promise<NotificationStatus>} */
export async function sendInquiryNotification(inquiry, { apiKey, senderEmail, senderName, recipientEmail }, fetcher = fetch, { timeoutMs = 5000 } = {}) {
  if (!apiKey || !senderEmail || !recipientEmail) return 'disabled';
  if (timeoutMs <= 0) return 'unknown';
  const service = serviceName(inquiry.serviceKey), category = categoryDetails(inquiry.inquiryCategory);
  const subject = service === null
    ? `New Booking Inquiry [${inquiry.referenceId}] from ${inquiry.name}`
    : `New ${service} Inquiry [${inquiry.referenceId}] from ${inquiry.name}`;
  const payload = {
    sender: { email: senderEmail, name: senderName || 'Ahmad Makatreh Site' },
    to: [{ email: recipientEmail, name: 'Admin' }],
    replyTo: { email: inquiry.email, name: inquiry.name },
    subject: category === null ? subject : `[${category.tag}] ${subject}`,
    textContent: `Reference ID: ${inquiry.referenceId}\nTimestamp (UTC): ${inquiry.createdAtUtc.slice(0, 19).replace('T', ' ')}Z\n\nClient Name: ${inquiry.name}\nClient Email: ${inquiry.email}\n\nRequested Service: ${service ?? 'General inquiry'}\nInquiry Category: ${category?.label ?? 'Not specified'}\n\nProject Details & Scope:\n${inquiry.projectDetails}`,
  };
  return sendEmailRef(payload, apiKey, fetcher, Math.min(timeoutMs, 5000), 'timedOut');
}

export async function sendInquiryReply(inquiry, reply, { apiKey, senderEmail, senderName }, fetcher = fetch, { timeoutMs = 12000 } = {}) {
  if (!apiKey || !senderEmail || timeoutMs <= 0) return 'unknown';
  return sendEmailRef({
    sender: { email: senderEmail, name: senderName || 'Ahmad Makatreh' },
    to: [{ email: inquiry.email, name: inquiry.name }], subject: reply.subject, textContent: reply.body,
  }, apiKey, fetcher, Math.min(timeoutMs, 12000), 'unknown');
}

async function sendEmail(payload, apiKey, fetcher, timeoutMs, timeoutStatus) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher('https://api.brevo.com/v3/smtp/email', {
      method: 'POST', redirect: 'manual', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey }, body: JSON.stringify(payload),
    });
    if (!response.ok) return response.status >= 400 && response.status < 500 ? 'failed' : 'unknown';
    const result = await response.json();
    return typeof result?.messageId === 'string' && result.messageId.trim() ? 'accepted' : 'unknown';
  } catch {
    return controller.signal.aborted ? timeoutStatus : 'unknown';
  } finally { clearTimeout(timer); }
}
// codeguard:components:end
