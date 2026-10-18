// codeguard:components:start
// codeguard:defines: getCategoryDetails, getServiceName, isKnownService, validateBooking
/** @typedef {{name:string,email:string,projectDetails:string,turnstileToken:string|null,serviceKey:string|null,inquiryCategory:string|null}} BookingInput */
const categories = new Map([
  ['software-project', { tag: 'مشروع برمجي', label: 'Software project' }],
  ['employment-opportunity', { tag: 'فرصة عمل', label: 'Employment opportunity' }],
  ['professional-collaboration', { tag: 'طلب تعاون', label: 'Collaboration request' }],
  ['technical-support', { tag: 'دعم فني', label: 'Technical support' }],
  ['general-inquiry', { tag: 'استفسار عام', label: 'General inquiry' }],
  ['other', { tag: 'أخرى', label: 'Other' }],
]);
const categoriesRef = categories;
const services = new Map([
  ['resume', 'Résumé website'], ['landing', 'Landing page'], ['business', 'Business website'],
  ['system', 'Web system starter'], ['mobile', 'Mobile app prototype'], ['custom', 'Custom software solution'],
]);
const servicesRef = services;
export const getCategoryDetails = key => categoriesRef.get(key) ?? null;
export const getServiceName = key => servicesRef.get(key) ?? null;
export const isKnownService = key => servicesRef.has(key);
const isKnownServiceRef = isKnownService;

// .NET whitespace includes U+0085 and excludes U+FEFF, unlike JavaScript trim/\s.
const trimContactValue = value => typeof value === 'string' ? value.replace(/^\p{White_Space}+|\p{White_Space}+$/gu, '') : '';
const trimContactValueRef = trimContactValue;

/** @param {unknown} value @returns {{input:BookingInput|null,errors:string[]}} */
export function validateBooking(value, { allowPublishedService = false } = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { input: null, errors: ['Invalid request data.'] };
  const errors = [];
  const name = trimContactValueRef(value.name);
  const email = trimContactValueRef(value.email);
  const projectDetails = trimContactValueRef(value.projectDetails);
  if (!name) errors.push('Name is required.');
  else if (name.length > 100) errors.push('Name cannot exceed 100 characters.');
  if (!email) errors.push('Email address is required.');
  else if (email.length > 255) errors.push('Email address cannot exceed 255 characters.');
  else if (!/^[^@\p{White_Space}]+@[^@\p{White_Space}]+\.[^@\p{White_Space}]+$/u.test(email)) errors.push('Please provide a valid email address.');
  if (!projectDetails) errors.push('Project details are required.');
  else if (projectDetails.length > 4000) errors.push('Project details cannot exceed 4000 characters.');
  const serviceKey = value.serviceKey ?? null, inquiryCategory = value.inquiryCategory ?? null, turnstileToken = value.turnstileToken ?? null;
  if (serviceKey !== null && (typeof serviceKey !== 'string' || serviceKey.length < 1 || serviceKey.length > 30 || (!isKnownServiceRef(serviceKey) && !allowPublishedService))) errors.push('Please select a valid service.');
  if (inquiryCategory !== null && (typeof inquiryCategory !== 'string' || !categoriesRef.has(inquiryCategory))) errors.push('Please select a valid inquiry category.');
  if (turnstileToken !== null && (typeof turnstileToken !== 'string' || turnstileToken.length > 2048)) errors.push('Invalid verification token.');
  return { input: errors.length ? null : { name, email, projectDetails, serviceKey, inquiryCategory, turnstileToken }, errors: errors };
}
// codeguard:components:end
