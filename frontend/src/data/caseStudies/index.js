// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: caseStudies, getCaseStudy
import { crisisFundData as crisisFundDataRef } from './crisisFund';
import { barariData as barariDataRef } from './barari';

export const caseStudies = [crisisFundDataRef, barariDataRef];
const caseStudiesRef = caseStudies;

export function getCaseStudy(slug) {
  return caseStudiesRef.find((cs) => cs.slug === slug) || null;
}
// codeguard:components:end
