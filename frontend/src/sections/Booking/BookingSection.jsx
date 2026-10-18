// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: BookingSection
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { submitBooking as sendBooking } from '../../api/bookingApi';
import { MagneticButton as MagneticButtonRef } from '../../components/ui/MagneticButton';
import { usePublishedSite as useSite } from '../../providers/publishedSiteContext';
import { defaultPricing as defaultPricingRef } from '../../data/serviceCatalog';

const INQUIRY_CATEGORIES = ['software-project', 'employment-opportunity', 'professional-collaboration', 'technical-support', 'general-inquiry', 'other'];
const INQUIRY_CATEGORIESRef = INQUIRY_CATEGORIES;
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TURNSTILE_SCRIPT_URLRef = TURNSTILE_SCRIPT_URL;

export function BookingSection({ isProjectInquiry = false, serviceKey = null } = {}) {
  const { t: tRef, language } = useLang();
  const { snapshot } = useSite();
  const packageItem = isProjectInquiry ? (snapshot.pricing ?? defaultPricingRef).packages.find(item => item.key === serviceKey && !item.hidden) : null;
  const selectedService = packageItem?.key ?? null;
  const serviceName = packageItem?.title[language] ?? null;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    inquiryCategory: selectedService ? 'software-project' : '',
    projectDetails: '',
  });

  const [turnstileToken, setTurnstileToken] = useState('');
  const categoryDetailsRef = useRef(null);
  const turnstileContainerRef = useRef(null);
  const turnstileWidgetId = useRef(null);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null); // { success: boolean, message: string }
  const formVisible = !submissionStatus?.success;

  // Load and render Turnstile widget if site key is configured
  useEffect(() => {
    if (!turnstileSiteKey || !formVisible) return;

    let isMounted = true;

    const renderWidget = () => {
      if (window.turnstile && turnstileContainerRef.current && isMounted && !turnstileWidgetId.current) {
        try {
          turnstileWidgetId.current = window.turnstile.render(turnstileContainerRef.current, {
            sitekey: turnstileSiteKey,
            callback: (token) => {
              if (isMounted) setTurnstileToken(token);
            },
            'error-callback': () => {
              if (isMounted) setTurnstileToken('');
            },
            'expired-callback': () => {
              if (isMounted) setTurnstileToken('');
            },
            theme: 'light',
          });
        } catch (e) {
          console.warn('[Turnstile] Initialization error:', e);
        }
      }
    };
    const renderWidgetRef = renderWidget;

    let script = null;
    if (!window.turnstile) {
      script = document.querySelector(`script[src="${TURNSTILE_SCRIPT_URLRef}"]`);
      if (!script) {
        script = document.createElement('script');
        script.src = TURNSTILE_SCRIPT_URLRef;
        script.async = true;
        script.defer = true;
        // The shared script may fail after this form unmounts; the next visit must be able to load it again.
        script.addEventListener('error', event => event.currentTarget.remove(), { once: true });
        document.head.appendChild(script);
      }
      script.addEventListener('load', renderWidgetRef);
    } else {
      renderWidgetRef();
    }

    return () => {
      isMounted = false;
      script?.removeEventListener('load', renderWidgetRef);
      if (window.turnstile && turnstileWidgetId.current) {
        try {
          window.turnstile.remove(turnstileWidgetId.current);
        } catch (error) {
          console.warn('[Turnstile] Cleanup error:', error);
        }
      }
      turnstileWidgetId.current = null;
    };
  }, [turnstileSiteKey, formVisible]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleChangeRef = handleChange;

  useEffect(() => {
    const closeCategoryOnOutsideClick = (event) => {
      if (categoryDetailsRef.current && !categoryDetailsRef.current.contains(event.target)) {
        categoryDetailsRef.current.open = false;
      }
    };
    const closeCategoryOnOutsideClickRef = closeCategoryOnOutsideClick;

    document.addEventListener('pointerdown', closeCategoryOnOutsideClickRef);
    return () => document.removeEventListener('pointerdown', closeCategoryOnOutsideClickRef);
  }, []);

  const handleCategoryKeyDown = (event) => {
    if (isSubmitting) return;
    const details = categoryDetailsRef.current;
    if (!details) return;

    if (event.key === 'Escape' && details.open) {
      event.preventDefault();
      details.open = false;
      details.querySelector('summary')?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      details.open = true;
      const options = [...details.querySelectorAll('[data-category-option]')];
      const currentIndex = options.indexOf(document.activeElement);
      const nextIndex = currentIndex < 0
        ? (event.key === 'ArrowDown' ? 0 : options.length - 1)
        : (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      options[nextIndex]?.focus();
    }
  };
  const handleCategoryKeyDownRef = handleCategoryKeyDown;

  const selectCategory = (category) => {
    setFormData((prev) => ({ ...prev, inquiryCategory: category }));
    categoryDetailsRef.current.open = false;
    categoryDetailsRef.current.querySelector('summary')?.focus();
  };
  const selectCategoryRef = selectCategory;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;

    // Basic client validation
    if (!formData.name.trim() || !formData.email.trim() || !INQUIRY_CATEGORIESRef.includes(formData.inquiryCategory) || !formData.projectDetails.trim()) {
      setSubmissionStatus({
        success: false,
        message: tRef('formRequired'),
      });
      if (!INQUIRY_CATEGORIESRef.includes(formData.inquiryCategory) && categoryDetailsRef.current) {
        categoryDetailsRef.current.open = true;
        categoryDetailsRef.current.querySelector('summary')?.focus();
      }
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus(null);

    try {
      const response = await sendBooking({
        ...formData,
        serviceKey: selectedService,
        turnstileToken: turnstileToken || null,
      });

      if (response && response.success) {
        setSubmissionStatus({
          success: true,
          message: tRef('formSuccess'),
        });
        setFormData({ name: '', email: '', inquiryCategory: '', projectDetails: '' });
        setTurnstileToken('');
      } else {
        setSubmissionStatus({
          success: false,
          message: response?.message || tRef('formError'),
        });
      }
    } catch (err) {
      console.error('[BookingSection] Submission error:', err);
      
      let errorMessage = tRef('formError');
      if (err.data?.code === 'duplicate_submission') {
        errorMessage = tRef('duplicateSubmission');
      } else if (err.data?.code === 'ip_blocked') {
        const remainingMinutes = Math.max(1, Math.ceil((err.data.retryAfterSeconds || 1800) / 60));
        errorMessage = language === 'ar'
          ? `تم حظر الإرسال مؤقتًا بسبب تكرار الطلب نفسه. حاول بعد ${remainingMinutes} دقيقة.`
          : `Submitting is temporarily blocked after repeated identical requests. Try again in ${remainingMinutes} minutes.`;
      } else if (err.data?.code === 'rate_limited' || err.status === 429) {
        errorMessage = tRef('rateLimited');
      } else if (err.status === 400 && err.data?.errors?.length) {
        errorMessage = err.data.errors.join(' | ');
      } else if (err.status === 408 || err.message?.includes('timed out') || !navigator.onLine) {
        errorMessage = language === 'ar'
          ? 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت أو المحاولة لاحقاً.'
          : 'Unable to reach the server. Please check your connection or try again later.';
      } else if (err.data?.message) {
        errorMessage = err.data.message;
      }

      setSubmissionStatus({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
      // Reset Turnstile challenge widget if present
      if (window.turnstile && turnstileWidgetId.current) {
        try {
          window.turnstile.reset(turnstileWidgetId.current);
          setTurnstileToken('');
        } catch {}
      }
    }
  };
  const handleSubmitRef = handleSubmit;

  return (
    <section className="portfolio-booking bg-[var(--portfolio-paper)] text-[var(--portfolio-ink)] section-space-md min-h-[calc(100vh-100px)] flex flex-col justify-between flex-grow select-none md:select-auto">
      <div className="container mx-auto page-gutter max-w-6xl flex-grow flex flex-col justify-center">
        <div className="text-center mb-[var(--section-space-sm)]">
          <p className="font-display font-bold tracking-widest uppercase mb-3 text-xs sm:text-sm text-[var(--portfolio-green)]">
            {isProjectInquiry 
              ? (language === 'ar' ? 'تواصل بشأن مشروع برمجي' : 'Discuss a software project')
              : tRef('bookingTag')}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] xl:text-[2.85rem] font-black uppercase tracking-tight leading-tight text-[var(--portfolio-ink)]">
            {isProjectInquiry 
              ? (serviceName ? `${language === 'ar' ? 'طلب عرض:' : 'Request a proposal:'} ${serviceName}` : (language === 'ar' ? 'لنناقش مشروعك' : 'Let’s discuss your project'))
              : tRef('bookSessionHeading')}
          </h1>
          <p className="text-[var(--portfolio-muted)] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto mt-4">
            {isProjectInquiry
              ? (language === 'ar' ? 'أرسل نبذة عن مشروعك والمهام المطلوبة، وسأتواصل معك عبر البريد الإلكتروني.' : 'Tell me about your project and the work involved, and I’ll reply by email.')
              : tRef('bookingIntro')}
          </p>
        </div>

        {submissionStatus?.success ? (
          <div className="bg-[#fffefa] text-[var(--portfolio-ink)] border border-[var(--portfolio-line)] p-8 md:p-12 rounded-3xl text-center animate-in fade-in my-8 shadow-xl">
            <div className="text-[var(--portfolio-green)] text-5xl mb-4">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold mb-3 uppercase">
              {submissionStatus.message}
            </h3>
            <p role="status" aria-live="polite" className="mx-auto mb-6 max-w-xl text-sm sm:text-base leading-relaxed text-[var(--portfolio-muted)]">
              {tRef('formSuccessDetails')}
            </p>
            <button
              onClick={() => setSubmissionStatus(null)}
              className="portfolio-action portfolio-button-outline border border-[var(--portfolio-green)] text-[var(--portfolio-green)] hover:bg-[var(--portfolio-sage)] font-display font-bold text-xs uppercase tracking-widest px-8 py-3 rounded-lg transition-all focus:outline-none"
            >
              {tRef('startProject')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitRef} className="mt-8 text-start-logical max-w-3xl margin-inline-auto w-full bg-[#fffefa] border border-[var(--portfolio-line)] rounded-2xl p-6 sm:p-10 shadow-[0_16px_45px_-32px_#082e2940]">
            {serviceName && (
              <p className="mb-8 rounded-lg border border-[var(--portfolio-line)] bg-[var(--portfolio-sage)] px-4 py-3 text-sm text-[var(--portfolio-ink)]">
                <span className="font-semibold">{language === 'ar' ? 'موضوع الطلب:' : 'Inquiry subject:'}</span> {serviceName}
              </p>
            )}
            {submissionStatus && !submissionStatus.success && (
              <div role="alert" className="bg-red-50 border border-red-300 text-red-900 p-4 rounded-xl mb-8 text-sm text-center">
                {submissionStatus.message}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label htmlFor="booking-name" className="block font-display text-sm text-[var(--portfolio-ink)] mb-2">
                  {tRef('namePlaceholder')}
                </label>
                <input
                  id="booking-name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChangeRef}
                  className="brutalist-input-field"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="booking-email" className="block font-display text-sm text-[var(--portfolio-ink)] mb-2">
                  {tRef('emailPlaceholder')}
                </label>
                <input
                  id="booking-email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChangeRef}
                  className="brutalist-input-field"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="mb-8">
              <span id="booking-category-label" className="block font-display text-sm text-[var(--portfolio-ink)] mb-2">
                {tRef('inquiryCategoryLabel')}
              </span>
              <details
                ref={categoryDetailsRef}
                className="portfolio-booking-category"
                onToggle={(event) => {
                  const details = event.currentTarget;
                  if (!details.open) {
                    delete details.dataset.placement;
                    details.style.removeProperty('--booking-category-menu-max-height');
                    return;
                  }
                  const options = details.querySelector('.portfolio-booking-category-options');
                  const rect = details.getBoundingClientRect();
                  const spaceBelow = window.innerHeight - rect.bottom;
                  const opensAbove = spaceBelow < options.scrollHeight + 6 && rect.top >= spaceBelow;
                  details.dataset.placement = opensAbove ? 'above' : 'below';
                  details.style.setProperty('--booking-category-menu-max-height', `${Math.max(0, (opensAbove ? rect.top : spaceBelow) - 12)}px`);
                }}
                onKeyDown={handleCategoryKeyDownRef}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
                }}
              >
                <summary
                  id="booking-category"
                  aria-labelledby="booking-category-label booking-category-value"
                  aria-disabled={isSubmitting}
                  data-empty={!formData.inquiryCategory}
                  tabIndex={isSubmitting ? -1 : 0}
                  onClick={(event) => { if (isSubmitting) event.preventDefault(); }}
                  className="brutalist-input-field portfolio-booking-category-trigger"
                >
                  <span id="booking-category-value">
                    {formData.inquiryCategory ? tRef(`inquiryCategory${formData.inquiryCategory}`) : tRef('inquiryCategoryPlaceholder')}
                  </span>
                </summary>
                <div className="portfolio-booking-category-options" role="group" aria-labelledby="booking-category-label">
                  {INQUIRY_CATEGORIESRef.map((category) => (
                    <button
                      key={category}
                      type="button"
                      data-category-option
                      aria-pressed={formData.inquiryCategory === category}
                      className="portfolio-booking-category-option"
                      onClick={() => selectCategoryRef(category)}
                      disabled={isSubmitting}
                    >
                      {tRef(`inquiryCategory${category}`)}
                    </button>
                  ))}
                </div>
              </details>
            </div>

            <div className="mb-12">
              <label htmlFor="booking-details" className="block font-display text-sm text-[var(--portfolio-ink)] mb-2">
                {tRef('projectLabel')}
              </label>
              <textarea
                id="booking-details"
                name="projectDetails"
                required
                rows={3}
                value={formData.projectDetails}
                onChange={handleChangeRef}
                placeholder={tRef('projectPlaceholder')}
                className="brutalist-input-field resize-none"
                disabled={isSubmitting}
              />
            </div>

            {turnstileSiteKey && (
              <div className="mb-8 flex justify-center">
                <div ref={turnstileContainerRef} />
              </div>
            )}

            <div className="text-center">
              <MagneticButtonRef
                type="submit"
                className="portfolio-action portfolio-button-primary min-w-44 min-h-13 px-8 rounded-lg bg-[var(--portfolio-green)] text-[var(--portfolio-paper)] hover:bg-[#0b362b] disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-display font-bold uppercase tracking-widest"
                style={{ cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
              >
                <span>{isSubmitting ? tRef('submitting') : tRef('submit')}</span>
              </MagneticButtonRef>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
// codeguard:components:end
