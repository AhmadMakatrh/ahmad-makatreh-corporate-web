// codeguard:components:start
// codeguard:defines: AdminApp
import { Suspense as SuspenseRef, lazy as lazyRef, useCallback, useEffect, useRef, useState } from 'react';
import { CircleUserRound as CircleUserRoundRef, Ellipsis as EllipsisRef, FileText as FileTextRef, Inbox as InboxRef, LayoutTemplate as LayoutTemplateRef, LogOut as LogOutRef, ShieldCheck as ShieldCheckRef, Tags as TagsRef } from 'lucide-react';
import { adminApi as api } from './adminApi';
import { InquiryInbox as InquiryInboxRef } from './InquiryInbox';
import './admin.css';
import brandLogo from '../assets/AhmadMakatrh Light logo.png';
const PricingEditor = lazyRef(() => import('./PricingEditor').then(module => ({ default: module.PricingEditor })));
const PricingEditorRef = PricingEditor;
const ContentEditor = lazyRef(() => import('./ContentEditor').then(module => ({ default: module.ContentEditor })));
const ContentEditorRef = ContentEditor;
const PagesEditor = lazyRef(() => import('./PagesEditor').then(module => ({ default: module.PagesEditor })));
const PagesEditorRef = PagesEditor;
const BackupEditor = lazyRef(() => import('./BackupEditor').then(module => ({ default: module.BackupEditor })));
const BackupEditorRef = BackupEditor;
const MediaLibrary = lazyRef(() => import('./MediaLibrary').then(module => ({ default: module.MediaLibrary })));
const MediaLibraryRef = MediaLibrary;
const sections = [
  { key: 'inquiries', icon: InboxRef, label: 'الطلبات', shortLabel: 'الطلبات', editor: InquiryInboxRef },
  { key: 'pricing', icon: TagsRef, label: 'الأسعار والعروض', shortLabel: 'الأسعار', editor: PricingEditorRef },
  { key: 'content', icon: FileTextRef, label: 'المحتوى والصور', shortLabel: 'المحتوى', editor: ContentEditorRef },
  { key: 'pages', icon: LayoutTemplateRef, label: 'الصفحات', shortLabel: 'الصفحات', editor: PagesEditorRef },
  { key: 'media', icon: FileTextRef, label: 'مكتبة الوسائط', shortLabel: 'الوسائط', editor: MediaLibraryRef },
  { key: 'backup', icon: FileTextRef, label: 'النسخ الاحتياطي', shortLabel: 'النسخ', editor: BackupEditorRef },
];
const sectionsRef = sections;

