// codeguard:components:start
// codeguard:defines: documentBackupLimit, serializeDocumentBackup, parseDocumentBackup
export const documentBackupLimit = 32 * 1024 * 1024;
const documentBackupLimitRef = documentBackupLimit;

export function serializeDocumentBackup(data) { return JSON.stringify(data); }

export function parseDocumentBackup(text, byteLength) {
  if (byteLength > documentBackupLimitRef) throw new Error('الملف أكبر من الحد المسموح (32 MB).');
  const invalid = () => new Error('صيغة النسخة الاحتياطية غير صالحة.');
  const invalidRef = invalid;
  let value;
  try { value = JSON.parse(text); } catch { throw invalidRef(); }
  if (!value || value.format !== 'ahmad-site-documents' || value.version !== 1 || !Array.isArray(value.documents) || value.documents.length > 3
    || value.documents.some(item => !item || !['content','pricing','pages'].includes(item.key) || !item.draft || typeof item.draft !== 'object' || Array.isArray(item.draft))
    || new Set(value.documents.map(item => item.key)).size !== value.documents.length) throw invalidRef();
  return value;
}
// codeguard:components:end
