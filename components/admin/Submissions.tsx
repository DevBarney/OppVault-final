'use client';

import { useState } from 'react';

type Sub = {
  id: string;
  category: string;
  title: string;
  provider: string;
  link: string;
  summary: string;
  deadline: string | null;
  location: string;
  level: string;
  funding: string;
  submitter_name: string;
  submitter_email: string;
  status: string;
  created_at: string;
};

const TABS = [
  { status: 'pending', label: 'Waiting' },
  { status: 'approved', label: 'Approved' },
  { status: 'rejected', label: 'Rejected' },
];

export default function Submissions() {
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState<Sub[] | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function load(s = status) {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`/api/admin/submissions?status=${s}`);
      const data = (await res.json()) as { ok: boolean; error?: string; items?: Sub[] };
      if (data.ok) setItems(data.items ?? []);
      else {
        setItems(null);
        setMsg(data.error ?? 'Could not load submissions.');
      }
    } catch {
      setMsg('Could not reach the server.');
    }
    setBusy(false);
  }

  async function act(id: string, action: 'approve' | 'approve_draft' | 'reject' | 'delete') {
    if (action === 'delete' && !window.confirm('Delete this submission for good?')) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; published?: boolean };
      if (data.ok) {
        setMsg(action === 'approve' ? 'Approved and published.' : action === 'approve_draft' ? 'Approved as a hidden draft. Show it from "Manage what is live".' : 'Done.');
        await load();
      } else setMsg(data.error ?? 'Nothing was changed.');
    } catch {
      setMsg('Could not reach the server.');
    }
    setBusy(false);
  }

  return (
    <div className="adm__form">
      <div className="adm__actions" role="tablist" aria-label="Submission status">
        {TABS.map((t) => (
          <button
            key={t.status}
            type="button"
            role="tab"
            aria-selected={status === t.status}
            className={`adm__ghost ${status === t.status ? 'adm__ghost--on' : ''}`}
            onClick={() => {
              setStatus(t.status);
              setItems(null);
              void load(t.status);
            }}
          >
            {t.label}
          </button>
        ))}
        <button type="button" className="adm__ghost" disabled={busy} onClick={() => load()}>
          {items ? 'Refresh' : 'Load'}
        </button>
      </div>
      {msg ? <p className="adm__notice" aria-live="polite">{msg}</p> : null}
      {items && items.length === 0 ? <p className="adm__muted">Nothing here.</p> : null}
      {items?.map((s) => (
        <article key={s.id} className="adm__sub">
          <h3 className="adm__subtitle">{s.title}</h3>
          <p className="adm__muted">
            {s.category} · sent {new Date(s.created_at).toLocaleDateString('en-GB')} · {s.submitter_name || 'no name'} ({s.submitter_email})
          </p>
          <p>
            Official link:{' '}
            <a className="adm__link" href={s.link} target="_blank" rel="noopener noreferrer nofollow">{s.link}</a>
          </p>
          {s.summary ? <p>{s.summary}</p> : null}
          <ul className="adm__list">
            {s.provider ? <li>Provider: {s.provider}</li> : null}
            {s.deadline ? <li>Deadline: {s.deadline}</li> : null}
            {s.location ? <li>Location: {s.location}</li> : null}
            {s.level ? <li>Level: {s.level}</li> : null}
            {s.funding ? <li>Funding or cost: {s.funding}</li> : null}
          </ul>
          {s.status === 'pending' ? (
            <div className="adm__actions">
              <button type="button" className="adm__ghost adm__ghost--on" disabled={busy} onClick={() => act(s.id, 'approve')}>Approve and publish</button>
              <button type="button" className="adm__ghost" disabled={busy} onClick={() => act(s.id, 'approve_draft')}>Approve as draft</button>
              <button type="button" className="adm__ghost" disabled={busy} onClick={() => act(s.id, 'reject')}>Reject</button>
              <button type="button" className="adm__ghost adm__ghost--danger" disabled={busy} onClick={() => act(s.id, 'delete')}>Delete</button>
            </div>
          ) : (
            <div className="adm__actions">
              <button type="button" className="adm__ghost adm__ghost--danger" disabled={busy} onClick={() => act(s.id, 'delete')}>Delete record</button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
