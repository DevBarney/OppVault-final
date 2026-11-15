'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import './account.css';
import PasswordInput from './PasswordInput';
import { refreshAccount } from './store';

const MIN_PASSWORD = 10;

async function send(url: string, body: Record<string, unknown>): Promise<{ ok: boolean; error?: string; name?: string }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; name?: string };
    return res.ok ? { ok: true, name: data.name } : { ok: false, error: data.error ?? 'That did not work. Please try again.' };
  } catch {
    return { ok: false, error: 'We could not reach the server. Please try again.' };
  }
}

type Note = { kind: 'ok' | 'error'; text: string } | null;

/** Profile name and password. Sign-out and delete are in AccountActions below. */
export default function SettingsForms({ email, name }: { email: string; name: string }) {
  const [displayName, setDisplayName] = useState(name);
  const [savedName, setSavedName] = useState(name);
  const [nameBusy, setNameBusy] = useState(false);
  const [nameNote, setNameNote] = useState<Note>(null);

  const [current, setCurrent] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwNote, setPwNote] = useState<Note>(null);

  async function saveName(e: FormEvent) {
    e.preventDefault();
    if (nameBusy) return;
    setNameBusy(true);
    setNameNote(null);
    const r = await send('/api/account/profile', { name: displayName });
    setNameBusy(false);
    if (r.ok) {
      const clean = r.name ?? displayName.trim();
      setDisplayName(clean);
      setSavedName(clean);
      setNameNote({ kind: 'ok', text: 'Saved.' });
      void refreshAccount();
    } else setNameNote({ kind: 'error', text: r.error ?? 'That did not work.' });
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    if (pwBusy) return;
    setPwNote(null);
    if (!current) return setPwNote({ kind: 'error', text: 'Enter your current password.' });
    if (pw.length < MIN_PASSWORD) return setPwNote({ kind: 'error', text: `Choose a password of at least ${MIN_PASSWORD} characters.` });
    if (pw !== pw2) return setPwNote({ kind: 'error', text: 'The two passwords do not match.' });
    setPwBusy(true);
    const r = await send('/api/account/password', { current, password: pw });
    setPwBusy(false);
    if (r.ok) {
      setCurrent('');
      setPw('');
      setPw2('');
      setPwNote({ kind: 'ok', text: 'Password changed. You have been signed out everywhere else.' });
    } else setPwNote({ kind: 'error', text: r.error ?? 'That did not work.' });
  }

  return (
    <>
      <section className="set-sec" id="profile" aria-labelledby="set-profile">
        <div className="set-sec__head">
          <h2 id="set-profile">Profile</h2>
          <p>How your name appears on OppVault. Your photo comes from the account you signed in with.</p>
        </div>
        <div className="set-card">
          <form onSubmit={saveName} className="set-form" noValidate>
            <div className="acct-field">
              <label htmlFor="set-name">Name</label>
              <input
                id="set-name"
                value={displayName}
                maxLength={60}
                autoComplete="name"
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="acct-field">
              <label htmlFor="set-email">Email address</label>
              <input id="set-email" value={email} readOnly aria-describedby="set-email-help" />
              <p id="set-email-help" className="set-help">
                This is the address you sign in with. To change it, <a href="/support">write to support</a> and we will help.
              </p>
            </div>
            {nameNote ? (
              <p className={`acct-msg acct-msg--${nameNote.kind}`} role={nameNote.kind === 'error' ? 'alert' : 'status'}>{nameNote.text}</p>
            ) : null}
            <div className="set-form__row">
              <button type="submit" className="btn btn--primary btn--sm" disabled={nameBusy || displayName.trim() === savedName}>
                {nameBusy ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="set-sec" id="password" aria-labelledby="set-password">
        <div className="set-sec__head">
          <h2 id="set-password">Password</h2>
          <p>Use at least {MIN_PASSWORD} characters. Changing it signs you out of every other device.</p>
        </div>
        <div className="set-card">
          <form onSubmit={savePassword} className="set-form" noValidate>
            <PasswordInput id="set-pw0" label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />
            <PasswordInput id="set-pw" label="New password" value={pw} onChange={setPw} autoComplete="new-password" minLength={MIN_PASSWORD} />
            <PasswordInput id="set-pw2" label="Repeat the new password" value={pw2} onChange={setPw2} autoComplete="new-password" minLength={MIN_PASSWORD} />
            <p className="set-help">
              Signed in with Google, LinkedIn or X and have no password yet? Choose &ldquo;Forgot your password?&rdquo; on the <a href="/account/sign-in">sign-in page</a> to set one.
            </p>
            {pwNote ? (
              <p className={`acct-msg acct-msg--${pwNote.kind}`} role={pwNote.kind === 'error' ? 'alert' : 'status'}>{pwNote.text}</p>
            ) : null}
            <div className="set-form__row">
              <button type="submit" className="btn btn--primary btn--sm" disabled={pwBusy || !pw}>
                {pwBusy ? 'Saving…' : 'Update password'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
