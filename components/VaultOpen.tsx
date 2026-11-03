'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

type Phase = 'idle' | 'closed' | 'open';

/**
 * A card that arrives behind a small vault door. The door swings open as the card scrolls into view.
 * The server renders it open, so nothing is hidden if JavaScript fails, and people who ask their
 * device to reduce motion never see the door at all.
 */
export default function VaultOpen({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;
    setPhase('closed');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPhase('open');
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <li
      ref={ref}
      className={`vo${phase === 'idle' ? '' : ` vo--${phase}`}`}
      style={{ '--vo-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
      <span className="vo__door" aria-hidden="true">
        <svg viewBox="0 0 40 52" className="vo__key">
          <circle cx="20" cy="17" r="8" />
          <path d="M16 22h8l3 20H13l3-20Z" />
        </svg>
      </span>
    </li>
  );
}
