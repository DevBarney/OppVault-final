'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import AvatarUploader from './AvatarUploader';

type User = { id: string; name: string; email: string; active: boolean; last_login: string | null; avatar_url: string | null };

export default function Team() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/users');
      const d = (await res.json()) as { ok: boolean; error?: string; users?: User[] };
      if (d.ok) setUsers(d.users ?? []);
      else setErr(d.error ?? 'Could not load the team.');
    } catch {
      setErr('Could not reach the server.');
    }
    setBusy(false);
  }

  async function act(payload: Record<string, unknown>) {
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const d = (await res.json()) as { ok: boolean; error?: string; password?: string; email?: string };
      if (d.ok) {
        if (d.password) setSecret({ email: String(d.email ?? payload.email ?? 'this person'), password: d.password });
        else setMsg('Done.');
        await load();
      } else setErr(d.error ?? 'Nothing was changed.');
    } catch {
      setErr('Could not reach the server.');
    }
    setBusy(false);
  }

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const name = (f.elements.namedItem('name') as HTMLInputElement).value;
    const email = (f.elements.namedItem('email') as HTMLInputElement).value;
    await act({ action: 'create', name, email });
    f.reset();
  }

  return (
    <div className="adm__form">
      <form onSubmit={onCreate} className="adm__actions">
        <input name="name" className="adm__input" placeholder="Name" required maxLength={80} aria-label="Name" />
        <input name="email" type="email" className="adm__input" placeholder="Email" required aria-label="Email" />
        <button type="submit" className="adm__ghost adm__ghost--on" disabled={busy}>Add writer</button>
        <button type="button" className="adm__ghost" disabled={busy} onClick={load}>{users ? 'Refresh' : 'Load team'}</button>
      </form>
      {err ? <p className="adm__notice adm__notice--error" role="alert">{err}</p> : null}
      {msg ? <p className="adm__notice adm__notice--ok">{msg}</p> : null}
      {secret ? (
        <div className="adm__notice adm__notice--warn" role="status">
          <p style={{ margin: 0 }}>
            <b>Temporary password for {secret.email}</b> (shown once, copy it now and send it privately):
          </p>
          <p style={{ margin: '6px 0' }}><code>{secret.password}</code></p>
          <p style={{ margin: 0 }}>They sign in at /admin/login with their email and this password, and can change it on the writing page.</p>
          <button type="button" className="adm__ghost" onClick={() => setSecret(null)}>I have copied it</button>
        </div>
      ) : null}
      {users && users.length === 0 ? <p className="adm__muted">No writers yet.</p> : null}
      <ul className="adm__rows">
        {users?.map((u) => (
          <li key={u.id}>
            <div className="adm__rowtitle" style={{ padding: '10px 12px' }}>
              {u.avatar_url ? <img className="adm__avatarimg adm__avatarimg--sm" src={u.avatar_url} alt="" width={36} height={36} style={{ marginRight: 8, verticalAlign: 'middle' }} /> : null}
              {u.name} <span className="adm__muted">{u.email}</span>
              <span className={`adm__chip ${u.active ? '' : 'adm__chip--draft'}`}>{u.active ? 'active' : 'switched off'}</span>
            </div>
            <div className="adm__rowtools">
              <AvatarUploader userId={u.id} current={null} label="Photo" onDone={() => void load()} />
              <button type="button" className="adm__ghost" disabled={busy} onClick={() => act({ action: 'reset', id: u.id, email: u.email })}>New password</button>
              <button type="button" className="adm__ghost" disabled={busy} onClick={() => act({ action: u.active ? 'deactivate' : 'activate', id: u.id })}>{u.active ? 'Switch off' : 'Switch on'}</button>
              <button type="button" className="adm__ghost adm__ghost--danger" disabled={busy} onClick={() => { if (window.confirm(`Delete ${u.name}'s account? Their posts stay.`)) void act({ action: 'delete', id: u.id }); }}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
