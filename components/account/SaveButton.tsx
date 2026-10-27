'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import './account.css';
import { setSaved, useAccount } from './store';

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
  const saved = account.saved.has(`${category}/${slug}`);

  async function onClick() {
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
  }

  const label = saved ? `Remove ${title} from your saved list` : `Save ${title}`;
  return (
    <>
      <button
        type="button"
        className={`save save--${variant}${saved ? ' is-saved' : ''}`}
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
