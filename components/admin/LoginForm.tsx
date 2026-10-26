'use client';

import { useState, type FormEvent } from 'react';

export default function LoginForm() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        window.location.href = '/admin';
        return;
      }
      setError(data.error ?? 'Sign-in failed.');
    } catch {
      setError('Could not reach the server. Try again.');
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="adm__form">
      <label className="adm__label" htmlFor="adm-password">Password</label>
      <input id="adm-password" name="password" type="password" autoComplete="current-password" required className="adm__input" />
      {error ? <p className="adm__notice adm__notice--error" role="alert">{error}</p> : null}
      <button type="submit" className="btn btn--primary" disabled={busy}>
        <span>{busy ? 'Signing in...' : 'Sign in'}</span>
      </button>
    </form>
  );
}
