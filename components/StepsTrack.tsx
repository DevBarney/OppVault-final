'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

/**
 * The "How OppVault helps" steps, wired to the scroll. A line fills as the steps pass the middle of the
 * screen and each step lights up in turn; the last one, where you act, turns gold.
 * Without JavaScript, or with reduced motion, every step simply shows as lit.
 */
export default function StepsTrack({ children, count }: { children: ReactNode; count: number }) {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.dataset.live = 'true';
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const mid = window.innerHeight * 0.62;
      const p = Math.min(1, Math.max(0, (mid - r.top) / Math.max(1, r.height)));
      el.style.setProperty('--p', p.toFixed(3));
      el.dataset.on = String(Math.min(count, Math.floor(p * (count + 0.4)) + (p > 0 ? 1 : 0)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [count]);

  return (
    <ol className="steps stp" ref={ref} data-on={String(count)}>
      <li className="stp__line" aria-hidden="true">
        <span className="stp__fill" />
      </li>
      {children}
    </ol>
  );
}
