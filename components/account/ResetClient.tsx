'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import './account.css';
import PasswordInput from './PasswordInput';

/** Landing page for the "choose a new password" email link. */
export default function ResetClient() {
  const [phase, setPhase] = useState<'checking' | 'ready' | 'bad' | 'done'>('checking');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const at = hash.get('access_token');
    const rt = hash.get('refresh_token');
    window.history.replaceState(null, '', window.location.pathname);
    if (!at || !rt) {
      setPhase('bad');
      return;
    }
    fetch('/api/account/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ access_token: at, refresh_token: rt, expires_in: Number(hash.get('expires_in')) || 3600 }),
    })
      .then((res) => setPhase(res.ok ? 'ready' : 'bad'))
      .catch(() => setPhase('bad'));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) setPhase('done');
      else setError(data.error ?? 'That did not work. Please try again.');
    } catch {
      setError('We could not reach the server. Please try again.');
    }
    setBusy(false);
  }

  return (
    <div className="acct-card acct-card--narrow">
      {phase === 'checking' ? (
        <>
          <h1 className="acct-title">One moment…</h1>
          <p className="acct-lead" role="status">Checking your link.</p>
        </>
      ) : null}
      {phase === 'bad' ? (
        <>
          <h1 className="acct-title">That link has expired</h1>
          <p className="acct-lead">Reset links only work for a short time, and only once. Ask for a new one and try again.</p>
          <Link className="btn btn--primary acct-submit" href="/account/sign-in">
            Back to sign in
          </Link>
        </>
      ) : null}
      {phase === 'ready' ? (
        <>
          <h1 className="acct-title">Choose a new password</h1>
          <form onSubmit={onSubmit} className="acct-form">
            <PasswordInput id="acct-newpw" label="New password" value={password} onChange={setPassword} autoComplete="new-password" minLength={10} />
            <p className="acct-hint">At least 10 characters.</p>
            {error ? (
              <p className="acct-msg acct-msg--error" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="btn btn--primary acct-submit" disabled={busy}>
              {busy ? 'One moment…' : 'Save new password'}
            </button>
          </form>
        </>
      ) : null}
      {phase === 'done' ? (
        <>
          <h1 className="acct-title">Password changed</h1>
          <p className="acct-lead">You are signed in. Your saved opportunities are waiting.</p>
          <Link className="btn btn--primary acct-submit" href="/account/saved">
            Go to My saved
          </Link>
        </>
      ) : null}
    </div>
  );
}
