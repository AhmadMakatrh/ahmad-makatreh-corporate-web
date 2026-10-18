// codeguard:components:start
// codeguard:defines: InquiryBackupImporter
import { useRef, useState } from 'react';
import { adminApi as api } from './adminApi';

export function InquiryBackupImporter({ onPermissionError }) {
  const readRef = read;
  const restoreRef = restore;

  const [backup, setBackup] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function read(file) {
    setBackup(null); setError(''); setNotice('');
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('الملف أكبر من 10 MiB.');
      const value = JSON.parse(await file.text());
      if (value.format !== 'ahmad-site-inquiries' || value.version !== 1 || !Array.isArray(value.items) || value.items.length > 100) throw new Error('صيغة نسخة الطلبات غير صالحة.');
      setBackup(value);
    } catch (err) { setError(err.message); }
  }
  async function restore() {
    if (lock.current || !backup || !window.confirm('إضافة الطلبات المفقودة من الملف؟ الطلبات الموجودة لن تُستبدل، ولن يُرسل بريد أثناء الاستعادة.')) return;
    lock.current = true; setBusy(true); setError('');
    try { const result = await api.write('/inquiries/import', 'POST', backup); setNotice(`تمت إضافة ${result.imported} طلبًا؛ تخطّي ${result.skipped} طلبًا موجودًا.`); setBackup(null); }
    catch (err) { setError(err.message); if ([401, 403].includes(err.status)) onPermissionError(err); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className="admin-panel admin-edit-form"><h2>استعادة الطلبات</h2><p className="admin-help">ملفات JSON المصدّرة من صندوق الطلبات، حتى 100 طلب لكل ملف. تُضاف السجلات المفقودة فقط؛ النسخة الكاملة تشمل سجل الردود وتؤخذ من PostgreSQL.</p>
    <label>نسخة الطلبات<input type="file" accept="application/json,.json" disabled={busy} onChange={e => readRef(e.target.files[0])} /></label>
    {backup && <><p>{backup.items.length} طلبًا في الملف.</p><button type="button" className="admin-button" disabled={busy} onClick={restoreRef}>استعادة السجلات المفقودة</button></>}
    {error && <p className="admin-error" role="alert">{error}</p>}{notice && <p className="admin-success" role="status">{notice}</p>}
  </div>;
}
// codeguard:components:end
