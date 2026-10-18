// codeguard:components:start
// codeguard:defines: defaultPricing, activeOffers, offerPriceForPackage, effectivePackages, launchPromotion
import { ar as arRef } from '../i18n/ar.js';
import { en as enRef } from '../i18n/en.js';
const activeOffersRef = activeOffers;
const offerPriceForPackageRef = offerPriceForPackage;


const originalPackages = [
  { key: 'resume', price: 80, discount: 25 },
  { key: 'landing', price: 350, discount: 20, offerPrice: 279 },
  { key: 'business', price: 750, discount: 20, offerPrice: 599 },
  { key: 'system', price: 2500, discount: 20, offerPrice: 1999 },
  { key: 'mobile', price: 3000, discount: 20, offerPrice: 2399 },
  { key: 'custom', price: null },
];
const originalPackagesRef = originalPackages;
export const defaultPricing = {
  packages: originalPackagesRef.map(({ key, price }) => ({ key, price, hidden: false,
    title: { ar: arRef[`pricing${key}Title`], en: enRef[`pricing${key}Title`] },
    description: { ar: arRef[`pricing${key}Description`], en: enRef[`pricing${key}Description`] },
    features: { ar: [1, 2, 3].map(i => arRef[`pricing${key}Feature${i}`]), en: [1, 2, 3].map(i => enRef[`pricing${key}Feature${i}`]) }
  })),
  offers: [{ id: 'year-end', title: { ar: arRef.launchOfferTag, en: enRef.launchOfferTag },
    description: { ar: arRef.launchOfferDescription, en: enRef.launchOfferDescription }, enabled: true, popup: true,
    startsAtUtc: null, endsAtUtc: null,
    items: originalPackagesRef.filter(p => p.price != null).map(p => ({ packageKey: p.key, discountPercent: p.discount, offerPrice: p.offerPrice ?? null })) }]
};

export function activeOffers(catalog, now = Date.now()) {
  return catalog.offers.filter(offer => offer.enabled && (!offer.startsAtUtc || Date.parse(offer.startsAtUtc) <= now) && (!offer.endsAtUtc || Date.parse(offer.endsAtUtc) > now));
}

export function offerPriceForPackage(price, offerItem) {
  if (price == null || offerItem?.discountPercent == null) return null;
  return offerItem.offerPrice ?? Math.round(price * (100 - offerItem.discountPercent)) / 100;
}

export function effectivePackages(catalog, language, now = Date.now()) {
  const offers = activeOffersRef(catalog, now);
  return catalog.packages.filter(p => !p.hidden).map(p => {
    const candidates = offers.flatMap(offer => offer.items.filter(item => item.packageKey === p.key));
    const offer = candidates.sort((a, b) => (a.offerPrice ?? p.price * (100 - a.discountPercent) / 100) - (b.offerPrice ?? p.price * (100 - b.discountPercent) / 100))[0];
    return { ...p, title: p.title[language], description: p.description[language], features: p.features[language],
      discount: offer?.discountPercent ?? null,
      offerPrice: offer ? offerPriceForPackageRef(p.price, offer) : null };
  });
}

export function launchPromotion(catalog, now = Date.now()) {
  const packages = catalog.packages.filter(p => !p.hidden && p.price != null);
  const offer = activeOffersRef(catalog, now).find(o => o.popup && o.items.some(item => packages.some(p => p.key === item.packageKey)));
  return offer ? { ...offer, discount: Math.max(...offer.items.filter(item => packages.some(p => p.key === item.packageKey)).map(item => item.discountPercent)) } : null;
}
// codeguard:components:end
