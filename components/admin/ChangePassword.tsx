'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

export default function ChangePassword() {
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    setMsg('');
    setErr('');
    const current = (f.elements.namedItem('current') as HTMLInputElement).value;
    const next = (f.elements.namedItem('next') as HTMLInputElement).value;
    try {
      const res = await fetch('/api/admin/account', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ current, next }) });
      const d = (await res.json()) as { ok: boolean; error?: string };
      if (d.ok) {
        setMsg('Password changed.');
        f.reset();
      } else setErr(d.error ?? 'Could not change the password.');
    } catch {
      setErr('Could not reach the server.');
    }
  }
  return (
    <form onSubmit={onSubmit} className="adm__form">
      <label className="adm__label" htmlFor="pw-current">Current password</label>
      <input id="pw-current" name="current" type="password" autoComplete="current-password" required className="adm__input" />
      <label className="adm__label" htmlFor="pw-next">New password (at least 10 characters)</label>
      <input id="pw-next" name="next" type="password" autoComplete="new-password" minLength={10} required className="adm__input" />
      {err ? <p className="adm__notice adm__notice--error" role="alert">{err}</p> : null}
      {msg ? <p className="adm__notice adm__notice--ok">{msg}</p> : null}
      <div className="adm__actions"><button type="submit" className="adm__ghost">Change password</button></div>
    </form>
  );
}
