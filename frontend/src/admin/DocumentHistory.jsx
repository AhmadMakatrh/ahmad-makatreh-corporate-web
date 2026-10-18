// codeguard:components:start
// codeguard:defines: DocumentHistory
import { useRef, useState } from 'react';
import { adminApi as api } from './adminApi';

export function DocumentHistory({ documentKey, disabled, onRestore, onPermissionError }) {
  const loadRef = load;
  const restoreRef = restore;

  const [page, setPage] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const path = `/documents/${documentKey}`;
  async function load(before) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const result = await api.get(`${path}/history${before ? `?before=${before}` : ''}`, true);
      setPage(before ? { ...result, items: [...page.items, ...result.items] } : result);
    } catch (err) { setError(err.message); if ([401, 403].includes(err.status)) onPermissionError(err); }
    finally { lock.current = false; setBusy(false); }
  }
  function restore(version) {
    if (disabled || lock.current || !window.confirm(`استعادة النسخة ${version} إلى المسودة؟ تبقى النسخة المنشورة كما هي حتى تنشر المسودة.`)) return;
    onRestore(version);
  }
  const labels = { save: 'حفظ مسودة', publish: 'نشر', rollbackPublished: 'استعادة المنشور', restore: 'استعادة إلى مسودة' };
  const labelsRef = labels;
  const actionLabel = action => action.startsWith('restore:') ? `استعادة إلى مسودة من النسخة ${action.slice(8)}` : labelsRef[action] ?? action;
  const actionLabelRef = actionLabel;
  return <section className="admin-panel"><div className="admin-toolbar-actions"><h2>سجل النسخ</h2><button type="button" className="admin-button admin-button-outline" disabled={busy || disabled} onClick={() => loadRef()}>عرض / تحديث السجل</button></div>
    <p className="admin-help">يُحمّل السجل عند الطلب فقط، 25 نسخة في كل صفحة. يبدأ التسجيل من تفعيل هذه الميزة.</p>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {page && <><ul className="admin-item-list">{page.items.map(item => <li key={item.revision}><span>#{item.revision} — {actionLabelRef(item.action)} — <time>{new Date(item.createdAtUtc).toLocaleString('ar-JO')}</time> — <span dir="ltr">{item.actor}</span></span><button type="button" className="admin-button admin-button-outline" disabled={disabled || busy} onClick={() => restoreRef(item.revision)}>استعادة إلى المسودة</button></li>)}</ul>{!page.items.length && <p>لا توجد نسخ مسجلة.</p>}{page.nextBefore && <button type="button" className="admin-button admin-button-outline" disabled={busy || disabled} onClick={() => loadRef(page.nextBefore)}>نسخ أقدم</button>}</>}
  </section>;
}
// codeguard:components:end
