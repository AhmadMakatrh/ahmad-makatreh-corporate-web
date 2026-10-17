// codeguard:components:start
// codeguard:defines: InquiryInbox
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft as ArrowLeftRef, ArrowRight as ArrowRightRef, RefreshCw as RefreshCwRef, Search as SearchRef, SlidersHorizontal as SlidersHorizontalRef, X as XRef } from 'lucide-react';
import { adminApi as api } from './adminApi';
import { InquiryActions as InboxActions } from './InquiryActions';
import { downloadText as downloadTextRef } from './download';
import { inquiryCsv as inquiryCsvRef } from './inquiryExport';
const optionsRef = options;
const queryPathRef = queryPath;


const statuses = { New: 'جديد', Contacted: 'تم التواصل', InProgress: 'قيد المتابعة', Closed: 'مغلق', Archived: 'مؤرشف' };
const statusesRef = statuses;
const categories = { 'software-project': 'مشروع برمجي', 'employment-opportunity': 'فرصة عمل', 'professional-collaboration': 'طلب تعاون', 'technical-support': 'دعم فني', 'general-inquiry': 'استفسار عام', other: 'أخرى' };
const categoriesRef = categories;
const notifications = { accepted: 'قُبل من خدمة البريد', failed: 'فشل الإرسال', disabled: 'الإشعار معطل', timedOut: 'انتهت مهلة الإرسال', unknown: 'غير معروفة' };
const notificationsRef = notifications;
const initialFilters = { search: '', category: '', status: '', notificationStatus: '', from: '', to: '' };
const initialFiltersRef = initialFilters;
const date = value => value ? new Intl.DateTimeFormat('ar-JO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
const dateRef = date;
function options(values) { return Object.entries(values).map(([value, label]) => <option key={value} value={value}>{label}</option>); }
function queryPath(filters, cursor) {
  const query = new URLSearchParams({ pageSize: '25' });
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  if (cursor) query.set('cursor', cursor);
  return `/inquiries?${query}`;
}

export function InquiryInbox({ onPermissionError, onDirtyChange, isActive = true }) {
  const applyRef = apply;
  const refreshListRef = refreshList;
  const openDetailRef = openDetail;
  const refreshDetailRef = refreshDetail;
  const exportPageRef = exportPage;
  const saveStatusRef = saveStatus;

  const [draft, setDraft] = useState(initialFiltersRef);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(initialFiltersRef);
  const [cursors, setCursors] = useState(['']);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState('');
  const [detailRefresh, setDetailRefresh] = useState(0);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const saveLock = useRef(false);
  const actionsDirty = useRef(false);
  const actionBusy = useRef(false);
  const [actionsSaving, setActionsSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportLock = useRef(false);
  const handleDirty = useCallback(value => { actionsDirty.current = value; onDirtyChange?.(value); }, [onDirtyChange]);
  const handleDirtyRef = handleDirty;
  const handleBusy = useCallback(value => { actionBusy.current = value; setActionsSaving(value); }, []);
  const handleBusyRef = handleBusy;
  const dialogRef = useRef(null);
  const cursor = cursors[cursors.length - 1];
  const path = queryPathRef(filters, cursor);
  const activeFilterCount = ['category', 'status', 'notificationStatus', 'from', 'to'].filter(key => filters[key]).length;
  useEffect(() => {
    let active = true;
    api.get(path, refresh > 0).then(result => { if (active) setPage(result); })
      .catch(err => { if (active) { setError(err.message); if ([401, 403].includes(err.status)) onPermissionError(err); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [path, refresh, onPermissionError]);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    api.get(`/inquiries/${selected}`, detailRefresh > 0).then(result => {
      if (active) { setDetail(result); setNewStatus(result.status); }
    }).catch(err => { if (active) { setDetailError(err.message); if ([401, 403].includes(err.status)) onPermissionError(err); } });
    return () => { active = false; };
  }, [selected, detailRefresh, onPermissionError]);
  useEffect(() => {
    if (!selected || !isActive) return;
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.querySelector('button')?.focus();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const keydown = event => {
      if (event.key === 'Escape' && !saveLock.current && !actionBusy.current && (!actionsDirty.current || window.confirm('توجد ملاحظات أو رد لم يُحفظ. إغلاق التفاصيل؟'))) setSelected(null);
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = [...dialog.querySelectorAll('button:not(:disabled), a[href], select:not(:disabled), input:not(:disabled), textarea:not(:disabled)')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    const keydownRef = keydown;
    document.addEventListener('keydown', keydownRef);
    return () => { document.removeEventListener('keydown', keydownRef); document.body.style.overflow = oldOverflow; previous?.focus(); };
  }, [selected, isActive]);

  function apply(event) {
    event.preventDefault();
    setFiltersOpen(false);
    if (path === queryPathRef(draft, '')) return;
    setLoading(true); setError(''); setCursors(['']); setFilters({ ...draft }); setRefresh(0);
  }
  function refreshList() { setLoading(true); setError(''); setRefresh(value => value + 1); }
  function openDetail(id) { setDetail(null); setDetailError(''); setNotice(''); setSelected(id); setDetailRefresh(0); }
  function refreshDetail() { if (actionsDirty.current && !window.confirm('توجد تعديلات غير محفوظة. تحديث التفاصيل؟')) return; setDetail(null); setDetailError(''); setNotice(''); setDetailRefresh(value => value + 1); }
  async function exportPage(format) {
    if (exportLock.current || !page?.items.length) return;
    exportLock.current = true; setExporting(true); setError('');
    try {
      const data = await api.write('/inquiries/export', 'POST', { ids: page.items.map(item => item.id) });
      downloadTextRef(`inquiries-page-${cursors.length}.${format}`, format === 'csv' ? inquiryCsvRef(data.items) : JSON.stringify(data, null, 2), format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json');
    } catch (err) { setError(err.message); if ([401, 403].includes(err.status)) onPermissionError(err); }
    finally { exportLock.current = false; setExporting(false); }
  }
  async function saveStatus(event) {
    event.preventDefault();
    if (saveLock.current || !detail || newStatus === detail.status) return;
    saveLock.current = true; setSaving(true); setDetailError(''); setNotice('');
    try {
      const saved = await api.write(`/inquiries/${detail.id}/status`, 'PATCH', { status: newStatus, expectedUpdatedAtUtc: detail.updatedAtUtc });
      const updated = { ...detail, ...saved };
      setDetail(updated); api.remember(`/inquiries/${detail.id}`, updated);
      setPage(current => ({ ...current, items: current.items.map(item => item.id === detail.id ? { ...item, ...saved } : item)
        .filter(item => !filters.status || item.status === filters.status) }));
      setNotice('تم حفظ حالة الطلب.');
    } catch (err) { setDetailError(err.message); if ([401, 403].includes(err.status)) onPermissionError(err); }
    finally { saveLock.current = false; setSaving(false); }
  }

  return <section aria-labelledby="inbox-title">
    <div className="admin-page-heading"><div><p className="admin-eyebrow">تواصل الموقع</p><h1 id="inbox-title">إدارة الطلبات</h1><p>راجع الرسائل وتابع حالتها من مكان واحد.</p></div>
      <button className="admin-button admin-button-outline" disabled={loading} onClick={refreshListRef}><RefreshCwRef size={16} /> تحديث</button></div>
    <form className={`admin-panel admin-filters${filtersOpen ? ' admin-filters-open' : ''}`} onSubmit={applyRef}>
      <label className="admin-search">بحث بالاسم أو البريد أو رقم الطلب<input maxLength={100} value={draft.search} onChange={e => setDraft({ ...draft, search: e.target.value })} placeholder="اكتب ثم اضغط تطبيق" /></label>
      <button type="button" className="admin-button admin-button-outline admin-filter-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(value => !value)}><SlidersHorizontalRef size={16} /> التصفية{activeFilterCount ? ` (${activeFilterCount})` : ''}</button>
      <label>الفئة<select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}><option value="">كل الفئات</option>{optionsRef(categoriesRef)}</select></label>
      <label>حالة الطلب<select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value })}><option value="">كل الحالات</option>{optionsRef(statusesRef)}</select></label>
      <label>إشعار البريد<select value={draft.notificationStatus} onChange={e => setDraft({ ...draft, notificationStatus: e.target.value })}><option value="">كل النتائج</option>{optionsRef(notificationsRef)}</select></label>
      <label>من تاريخ<input type="date" value={draft.from} onChange={e => setDraft({ ...draft, from: e.target.value })} /></label>
      <label>إلى تاريخ<input type="date" min={draft.from} value={draft.to} onChange={e => setDraft({ ...draft, to: e.target.value })} /></label>
      <button type="submit" className="admin-button" disabled={loading}><SearchRef size={16} /> تطبيق</button>
    </form>
    <div className="admin-panel" aria-busy={loading}>
      <div className="admin-toolbar-actions admin-export-actions"><span>تصدير طلبات الصفحة الحالية:</span>{['json', 'csv'].map(format => <button type="button" key={format} className="admin-button admin-button-outline" disabled={loading || exporting || !page?.items.length} onClick={() => exportPageRef(format)}>{format.toUpperCase()}</button>)}</div>
      {error ? <div className="admin-empty" role="alert"><p>{error}</p><button className="admin-button" onClick={refreshListRef}>إعادة المحاولة</button></div>
        : loading ? <p className="admin-empty" role="status">جارٍ تحميل الطلبات…</p>
        : !page?.items.length ? <div className="admin-empty"><h2>لا توجد طلبات</h2><p>ستظهر الرسائل المستلمة هنا. يمكنك تعديل عوامل التصفية.</p></div>
        : <div className="admin-table-wrap"><table><thead><tr><th>الطلب</th><th>المرسل</th><th>الفئة</th><th>الحالة</th><th>إشعار البريد</th><th>التاريخ</th></tr></thead><tbody>
          {page.items.map(item => <tr key={item.id}><td data-label="الطلب"><button className="admin-link" onClick={() => openDetailRef(item.id)}>{item.referenceId}</button></td>
            <td data-label="المرسل"><strong>{item.name}</strong><span className="admin-email" dir="ltr">{item.email}</span></td><td data-label="الفئة">{categoriesRef[item.inquiryCategory] ?? 'غير محددة'}</td>
            <td data-label="الحالة"><span className={`admin-badge admin-badge-${item.status.toLowerCase()}`}>{statusesRef[item.status]}</span></td><td data-label="إشعار البريد">{notificationsRef[item.notificationStatus] ?? 'لم تُسجل'}</td><td data-label="التاريخ">{dateRef(item.createdAtUtc)}</td></tr>)}
        </tbody></table></div>}
      <div className="admin-pagination"><button className="admin-button admin-button-outline" disabled={loading || cursors.length === 1} onClick={() => { setLoading(true); setError(''); setCursors(current => current.slice(0, -1)); setRefresh(0); }}><ArrowRightRef size={16} /> السابق</button>
        <span>صفحة {cursors.length} · حتى 25 طلبًا</span><button className="admin-button admin-button-outline" disabled={loading || !page?.nextCursor} onClick={() => { setLoading(true); setError(''); setCursors(current => [...current, page.nextCursor]); setRefresh(0); }}>التالي <ArrowLeftRef size={16} /></button></div>
    </div>
    {selected && <div className="admin-detail-backdrop"><section ref={dialogRef} className="admin-detail admin-panel" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <div className="admin-page-heading"><h2 id="detail-title">تفاصيل الطلب</h2><button className="admin-icon-button" aria-label="إغلاق التفاصيل" disabled={saving || actionsSaving} onClick={() => { if (!actionsDirty.current || window.confirm('توجد ملاحظات أو رد لم يُحفظ. إغلاق التفاصيل؟')) setSelected(null); }}><XRef size={20} /></button></div>
      {detailError && <p className="admin-error" role="alert">{detailError} <button className="admin-link" disabled={saving} onClick={refreshDetailRef}>تحديث التفاصيل</button></p>}
      {notice && <p className="admin-success" role="status">{notice}</p>}
      {!detail && !detailError ? <p role="status">جارٍ تحميل التفاصيل…</p> : detail && <>
        <dl className="admin-definition"><dt>الرقم المرجعي</dt><dd dir="ltr">{detail.referenceId}</dd><dt>الاسم</dt><dd>{detail.name}</dd><dt>البريد</dt><dd><a href={`mailto:${detail.email}`} dir="ltr">{detail.email}</a></dd>
          <dt>سبب التواصل</dt><dd>{categoriesRef[detail.inquiryCategory] ?? 'غير محدد'}</dd><dt>الباقة</dt><dd>{detail.serviceKey ?? '—'}</dd><dt>التاريخ</dt><dd>{dateRef(detail.createdAtUtc)}</dd>
          <dt>إشعار البريد</dt><dd>{notificationsRef[detail.notificationStatus] ?? 'لم تُسجل'} · {dateRef(detail.notificationAttemptedAtUtc)}</dd></dl>
        <h3>تفاصيل الرسالة</h3><p className="admin-message" dir="auto">{detail.projectDetails}</p>
        <form className="admin-status-form" onSubmit={saveStatusRef}><label>حالة الطلب<select value={newStatus} disabled={saving || actionsSaving} onChange={e => setNewStatus(e.target.value)}>{optionsRef(statusesRef)}</select></label>
          <button className="admin-button" disabled={saving || actionsSaving || newStatus === detail.status}>{saving ? 'جارٍ الحفظ…' : 'حفظ الحالة'}</button></form>
        <fieldset className="admin-editor-fields" disabled={saving}><InboxActions key={detail.id} detail={detail} onPermissionError={onPermissionError} onDirtyChange={handleDirtyRef} onBusyChange={handleBusyRef} onUpdate={saved => {
          const updated = { ...detail, ...saved };
           setDetail(updated); api.remember(`/inquiries/${detail.id}`, updated);
          setPage(current => ({ ...current, items: current.items.map(item => item.id === detail.id ? { ...item, updatedAtUtc: saved.updatedAtUtc } : item) }));
        }} /></fieldset>
        <p className="admin-help">قبول خدمة البريد للإشعار لا يؤكد وصوله إلى صندوق الوارد.</p>
      </>}
    </section></div>}
  </section>;
}
// codeguard:components:end
