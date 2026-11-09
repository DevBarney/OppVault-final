'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const CommandPalette = dynamic(() => import('./CommandPalette'), { ssr: false });
const CookieNotice = dynamic(() => import('./CookieNotice'), { ssr: false });
const Analytics = dynamic(() => import('./Analytics'), { ssr: false });

/**
 * Cookie notice, quick search and analytics are not needed to paint the page, so their code loads after
 * the page is interactive. The search opens on "/" or Ctrl/Cmd+K, and the nav search button, even if
 * pressed before the code has arrived: the first request is replayed once it loads.
 */
export default function LazyChrome() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let done = false;
    let pending = false;
    const go = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    const onKey = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey);
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (isK || (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey)) {
        e.preventDefault();
        pending = true;
        go();
      }
    };
    const onOpen = () => {
      if (!done) {
        pending = true;
        go();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('oppvault:open-search', onOpen);
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (n: number) => void };
    const id = w.requestIdleCallback ? w.requestIdleCallback(go, { timeout: 2500 }) : window.setTimeout(go, 1500);
    const replay = window.setInterval(() => {
      if (pending && done && document.querySelector('.cmdk') === null) {
        // Give the palette a moment to attach its listeners, then replay once.
        window.setTimeout(() => window.dispatchEvent(new Event('oppvault:open-search')), 150);
        pending = false;
      }
    }, 200);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('oppvault:open-search', onOpen);
      window.clearInterval(replay);
      if (w.requestIdleCallback && w.cancelIdleCallback) w.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, []);

  if (!ready) return null;
  return (
    <>
      <CommandPalette />
      <CookieNotice />
      <Analytics />
    </>
  );
}
