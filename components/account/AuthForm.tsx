'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import './account.css';
import { enabledProviders } from '../../lib/account/providers';
import { finishSignIn } from './finish';
import PasswordInput from './PasswordInput';
import { safePath } from './refs';
import VaultDoor from '../VaultDoor';
import { CheckIcon } from '../Icons';

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

  const heading = mode === 'signup' ? 'Create your free account' : mode === 'forgot' ? 'Reset your password' : 'Welcome back';
  const lead =
    mode === 'forgot'
      ? 'Enter your email and we will send you a link to choose a new password.'
      : save
        ? 'Sign in to save this opportunity and find it again in My saved.'
        : mode === 'signup'
          ? 'Keep the opportunities you like in one place, and tick off the ones you have applied for.'
          : 'Pick up where you left off. Everything you saved is waiting for you.';
  const strength = password.length >= 14 ? 3 : password.length >= MIN_PASSWORD ? 2 : password.length > 0 ? 1 : 0;

  return (
    <div className="acct-auth">
      <div className="acct-aside">
        <div className="acct-aside__art" aria-hidden="true">
          <VaultDoor />
        </div>
        <div className="acct-aside__copy">
          <h1 className="acct-aside__title">{heading}</h1>
          <p className="acct-aside__lead">{lead}</p>
          <ul className="acct-perks" aria-label="What an account gives you">
            <li><CheckIcon className="acct-perks__tick" /> Save any listing with one tap</li>
            <li><CheckIcon className="acct-perks__tick" /> Mark what you have applied for</li>
            <li><CheckIcon className="acct-perks__tick" /> Free, and you can delete your account at any time</li>
          </ul>
        </div>
      </div>

      <div className="acct-card">
        {mode !== 'forgot' ? (
          <div className="acct-tabs" role="group" aria-label="Sign in or create an account">
            <button type="button" className="acct-tab" aria-pressed={mode === 'signin'} onClick={() => switchTo('signin')}>
              Sign in
            </button>
            <button type="button" className="acct-tab" aria-pressed={mode === 'signup'} onClick={() => switchTo('signup')}>
              Create account
            </button>
          </div>
        ) : null}

        {mode !== 'forgot' && providers.length > 0 ? (
          <>
            <div className="acct-social">
              {providers.map((p) => (
                <button key={p.id} type="button" className="acct-social__btn" onClick={() => social(p.id)}>
                  <SocialMark id={p.id} />
                  <span>{mode === 'signup' ? 'Sign up' : 'Continue'} with {p.label}</span>
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
          {mode === 'signup' ? (
            <div className="acct-meter" data-level={strength}>
              <span className="acct-meter__bars" aria-hidden="true">
                <i /><i /><i />
              </span>
              <span className="acct-meter__text" role="status">
                {strength === 0
                  ? `At least ${MIN_PASSWORD} characters. A short sentence works well.`
                  : strength === 1
                    ? `${MIN_PASSWORD - password.length} more to go`
                    : strength === 2
                      ? 'Long enough. A few more characters makes it stronger.'
                      : 'Strong length'}
              </span>
            </div>
          ) : null}

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
            <button type="button" className="acct-linkbtn" onClick={() => switchTo('forgot')}>
              Forgot your password?
            </button>
          ) : null}
          {mode === 'forgot' ? (
            <button type="button" className="acct-linkbtn" onClick={() => switchTo('signin')}>
              Back to sign in
            </button>
          ) : null}
        </div>

        {mode === 'signup' ? (
          <p className="acct-legal">
            By creating an account you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy notice</Link>.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SocialMark({ id }: { id: string }) {
  if (id === 'google')
    return (
      <svg className="acct-social__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.39 3.62v3h3.87c2.27-2.09 3.57-5.17 3.57-8.81Z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3a7.2 7.2 0 0 1-10.72-3.78H1.35v3.09A12 12 0 0 0 12 24Z" />
        <path fill="#FBBC05" d="M5.35 14.31a7.2 7.2 0 0 1 0-4.62V6.6H1.35a12 12 0 0 0 0 10.8l4-3.09Z" />
        <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.43-3.43A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.35 6.6l4 3.09A7.2 7.2 0 0 1 12 4.77Z" />
      </svg>
    );
  if (id === 'linkedin_oidc')
    return (
      <svg className="acct-social__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect width="24" height="24" rx="4" fill="#0A66C2" />
        <path fill="#fff" d="M6.1 9.5h2.7V18H6.1V9.5Zm1.35-4.2a1.57 1.57 0 1 1 0 3.14 1.57 1.57 0 0 1 0-3.14ZM10.5 9.5h2.6v1.17h.04c.36-.69 1.25-1.41 2.57-1.41 2.75 0 3.26 1.81 3.26 4.16V18h-2.7v-4.07c0-.97-.02-2.22-1.35-2.22-1.35 0-1.56 1.06-1.56 2.15V18H10.5V9.5Z" />
      </svg>
    );
  return (
    <svg className="acct-social__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M17.75 3h3.07l-6.7 7.67L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.78L17.75 3Zm-1.08 16.16h1.7L7.4 4.75H5.58l11.09 14.41Z" />
    </svg>
  );
}
