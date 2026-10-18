// codeguard:components:start
// codeguard:defines: getReply, addReply, completeReply, listReplies
import { cursorFor as cursorForRef } from './inquiryTime.js';

const columns = 'id,inquiry_id AS inquiryId,subject,body,actor,status,created_at_utc AS createdAtUtc,completed_at_utc AS completedAtUtc';
const columnsRef = columns;
export async function getReply(db, id) {
  return db.prepare(`SELECT ${columnsRef} FROM inquiry_replies WHERE id=? LIMIT 1`).bind(id).first();
}
export async function addReply(db, reply) {
  return (await db.prepare(`INSERT INTO inquiry_replies (id,inquiry_id,subject,body,actor,status,created_at_utc)
    VALUES (?,?,?,?,?,'pending',?) ON CONFLICT(id) DO NOTHING`).bind(reply.id, reply.inquiryId, reply.subject, reply.body, reply.actor, reply.createdAtUtc).run()).meta.changes === 1;
}
export async function completeReply(db, id, status, completedAtUtc, { timeoutMs = 5000 } = {}) {
  let timer;
  try {
    const write = db.prepare("UPDATE inquiry_replies SET status=?,completed_at_utc=? WHERE id=? AND status='pending'").bind(status, completedAtUtc, id).run();
    const result = await Promise.race([write, new Promise((_resolve, reject) => { timer = setTimeout(() => reject(new Error('Reply completion timed out.')), Math.min(timeoutMs, 5000)); })]);
    if (result.meta.changes !== 1) throw new Error('Reply completion was not recorded.');
  } finally { clearTimeout(timer); }
}
export async function listReplies(db, inquiryId, beforeUtc, beforeId) {
  const args = [inquiryId];
  const before = beforeUtc ? ' AND (created_at_utc<? OR (created_at_utc=? AND id<?))' : '';
  if (beforeUtc) args.push(beforeUtc, beforeUtc, beforeId);
  const rows = (await db.prepare(`SELECT ${columnsRef} FROM inquiry_replies WHERE inquiry_id=?${before} ORDER BY created_at_utc DESC,id DESC LIMIT 26`).bind(...args).all()).results;
  const items = rows.slice(0, 25), last = items.at(-1);
  return { items, nextCursor: rows.length > 25 ? cursorForRef(last.createdAtUtc, last.id) : null };
}
// codeguard:components:end
