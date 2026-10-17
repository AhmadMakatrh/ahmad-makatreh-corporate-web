// codeguard:components:start
// codeguard:defines: InquiryActions
import { useEffect, useRef, useState } from 'react';
import { adminApi as api } from './adminApi';

const replyStates = { pending: 'قيد التنفيذ أو نتيجته لم تُسجل بعد', accepted: 'قُبل الرد من SMTP', failed: 'فشل إرسال الرد', unknown: 'نتيجة الإرسال غير مؤكدة؛ تحقق قبل إرسال رد جديد' };
const replyStatesRef = replyStates;

export function InquiryActions({ detail, onUpdate, onPermissionError, onDirtyChange, onBusyChange }) {
  const runRef = run;
  const sendRef = send;

  const [notes, setNotes] = useState(detail.adminNotes ?? '');
  const [subject, setSubject] = useState(`Re: [${detail.referenceId}]`);
  const [body, setBody] = useState('');
  const [operationId, setOperationId] = useState(() => crypto.randomUUID());
  const [result, setResult] = useState(null);
  const [attempted, setAttempted] = useState(false);
  const [replies, setReplies] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  const dirty = notes !== (detail.adminNotes ?? '') || Boolean(body);
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const prevent = event => { event.preventDefault(); event.returnValue = ''; };
    const preventRef = prevent;
    window.addEventListener('beforeunload', preventRef);
    return () => window.removeEventListener('beforeunload', preventRef);
  }, [dirty]);
  async function run(work) {
    if (lock.current) return;
    lock.current = true; setBusy(true); onBusyChange(true); setError(''); setNotice('');
    try { await work(); }
    catch (err) { setError(err.message); if ([401, 403].includes(err.status)) onPermissionError(err); }
    finally { lock.current = false; setBusy(false); onBusyChange(false); }
  }
  function send() {
    if (!attempted && !window.confirm(`إرسال هذا الرد إلى ${detail.email}؟`)) return;
    runRef(async () => {
      setAttempted(true);
      const saved = await api.write(`/inquiries/${detail.id}/replies`, 'POST', { operationId, subject, body });
      setResult(saved); setNotice(replyStatesRef[saved.status]);
      setReplies(current => current ? { ...current, items: [saved, ...current.items.filter(item => item.id !== saved.id)] } : null);
      if (saved.status === 'accepted') setBody('');
    });
  }
  const frozen = attempted;
  return <section className="admin-edit-form"><h3>ملاحظات خاصة بالإدارة</h3><label>الملاحظات<textarea value={notes} maxLength={10000} disabled={busy} onChange={e => setNotes(e.target.value)} /></label>
    <button type="button" className="admin-button" disabled={busy || notes === (detail.adminNotes ?? '')} onClick={() => runRef(async () => { const saved = await api.write(`/inquiries/${detail.id}/notes`, 'PATCH', { notes, expectedUpdatedAtUtc: detail.updatedAtUtc }); onUpdate(saved); setNotice('تم حفظ الملاحظات.'); })}>حفظ الملاحظات</button>
    {detail.notesUpdatedBy && <small>آخر محرر: <span dir="ltr">{detail.notesUpdatedBy}</span></small>}
    <h3>الرد بالبريد</h3>{!detail.replyEnabled && <p className="admin-help">يلزم إعداد SMTP على الخادم لتفعيل الإرسال.</p>}
    <label>عنوان الرد<input dir="auto" maxLength={200} value={subject} disabled={busy || frozen} onChange={e => setSubject(e.target.value)} /></label>
    <label>نص الرد<textarea dir="auto" rows={6} maxLength={10000} value={body} disabled={busy || frozen} onChange={e => setBody(e.target.value)} /></label>
    <div className="admin-toolbar-actions"><button type="button" className="admin-button" disabled={busy || !detail.replyEnabled || !body.trim() || !subject.trim() || result?.status === 'accepted'} onClick={sendRef}>{attempted ? 'التحقق من حالة هذا الرد' : 'إرسال الرد'}</button>
      {attempted && <button type="button" className="admin-button admin-button-outline" disabled={busy} onClick={() => { if (!result || result.status === 'unknown' || result.status === 'pending') { if (!window.confirm('نتيجة الرد السابق غير مؤكدة. بدء رد جديد قد يؤدي إلى وصول رسالتين. هل تحققت من البريد؟')) return; } setOperationId(crypto.randomUUID()); setResult(null); setAttempted(false); setBody(''); setNotice(''); }}>بدء رد جديد</button>}</div>
    {error && <p className="admin-error" role="alert">{error}</p>}{notice && <p className={result && result.status !== 'accepted' ? 'admin-error' : 'admin-success'} role="status">{notice}</p>}
    <p className="admin-help">الإرسال يدوي. عند انقطاع الاتصال، النقر مجددًا يستخدم نفس معرّف الرد؛ لا يعيد SMTP الإرسال. قبول SMTP لا يثبت وصول البريد إلى صندوق الوارد.</p>
    <button type="button" className="admin-button admin-button-outline" disabled={busy} onClick={() => runRef(async () => { setReplies(await api.get(`/inquiries/${detail.id}/replies`, true)); })}>عرض / تحديث سجل الردود</button>
    {replies && <><ul className="admin-item-list">{replies.items.map(reply => <li key={reply.id}><strong>{reply.subject}</strong><p className="admin-help">{replyStatesRef[reply.status]} — {new Date(reply.createdAtUtc).toLocaleString('ar-JO')} — {reply.actor}</p><p className="admin-message" dir="auto">{reply.body}</p></li>)}</ul>{!replies.items.length && <p>لم تُسجّل ردود.</p>}
      {replies.nextCursor && <button type="button" className="admin-button admin-button-outline" disabled={busy} onClick={() => runRef(async () => { const next = await api.get(`/inquiries/${detail.id}/replies?cursor=${encodeURIComponent(replies.nextCursor)}`); setReplies({ ...next, items: [...replies.items, ...next.items] }); })}>ردود أقدم</button>}</>}
  </section>;
}
// codeguard:components:end
