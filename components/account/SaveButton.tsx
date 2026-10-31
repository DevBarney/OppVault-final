'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { MouseEvent } from 'react';
import './account.css';
import { setSaved, useAccount } from './store';

/** A small heart that flies from the button to the heart in the header, so the save feels like it landed somewhere. */
function flyToNav(from: HTMLElement) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target = document.querySelector<HTMLElement>('[data-acct-nav]');
  if (!target || !from.animate) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  if (b.width === 0) return;
  const ghost = document.createElement('span');
  ghost.className = 'save-fly';
  ghost.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.3C1.7 8 3.5 4.8 6.8 4.8c2 0 3.5 1.1 5.2 3.1 1.7-2 3.2-3.1 5.2-3.1 3.3 0 5.1 3.2 4 6.4-1.7 4.7-9.2 9.3-9.2 9.3Z"/></svg>';
  ghost.style.left = `${a.left + a.width / 2 - 11}px`;
  ghost.style.top = `${a.top + a.height / 2 - 11}px`;
  document.body.appendChild(ghost);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = ghost.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 40}px) scale(1.15)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.5)`, opacity: 0.2 },
    ],
    { duration: 600, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
  );
  anim.onfinish = () => ghost.remove();
  anim.oncancel = () => ghost.remove();
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg className="save__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 20.5s-7.5-4.6-9.2-9.3C1.7 8 3.5 4.8 6.8 4.8c2 0 3.5 1.1 5.2 3.1 1.7-2 3.2-3.1 5.2-3.1 3.3 0 5.1 3.2 4 6.4-1.7 4.7-9.2 9.3-9.2 9.3Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Save an opportunity to "My saved". Signed-out visitors are taken to sign in first and the opportunity
 * is saved for them as soon as they are back. Use `variant="icon"` on cards, `"full"` on a detail page.
 */
export default function SaveButton({
  category,
  slug,
  title,
  variant = 'icon',
}: {
  category: string;
  slug: string;
  title: string;
  variant?: 'icon' | 'full';
}) {
  const account = useAccount();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [pop, setPop] = useState(false);
  const saved = account.saved.has(`${category}/${slug}`);

  async function onClick(event: MouseEvent<HTMLButtonElement>) {
    const button = event.currentTarget;
    if (busy) return;
    if (account.status === 'ready' && !account.signedIn) {
      const here = `${window.location.pathname}${window.location.search}`;
      router.push(`/account/sign-in?next=${encodeURIComponent(here)}&save=${encodeURIComponent(`${category}/${slug}`)}`);
      return;
    }
    setBusy(true);
    setNote('');
    const ok = await setSaved(category, slug, !saved);
    setBusy(false);
    if (!ok) setNote('That did not save. Please try again.');
    else if (!saved) {
      setPop(true);
      window.setTimeout(() => setPop(false), 500);
      flyToNav(button);
    }
  }

  const label = saved ? `Remove ${title} from your saved list` : `Save ${title}`;
  return (
    <>
      <button
        type="button"
        className={`save save--${variant}${saved ? ' is-saved' : ''}${pop ? ' is-pop' : ''}`}
        aria-pressed={saved}
        aria-label={variant === 'icon' ? label : undefined}
        onClick={onClick}
        disabled={busy}
      >
        <Heart filled={saved} />
        {variant === 'full' ? <span>{saved ? 'Saved' : 'Save for later'}</span> : null}
      </button>
      <span className="visually-hidden" role="status">
        {note || (saved ? 'Saved' : '')}
      </span>
    </>
  );
}
