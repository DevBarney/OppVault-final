'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

/**
 * The big logo in the hero. On a computer with a mouse it follows the pointer very slightly
 * (a soft tilt, drifting rings and a glow), which makes the page feel responsive without being busy.
 * Touch screens and people who prefer reduced motion get the still version.
 */
export default function HeroArt() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const scope = el?.closest('.hero');
    if (!el || !scope) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      frame = 0;
      el.style.setProperty('--px', x.toFixed(3));
      el.style.setProperty('--py', y.toFixed(3));
    };
    const queue = () => {
      if (!frame) frame = window.requestAnimationFrame(apply);
    };
    const clamp = (value: number) => Math.max(-1, Math.min(1, value));

    const onMove = (event: Event) => {
      const p = event as PointerEvent;
      const r = el.getBoundingClientRect();
      x = clamp((p.clientX - (r.left + r.width / 2)) / (r.width * 0.9));
      y = clamp((p.clientY - (r.top + r.height / 2)) / (r.height * 0.9));
      queue();
    };
    const onLeave = () => {
      x = 0;
      y = 0;
      queue();
    };

    scope.addEventListener('pointermove', onMove);
    scope.addEventListener('pointerleave', onLeave);
    return () => {
      scope.removeEventListener('pointermove', onMove);
      scope.removeEventListener('pointerleave', onLeave);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="hero__art" ref={ref} aria-hidden="true">
      <div className="rings">
        <span className="ring ring--1" />
        <span className="ring ring--2" />
        <span className="ring ring--3" />
      </div>
      <span className="hero__glow" />
      <span className="orbit" />
      <span className="hero__disc" />
      <Image className="hero__logo" src="/logo-stacked.png" alt="" width={1100} height={1031} sizes="320px" />
    </div>
  );
}
