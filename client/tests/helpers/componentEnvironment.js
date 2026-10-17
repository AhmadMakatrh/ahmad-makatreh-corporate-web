// codeguard:components:start
// codeguard:defines: createComponentEnvironment, changeInput, waitFor
import { JSDOM as JSDOMRef } from 'jsdom';
import { act as actRef } from 'react';
import { createServer as createViteServer } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath as filePath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

export async function createComponentEnvironment(options = {}) {
  const dom = new JSDOMRef('<!doctype html><html><body></body></html>', { url: options.url ?? 'https://admin.localhost/', pretendToBeVisual: true });
  const domRef = dom;
  const previous = new Map();
  for (const name of ['window', 'document', 'navigator', 'localStorage', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Element', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent', 'MutationObserver', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'IS_REACT_ACT_ENVIRONMENT', 'fetch']) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    if (name === 'fetch') continue;
    const value = name === 'IS_REACT_ACT_ENVIRONMENT' ? true : ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame'].includes(name) ? domRef.window[name].bind(domRef.window) : domRef.window[name];
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  domRef.window.confirm = () => true;
  domRef.window.matchMedia = query => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} });
  const { createRoot: createRootRef } = await import('react-dom/client');
  const server = await createViteServer({ root: filePath(new URL('../..', import.meta.url)), configFile: false, cacheDir: 'node_modules/.vite-component-tests', plugins: [...(options.plugins ?? []), react()], define: options.define ?? {}, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
  const serverRef = server;
  const mounted = new Set();
  return {
    window: domRef.window,
    load(path) { return serverRef.ssrLoadModule(path); },
    async mount(element) {
      const container = domRef.window.document.createElement('div');
      domRef.window.document.body.appendChild(container);
      const root = createRootRef(container);
      const rootRef = root;
      const unmount = async () => { await actRef(() => rootRef.unmount()); container.remove(); mounted.delete(unmountRef); };
      const unmountRef = unmount;
      mounted.add(unmountRef);
      await actRef(async () => { rootRef.render(element); });
      return { container, unmount: unmountRef };
    },
    async close() {
      for (const unmount of mounted) await unmount();
      await serverRef.close();
      domRef.window.close();
      for (const [name, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else delete globalThis[name];
      }
    },
  };
}

export async function changeInput(input, value) {
  const prototype = input.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  await actRef(() => {
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value);
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
}

export async function waitFor(predicate, message = 'Component did not settle') {
  const deadline = Date.now() + 5000;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error(message);
    await actRef(() => delay(10));
  }
}
// codeguard:components:end
