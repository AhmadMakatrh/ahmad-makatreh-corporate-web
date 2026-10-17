// codeguard:components:start
// codeguard:defines: csvCell, inquiryCsv
const csvCellRef = csvCell;
export function csvCell(value) {
  const text = String(value ?? '');
  const safe = /^\s*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function inquiryCsv(items) {
  const fields = ['referenceId', 'name', 'email', 'inquiryCategory', 'serviceKey', 'status', 'createdAtUtc', 'projectDetails', 'adminNotes'];
  const fieldsRef = fields;
  return '\uFEFF' + [fieldsRef, ...items.map(item => fieldsRef.map(key => item[key]))].map(row => row.map(csvCellRef).join(',')).join('\r\n');
}
// codeguard:components:end