export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(true);
  const [retry, setRetry] = useState(0);
  const [tab, setTab] = useState('inquiries');
  const [dirty, setDirty] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const moreMenuRef = useRef(null);
  const accessStateRef = useRef(null);
  const accessBlocked = checking || Boolean(error);
  const handleDirty = useCallback(value => setDirty(value), []);
  const handleDirtyRef = handleDirty;
  const selectedSection = sectionsRef.find(section => section.key === tab) ?? sectionsRef[0];
  const CurrentEditor = selectedSection.editor;
  const CurrentEditorRef = CurrentEditor;
  function closeMoreMenu() {
    if (!moreMenuRef.current?.open) return;
    moreMenuRef.current.open = false;
    moreMenuRef.current.querySelector('summary')?.focus();
  }
  const closeMoreMenuRef = closeMoreMenu;
  function navigate(next) {
    if (accessBlocked) return;
    if (next === tab) { closeMoreMenuRef(); return; }
    if (dirty && !window.confirm('توجد تعديلات لم تُحفظ. هل تريد الانتقال وتركها؟')) return;
    setDirty(false); setTab(next); closeMoreMenuRef();
  }
  const navigateRef = navigate;
  const permissionError = useCallback(err => { api.clear(); if (err.status === 403) setSession(null); setError(err); setChecking(false); }, []);
  const permissionErrorRef = permissionError;
  async function logout() {
    setLoggingOut(true); setLogoutError('');
    try {
      const response = await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!response.ok) throw new Error('تعذر تسجيل الخروج. حاول مجددًا.');
      api.clear(); window.location.replace('/login');
    } catch (exception) { setLogoutError(exception.message); setLoggingOut(false); }
  }
  const logoutRef = logout;
  useEffect(() => {
    document.documentElement.lang = 'ar'; document.documentElement.dir = 'rtl';
    document.title = 'لوحة الإدارة — أحمد المكاترة';
    let active = true;
    api.session(retry > 0).then(result => { if (active) { setSession(result); setError(null); } })
      .catch(err => { if (active) { if (err.status === 403) setSession(null); setError(err); } })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [retry]);
  useEffect(() => { if (error) accessStateRef.current?.focus(); }, [error]);
  useEffect(() => {
    const closeMenuInEffect = closeMoreMenu;
    const dismissMoreMenuRef = dismissMoreMenu;

    function dismissMoreMenu(event) {
      if (moreMenuRef.current?.open && (event.key === 'Escape' || (event.type === 'pointerdown' && !moreMenuRef.current.contains(event.target)))) closeMenuInEffect();
    }
    document.addEventListener('pointerdown', dismissMoreMenuRef);
    document.addEventListener('keydown', dismissMoreMenuRef);
    return () => { document.removeEventListener('pointerdown', dismissMoreMenuRef); document.removeEventListener('keydown', dismissMoreMenuRef); };
  }, []);
  const accountActions = () => <><span className="admin-account-email" dir="ltr">{session?.email ?? 'التحقق من الدخول'}</span>
    {session && !accessBlocked && <a className="admin-button admin-button-outline" href="/auth/backup">إضافة تطبيق تحقق احتياطي</a>}
    {session && <button className="admin-button admin-button-outline" type="button" onClick={logoutRef} disabled={loggingOut || accessBlocked}><LogOutRef size={16} /> تسجيل الخروج</button>}</>;
  const accountActionsRef = accountActions;
  return <div className="site-admin" dir="rtl">
    <aside className="admin-sidebar"><a href="https://ahmad-makatreh.vip/" className="admin-brand"><img src={brandLogo} alt="أحمد المكاترة" /><span>إدارة الموقع</span></a>
      <p className="admin-sidebar-label">مساحة العمل</p><nav aria-label="لوحة التحكم">{sectionsRef.map(({ key, icon: Icon, label, shortLabel }, index) => <button type="button" key={key} className={index > 2 ? 'admin-nav-secondary' : undefined} aria-label={label} aria-current={tab === key ? 'page' : undefined} disabled={accessBlocked} onClick={() => navigateRef(key)}><Icon size={19} aria-hidden="true" /><span className="admin-nav-full">{label}</span><span className="admin-nav-short" aria-hidden="true">{shortLabel}</span></button>)}<details className="admin-more-menu" ref={moreMenuRef}><summary aria-label="المزيد" aria-current={sectionsRef.slice(3).some(section => section.key === tab) ? 'page' : undefined}><EllipsisRef size={19} aria-hidden="true" /><span>المزيد</span></summary><div className="admin-more-content">{sectionsRef.slice(3).map(({ key, icon: Icon, label }) => <button type="button" key={key} aria-current={tab === key ? 'page' : undefined} disabled={accessBlocked} onClick={() => navigateRef(key)}><Icon size={18} aria-hidden="true" /><span>{label}</span></button>)}</div></details></nav>
      <div className="admin-security"><ShieldCheckRef size={18} /><span>دخول محمي بصلاحيات الإدارة</span></div>
    </aside>
    <div className="admin-workspace"><header className="admin-topbar"><div className="admin-topbar-heading"><span className="admin-desktop-title">لوحة التحكم</span>
      <span className="admin-mobile-title"><strong>إدارة الموقع</strong><small>{selectedSection.label}</small></span></div>
      {logoutError && <span className="admin-topbar-error" role="alert">{logoutError}</span>}
      <div className="admin-toolbar-actions admin-desktop-account">{accountActionsRef()}</div>
      <details className="admin-mobile-account"><summary aria-label="خيارات الحساب"><CircleUserRoundRef size={22} /></summary><div className="admin-mobile-account-content">{accountActionsRef()}</div></details></header>
      <main className="admin-main">{session && <fieldset className="admin-editor-fields" style={{ margin: 0 }} disabled={accessBlocked} hidden={accessBlocked} inert={accessBlocked}>
        <SuspenseRef fallback={<p role="status">جارٍ التحميل…</p>}><CurrentEditorRef onPermissionError={permissionErrorRef} onDirtyChange={handleDirtyRef} isActive={!accessBlocked} /></SuspenseRef></fieldset>}
        {error ? <section className="admin-panel admin-access-state" role="alert" tabIndex={-1} ref={accessStateRef}><ShieldCheckRef size={36} /><h1>{[401, 403].includes(error.status) ? 'الدخول مطلوب' : 'تعذر الاتصال'}</h1>
          <p>{error.message}</p><p>{session ? 'تعديلاتك محفوظة في هذه الصفحة. افتح الدخول في تبويب جديد ثم ارجع وأعد التحقق.' : 'استخدم حساب الإدارة وتطبيق التحقق للدخول.'}</p><a className="admin-button" href="/login" target={session ? '_blank' : undefined} rel={session ? 'noopener noreferrer' : undefined}>صفحة الدخول</a><button className="admin-button" onClick={() => { setError(null); setChecking(true); setRetry(value => value + 1); }}>إعادة التحقق</button></section>
        : checking && <section className="admin-panel admin-access-state" role="status"><ShieldCheckRef size={36} /><p>جارٍ التحقق من صلاحية الدخول…</p></section>}</main>
    </div>
  </div>;
}
// codeguard:components:end
