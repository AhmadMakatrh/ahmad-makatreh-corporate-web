// codeguard:components:start
// codeguard:defines: PagesEditor
import { useState } from 'react';
import { ArrowDown as ArrowDownRef, ArrowUp as ArrowUpRef, Plus as PlusRef, Trash2 as Trash2Ref } from 'lucide-react';
import { DocumentEditor as Editor, LocalizedFields as LocaleFields } from './DocumentEditor';
import { ContentPageView as PageView } from '../pages/ContentPage';
import { AssetField as MediaField } from './MediaLibrary';
import { emptyLocalizedText as text, moveRecord as reorderSections } from './contentCollections';
const newSectionRef = newSection;


const initialPages = { pages: [] };
const initialPagesRef = initialPages;
const identifier = prefix => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
const identifierRef = identifier;
const types = { hero: 'عنوان وصورة', text: 'نص', image: 'صورة ووصف', cards: 'بطاقات', cta: 'دعوة للتواصل' };
const typesRef = types;
function newSection(type) { return { id: identifierRef('section'), type, title: text(), body: text(), imageUrl: '', imageAlt: text(), linkUrl: type === 'cta' ? '/start-project' : '', linkLabel: type === 'cta' ? { ar: 'تواصل معي', en: 'Get in touch' } : text(), items: [] }; }

