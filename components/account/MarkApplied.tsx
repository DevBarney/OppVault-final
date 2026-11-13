'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import './account.css';
import { setApplied } from './store';

export type SavedPick = { category: string; slug: string; title: string; provider: string };

/** Saved opportunities that are not in the tracker yet, each with a one-tap "I applied". */
export default function MarkApplied({ picks, more }: { picks: SavedPick[]; more: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function mark(p: SavedPick) {
    setBusy(`${p.category}/${p.slug}`);
    setError('');
    const ok = await setApplied(p.category, p.slug, true);
    setBusy('');
    if (ok) router.refresh();
    else setError('That did not save. Please try again.');
  }

  return (
    <aside className="trk-prompt" aria-labelledby="trk-prompt-h">
      <h2 id="trk-prompt-h" className="trk-prompt__title">Applied to one of your saved opportunities?</h2>
      <p className="trk-prompt__text">Add it here to follow it through.</p>
      <ul className="trk-prompt__list">
        {picks.map((p) => (
          <li key={`${p.category}/${p.slug}`}>
            <span className="trk-prompt__name">
              <Link href={`/${p.category}/${p.slug}`}>{p.title}</Link>
              {p.provider ? <small>{p.provider}</small> : null}
            </span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => mark(p)} disabled={busy !== ''}>
              {busy === `${p.category}/${p.slug}` ? 'Adding' : 'I applied'}
            </button>
          </li>
        ))}
      </ul>
      {more > 0 ? <p className="acct-note"><Link href="/account/saved">{more} more in My saved</Link></p> : null}
      {error ? <p className="acct-msg acct-msg--error" role="alert">{error}</p> : null}
    </aside>
  );
}
