// codeguard:components:start
// codeguard:defines: storeInquiry, recordNotification, cleanupAbuse
import { normalizeUtc as utcStamp } from './inquiryTime.js';
/** @typedef {{disposition:'stored'|'duplicate'|'blocked',retryAfterSeconds?:number}} SubmissionOutcome */

/** @param {import('./bookingCrypto.js').Inquiry} inquiry @returns {Promise<SubmissionOutcome>} */
export async function storeInquiry(db, inquiry, ipHash, payloadHash, nowMs) {
  const expires = nowMs + 1800000;
  // D1.batch makes the gate, block and insert indivisible across simultaneous submissions.
  const results = await db.batch([
    db.prepare(`INSERT INTO booking_submission_guards
      (ip_hash,payload_hash,attempt_count,window_started_at_ms,expires_at_ms,original_inquiry_id)
      SELECT ?1,?2,1,?3,?4,?5 WHERE NOT EXISTS
        (SELECT 1 FROM booking_ip_blocks WHERE ip_hash=?1 AND blocked_until_ms>?3)
      ON CONFLICT(ip_hash,payload_hash) DO UPDATE SET
        attempt_count=CASE WHEN expires_at_ms<=?3 THEN 1 ELSE MIN(attempt_count+1,6) END,
        window_started_at_ms=CASE WHEN expires_at_ms<=?3 THEN ?3 ELSE window_started_at_ms END,
        original_inquiry_id=CASE WHEN expires_at_ms<=?3 THEN ?5 ELSE original_inquiry_id END,
        expires_at_ms=CASE WHEN expires_at_ms<=?3 THEN ?4 ELSE expires_at_ms END
    `).bind(ipHash, payloadHash, nowMs, expires, inquiry.id),
    db.prepare(`INSERT INTO booking_ip_blocks (ip_hash,blocked_until_ms)
      SELECT ?1,?4 FROM booking_submission_guards
      WHERE ip_hash=?1 AND payload_hash=?2 AND attempt_count=6 AND expires_at_ms>?3
      ON CONFLICT(ip_hash) DO UPDATE SET blocked_until_ms=excluded.blocked_until_ms
      WHERE booking_ip_blocks.blocked_until_ms<=?3
    `).bind(ipHash, payloadHash, nowMs, expires),
    db.prepare(`INSERT INTO inquiries
      (id,reference_id,name,email,project_details,service_key,inquiry_category,status,created_at_utc,updated_at_utc)
      SELECT ?1,?2,?3,?4,?5,?6,?7,?8,?9,?10 FROM booking_submission_guards
      WHERE ip_hash=?11 AND payload_hash=?12 AND original_inquiry_id=?1 AND attempt_count=1
        AND NOT EXISTS (SELECT 1 FROM booking_ip_blocks WHERE ip_hash=?11 AND blocked_until_ms>?13)
    `).bind(inquiry.id, inquiry.referenceId, inquiry.name, inquiry.email, inquiry.projectDetails,
      inquiry.serviceKey, inquiry.inquiryCategory, inquiry.status, utcStamp(inquiry.createdAtUtc), utcStamp(inquiry.updatedAtUtc),
      ipHash, payloadHash, nowMs),
    db.prepare(`SELECT CASE
      WHEN EXISTS (SELECT 1 FROM booking_ip_blocks WHERE ip_hash=?1 AND blocked_until_ms>?3) THEN 'blocked'
      WHEN EXISTS (SELECT 1 FROM booking_submission_guards WHERE ip_hash=?1 AND payload_hash=?2
        AND original_inquiry_id=?4 AND attempt_count=1) THEN 'stored'
      ELSE 'duplicate' END AS disposition,
      (SELECT CAST((blocked_until_ms-?3+999)/1000 AS INTEGER) FROM booking_ip_blocks
        WHERE ip_hash=?1 AND blocked_until_ms>?3) AS retry_after_seconds
    `).bind(ipHash, payloadHash, nowMs, inquiry.id),
  ]);
  const row = results[3].results[0];
  if (!row || !['stored', 'duplicate', 'blocked'].includes(row.disposition)) throw new Error('The booking submission guard returned no result.');
  return row.disposition === 'blocked'
    ? { disposition: 'blocked', retryAfterSeconds: Math.max(1, row.retry_after_seconds) }
    : { disposition: row.disposition };
}

export async function recordNotification(db, inquiryId, status, attemptedAtUtc, timeoutMs = 3000, expectedAttemptedAtUtc) {
  if (timeoutMs <= 0) throw new Error('Notification outcome recording budget exhausted.');
  let timer;
  try {
    // D1 cannot cancel an in-flight write; timeout means unknown, never retry it.
    const scoped = expectedAttemptedAtUtc === undefined ? '' : " AND notification_status='unknown' AND notification_attempted_at_utc=?";
    const update = db.prepare(`UPDATE inquiries SET notification_status=?,notification_attempted_at_utc=?
      WHERE id=?${scoped}`).bind(status, utcStamp(attemptedAtUtc), inquiryId,
      ...(expectedAttemptedAtUtc === undefined ? [] : [expectedAttemptedAtUtc])).run();
    const result = await Promise.race([update, new Promise((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error('Notification outcome recording timed out.')), Math.min(timeoutMs, 3000));
    })]);
    if (result.meta.changes !== 1) throw new Error('Notification outcome could not be recorded.');
  } finally { clearTimeout(timer); }
}

export async function cleanupAbuse(db, nowMs) {
  const results = await db.batch([
    db.prepare(`DELETE FROM booking_submission_guards WHERE (ip_hash,payload_hash) IN
      (SELECT ip_hash,payload_hash FROM booking_submission_guards
        WHERE expires_at_ms<=? ORDER BY expires_at_ms LIMIT 1000)`).bind(nowMs),
    db.prepare(`DELETE FROM booking_ip_blocks WHERE ip_hash IN
      (SELECT ip_hash FROM booking_ip_blocks WHERE blocked_until_ms<=? ORDER BY blocked_until_ms LIMIT 1000)`).bind(nowMs),
  ]);
  return { guardsDeleted: results[0].meta.changes, blocksDeleted: results[1].meta.changes };
}
// codeguard:components:end
