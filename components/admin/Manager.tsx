'use client';

import { useState, type ChangeEvent } from 'react';

type Kind = { kind: string; label: string };
type Item = { id: string; title: string; slug: string; category?: string; published: boolean; deadline?: string | null; published_at?: string; source_url?: string | null };

export default function Manager({ kinds }: { kinds: Kind[] }) {
  const [kind, setKind] = useState(kinds[0]?.kind ?? 'courses');
  const [items, setItems] = useState<Item[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function load(k = kind) {
    setBusy(true);
    setMsg('');
    setPicked(new Set());
    try {
      const res = await fetch(`/api/admin/items?kind=${encodeURIComponent(k)}`);
      const data = (await res.json()) as { ok: boolean; error?: string; items?: Item[] };
      if (data.ok) setItems(data.items ?? []);
      else {
        setItems(null);
        setMsg(data.error ?? 'Could not load the list.');
      }
    } catch {
      setMsg('Could not reach the server.');
    }
    setBusy(false);
  }

  async function act(action: 'publish' | 'unpublish' | 'delete', only?: Item) {
    const ids = only ? [only.id] : [...picked];
    if (ids.length === 0) return;
    const what = only ? `"${only.title}"` : `${ids.length} item(s)`;
    if (action === 'delete' && !window.confirm(`Delete ${what} for good? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/items', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, ids, action }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; count?: number };
      setMsg(data.ok ? `Done (${data.count}).` : data.error ?? 'Nothing was changed.');
      if (data.ok) await load();
    } catch {
      setMsg('Could not reach the server.');
    }
    setBusy(false);
  }

  function toggle(id: string) {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  }

  return (
    <div className="adm__form">
      <label className="adm__label" htmlFor="adm-mkind">Show</label>
      <div className="adm__actions">
        <select id="adm-mkind" className="adm__input" value={kind} onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setKind(e.target.value); setItems(null); }}>
          {kinds.map((k) => (
            <option key={k.kind} value={k.kind}>{k.label}</option>
          ))}
        </select>
        <button type="button" className="adm__ghost" disabled={busy} onClick={() => load()}>Load list</button>
      </div>
      {msg ? <p className="adm__notice" aria-live="polite">{msg}</p> : null}
      {items ? (
        items.length === 0 ? (
          <p className="adm__muted">Nothing here yet.</p>
        ) : (
          <>
            <div className="adm__actions">
              <button type="button" className="adm__ghost" disabled={busy || picked.size === 0} onClick={() => act('unpublish')}>Hide selected</button>
              <button type="button" className="adm__ghost" disabled={busy || picked.size === 0} onClick={() => act('publish')}>Show selected</button>
              <button type="button" className="adm__ghost adm__ghost--danger" disabled={busy || picked.size === 0} onClick={() => act('delete')}>Delete selected</button>
            </div>
            <ul className="adm__rows">
              {items.map((it) => (
                <li key={it.id}>
                  <label>
                    <input type="checkbox" checked={picked.has(it.id)} onChange={() => toggle(it.id)} />
                    <span className="adm__rowtitle">{it.title}</span>
                    {kind === 'opportunities' && it.category ? <span className="adm__chip">{it.category}</span> : null}
                    <span className={`adm__chip ${it.published ? '' : 'adm__chip--draft'}`}>{it.published ? 'live' : 'hidden'}</span>
                  </label>
                  <div className="adm__rowtools">
                    {it.source_url ? (
                      <a className="adm__link" href={it.source_url} target="_blank" rel="noopener noreferrer nofollow">Check link</a>
                    ) : null}
                    <button type="button" className="adm__ghost" disabled={busy} onClick={() => act(it.published ? 'unpublish' : 'publish', it)}>
                      {it.published ? 'Hide' : 'Show'}
                    </button>
                    <button type="button" className="adm__ghost adm__ghost--danger" disabled={busy} onClick={() => act('delete', it)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="adm__muted">Tip: use Delete on a single row for a fake or wrong listing. Showing the newest {items.length}.</p>
          </>
        )
      ) : null}
    </div>
  );
}
