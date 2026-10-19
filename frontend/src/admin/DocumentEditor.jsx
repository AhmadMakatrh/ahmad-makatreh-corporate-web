// codeguard:components:start
// codeguard:defines: LocalizedFields, DocumentEditor
import { useEffect, useRef, useState } from 'react';
import { RefreshCw as RefreshCwRef, Save as SaveRef, Send as SendRef } from 'lucide-react';
import { adminApi as api } from './adminApi';
import { DocumentHistory as RevisionHistory } from './DocumentHistory';

export function LocalizedFields({ label, value, onChange, multiline = false, required = false }) {
  const Tag = multiline ? 'textarea' : 'input';
  const TagRef = Tag;
  return <fieldset className="admin-localized"><legend>{label}</legend>{['ar', 'en'].map(language => <label key={language}>{language === 'ar' ? 'العربية' : 'English'}
    <TagRef dir={language === 'ar' ? 'rtl' : 'ltr'} required={required} value={value?.[language] ?? ''} onChange={e => onChange({ ...value, [language]: e.target.value })} /></label>)}</fieldset>;
}

export function DocumentEditor({ documentKey, title, description, initialValue, onPermissionError, onDirtyChange, children }) {
  const refreshDocumentRef = refreshDocument;
  const executeRef = execute;

  const [document, setDocument] = useState(null);
  const [draft, setDraft] = useState(null);
  const [savedJson, setSavedJson] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const lock = useRef(false);
  const path = `/documents/${documentKey}`;
  const dirty = draft != null && JSON.stringify(draft) !== savedJson;
  useEffect(() => {
    let active = true;
    api.get(path, reload > 0).then(result => {
      if (!active) return;
      const data = result.draft ?? structuredClone(initialValue);
      setDocument(result); setDraft(data); setSavedJson(JSON.stringify(data));
    }).catch(err => { if (active) { setError(err.message); if ([401, 403].includes(err.status)) onPermissionError(err); } });
    return () => { active = false; };
  }, [path, reload, initialValue, onPermissionError]);
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const prevent = event => { event.preventDefault(); event.returnValue = ''; };
    const preventRef = prevent;
    window.addEventListener('beforeunload', preventRef);
    return () => window.removeEventListener('beforeunload', preventRef);
  }, [dirty]);
  function refreshDocument() {
    if (lock.current) return;
    if (dirty && !window.confirm('توجد تعديلات لم تُحفظ. هل تريد تحميل النسخة المحفوظة؟')) return;
    setDocument(null); setDraft(null); setError(''); setNotice(''); setReload(value => value + 1);
  }
  async function execute(action, version) {
    if (lock.current || !document) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      if (action === 'history') {
        const result = await api.write(`${path}/restore`, 'POST', { revision: version, expectedRevision: document.revision });
        const updated = { ...document, revision: result.revision, draft: result.draft, isPublished: false };
        setDraft(result.draft); setSavedJson(JSON.stringify(result.draft)); setDocument(updated); api.remember(path, updated);
        setNotice('تمت استعادة النسخة إلى المسودة. راجعها ثم انشرها.');
        return;
      }
      const result = action === 'save'
        ? await api.write(path, 'PUT', { expectedRevision: document.revision, data: draft })
        : await api.write(`${path}/publish`, 'POST', { expectedRevision: document.revision, restorePrevious: action === 'restore' });
      const updated = { ...document, ...result, draft, isPublished: action === 'publish', hasPrevious: action === 'save' ? document.hasPrevious : Boolean(document.publishedAtUtc) };
      setDocument(updated); api.remember(path, updated);
      if (action === 'save') setSavedJson(JSON.stringify(draft));
      setNotice(action === 'save' ? 'تم حفظ المسودة. لم يتغير الموقع المنشور.' : action === 'restore' ? 'تم نشر النسخة السابقة. المسودة الحالية محفوظة.' : 'تم نشر التعديلات. ستظهر تلقائيًا في الصفحات المفتوحة بعد تجدد البيانات.');
    } catch (err) { setError(err.message); if ([401, 403].includes(err.status)) onPermissionError(err); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section>
    <div className="admin-page-heading"><div><p className="admin-eyebrow">إدارة الموقع</p><h1>{title}</h1><p>{description}</p></div>
      <button type="button" className="admin-button admin-button-outline" disabled={busy} onClick={refreshDocumentRef}><RefreshCwRef size={16} /> تحديث</button></div>
    {error && <p className="admin-error" role="alert">{error}</p>}{notice && <p className="admin-success" role="status">{notice}</p>}
    {!draft ? <div className="admin-panel admin-empty">{error ? <button className="admin-button" onClick={refreshDocumentRef}>إعادة المحاولة</button> : <p role="status">جارٍ تحميل البيانات…</p>}</div>
      : <><div className="admin-panel admin-editor-toolbar"><span>{dirty ? 'تعديلات غير محفوظة' : document.revision ? 'المسودة محفوظة' : 'المحتوى الحالي للموقع'}</span>
        <div className="admin-toolbar-actions"><button type="button" className="admin-button" disabled={busy || (!dirty && document.revision > 0)} onClick={() => executeRef('save')}><SaveRef size={16} /> حفظ المسودة</button>
          <button type="button" className="admin-button admin-button-outline" disabled={busy || dirty || document.revision === 0 || document.isPublished} onClick={() => executeRef('publish')}><SendRef size={16} /> نشر</button>
          {document.hasPrevious && <button type="button" className="admin-link" disabled={busy || dirty} onClick={() => { if (window.confirm('هل تريد إعادة نشر النسخة المنشورة السابقة؟')) executeRef('restore'); }}>استعادة المنشور السابق</button>}</div></div>
        <fieldset className="admin-editor-fields" disabled={busy}>{children(draft, setDraft)}</fieldset>
        <RevisionHistory key={`${documentKey}-${document.revision}`} documentKey={documentKey} disabled={busy || dirty} onPermissionError={onPermissionError} onRestore={version => executeRef('history', version)} /></>}
  </section>;
}
// codeguard:components:end