export function PagesEditor(props) {
  const [selected, setSelected] = useState(0);
  const [template, setTemplate] = useState('landing');
  const [sectionType, setSectionType] = useState('text');
  const [preview, setPreview] = useState(false);
  const [language, setLanguage] = useState('ar');
  return <Editor {...props} documentKey="pages" title="الصفحات" description="أنشئ صفحات من قوالب الموقع، ورتّب أقسامها وراجعها قبل النشر." initialValue={initialPagesRef}>
    {(document, change) => {
      const index = Math.min(selected, Math.max(0, document.pages.length - 1)); const page = document.pages[index];
      const patch = updates => change({ ...document, pages: document.pages.map((item, i) => i === index ? { ...item, ...updates } : item) });
      const patchRef = patch;
      const sectionPatch = (id, updates) => patchRef({ sections: page.sections.map(section => section.id === id ? { ...section, ...updates } : section) });
      const sectionPatchRef = sectionPatch;
      return <div className="admin-editor-grid"><aside className="admin-panel admin-item-list"><label>القالب<select value={template} onChange={e => setTemplate(e.target.value)}><option value="landing">صفحة تعريفية</option><option value="service">صفحة خدمة</option><option value="blank">صفحة بأقسام تختارها</option></select></label>
        <button type="button" className="admin-button" disabled={document.pages.length >= 100} onClick={() => {
          const sections = template === 'blank' ? [] : (template === 'service' ? ['hero', 'cards', 'cta'] : ['hero', 'text', 'cta']).map(newSectionRef);
          change({ ...document, pages: [...document.pages, { slug: identifierRef('page'), title: { ar: 'صفحة جديدة', en: 'New page' }, description: text(), sections, visible: false, showInNav: false }] });
          setSelected(document.pages.length); setPreview(false);
        }}><PlusRef size={16} /> إضافة صفحة</button>
        {document.pages.map((item, i) => <button type="button" className="admin-item" key={i} aria-pressed={index === i} onClick={() => { setSelected(i); setPreview(false); }}><span>{item.title.ar || item.title.en}</span><small dir="ltr">/{item.slug}</small><small>{item.visible ? 'ظاهرة' : 'مخفية'}</small></button>)}
      </aside><div className="admin-panel admin-edit-form">{!page ? <p className="admin-empty">اختر قالبًا وأضف أول صفحة.</p> : <>
        <div className="admin-toolbar-actions"><button type="button" className="admin-button admin-button-outline" onClick={() => setPreview(value => !value)}>{preview ? 'العودة للتحرير' : 'معاينة المسودة'}</button>{preview && <select aria-label="لغة المعاينة" value={language} onChange={e => setLanguage(e.target.value)}><option value="ar">العربية</option><option value="en">English</option></select>}</div>
        {preview ? <PageView page={page} language={language} preview /> : <>
          <LocaleFields label="عنوان الصفحة" value={page.title} onChange={title => patchRef({ title })} required />
          <LocaleFields label="وصف الصفحة ونتائج البحث" value={page.description} onChange={description => patchRef({ description })} multiline />
          <label>رابط الصفحة<input dir="ltr" value={page.slug} maxLength={30} onChange={e => patchRef({ slug: e.target.value.toLowerCase() })} pattern="[a-z][a-z0-9-]{0,29}" /></label>
          <label className="admin-checkbox"><input type="checkbox" checked={page.visible} onChange={e => patchRef({ visible: e.target.checked })} /> إظهار الصفحة بعد النشر</label>
          <label className="admin-checkbox"><input type="checkbox" checked={page.showInNav} onChange={e => patchRef({ showInNav: e.target.checked })} /> إضافتها إلى قائمة الموقع</label>
          <h2>أقسام الصفحة</h2>{page.sections.map((section, sectionIndex) => <div className="admin-section-editor" key={section.id}>
            <div className="admin-page-heading"><h3>{typesRef[section.type]}</h3><div className="admin-toolbar-actions">{[-1, 1].map(direction => <button type="button" className="admin-icon-button" key={direction} aria-label={direction === -1 ? 'نقل القسم لأعلى' : 'نقل القسم لأسفل'} disabled={direction === -1 ? sectionIndex === 0 : sectionIndex === page.sections.length - 1} onClick={() => {
              patchRef({ sections: reorderSections(page.sections, sectionIndex, direction) });
            }}>{direction === -1 ? <ArrowUpRef size={17} /> : <ArrowDownRef size={17} />}</button>)}<button type="button" className="admin-icon-button" aria-label="إزالة القسم من المسودة" onClick={() => patchRef({ sections: page.sections.filter(item => item.id !== section.id) })}><Trash2Ref size={17} /></button></div></div>
            <LocaleFields label="عنوان القسم" value={section.title} onChange={title => sectionPatchRef(section.id, { title })} />
            <LocaleFields label="النص — سطر فارغ بين الفقرات" value={section.body} onChange={body => sectionPatchRef(section.id, { body })} multiline />
            {['hero', 'image'].includes(section.type) && <><MediaField label="رابط الصورة" value={section.imageUrl} onPermissionError={props.onPermissionError} onChange={imageUrl => sectionPatchRef(section.id, { imageUrl })} /><LocaleFields label="وصف الصورة" value={section.imageAlt} onChange={imageAlt => sectionPatchRef(section.id, { imageAlt })} /></>}
            <label>رابط الزر (اختياري)<input dir="ltr" value={section.linkUrl ?? ''} onChange={e => sectionPatchRef(section.id, { linkUrl: e.target.value })} /></label>
            {section.linkUrl && <LocaleFields label="نص الزر" value={section.linkLabel} onChange={linkLabel => sectionPatchRef(section.id, { linkLabel })} />}
            {section.type === 'cards' && <>{(section.items ?? []).map((card, cardIndex) => {
              const updateCard = updates => sectionPatchRef(section.id, { items: section.items.map((item, i) => i === cardIndex ? { ...item, ...updates } : item) });
              const updateCardRef = updateCard;
              return <div className="admin-offer-item" key={cardIndex}><LocaleFields label={`عنوان البطاقة ${cardIndex + 1}`} value={card.title} onChange={title => updateCardRef({ title })} /><LocaleFields label="وصف البطاقة" value={card.body} multiline onChange={body => updateCardRef({ body })} />
                <MediaField label="رابط صورة البطاقة" value={card.imageUrl} onPermissionError={props.onPermissionError} onChange={imageUrl => updateCardRef({ imageUrl })} /><label>رابط البطاقة<input dir="ltr" value={card.linkUrl ?? ''} onChange={e => updateCardRef({ linkUrl: e.target.value })} /></label>
                <button type="button" className="admin-link" onClick={() => sectionPatchRef(section.id, { items: section.items.filter((_, i) => i !== cardIndex) })}>إزالة البطاقة من المسودة</button></div>;
            })}<button type="button" className="admin-button admin-button-outline" disabled={(section.items?.length ?? 0) >= 30} onClick={() => sectionPatchRef(section.id, { items: [...(section.items ?? []), { title: text(), body: text(), imageUrl: '', linkUrl: '' }] })}>إضافة بطاقة</button></>}
          </div>)}
          <div className="admin-toolbar-actions"><select aria-label="نوع القسم الجديد" value={sectionType} onChange={e => setSectionType(e.target.value)}>{Object.entries(typesRef).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><button type="button" className="admin-button" disabled={page.sections.length >= 40} onClick={() => patchRef({ sections: [...page.sections, newSectionRef(sectionType)] })}><PlusRef size={16} /> إضافة قسم</button></div>
        </>}
      </>}</div></div>;
    }}
  </Editor>;
}
// codeguard:components:end
