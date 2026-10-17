// codeguard:components:start
// codeguard:defines: BackupEditor
import { useRef, useState } from 'react';
import { adminApi as api } from './adminApi';
import { downloadText as downloadTextRef } from './download';
import { InquiryBackupImporter as BackupImporter } from './InquiryBackupImporter';
import { documentBackupLimit as documentBackupLimitRef, parseDocumentBackup as parseDocumentBackupRef, serializeDocumentBackup as serializeDocumentBackupRef } from './documentBackup';

export function BackupEditor({ onPermissionError }) {
  const runRef = run;
  const readRef = read;

  const [backup, setBackup] = useState(null);
  const [key, setKey] = useState('content');
  const [source, setSource] = useState('draft');
  const [current, setCurrent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  const entry = backup?.documents.find(document => document.key === key);
  async function run(action) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await action(); }
    catch (err) { setError(err.message); if ([401, 403].includes(err.status)) onPermissionError(err); }
    finally { lock.current = false; setBusy(false); }
  }
  async function read(file) {
    setBackup(null); setCurrent(null);
    if (!file) return;
    await runRef(async () => {
      if (file.size > documentBackupLimitRef) throw new Error('الملف أكبر من الحد المسموح (32 MB).');
      const value = parseDocumentBackupRef(await file.text(), file.size);
      setBackup(value);
    });
  }
  return <section><div className="admin-page-heading"><div><p className="admin-eyebrow">إدارة الموقع</p><h1>النسخ الاحتياطي</h1><p>تصدير المستندات واستعادة مستند محدد إلى المسودة، مع التحقق من عدم تغييره في جلسة أخرى.</p></div></div>
    {error && <p className="admin-error" role="alert">{error}</p>}{notice && <p className="admin-success" role="status">{notice}</p>}
    <div className="admin-panel admin-edit-form"><button type="button" className="admin-button" disabled={busy} onClick={() => runRef(async () => { const data = await api.get('/backup/documents', true); downloadTextRef(`site-content-${new Date().toISOString().slice(0, 10)}.json`, serializeDocumentBackupRef(data)); setNotice('تم تنزيل نسخة المستندات.'); })}>تنزيل نسخة المحتوى والأسعار والصفحات</button>
      <p className="admin-help">هذه نسخة بيانات المحتوى. الطلبات تُصدّر من صندوق الطلبات؛ نسخة قاعدة البيانات وسجل النسخ وملفات الوسائط تحتاج إجراءات النسخ الكاملة الموثقة في المشروع.</p>
      <label>فتح نسخة احتياطية<input type="file" accept="application/json,.json" disabled={busy} onChange={e => readRef(e.target.files[0])} /></label>
      {backup && <><label>المستند<select value={key} disabled={busy} onChange={e => { setKey(e.target.value); setCurrent(null); }}>{['content', 'pricing', 'pages'].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>مصدر الاستعادة<select value={source} disabled={busy} onChange={e => { setSource(e.target.value); setCurrent(null); }}><option value="draft">المسودة المحفوظة</option><option value="published">النسخة المنشورة</option></select></label>
        <p>المستند في الملف: {entry ? `النسخة ${entry.revision}` : 'غير موجود'}</p>
        <button type="button" className="admin-button admin-button-outline" disabled={busy || !entry?.[source]} onClick={() => runRef(async () => { setCurrent(await api.get(`/documents/${key}`, true)); })}>مراجعة النسخة الحالية قبل الاستعادة</button>
        {current && <><p>النسخة الحالية #{current.revision}. الاستعادة تحفظ مسودة جديدة وتحتفظ بسجل النسخ؛ راجع المستند من محرره بعد الاستعادة.</p>
          <button type="button" className="admin-button" disabled={busy} onClick={() => { if (window.confirm(`استبدال مسودة ${key} ببيانات الملف؟ لا تتغير النسخة المنشورة.`)) runRef(async () => { await api.write(`/documents/${key}`, 'PUT', { expectedRevision: current.revision, data: entry[source] }); setCurrent(null); setNotice('تمت الاستعادة إلى المسودة. راجعها من محرر المستند.'); }); }}>استعادة هذا المستند إلى المسودة</button></>}
      </>}
    </div><BackupImporter onPermissionError={onPermissionError} />
  </section>;
}
// codeguard:components:end
