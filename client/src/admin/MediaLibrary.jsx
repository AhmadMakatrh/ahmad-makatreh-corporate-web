// codeguard:components:start
// codeguard:defines: MediaLibrary, AssetField
import { useEffect, useId, useRef, useState } from 'react';
import { adminApi as api } from './adminApi';
const MediaLibraryRef = MediaLibrary;


export function MediaLibrary({ onSelect, onPermissionError, imagesOnly = false }) {
  const actionRef = action;
  const uploadRef = upload;

  const [page, setPage] = useState(null);
  const [cursor, setCursor] = useState('');
  const [previous, setPrevious] = useState([]);
  const [file, setFile] = useState(null);
  const [uploadId, setUploadId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const lock = useRef(false);
  const fileRef = useRef(null);
  const permission = useRef(onPermissionError);
  useEffect(() => { permission.current = onPermissionError; }, [onPermissionError]);
  useEffect(() => {
    let active = true;
    api.get(`/media${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`, reload > 0).then(result => { if (active) setPage(result); })
      .catch(err => { if (active) { setError(err.message); if ([401, 403].includes(err.status)) permission.current?.(err); } });
    return () => { active = false; };
  }, [cursor, reload]);
  async function action(work) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await work(); }
    catch (err) { setError(err.message); if ([401, 403].includes(err.status)) permission.current?.(err); }
    finally { lock.current = false; setBusy(false); }
  }
  async function upload() {
    if (!file || !uploadId) return;
    await actionRef(async () => {
      if (file.size > 10 * 1024 * 1024) throw new Error('الملف أكبر من 10 MiB.');
      const asset = await api.upload(uploadId, file);
      setFile(null); setUploadId(null); fileRef.current.value = '';
      setPage(current => ({ ...current, items: [asset, ...current.items.filter(item => item.id !== asset.id)].slice(0, 25) }));
      setNotice('تم رفع الملف. اختيار الملف في المحتوى لا ينشره تلقائيًا.');
    });
  }
  const rows = (page?.items ?? []).filter(item => !imagesOnly || item.contentType.startsWith('image/'));
  return <section className="admin-panel admin-edit-form" aria-label="مكتبة الوسائط"><div className="admin-toolbar-actions"><h2>مكتبة الوسائط</h2><button type="button" className="admin-button admin-button-outline" disabled={busy} onClick={() => { setError(''); setReload(value => value + 1); }}>تحديث</button></div>
    <p className="admin-help">PNG / JPEG / WebP / PDF حتى 10 MiB. الملفات المرفوعة متاحة عبر الرابط العام؛ ارفع مواد الموقع العامة فقط.</p>
    {error && <p className="admin-error" role="alert">{error}</p>}{notice && <p className="admin-success" role="status">{notice}</p>}
    {page && !page.configured && <p className="admin-error">يلزم إعداد مخزن الملفات على الخادم قبل الرفع.</p>}
    <label>اختر ملفًا<input ref={fileRef} type="file" accept={imagesOnly ? 'image/png,image/jpeg,image/webp' : 'image/png,image/jpeg,image/webp,application/pdf'} disabled={busy || !page?.configured} onChange={e => { setFile(e.target.files[0] ?? null); setUploadId(e.target.files[0] ? crypto.randomUUID() : null); }} /></label>
    <button type="button" className="admin-button" disabled={busy || !file || !page?.configured} onClick={uploadRef}>{busy ? 'جارٍ التنفيذ…' : 'رفع الملف'}</button>
    {!page ? <p role="status">جارٍ تحميل المكتبة…</p> : <><div className="admin-media-grid">{rows.map(item => <div className="admin-media-item" key={item.id}>{item.contentType.startsWith('image/') && <img src={item.url} alt="" loading="lazy" />}<strong>{item.originalName}</strong><small>{Math.ceil(item.size / 1024)} KiB</small><div className="admin-toolbar-actions">
      <a className="admin-link" href={item.url} target="_blank" rel="noopener noreferrer">فتح</a>{onSelect && <button type="button" className="admin-button admin-button-outline" disabled={busy} onClick={() => onSelect(item.url)}>اختيار</button>}
      <button type="button" className="admin-link" disabled={busy} onClick={() => { if (window.confirm('إزالة الملف من المكتبة؟ يحتفظ التخزين بالملف لحماية الروابط وسجل النسخ.')) actionRef(async () => { await api.write(`/media/${item.id}/archive`, 'POST', {}); setPage(current => ({ ...current, items: current.items.filter(row => row.id !== item.id) })); setNotice('أزيل الملف من المكتبة. الملف الأصلي محفوظ في التخزين.'); }); }}>إزالة من المكتبة</button>
    </div></div>)}</div>{!rows.length && <p>لا توجد ملفات في هذه الصفحة.</p>}
    <div className="admin-toolbar-actions"><button type="button" className="admin-button admin-button-outline" disabled={busy || !previous.length} onClick={() => { setCursor(previous.at(-1)); setPrevious(previous.slice(0, -1)); setPage(null); }}>السابقة</button><button type="button" className="admin-button admin-button-outline" disabled={busy || !page.nextCursor} onClick={() => { setPrevious([...previous, cursor]); setCursor(page.nextCursor); setPage(null); }}>التالية</button></div></>}
  </section>;
}

export function AssetField({ label, value, onChange, imagesOnly = true, onPermissionError }) {
  const id = useId(); const [open, setOpen] = useState(false);
  return <div className="admin-edit-form"><label htmlFor={id}>{label}<input id={id} dir="ltr" value={value ?? ''} onChange={e => onChange(e.target.value)} /></label><button type="button" className="admin-button admin-button-outline" onClick={() => setOpen(value => !value)}>{open ? 'إغلاق المكتبة' : 'اختيار / رفع من المكتبة'}</button>
    {open && <MediaLibraryRef imagesOnly={imagesOnly} onPermissionError={onPermissionError} onSelect={url => { onChange(url); setOpen(false); }} />}
  </div>;
}
// codeguard:components:end
