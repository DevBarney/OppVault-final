'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { MouseEvent } from 'react';
import './account.css';
import { setApplied, useAccount } from './store';

const COLOURS = ['#FBB800', '#1BDBE3', '#0DB4F8', '#0332B3', '#FFFFFF'];

/** A short burst of confetti from the button. Skipped for visitors who prefer reduced motion. */
function confetti(from: HTMLElement) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !from.animate) return;
  const r = from.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  for (let i = 0; i < 28; i++) {
    const bit = document.createElement('span');
    const size = 6 + Math.random() * 6;
    bit.className = 'confetti-bit';
    bit.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size * 0.5}px;background:${COLOURS[i % COLOURS.length]}`;
    document.body.appendChild(bit);
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const dist = 90 + Math.random() * 130;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const anim = bit.animate(
      [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx * 1.1}px, ${dy + 110}px) rotate(${Math.random() * 720}deg)`, opacity: 0 },
      ],
      { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
    );
    anim.onfinish = () => bit.remove();
    anim.oncancel = () => bit.remove();
  }
}

/**
 * "I applied" toggle for a listing page. `baseCount` is how many visitors had marked it when the page was built;
 * the number is shown only once it reaches `minPublic`, and it moves by one when you tick or untick.
 */
export default function AppliedButton({ category, slug, baseCount, minPublic }: { category: string; slug: string; baseCount: number; minPublic: number }) {
  const account = useAccount();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [delta, setDelta] = useState(0);
  const applied = account.applied.has(`${category}/${slug}`);
  const shown = Math.max(0, baseCount + delta);

  async function onClick(event: MouseEvent<HTMLButtonElement>) {
    const button = event.currentTarget;
    if (busy) return;
    if (account.status === 'ready' && !account.signedIn) {
      const here = `${window.location.pathname}${window.location.search}`;
      router.push(`/account/sign-in?next=${encodeURIComponent(here)}`);
      return;
    }
    setBusy(true);
    setNote('');
    const ok = await setApplied(category, slug, !applied);
    setBusy(false);
    if (!ok) {
      setNote('That did not save. Please try again.');
      return;
    }
    setDelta((d) => d + (applied ? -1 : 1));
    if (!applied) confetti(button);
  }

  return (
    <div className="applied">
      <button type="button" className={`applied__btn${applied ? ' is-applied' : ''}`} aria-pressed={applied} onClick={onClick} disabled={busy}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d={applied ? 'm5 12.5 4.5 4.5L19 7.5' : 'M12 5v14M5 12h14'} />
        </svg>
        <span>{applied ? 'You applied' : 'I applied'}</span>
      </button>
      {applied ? (
        <p className="applied__count">
          <Link href="/account/applications">Track it in My applications</Link>
        </p>
      ) : null}
      {shown >= minPublic ? (
        <p className="applied__count">{shown} people on OppVault have marked this as applied.</p>
      ) : (
        <p className="applied__count">Mark it once you have submitted your application, so you can keep track.</p>
      )}
      <span className="visually-hidden" role="status">{note || (applied ? 'Marked as applied' : '')}</span>
      {note ? <p className="applied__error" role="alert">{note}</p> : null}
    </div>
  );
}
