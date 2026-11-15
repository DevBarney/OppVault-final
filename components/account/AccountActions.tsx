'use client';

import { useState } from 'react';
import type { ChangeEvent } from 'react';
import './account.css';
import { forgetAccount } from './store';

/** Sign out, and delete the account for good. */
export default function AccountActions({ part }: { part: 'sessions' | 'delete' }) {
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

  async function signOutAll() {
    setBusy(true);
    setError('');
    if (await call('/api/account/signout', { all: true })) {
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

  const errorLine = error ? (
    <p className="acct-msg acct-msg--error" role="alert">
      {error}
    </p>
  ) : null;

  if (part === 'sessions') {
    return (
      <div className="set-card">
        <ul className="set-rows">
          <li className="set-row">
            <div>
              <h3 className="set-row__title">This device</h3>
              <p className="set-row__text">Sign out of OppVault here. Your saved list and applications stay safe.</p>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={signOut} disabled={busy}>
              Sign out
            </button>
          </li>
          <li className="set-row">
            <div>
              <h3 className="set-row__title">All devices</h3>
              <p className="set-row__text">Sign out everywhere you are signed in, including this device. Use it if you lost a phone or used a shared computer.</p>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={signOutAll} disabled={busy}>
              Sign out everywhere
            </button>
          </li>
        </ul>
        <p className="set-help set-help--foot">For your security, every sign-in ends 7 days after it began, even if you keep using OppVault.</p>
        {errorLine}
      </div>
    );
  }

  return (
    <div className="set-card set-card--danger">
      <p className="set-row__text">
        Deleting your account removes your saved opportunities and your application tracker for good. We cannot bring them back.
      </p>
      {!confirming ? (
        <div className="set-form__row">
          <button type="button" className="btn btn--sm acct-danger__btn" onClick={() => setConfirming(true)}>
            Delete my account
          </button>
        </div>
      ) : (
        <div className="acct-danger">
          <p>Type <strong>DELETE</strong> to confirm.</p>
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
      )}
      {errorLine}
    </div>
  );
}
