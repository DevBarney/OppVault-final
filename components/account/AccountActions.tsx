'use client';

import { useState } from 'react';
import type { ChangeEvent } from 'react';
import './account.css';
import { forgetAccount } from './store';

/** Sign out, and delete the account for good. */
export default function AccountActions({ email }: { email: string }) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState('');

  async function call(url: string, body: Record<string, unknown>): Promise<boolean> {
    try {
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) setError(data.error ?? 'That did not work. Please try again.');
      return res.ok;
    } catch {
      setError('We could not reach the server. Please try again.');
      return false;
    }
  }

  async function signOut() {
    setBusy(true);
    if (await call('/api/account/signout', {})) {
      forgetAccount();
      window.location.assign('/');
    } else setBusy(false);
  }

  async function remove() {
    setBusy(true);
    setError('');
    if (await call('/api/account/delete', { confirm: typed })) {
      forgetAccount();
      window.location.assign('/');
    } else setBusy(false);
  }

  return (
    <div className="acct-actions">
      <p className="acct-actions__who">
        Signed in as <strong>{email || 'your account'}</strong>
      </p>
      <div className="acct-actions__row">
        <button type="button" className="btn btn--ghost btn--sm" onClick={signOut} disabled={busy}>
          Sign out
        </button>
        {!confirming ? (
          <button type="button" className="acct-linkbtn acct-linkbtn--danger" onClick={() => setConfirming(true)}>
            Delete my account
          </button>
        ) : null}
      </div>
      {confirming ? (
        <div className="acct-danger">
          <p>This deletes your account and your saved list for good. Type <strong>DELETE</strong> to confirm.</p>
          <div className="acct-danger__row">
            <input
              aria-label="Type DELETE to confirm"
              value={typed}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTyped(e.target.value)}
              autoCapitalize="characters"
              spellCheck={false}
            />
            <button type="button" className="btn btn--sm acct-danger__btn" disabled={busy || typed !== 'DELETE'} onClick={remove}>
              Delete for good
            </button>
            <button type="button" className="acct-linkbtn" onClick={() => { setConfirming(false); setTyped(''); setError(''); }}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {error ? (
        <p className="acct-msg acct-msg--error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
