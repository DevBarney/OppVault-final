'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { askToJoin } from '../JoinToast';
import './account.css';
import { setApplied, useAccount } from './store';

/**
 * "I applied" under a listing card, so you can track an application without opening the listing.
 * Signed-out visitors are sent to sign in and brought back here. Once ticked, a link goes to My applications.
 */
export default function CardApplied({ category, slug, title }: { category: string; slug: string; title: string }) {
  const account = useAccount();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const applied = account.applied.has(`${category}/${slug}`);

  async function onClick() {
    if (busy) return;
    if (account.status === 'ready' && !account.signedIn) {
      const here = `${window.location.pathname}${window.location.search}`;
      router.push(`/account/sign-in?next=${encodeURIComponent(here)}`);
      return;
    }
    setBusy(true);
    setFailed(false);
    const ok = await setApplied(category, slug, !applied);
    setBusy(false);
    if (!ok) {
      setFailed(true);
      return;
    }
    if (!applied) askToJoin('applied');
  }

  return (
    <div className="card__track">
      <button
        type="button"
        className={`card__track-btn${applied ? ' is-applied' : ''}`}
        aria-pressed={applied}
        aria-label={applied ? `You applied to ${title}. Select to undo` : `Mark ${title} as applied`}
        onClick={onClick}
        disabled={busy}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d={applied ? 'm5 12.5 4.5 4.5L19 7.5' : 'M12 5v14M5 12h14'} />
        </svg>
        <span>{applied ? 'You applied' : 'I applied'}</span>
      </button>
      {applied ? (
        <Link className="card__track-link" href="/account/applications">
          Track it
        </Link>
      ) : null}
      <span className="visually-hidden" role="status">{failed ? 'That did not save. Please try again.' : applied ? 'Marked as applied' : ''}</span>
      {failed ? <span className="card__track-err" aria-hidden="true">Did not save. Try again.</span> : null}
    </div>
  );
}
