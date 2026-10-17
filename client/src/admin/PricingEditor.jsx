// codeguard:components:start
// codeguard:defines: PricingEditor
import { useEffect, useRef, useState } from 'react';
import { ArrowDown as ArrowDownRef, ArrowUp as ArrowUpRef, ChevronLeft as ChevronLeftRef, ChevronRight as ChevronRightRef, Plus as PlusRef } from 'lucide-react';
import { activeOffers as activeOffersRef, defaultPricing as defaultPricingRef, offerPriceForPackage as packageOfferPrice } from '../data/serviceCatalog';
import { DocumentEditor as Editor, LocalizedFields as LocaleFields } from './DocumentEditor';
import { emptyLocalizedText as emptyText, moveRecord as reorderPricingItems } from './contentCollections';
const localDateRef = localDate;
const utcDateRef = utcDate;
const OfferPriceInputRef = OfferPriceInput;


const id = prefix => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
const idRef = id;
function localDate(value) { if (!value) return ''; const date = new Date(value);
 return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
function utcDate(value) { return value ? new Date(value).toISOString() : null; }

function OfferPriceInput({ price, offerItem, onChange }) {
  const suggested = packageOfferPrice(price, offerItem);
  const [draft, setDraft] = useState(suggested == null ? '' : String(suggested));
  const editing = useRef(false);
  useEffect(() => { if (!editing.current) setDraft(suggested == null ? '' : String(suggested)); }, [suggested]);
  return <input type="number" dir="ltr" min="0" max={price - 0.01} step="0.01" value={draft}
    onFocus={() => { editing.current = true; }}
    onChange={e => { const value = e.target.value; setDraft(value); onChange(value === '' ? null : Number(value)); }}
    onBlur={() => { editing.current = false; setDraft(suggested == null ? '' : String(suggested)); }} />;
}

export function PricingEditor(props) {
  const scrollListRef = scrollList;

  const [tab, setTab] = useState('packages');
  const [selected, setSelected] = useState(0);
  const listRef = useRef(null);
  function scrollList(direction) {
    const list = listRef.current;
    const card = list?.querySelector('.admin-item');
    if (!card) return;
    const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
    list.scrollBy({ left: -direction * (card.getBoundingClientRect().width + gap), behavior: 'smooth' });
  }
  return <Editor {...props} documentKey="pricing" title="الأسعار والعروض" description="أنشئ الباقات والعروض، وحدد الأسعار والتوقيت والظهور باللغتين." initialValue={defaultPricingRef}>
    {(catalog, change) => {
      const list = catalog[tab]; const index = Math.min(selected, Math.max(0, list.length - 1)); const item = list[index];
      const patch = update => change({ ...catalog, [tab]: list.map((entry, i) => i === index ? { ...entry, ...update } : entry) });
      const patchRef = patch;
      const activeOfferIds = new Set(activeOffersRef(catalog).map(offer => offer.id));
      const updatePackageOffer = (offerIndex, updates) => change({ ...catalog, offers: catalog.offers.map((offer, i) => i === offerIndex
        ? { ...offer, items: offer.items.map(entry => entry.packageKey === item.key ? { ...entry, ...updates } : entry) } : offer) });
      const updatePackageOfferRef = updatePackageOffer;
      const reorder = direction => { change({ ...catalog, [tab]: reorderPricingItems(list, index, direction) }); setSelected(index + direction); };
      const reorderRef = reorder;
      return <>
        <div className="admin-tabs" role="tablist" aria-label="إدارة الأسعار">{[['packages', 'الباقات'], ['offers', 'العروض']].map(([key, label]) => <button role="tab" type="button" key={key} aria-selected={tab === key} onClick={() => { setTab(key); setSelected(0); }}>{label} ({catalog[key].length})</button>)}</div>
        <div className="admin-editor-grid"><div className="admin-pricing-selector"><div className="admin-pricing-controls"><span>اسحب لعرض بقية {tab === 'packages' ? 'الباقات' : 'العروض'}</span><div><button type="button" className="admin-icon-button" aria-label="السابق" onClick={() => scrollListRef(-1)}><ChevronRightRef size={19} /></button><button type="button" className="admin-icon-button" aria-label="التالي" onClick={() => scrollListRef(1)}><ChevronLeftRef size={19} /></button></div></div><aside ref={listRef} className="admin-panel admin-item-list admin-pricing-list"><button type="button" className="admin-button" disabled={list.length >= 50} onClick={() => {
          const newItem = tab === 'packages' ? { key: idRef('package'), title: { ar: 'باقة جديدة', en: 'New package' }, description: emptyText(), features: { ar: [], en: [] }, price: null, hidden: true }
            : { id: idRef('offer'), title: { ar: 'عرض جديد', en: 'New offer' }, description: emptyText(), items: [], enabled: false, popup: false, startsAtUtc: null, endsAtUtc: null };
          change({ ...catalog, [tab]: [...list, newItem] }); setSelected(list.length);
        }}><PlusRef size={16} /> {tab === 'packages' ? 'إضافة باقة' : 'إضافة عرض'}</button>
          {list.map((entry, i) => <button type="button" className="admin-item" aria-pressed={index === i} key={entry.key ?? entry.id} onClick={() => setSelected(i)}><span>{entry.title.ar || entry.title.en}</span><small>{tab === 'packages' ? entry.hidden ? 'مخفية' : 'ظاهرة' : entry.enabled ? 'مفعّل' : 'متوقف'}</small></button>)}
        </aside></div><div className="admin-panel admin-edit-form">{!item ? <p className="admin-empty">أضف {tab === 'packages' ? 'باقة' : 'عرضًا'} للبدء.</p> : <>
          <div className="admin-toolbar-actions"><button type="button" className="admin-button admin-button-outline" disabled={index === 0} onClick={() => reorderRef(-1)}><ArrowUpRef size={16} /> لأعلى</button><button type="button" className="admin-button admin-button-outline" disabled={index === list.length - 1} onClick={() => reorderRef(1)}><ArrowDownRef size={16} /> لأسفل</button></div>
          <LocaleFields label="العنوان" value={item.title} onChange={title => patchRef({ title })} required />
          <LocaleFields label="الوصف" value={item.description} onChange={description => patchRef({ description })} multiline />
          {tab === 'packages' ? <>
            <label>مفتاح الباقة<input dir="ltr" readOnly={defaultPricingRef.packages.some(original => original.key === item.key)} pattern="[a-z][a-z0-9-]{0,29}" maxLength={30} value={item.key} onChange={e => patchRef({ key: e.target.value })} /></label><p className="admin-help">أبقِ مفتاح الباقة الحالية ثابتًا للمحافظة على روابطها. يجب أن يكون فريدًا.</p>
            <label>السعر الأساسي (القديم) بالدينار الأردني<input type="number" min={0} max={1000000} step="0.01" value={item.price ?? ''} placeholder="اتركه فارغًا لسعر حسب المشروع" onChange={e => patchRef({ price: e.target.value === '' ? null : Number(e.target.value) })} /></label>
            <div className="admin-section-editor"><h2>الخصم والسعر الجديد</h2>
              {item.price == null && <p className="admin-help">أدخل السعر الأساسي لتطبيق خصم على الباقة.</p>}
              {catalog.offers.length === 0 && <p className="admin-help">لا توجد عروض لهذه الباقة. <button type="button" className="admin-link" onClick={() => setTab('offers')}>انتقل إلى تبويب العروض</button> لإضافة عرض وخصم.</p>}
              {catalog.offers.map((offer, offerIndex) => {
                const offerItem = offer.items.find(entry => entry.packageKey === item.key);
                return <div className="admin-offer-item" key={offer.id}>
                  <label className="admin-checkbox"><input type="checkbox" checked={Boolean(offerItem)} disabled={!offerItem && (item.price == null || offer.items.length >= 50)} onChange={e => change({ ...catalog, offers: catalog.offers.map((entry, i) => i === offerIndex ? { ...entry, items: e.target.checked
                    ? [...entry.items, { packageKey: item.key, discountPercent: 10, offerPrice: null }]
                    : entry.items.filter(value => value.packageKey !== item.key) } : entry) })} />تطبيق عرض «{offer.title.ar || offer.title.en}» على هذه الباقة</label>
                  {offerItem && <p className="admin-help">{activeOfferIds.has(offer.id) ? 'العرض نشط الآن. يظهر السعر الجديد على الموقع بعد النشر.' : 'العرض غير نشط الآن. راجع تفعيله وتوقيته من تبويب العروض.'}</p>}
                  {offerItem && item.price == null && <p className="admin-error">أدخل السعر الأساسي أو أزل الباقة من العرض.</p>}
                  {offerItem && item.price != null && <div className="admin-localized"><label>نسبة الخصم %<input type="number" min="0.01" max="100" step="0.01" value={offerItem.discountPercent ?? ''} onChange={e => updatePackageOfferRef(offerIndex, { discountPercent: e.target.value === '' ? null : Number(e.target.value), offerPrice: null })} /></label>
                    <div className="admin-price-preview"><label>السعر الجديد بالدينار الأردني<OfferPriceInputRef key={`${item.key}-${offer.id}`} price={item.price} offerItem={offerItem} onChange={offerPrice => updatePackageOfferRef(offerIndex, { offerPrice })} /></label><small>السعر مقترح من النسبة؛ يمكنك تعديله مباشرة. مسح القيمة يعيد الحساب التلقائي.</small></div></div>}
                </div>;
              })}
            </div>
            <label className="admin-checkbox"><input type="checkbox" checked={item.hidden} onChange={e => patchRef({ hidden: e.target.checked })} /> إخفاء الباقة</label>
            <LocaleFields label="المزايا — كل ميزة في سطر" value={{ ar: item.features.ar.join('\n'), en: item.features.en.join('\n') }} multiline onChange={features => patchRef({ features: { ar: features.ar.split('\n').filter(Boolean), en: features.en.split('\n').filter(Boolean) } })} />
          </> : <>
            <div className="admin-localized"><label>بداية العرض<input type="datetime-local" value={localDateRef(item.startsAtUtc)} onChange={e => patchRef({ startsAtUtc: utcDateRef(e.target.value) })} /></label><label>نهاية العرض<input type="datetime-local" value={localDateRef(item.endsAtUtc)} onChange={e => patchRef({ endsAtUtc: utcDateRef(e.target.value) })} /></label></div>
            <p className="admin-help">يُدخل التوقيت وفق المنطقة الزمنية لجهازك. تنتهي العروض تلقائيًا في الموعد المحدد.</p>
            <label className="admin-checkbox"><input type="checkbox" checked={item.enabled} onChange={e => patchRef({ enabled: e.target.checked })} /> تفعيل العرض</label>
            <label className="admin-checkbox"><input type="checkbox" checked={item.popup} onChange={e => patchRef({ popup: e.target.checked })} /> عرضه في النافذة المنبثقة</label>
            <h2>الباقات المشمولة</h2>{catalog.packages.filter(p => p.price != null).map(packageItem => {
              const offerItem = item.items.find(entry => entry.packageKey === packageItem.key);
              const updateOffer = updates => patchRef({ items: item.items.map(entry => entry.packageKey === packageItem.key ? { ...entry, ...updates } : entry) });
              const updateOfferRef = updateOffer;
              return <div className="admin-offer-item" key={packageItem.key}><label className="admin-checkbox"><input type="checkbox" checked={Boolean(offerItem)} onChange={e => patchRef({ items: e.target.checked ? [...item.items, { packageKey: packageItem.key, discountPercent: 10, offerPrice: null }] : item.items.filter(entry => entry.packageKey !== packageItem.key) })} />{packageItem.title.ar}</label>
                {offerItem && <div className="admin-localized"><label>نسبة الخصم %<input type="number" min="0.01" max="100" step="0.01" value={offerItem.discountPercent} onChange={e => updateOfferRef({ discountPercent: Number(e.target.value) })} /></label><label>سعر العرض (اختياري)<input type="number" min="0" max={packageItem.price} step="0.01" value={offerItem.offerPrice ?? ''} onChange={e => updateOfferRef({ offerPrice: e.target.value === '' ? null : Number(e.target.value) })} /></label></div>}
              </div>;
            })}
          </>}
        </>}</div></div>
      </>;
    }}
  </Editor>;
}
// codeguard:components:end
