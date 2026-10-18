// codeguard:components:start
// codeguard:defines: ContentEditor
import { useMemo, useState } from 'react';
import { ar as arRef } from '../i18n/ar';
import { en as enRef } from '../i18n/en';
import { siteCopy as siteCopyRef } from '../data/siteCopy';
import { projectCards as projectCardsRef } from '../data/projectCards';
import { projectContributions as projectContributionsRef } from '../data/projectContributions';
import { caseStudies as caseStudiesRef } from '../data/caseStudies';
import { projects as projectsRef } from '../data/projects';
import { fallbackArticles as fallbackArticlesRef } from '../data/fallbackArticles';
import { DocumentEditor as Editor, LocalizedFields as LocaleFields } from './DocumentEditor';
import { CollectionEditor as ListEditor } from './CollectionEditor';
import { collectionData as collectionDataRef, replaceCollection as replaceCollectionRef } from './contentCollections';
import { AssetField as MediaField } from './MediaLibrary';
const flattenRef = flatten;


const dictionaries = { ar: { ...arRef, ...siteCopyRef.ar }, en: { ...enRef, ...siteCopyRef.en } };
const dictionariesRef = dictionaries;
const initialContent = {
  ar: Object.fromEntries(Object.entries(dictionariesRef.ar).filter(([, value]) => typeof value === 'string')),
  en: Object.fromEntries(Object.entries(dictionariesRef.en).filter(([, value]) => typeof value === 'string')),
  assets: { heroImageUrl: '/images/castle-hill-pencil-sketch.png', brandLogoAr: '', brandLogoEn: '', cvUrl: '', linkedinUrl: 'https://linkedin.com/in/ahmadmakhatrh', instagramUrl: 'https://www.instagram.com/ahmad.albarishi/', whatsappUrl: 'https://wa.me/962776360251' }, overrides: {}
};
const initialContentRef = initialContent;
const datasets = { projectCards: projectCardsRef, projectContributions: projectContributionsRef, caseStudies: caseStudiesRef, projects: projectsRef, articles: fallbackArticlesRef };
const datasetsRef = datasets;
const groups = { copy: 'نصوص الموقع', assets: 'صور الهوية والملفات', projectCards: 'بطاقات الأعمال والصور', projectContributions: 'تفاصيل المساهمات', caseStudies: 'دراسات المشاريع', projects: 'بيانات المشاريع', articles: 'المقالات' };
const groupsRef = groups;
function flatten(data, prefix, result = []) {
  if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) if (!['id', 'slug', 'key', 'mode', 'type', 'descriptionKey'].includes(key)) flattenRef(value, `${prefix}.${key}`, result);
  } else if (['string', 'boolean', 'number'].includes(typeof data) || data === null) result.push({ path: prefix, value: data });
  return result;
}

