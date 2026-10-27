'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import './account.css';
import { enabledProviders } from '../../lib/account/providers';
import { finishSignIn } from './finish';
import PasswordInput from './PasswordInput';
import { safePath } from './refs';

type Mode = 'signin' | 'signup' | 'forgot';
const MIN_PASSWORD = 10;

async function post(url: string, body: Record<string, unknown>): Promise<{ ok: boolean; error?: string; confirm?: boolean }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; confirm?: boolean };
    return { ok: res.ok && data.ok !== false, error: data.error, confirm: data.confirm };
  } catch {
    return { ok: false, error: 'We could not reach the server. Please check your connection and try again.' };
  }
}

export default function AuthForm({ next, save, startOn = 'signin' }: { next: string; save: string | null; startOn?: Mode }) {
  const [mode, setMode] = useState<Mode>(startOn);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState(''); // hidden trap field for bots
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const providers = enabledProviders();
  const target = safePath(next);

  function switchTo(m: Mode) {
    setMode(m);
    setError('');
    setInfo('');
  }

  function social(id: string) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
    if (!base) {
      setError('Social sign-in is not switched on yet.');
      return;
    }
    const back = `${window.location.origin}/account/callback?next=${encodeURIComponent(target)}${save ? `&save=${encodeURIComponent(save)}` : ''}`;
    window.location.assign(`${base}/auth/v1/authorize?provider=${encodeURIComponent(id)}&redirect_to=${encodeURIComponent(back)}`);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setInfo('');
    if (mode === 'signup' && password.length < MIN_PASSWORD) {
      setError(`Choose a password of at least ${MIN_PASSWORD} characters.`);
      return;
    }
    setBusy(true);
    if (mode === 'forgot') {
      const r = await post('/api/account/reset', { email });
      setBusy(false);
      if (r.ok) setInfo('If there is an account for that email, a link to choose a new password is on its way.');
      else setError(r.error ?? 'That did not work. Please try again.');
      return;
    }
    if (mode === 'signup') {
      const r = await post('/api/account/signup', { name, email, password, company });
      if (!r.ok) {
        setBusy(false);
        setError(r.error ?? 'That did not work. Please try again.');
        return;
      }
      if (r.confirm) {
        setBusy(false);
        setInfo('Nearly there. We have sent a link to your email. Open it to confirm your address, then come back and sign in.');
        setMode('signin');
        setPassword('');
        return;
      }
      await finishSignIn(target, save);
      return;
    }
    const r = await post('/api/account/signin', { email, password });
    if (!r.ok) {
      setBusy(false);
      setError(r.error ?? 'That did not work. Please try again.');
      return;
    }
    await finishSignIn(target, save);
  }

  const title = mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : 'Welcome back';

  return (
    <div className="acct-card">
      <h1 className="acct-title">{title}</h1>
      <p className="acct-lead">
        {mode === 'forgot'
          ? 'Enter your email and we will send you a link to choose a new password.'
          : save
            ? 'Sign in to save this opportunity and find it again in My saved.'
            : 'Save opportunities you like and find them again in one place.'}
      </p>

      {mode !== 'forgot' && providers.length > 0 ? (
        <>
          <div className="acct-social">
            {providers.map((p) => (
              <button key={p.id} type="button" className="acct-social__btn" onClick={() => social(p.id)}>
                <span className="acct-social__mark" aria-hidden="true">
                  {p.label === 'LinkedIn' ? 'in' : p.label === 'Google' ? 'G' : 'X'}
                </span>
                Continue with {p.label}
              </button>
            ))}
          </div>
          <p className="acct-or">
            <span>or use your email</span>
          </p>
        </>
      ) : null}

      <form onSubmit={onSubmit} noValidate={false} className="acct-form">
        {mode === 'signup' ? (
          <div className="acct-field">
            <label htmlFor="acct-name">Your name <span className="acct-optional">(optional)</span></label>
            <input id="acct-name" type="text" value={name} onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)} autoComplete="name" maxLength={80} />
          </div>
        ) : null}
        <div className="acct-field">
          <label htmlFor="acct-email">Email</label>
          <input
            id="acct-email"
            type="email"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            autoComplete="email"
            required
            autoCapitalize="none"
            spellCheck={false}
          />
        </div>
        {mode !== 'forgot' ? (
          <PasswordInput
            id="acct-password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            minLength={mode === 'signup' ? MIN_PASSWORD : undefined}
          />
        ) : null}
        {mode === 'signup' ? <p className="acct-hint">At least {MIN_PASSWORD} characters. A short sentence works well.</p> : null}

        <div className="acct-trap" aria-hidden="true">
          <label>
            Company
            <input type="text" tabIndex={-1} autoComplete="off" value={company} onChange={(e: ChangeEvent<HTMLInputElement>) => setCompany(e.target.value)} />
          </label>
        </div>

        {error ? (
          <p className="acct-msg acct-msg--error" role="alert">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="acct-msg acct-msg--ok" role="status">
            {info}
          </p>
        ) : null}

        <button type="submit" className="btn btn--primary acct-submit" disabled={busy}>
          {busy ? 'One moment…' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}
        </button>
      </form>

      <div className="acct-switch">
        {mode === 'signin' ? (
          <>
            <button type="button" className="acct-linkbtn" onClick={() => switchTo('forgot')}>
              Forgot your password?
            </button>
            <span>
              New here?{' '}
              <button type="button" className="acct-linkbtn" onClick={() => switchTo('signup')}>
                Create an account
              </button>
            </span>
          </>
        ) : (
          <button type="button" className="acct-linkbtn" onClick={() => switchTo('signin')}>
            Back to sign in
          </button>
        )}
      </div>

      {mode === 'signup' ? (
        <p className="acct-legal">
          By creating an account you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy notice</Link>.
        </p>
      ) : null}
    </div>
  );
}
