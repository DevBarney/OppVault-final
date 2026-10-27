'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import './account.css';
import { finishSignIn } from './finish';
import { safePath } from './refs';

/** The page a social sign-in lands on. It reads the result from the address, stores the session, and moves on. */
export default function CallbackClient() {
  const [error, setError] = useState('');

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const next = safePath(search.get('next'));
    const save = search.get('save');
    const fail = hash.get('error_description') ?? search.get('error_description') ?? hash.get('error') ?? search.get('error');
    const at = hash.get('access_token');
    const rt = hash.get('refresh_token');
    // Take the tokens out of the address bar straight away.
    window.history.replaceState(null, '', window.location.pathname);

    if (fail || !at || !rt) {
      const text = fail ?? '';
      setError(
        /not enabled|unsupported provider|provider is not/i.test(text)
          ? 'That sign-in option is not switched on yet. Please use another one, or your email.'
          : /denied|cancel/i.test(text)
            ? 'The sign-in was cancelled. You can try again whenever you like.'
            : 'We could not complete that sign-in. Please try again.',
      );
      return;
    }
    const expires = Number(hash.get('expires_in')) || 3600;
    fetch('/api/account/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ access_token: at, refresh_token: rt, expires_in: expires }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('rejected');
        return finishSignIn(next, save);
      })
      .catch(() => setError('We could not complete that sign-in. Please try again.'));
  }, []);

  return (
    <div className="acct-card acct-card--narrow">
      {error ? (
        <>
          <h1 className="acct-title">Sign-in did not finish</h1>
          <p className="acct-msg acct-msg--error" role="alert">
            {error}
          </p>
          <Link className="btn btn--primary acct-submit" href="/account/sign-in">
            Back to sign in
          </Link>
        </>
      ) : (
        <>
          <h1 className="acct-title">Signing you in…</h1>
          <p className="acct-lead" role="status">
            One moment.
          </p>
        </>
      )}
    </div>
  );
}