export function ContentEditor(props) {
  const [group, setGroup] = useState('copy');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(30);
  const fields = useMemo(() => group in datasetsRef ? flattenRef(datasetsRef[group], group) : [], [group]);
  return <Editor {...props} documentKey="content" title="المحتوى والصور" description="حرّر النصوص باللغتين، وصور الهوية والأعمال، ومحتوى المشاريع والمقالات." initialValue={initialContentRef}>
    {(content, change) => {
      const copyKeys = [...new Set([...Object.keys(initialContentRef.ar), ...Object.keys(initialContentRef.en)])];
      const visibleKeys = copyKeys.filter(key => `${key} ${content.ar?.[key] ?? ''} ${content.en?.[key] ?? ''}`.toLowerCase().includes(search.toLowerCase()));
      const visibleFields = fields.filter(field => `${field.path} ${content.overrides?.[field.path] ?? field.value}`.toLowerCase().includes(search.toLowerCase()));
      const activeFields = content.datasets?.[group] ? flattenRef(content.datasets[group], group).filter(field => `${field.path} ${field.value}`.toLowerCase().includes(search.toLowerCase())) : visibleFields;
      const override = (path, value) => {
        if (!content.datasets?.[group]) { change({ ...content, overrides: { ...content.overrides, [path]: value } }); return; }
        const data = structuredClone(collectionDataRef(content, group, datasetsRef[group]));
        const parts = path.split('.').slice(1);
        let target = data;
        for (const part of parts.slice(0, -1)) target = target[part];
        target[parts.at(-1)] = value;
        change(replaceCollectionRef(content, group, data));
      };
      const overrideRef = override;
      return <div className="admin-panel admin-edit-form"><div className="admin-localized"><label>المجموعة<select value={group} onChange={e => { setGroup(e.target.value); setSearch(''); setLimit(30); }}>{Object.entries(groupsRef).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>بحث في الحقول<input value={search} onChange={e => { setSearch(e.target.value); setLimit(30); }} placeholder="البحث محلي ولا يرسل طلبات" /></label></div>
        {group === 'copy' ? <>{visibleKeys.slice(0, limit).map(key => <LocaleFields key={key} label={key} multiline value={{ ar: content.ar?.[key] ?? '', en: content.en?.[key] ?? '' }} onChange={value => change({ ...content, ar: { ...content.ar, [key]: value.ar }, en: { ...content.en, [key]: value.en } })} />)}
          {limit < visibleKeys.length && <button type="button" className="admin-button admin-button-outline" onClick={() => setLimit(value => value + 30)}>إظهار المزيد ({visibleKeys.length - limit})</button>}</>
          : group === 'assets' ? <><p className="admin-help">أدخل مسار صورة موجودة في الموقع أو رابط HTTPS. اترك حقول الشعار والملف فارغة لاستخدام النسخة الحالية.</p>
            {Object.entries({ heroImageUrl: 'صورة الهيرو', brandLogoAr: 'الشعار العربي', brandLogoEn: 'الشعار الإنجليزي', cvUrl: 'رابط السيرة الذاتية', linkedinUrl: 'LinkedIn', instagramUrl: 'Instagram', whatsappUrl: 'WhatsApp' }).map(([key, label]) => ['heroImageUrl', 'brandLogoAr', 'brandLogoEn', 'cvUrl'].includes(key)
              ? <MediaField key={key} label={label} value={content.assets?.[key]} imagesOnly={key !== 'cvUrl'} onPermissionError={props.onPermissionError} onChange={value => change({ ...content, assets: { ...content.assets, [key]: value } })} />
              : <label key={key}>{label}<input dir="ltr" value={content.assets?.[key] ?? ''} onChange={e => change({ ...content, assets: { ...content.assets, [key]: e.target.value } })} /></label>)}</>
          : group === 'projectCards' || group === 'articles' ? <ListEditor key={group} content={content} change={change} name={group} fallback={datasetsRef[group]} contributions={projectContributionsRef} onPermissionError={props.onPermissionError} />
          : <>{activeFields.slice(0, limit).map(field => {
            const value = content.overrides?.[field.path] ?? field.value;
            return typeof value === 'boolean' ? <label className="admin-checkbox" key={field.path}><input type="checkbox" checked={value} onChange={e => overrideRef(field.path, e.target.checked)} />{field.path}</label>
              : typeof field.value === 'number' ? <label key={field.path}>{field.path}<input type="number" step="any" dir="ltr" value={value ?? ''} onChange={e => { if (e.target.value !== '') overrideRef(field.path, Number(e.target.value)); }} /></label>
              : <label key={field.path}>{field.path}<textarea dir="auto" value={value ?? ''}
                onChange={e => overrideRef(field.path, e.target.value)} /></label>;
          })}{group === 'articles' && <p className="admin-help">محتوى المقال المعدّل يُعرض كنص وفقرات؛ لا تُنفّذ وسوم HTML.</p>}
            {limit < activeFields.length && <button type="button" className="admin-button admin-button-outline" onClick={() => setLimit(value => value + 30)}>إظهار المزيد ({activeFields.length - limit})</button>}</>}
      </div>;
    }}
  </Editor>;
}
// codeguard:components:end
