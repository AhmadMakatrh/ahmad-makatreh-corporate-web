// codeguard:components:start
// codeguard:defines: ContextMenu
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal as createPortalRef } from 'react-dom';
import { ArrowLeft as ArrowLeftRef, Copy as CopyRef, ExternalLink as ExternalLinkRef, Image as ImageRef, Languages as LanguagesRef, Link as LinkRef, RefreshCw as RefreshCwRef } from 'lucide-react';
import { useLanguage as useLang } from '../../hooks/useLanguage';
import './ContextMenu.css';
const webUrlRef = webUrl;
const copyImageRef = copyImage;
const MenuItemRef = MenuItem;


function webUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

async function copyImage(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image copying unavailable.');
  context.drawImage(image, 0, 0);
  const png = new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Image conversion failed.')), 'image/png'));
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
}

function MenuItem({ icon: Icon, label, onClick, disabled, href }) {
  const content = <><Icon size={17} strokeWidth={1.7} aria-hidden="true" /><span>{label}</span></>;
  return href
    ? <a role="menuitem" className="portfolio-context-item" href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}>{content}</a>
    : <button type="button" role="menuitem" className="portfolio-context-item" disabled={disabled} onClick={onClick}>{content}</button>;
}

export function ContextMenu() {
  const closeRef = close;
  const copyRef = copy;
  const handleKeysRef = handleKeys;

  const { language, toggleLanguage: toggleLanguageRef, pendingLanguage, t: tRef } = useLang();
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const menuRef = useRef(null);
  const previousFocus = useRef(null);
  const copyLock = useRef(false);

  function close(restoreFocus = false) {
    setMenu(null); setError('');
    if (restoreFocus && previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true });
  }

  useEffect(() => {
    const openRef = open;

    function open(event, keyboard = false) {
      const target = event.target instanceof Element ? event.target : document.body;
      // Keep native editing, media and modal controls, and touch long-press behavior.
      if (event.shiftKey && !keyboard || event.pointerType === 'touch'
        || target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), video, audio, iframe, dialog[open], .portfolio-preloader')) return;
      event.preventDefault();
      if (copyLock.current || target.closest('.portfolio-context-menu')) return;
      const rect = target.getBoundingClientRect();
      const image = target.closest('img');
      previousFocus.current = document.activeElement;
      setError('');
      setMenu({
        x: keyboard || (!event.clientX && !event.clientY) ? rect.left + Math.min(rect.width, 24) : event.clientX,
        y: keyboard || (!event.clientX && !event.clientY) ? rect.top + Math.min(rect.height, 24) : event.clientY,
        text: window.getSelection()?.toString() || '',
        link: webUrlRef(target.closest('a[href]')?.href),
        image, imageUrl: webUrlRef(image?.currentSrc || image?.src),
      });
    }
    const contextmenu = event => openRef(event);
    const contextmenuRef = contextmenu;
    const keydown = event => { if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) openRef(event, true); };
    const keydownRef = keydown;
    document.addEventListener('contextmenu', contextmenuRef);
    document.addEventListener('keydown', keydownRef);
    return () => { document.removeEventListener('contextmenu', contextmenuRef); document.removeEventListener('keydown', keydownRef); };
  }, []);

  useLayoutEffect(() => {
    if (!menu) return;
    const element = menuRef.current;
    const rect = element.getBoundingClientRect();
    element.style.left = `${Math.max(8, Math.min(menu.x, window.innerWidth - rect.width - 8))}px`;
    element.style.top = `${Math.max(8, Math.min(menu.y, window.innerHeight - rect.height - 8))}px`;
  }, [menu, error]);

  useEffect(() => {
    if (!menu) return;
    menuRef.current.querySelector('[role="menuitem"]:not(:disabled)')?.focus({ preventScroll: true });
    const dismiss = () => setMenu(null);
    const dismissRef = dismiss;
    const outside = event => { if (!menuRef.current?.contains(event.target)) dismissRef(); };
    const outsideRef = outside;
    const scroll = event => { if (!menuRef.current?.contains(event.target)) dismissRef(); };
    const scrollRef = scroll;
    document.addEventListener('pointerdown', outsideRef);
    // Nested scroll events (including carousel autoplay) must not dismiss the menu.
    document.addEventListener('scroll', scrollRef);
    window.addEventListener('resize', dismissRef);
    window.addEventListener('blur', dismissRef);
    return () => {
      document.removeEventListener('pointerdown', outsideRef); document.removeEventListener('scroll', scrollRef);
      window.removeEventListener('resize', dismissRef); window.removeEventListener('blur', dismissRef);
    };
  }, [menu]);

  async function copy(action) {
    if (copyLock.current) return;
    copyLock.current = true; setBusy(true); setError('');
    try { await action(); closeRef(true); }
    catch { setError(tRef('contextMenuCopyFailed')); }
    finally { copyLock.current = false; setBusy(false); }
  }

  function handleKeys(event) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeRef(true); return; }
    if (event.key === 'Tab') { closeRef(true); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = [...menuRef.current.querySelectorAll('[role="menuitem"]:not(:disabled)')];
    const current = items.indexOf(document.activeElement);
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
      : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[index]?.focus();
  }

  if (!menu) return null;
  return createPortalRef(<div ref={menuRef} className="portfolio-context-menu" dir={language === 'ar' ? 'rtl' : 'ltr'} role="menu" aria-label={tRef('contextMenuTitle')}
    aria-busy={busy} onKeyDown={handleKeysRef}>
    <div className="portfolio-context-heading" aria-hidden="true"><span className="portfolio-context-mark" />{tRef('contextMenuTitle')}</div>
    {menu.text.trim() && <div className="portfolio-context-group"><MenuItemRef icon={CopyRef} label={tRef('contextMenuCopyText')} disabled={busy} onClick={() => copyRef(() => navigator.clipboard.writeText(menu.text))} /></div>}
    {menu.link && <div className="portfolio-context-group"><MenuItemRef icon={ExternalLinkRef} label={tRef('contextMenuOpenLink')} href={menu.link} onClick={() => closeRef(true)} />
      <MenuItemRef icon={LinkRef} label={tRef('contextMenuCopyLink')} disabled={busy} onClick={() => copyRef(() => navigator.clipboard.writeText(menu.link))} /></div>}
    {menu.imageUrl && <div className="portfolio-context-group"><MenuItemRef icon={ExternalLinkRef} label={tRef('contextMenuOpenImage')} href={menu.imageUrl} onClick={() => closeRef(true)} />
      <MenuItemRef icon={ImageRef} label={tRef('contextMenuCopyImage')} disabled={busy || !menu.image.complete || !menu.image.naturalWidth || !navigator.clipboard?.write || typeof ClipboardItem === 'undefined'} onClick={() => copyRef(() => copyImageRef(menu.image))} />
      <MenuItemRef icon={LinkRef} label={tRef('contextMenuCopyImageLink')} disabled={busy} onClick={() => copyRef(() => navigator.clipboard.writeText(menu.imageUrl))} /></div>}
    <div className="portfolio-context-group">
      <MenuItemRef icon={ArrowLeftRef} label={tRef('contextMenuBack')} disabled={busy || window.history.length < 2} onClick={() => { closeRef(true); window.history.back(); }} />
      <MenuItemRef icon={RefreshCwRef} label={tRef('contextMenuRefresh')} disabled={busy} onClick={() => { closeRef(); window.location.reload(); }} />
      <MenuItemRef icon={CopyRef} label={tRef('contextMenuCopyPageLink')} disabled={busy} onClick={() => copyRef(() => navigator.clipboard.writeText(window.location.href))} />
    </div>
    <div className="portfolio-context-group"><MenuItemRef icon={LanguagesRef} label={tRef(language === 'ar' ? 'contextMenuTranslateToEnglish' : 'contextMenuTranslateToArabic')} disabled={busy || Boolean(pendingLanguage)} onClick={() => { closeRef(true); toggleLanguageRef(); }} /></div>
    {error && <p className="portfolio-context-error" role="alert">{error}</p>}
  </div>, document.body);
}
// codeguard:components:end
