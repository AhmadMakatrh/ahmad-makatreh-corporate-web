// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: CvLink
import { Download as DownloadRef } from 'lucide-react';
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { usePublishedSite as useSite } from '../../providers/publishedSiteContext';

export function CvLink({ className = '' }) {
  const { language } = useLang();
  const { snapshot } = useSite();
  return (
    <a className={`portfolio-button portfolio-button-outline ${className}`} href={snapshot.content?.assets?.cvUrl || '/documents/Ahmad_Makhatreh_CV.pdf'} download>
      <span>{language === 'ar' ? 'السيرة الذاتية' : 'Résumé'}</span>
      <DownloadRef size={19} strokeWidth={1.7} aria-hidden="true" />
    </a>
  );
}
// codeguard:components:end
