// codeguard:components:start
// codeguard:defines: inquiryStates, inquiryStatus, inquiryId, listInquiries, getInquiry, updateInquiryStatus, updateInquiryNotes, exportInquiries (and more)
import { cursorFor as cursorForRef, normalizeUtc as utcStamp } from './inquiryTime.js';
import { validateBooking as checkBooking } from './bookingValidation.js';
const inquiryIdRef = inquiryId;


export const inquiryStates = ['New', 'Contacted', 'InProgress', 'Closed', 'Archived'];
const inquiryStatesRef = inquiryStates;
export function inquiryStatus(value) {
  if (typeof value !== 'string') return null;
  const text = value.replace(/^\p{White_Space}+|\p{White_Space}+$/gu, '');
  if (inquiryStatesRef.includes(text)) return text;
  return /^[+-]?\d+$/.test(text) && Number(text) >= 0 && Number(text) <= 4 ? inquiryStatesRef[Number(text)] : null;
}
export function inquiryId(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value.toLowerCase() : null;
}
const summaryColumns = `id,reference_id AS referenceId,name,email,inquiry_category AS inquiryCategory,
  service_key AS serviceKey,status,notification_status AS notificationStatus,created_at_utc AS createdAtUtc,updated_at_utc AS updatedAtUtc`;
const summaryColumnsRef = summaryColumns;
const fullColumns = `${summaryColumnsRef},project_details AS projectDetails,notification_attempted_at_utc AS notificationAttemptedAtUtc,
  admin_notes AS adminNotes,notes_updated_by AS notesUpdatedBy`;
const fullColumnsRef = fullColumns;

export async function listInquiries(db, filter) {
  const where = [];
  const args = [];
  if (filter.search) { where.push('(instr(name,?)>0 OR instr(email,?)>0 OR instr(reference_id,?)>0)'); args.push(filter.search, filter.search, filter.search); }
  for (const [key, column] of [['category', 'inquiry_category'], ['status', 'status'], ['notificationStatus', 'notification_status']]) {
    if (filter[key]) { where.push(`${column}=?`); args.push(filter[key]); }
  }
  if (filter.fromUtc) { where.push('created_at_utc>=?'); args.push(filter.fromUtc); }
  if (filter.toExclusiveUtc) { where.push('created_at_utc<?'); args.push(filter.toExclusiveUtc); }
  if (filter.beforeUtc) { where.push('(created_at_utc<? OR (created_at_utc=? AND id<?))'); args.push(filter.beforeUtc, filter.beforeUtc, filter.beforeId); }
  const rows = (await db.prepare(`SELECT ${summaryColumnsRef} FROM inquiries${where.length ? ` WHERE ${where.join(' AND ')}` : ''}
    ORDER BY created_at_utc DESC,id DESC LIMIT ?`).bind(...args, filter.pageSize + 1).all()).results;
  const items = rows.slice(0, filter.pageSize), last = items.at(-1);
  return { items, nextCursor: rows.length > filter.pageSize ? cursorForRef(last.createdAtUtc, last.id) : null };
}
export async function getInquiry(db, id) {
  return db.prepare(`SELECT ${fullColumnsRef} FROM inquiries WHERE id=? LIMIT 1`).bind(id).first();
}
export async function updateInquiryStatus(db, id, status, expected, updated) {
  return (await db.prepare('UPDATE inquiries SET status=?,updated_at_utc=? WHERE id=? AND updated_at_utc=?').bind(status, updated, id, expected).run()).meta.changes === 1;
}
export async function updateInquiryNotes(db, id, notes, actor, expected, updated) {
  return (await db.prepare('UPDATE inquiries SET admin_notes=?,notes_updated_by=?,updated_at_utc=? WHERE id=? AND updated_at_utc=?').bind(notes, actor, updated, id, expected).run()).meta.changes === 1;
}

export async function exportInquiries(db, ids) {
  if (!ids.length) return [];
  const rows = (await db.prepare(`SELECT ${fullColumnsRef} FROM inquiries WHERE id IN (${ids.map(() => '?').join(',')}) LIMIT 100`).bind(...ids).all()).results;
  return rows.map(row => ({ ...row, status: inquiryStatesRef.indexOf(row.status) }));
}

export function validateInquiryBackup(value) {
  const invalid = () => ({ items: null, message: 'Invalid inquiry backup. Maximum 100 records.' });
  const invalidRef = invalid;
  if (!value || value.format !== 'ahmad-site-inquiries' || value.version !== 1 || !Array.isArray(value.items) || value.items.length > 100) return invalidRef();
  const items = [];
  const ids = new Set();
  const references = new Set();
  const text = (v, limit) => typeof v === 'string' && v.length <= limit;
  const textRef = text;
  for (const row of value.items) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return invalidRef();
    const id = inquiryIdRef(row.id), created = utcStamp(row.createdAtUtc), updated = utcStamp(row.updatedAtUtc);
    const attempted = row.notificationAttemptedAtUtc == null ? null : utcStamp(row.notificationAttemptedAtUtc);
    if (!id || id === '00000000-0000-0000-0000-000000000000' || ids.has(id) || !textRef(row.referenceId, 50) || !/[^\p{White_Space}]/u.test(row.referenceId) || references.has(row.referenceId)
      || !Number.isInteger(row.status) || row.status < 0 || row.status > 4 || !created || !updated || updated < created
      || !textRef(row.name, 100) || !textRef(row.email, 255) || !textRef(row.projectDetails, 4000) || !textRef(row.adminNotes, 10000)
      || row.notesUpdatedBy != null && !textRef(row.notesUpdatedBy, 255) || row.serviceKey != null && !textRef(row.serviceKey, 30)
      || row.notificationStatus != null && !['accepted', 'failed', 'disabled', 'timedOut', 'unknown'].includes(row.notificationStatus)
      || row.notificationAttemptedAtUtc != null && !attempted
      || !checkBooking({ name: row.name, email: row.email, projectDetails: row.projectDetails, serviceKey: row.serviceKey, inquiryCategory: row.inquiryCategory }, { allowPublishedService: true }).input) return invalidRef();
    ids.add(id); references.add(row.referenceId);
    items.push({ id, referenceId: row.referenceId, name: row.name, email: row.email, projectDetails: row.projectDetails,
      serviceKey: row.serviceKey ?? null, inquiryCategory: row.inquiryCategory ?? null, status: row.status, createdAtUtc: created, updatedAtUtc: updated,
      notificationStatus: row.notificationStatus ?? null, notificationAttemptedAtUtc: attempted, adminNotes: row.adminNotes, notesUpdatedBy: row.notesUpdatedBy ?? null });
  }
  return { items: items };
}

export async function importMissingInquiries(db, items) {
  if (!items.length) return { imported: 0, skipped: 0 };
  const results = await db.batch(items.map(row => db.prepare(`INSERT INTO inquiries
    (id,reference_id,name,email,project_details,service_key,inquiry_category,status,created_at_utc,updated_at_utc,notification_status,notification_attempted_at_utc,admin_notes,notes_updated_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING`).bind(row.id, row.referenceId, row.name, row.email, row.projectDetails,
    row.serviceKey, row.inquiryCategory, inquiryStatesRef[row.status], row.createdAtUtc, row.updatedAtUtc, row.notificationStatus, row.notificationAttemptedAtUtc, row.adminNotes, row.notesUpdatedBy)));
  const imported = results.reduce((count, result) => count + result.meta.changes, 0);
  return { imported, skipped: items.length - imported };
}
// codeguard:components:end
