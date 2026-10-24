'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

type Props = {
  children: ReactNode;
  as?: 'div' | 'li' | 'section';
  className?: string;
  /** Milliseconds to wait before this one animates, so a row of items can arrive one after another. */
  delay?: number;
};

type Phase = 'idle' | 'hidden' | 'shown';

/**
 * Fades and lifts its content into place as you scroll it into view.
 *
 * The server renders it fully visible, so nothing is ever hidden if JavaScript fails.
 * Only things that start below the fold are hidden after the page loads, and people who ask
 * their device to reduce motion never see them hidden at all.
 */
export default function Reveal({ children, as = 'div', className, delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // already on screen

    setPhase('hidden');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setPhase('shown');
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as as 'div';
  const style = { '--reveal-delay': `${delay}ms` } as CSSProperties;
  const classes = `${className ? `${className} ` : ''}reveal${phase === 'idle' ? '' : ` reveal--${phase}`}`;

  return (
    <Tag ref={ref} className={classes} style={style}>
      {children}
    </Tag>
  );
}
