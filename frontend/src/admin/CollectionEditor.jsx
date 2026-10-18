// codeguard:components:start
// codeguard:defines: CollectionEditor
import { useState } from 'react';
import { LocalizedFields as LocaleFields } from './DocumentEditor';
import { collectionData as collectionDataRef, emptyLocalizedText as emptyText, moveRecord as reorderRecord, plainArticle as plainArticleRef, replaceCollection as replaceCollectionRef } from './contentCollections';
import { AssetField as MediaField } from './MediaLibrary';

const validSlug = /^[a-z][a-z0-9-]{0,29}$/;
const validSlugRef = validSlug;

export function CollectionEditor({ content, change, name, fallback, contributions, onPermissionError }) {
  const articles = name === 'articles';
  const records = collectionDataRef(content, name, fallback);
  const [selected, setSelected] = useState(0);
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const index = Math.min(selected, Math.max(0, records.length - 1));
  const record = records[index];
  const replace = values => replaceCollectionRef(content, name, articles ? values.map(article => ({ ...article, content: article.contentIsPlainText ? article.content : plainArticleRef(article.content), useOriginalContent: article.useOriginalContent ?? !article.contentIsPlainText, contentIsPlainText: true })) : values);
  const replaceRef = replace;
  const update = patch => change(replaceRef(records.map((item, i) => i === index ? { ...item, ...patch } : item)));
  const updateRef = update;
  const details = !articles ? collectionDataRef(content, 'projectContributions', contributions) : [];
  const detail = details.find(item => item.slug === record?.slug);
  const updateDetail = patch => change(replaceCollectionRef(content, 'projectContributions', details.map(item => item.slug === record.slug ? { ...item, ...patch } : item)));
  const updateDetailRef = updateDetail;
  const add = () => {
    if (!validSlugRef.test(slug) || records.some(item => item.slug === slug)) { setError('اكتب مسارًا فريدًا من حروف إنجليزية صغيرة وأرقام وشرطات، بطول 30 حرفًا كحد أقصى.'); return; }
    if (records.length >= (articles ? 198 : 100)) { setError('وصلت إلى الحد الأقصى للمجموعة.'); return; }
    let next;
    if (articles) {
      next = replaceRef([...records, ...['ar', 'en'].map(language => ({ slug, language, title: '', summary: '', content: '', date: new Date().toISOString().slice(0, 10), hidden: true, contentIsPlainText: true, labels: [] }))]);
    } else {
      next = replaceRef([...records, { slug, name: slug, description: emptyText(), featured: false, hidden: true, media: { mode: 'single', items: [] } }]);
      next = replaceCollectionRef(next, 'projectContributions', [...details, { slug, title: { ar: slug, en: slug }, summary: emptyText(), role: emptyText(), contributions: { ar: [], en: [] }, result: emptyText(), url: '', linkLabel: emptyText() }]);
    }
    change(next); setSelected(records.length); setSlug(''); setError('');
  };
  const addRef = add;
  const remove = () => {
    if (!window.confirm(articles ? 'حذف نسخة هذا المقال من المسودة؟ لا يتغير الموقع قبل النشر.' : 'حذف هذا العمل وتفاصيل مساهمته من المسودة؟ لا يتغير الموقع قبل النشر.')) return;
    let next = replaceRef(records.filter((_, i) => i !== index));
    if (!articles) next = replaceCollectionRef(next, 'projectContributions', details.filter(item => item.slug !== record.slug));
    change(next); setSelected(Math.max(0, index - 1));
  };
  const removeRef = remove;
  const reorder = delta => { const next = reorderRecord(records, index, delta); if (next !== records) { change(replaceRef(next)); setSelected(index + delta); } };
  const reorderRef = reorder;
  return <>
    <div className="admin-toolbar-actions"><label>مسار {articles ? 'المقال' : 'العمل'} الجديد<input dir="ltr" value={slug} onChange={e => setSlug(e.target.value)} placeholder="new-project" maxLength={30} /></label><button type="button" className="admin-button" onClick={addRef}>إضافة {articles ? 'مقال باللغتين' : 'عمل'}</button></div>
    {error && <p className="admin-notice admin-notice-error" role="alert">{error}</p>}
    {!record ? <p>لا توجد عناصر. أضف العنصر الأول ثم احفظ المسودة.</p> : <>
      <label>اختر العنصر<select value={index} onChange={e => setSelected(Number(e.target.value))}>{records.map((item, i) => <option key={`${item.slug}-${item.language ?? ''}`} value={i}>{articles ? `${item.title || item.slug} (${item.language})` : item.name}{item.hidden ? ' — مخفي' : ''}</option>)}</select></label>
      <div className="admin-toolbar-actions"><span dir="ltr">{record.slug}</span><button type="button" className="admin-button admin-button-outline" disabled={index === 0} onClick={() => reorderRef(-1)}>تحريك للأعلى</button><button type="button" className="admin-button admin-button-outline" disabled={index === records.length - 1} onClick={() => reorderRef(1)}>تحريك للأسفل</button><button type="button" className="admin-button admin-button-outline" onClick={removeRef}>حذف من المسودة</button></div>
      <label className="admin-checkbox"><input type="checkbox" checked={!record.hidden} onChange={e => updateRef({ hidden: !e.target.checked })} />إظهار في الموقع عند النشر</label>
      {articles ? <>
        <label>عنوان المقال<input dir={record.language === 'ar' ? 'rtl' : 'ltr'} value={record.title} maxLength={200} onChange={e => updateRef({ title: e.target.value })} /></label>
        <label>تاريخ العرض<input dir="auto" value={record.date} maxLength={100} onChange={e => updateRef({ date: e.target.value })} /></label>
        <MediaField label="صورة المقال" value={record.imageUrl} onChange={imageUrl => updateRef({ imageUrl })} onPermissionError={onPermissionError} />
        <label>الملخص<textarea dir="auto" value={record.summary} maxLength={4000} onChange={e => updateRef({ summary: e.target.value })} /></label>
        <label>محتوى المقال<textarea dir="auto" rows={12} value={record.contentIsPlainText ? record.content : plainArticleRef(record.content)} maxLength={40000} onChange={e => updateRef({ content: e.target.value, contentIsPlainText: true, useOriginalContent: false })} /></label>
        <label>التصنيفات (تصنيف في كل سطر)<textarea dir="auto" value={(record.labels ?? []).join('\n')} onChange={e => updateRef({ labels: e.target.value.split('\n').slice(0, 20) })} /></label>
        <p className="admin-help">النص يُعرض كفقرات آمنة؛ لا تُنفّذ وسوم HTML. معاينة هذه النسخة:</p><article className="admin-panel" dir={record.language === 'ar' ? 'rtl' : 'ltr'}><h3>{record.title}</h3><p>{record.summary}</p>{(record.contentIsPlainText ? record.content : plainArticleRef(record.content)).split(/\n\s*\n/).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</article>
      </> : <>
        <label>اسم العمل<input dir="auto" value={record.name} maxLength={200} onChange={e => updateRef({ name: e.target.value })} /></label>
        <LocaleFields label="الوصف في قائمة الأعمال" multiline value={record.description} onChange={description => updateRef({ description })} />
        <label className="admin-checkbox"><input type="checkbox" checked={Boolean(record.featured)} onChange={e => updateRef({ featured: e.target.checked })} />عمل مميز</label>
        <label className="admin-checkbox"><input type="checkbox" checked={Boolean(record.inDevelopment)} onChange={e => updateRef({ inDevelopment: e.target.checked })} />قيد التطوير</label>
        <label>طريقة عرض الصور<select value={record.media?.mode ?? 'single'} onChange={e => updateRef({ media: { ...record.media, mode: e.target.value } })}><option value="single">صورة</option><option value="slideshow">معرض</option><option value="stack">صور متجاورة</option></select></label>
        {(record.media?.items ?? []).map((image, i) => <div className="admin-panel admin-edit-form" key={i}>
          <MediaField label="الصورة" value={image.src} onPermissionError={onPermissionError} onChange={src => updateRef({ media: { ...record.media, items: record.media.items.map((item, j) => j === i ? { ...item, src } : item) } })} />
          <MediaField label="نسخة إنجليزية اختيارية" value={image.srcEn} onPermissionError={onPermissionError} onChange={srcEn => updateRef({ media: { ...record.media, items: record.media.items.map((item, j) => j === i ? { ...item, srcEn: srcEn || undefined } : item) } })} />
          <LocaleFields label="وصف الصورة" value={image.caption} onChange={caption => updateRef({ media: { ...record.media, items: record.media.items.map((item, j) => j === i ? { ...item, caption } : item) } })} />
          <button type="button" className="admin-button admin-button-outline" onClick={() => updateRef({ media: { ...record.media, items: record.media.items.filter((_, j) => j !== i) } })}>حذف الصورة من المسودة</button>
        </div>)}
        <button type="button" className="admin-button admin-button-outline" disabled={(record.media?.items?.length ?? 0) >= 30} onClick={() => updateRef({ media: { mode: record.media?.mode ?? 'single', ...record.media, items: [...(record.media?.items ?? []), { src: '', caption: emptyText() }] } })}>إضافة صورة</button>
        {detail && <><h3>صفحة تفاصيل العمل</h3>{[['title', 'العنوان'], ['summary', 'الملخص'], ['role', 'الدور'], ['result', 'النتيجة'], ['linkLabel', 'نص رابط الزيارة']].map(([key, label]) => <LocaleFields key={key} label={label} multiline={key !== 'title' && key !== 'linkLabel'} value={detail[key] ?? emptyText()} onChange={value => updateDetailRef({ [key]: value })} />)}
          <LocaleFields label="المساهمات (واحدة في كل سطر)" multiline value={{ ar: detail.contributions.ar.join('\n'), en: detail.contributions.en.join('\n') }} onChange={value => updateDetailRef({ contributions: { ar: value.ar.split('\n'), en: value.en.split('\n') } })} />
          <label>رابط الزيارة<input dir="ltr" value={detail.url ?? ''} onChange={e => updateDetailRef({ url: e.target.value })} /></label>
        </>}
        <p className="admin-help">الأعمال ذات دراسة تفصيلية تحتفظ بها؛ يمكنك تحريرها من مجموعة دراسات المشاريع.</p>
      </>}
    </>}
  </>;
}
// codeguard:components:end
