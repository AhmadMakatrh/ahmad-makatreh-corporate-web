// codeguard:components:start
// codeguard:defines: ErrorBoundary
import { Component as ComponentRef } from 'react';

function reloadPage() {
  window.location.reload();
}
const reloadPageRef = reloadPage;

export class ErrorBoundary extends ComponentRef {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(previousProps) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const language = this.props.language ?? (typeof document === 'undefined' ? 'en' : document.documentElement.lang);
    const isArabic = language === 'ar';
    return <section className="portfolio-cms-empty" role="alert" dir={isArabic ? 'rtl' : 'ltr'}>
      <h1 className="font-display">{isArabic ? 'تعذر تحميل الصفحة' : 'Unable to load this page'}</h1>
      <p>{isArabic ? 'تحقق من الاتصال ثم أعد تحميل الصفحة للمحاولة مجددًا.' : 'Check your connection, then reload the page to try again.'}</p>
      <button type="button" className="portfolio-button portfolio-button-primary" onClick={reloadPageRef}>
        {isArabic ? 'إعادة تحميل الصفحة' : 'Reload page'}
      </button>
    </section>;
  }
}
// codeguard:components:end
