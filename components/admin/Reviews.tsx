'use client';

import { useEffect, useState } from 'react';

type Rev = { id: string; name: string; body: string; avatar_url: string | null; status: string; created_at: string };

const TABS = [
  { status: 'pending', label: 'Waiting' },
  { status: 'approved', label: 'Approved' },
  { status: 'rejected', label: 'Rejected' },
];

export default function Reviews() {
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState<Rev[] | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function load(s = status) {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`/api/admin/reviews?status=${s}`);
      const data = (await res.json()) as { ok: boolean; error?: string; items?: Rev[] };
      if (data.ok) setItems(data.items ?? []);
      else {
        setItems(null);
        setMsg(data.error ?? 'Could not load reviews.');
      }
    } catch {
      setMsg('Could not reach the server.');
    }
    setBusy(false);
  }

  useEffect(() => {
    void load('pending');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(id: string, action: 'approve' | 'reject' | 'delete') {
    if (action === 'delete' && !window.confirm('Delete this review for good?')) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setMsg(action === 'approve' ? 'Approved. It is now on the website.' : 'Done.');
        await load();
      } else setMsg(data.error ?? 'Nothing was changed.');
    } catch {
      setMsg('Could not reach the server.');
    }
    setBusy(false);
  }

  return (
    <div className="adm__form">
      <div className="adm__actions" role="tablist" aria-label="Review status">
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
            {t.status === 'pending' && status === 'pending' && items ? ` (${items.length})` : ''}
          </button>
        ))}
        <button type="button" className="adm__ghost" disabled={busy} onClick={() => load()}>
          Refresh
        </button>
      </div>
      {msg ? <p className="adm__notice" aria-live="polite">{msg}</p> : null}
      {items && items.length === 0 ? <p className="adm__muted">Nothing here.</p> : null}
      {items?.map((r) => (
        <article key={r.id} className="adm__sub">
          <div className="adm__avatar">
            {r.avatar_url ? <img className="adm__avatarimg" src={r.avatar_url} alt="" width={56} height={56} /> : <span className="adm__avatarimg adm__avatarimg--empty" aria-hidden="true" />}
            <div>
              <h3 className="adm__subtitle">{r.name}</h3>
              <p className="adm__muted">sent {new Date(r.created_at).toLocaleDateString('en-GB')}</p>
            </div>
          </div>
          <p style={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{r.body}</p>
          <div className="adm__actions">
            {r.status !== 'approved' ? (
              <button type="button" className="adm__ghost" disabled={busy} onClick={() => act(r.id, 'approve')}>
                Approve and show
              </button>
            ) : null}
            {r.status === 'pending' ? (
              <button type="button" className="adm__ghost" disabled={busy} onClick={() => act(r.id, 'reject')}>
                Reject
              </button>
            ) : null}
            {r.status === 'approved' ? (
              <button type="button" className="adm__ghost" disabled={busy} onClick={() => act(r.id, 'reject')}>
                Hide
              </button>
            ) : null}
            <button type="button" className="adm__ghost" disabled={busy} onClick={() => act(r.id, 'delete')}>
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
