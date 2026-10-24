'use client';

import { useEffect } from 'react';

/**
 * Small, visitor-triggered touches that are shared across the page:
 *  - a soft ripple from the exact point you press a button;
 *  - a light that follows the pointer across cards (sets --mx / --my);
 *  - the hero logo springs and its star twirls when you tap or click it.
 * Nothing runs for people who have asked their device to reduce motion.
 */
export default function Interactions() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const onDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const btn = target?.closest<HTMLElement>('.btn');
      if (btn && !(btn as HTMLButtonElement).disabled) {
        const r = btn.getBoundingClientRect();
        const size = Math.max(r.width, r.height) * 1.6;
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.setAttribute('aria-hidden', 'true');
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${event.clientX - r.left - size / 2}px`;
        ripple.style.top = `${event.clientY - r.top - size / 2}px`;
        btn.appendChild(ripple);
        window.setTimeout(() => ripple.remove(), 700);
      }
      const art = target?.closest<HTMLElement>('.hero__art');
      if (art) {
        art.classList.remove('is-pop');
        void art.offsetWidth; // restart the animation if it is tapped again
        art.classList.add('is-pop');
        window.setTimeout(() => art.classList.remove('is-pop'), 1100);
      }
    };

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      const card = (event.target as Element | null)?.closest<HTMLElement>('.band__card, .steps__item, .areas__item');
      if (!card) return;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${event.clientX - r.left}px`);
        card.style.setProperty('--my', `${event.clientY - r.top}px`);
      });
    };

    document.addEventListener('pointerdown', onDown, { passive: true });
    if (fine) document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointermove', onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
