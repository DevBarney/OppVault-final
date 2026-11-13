'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import './account.css';
import { NOTE_MAX, STATUSES, type StatusId } from '../../lib/account/statuses';

export type TrackRow = {
  category: string;
  slug: string;
  title: string;
  provider: string;
  href: string;
  listed: boolean;
  closes: string; // already formatted, or ''
  status: StatusId;
  applied_on: string;
  note: string;
};

async function save(row: TrackRow, change: Partial<Pick<TrackRow, 'status' | 'applied_on' | 'note'>>): Promise<string> {
  try {
    const res = await fetch('/api/account/applied', {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ category: row.category, slug: row.slug, ...change }),
    });
    if (res.ok) return '';
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return data.error ?? 'That did not save. Please try again.';
  } catch {
    return 'We could not reach the server. Please try again.';
  }
}

function Row({ initial, onStatus }: { initial: TrackRow; onStatus: (id: string, status: StatusId) => void }) {
  const [row, setRow] = useState(initial);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const key = `${row.category}-${row.slug}`;

  function flash(text: string) {
    setMsg(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), 2500);
  }

  async function commit(change: Partial<Pick<TrackRow, 'status' | 'applied_on' | 'note'>>) {
    const before = row;
    setRow({ ...row, ...change });
    setError('');
    const problem = await save(before, change);
    if (problem) {
      setRow(before);
      setError(problem);
      return;
    }
    if (change.status) onStatus(key, change.status);
    flash('Saved');
  }

  return (
    <li className="trk-row" data-status={row.status}>
      <div className="trk-row__head">
        <div>
          <h3 className="trk-row__title">
            {row.listed ? <Link href={row.href}>{row.title}</Link> : row.title}
          </h3>
          <p className="trk-row__meta">
            {row.provider ? `${row.provider}` : ''}
            {row.closes ? `${row.provider ? '. ' : ''}${row.closes}` : ''}
            {!row.listed ? 'No longer listed on OppVault' : ''}
          </p>
        </div>
        <span className="trk-row__saved" role="status" aria-live="polite">{msg}</span>
      </div>
      <div className="trk-row__fields">
        <label className="trk-field">
          <span>Status</span>
          <select value={row.status} onChange={(e: ChangeEvent<HTMLSelectElement>) => commit({ status: e.target.value as StatusId })}>
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
        <label className="trk-field">
          <span>Date applied</span>
          <input
            type="date"
            value={row.applied_on}
            max={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (e.target.value) commit({ applied_on: e.target.value });
            }}
          />
        </label>
      </div>
      <label className="trk-field trk-field--note">
        <span>Private note</span>
        <textarea
          rows={2}
          maxLength={NOTE_MAX}
          placeholder="Reference number, who you spoke to, documents you sent, next step"
          defaultValue={row.note}
          onBlur={(e: { target: { value: string } }) => {
            if (e.target.value !== row.note) commit({ note: e.target.value });
          }}
        />
      </label>
      {error ? <p className="acct-msg acct-msg--error" role="alert">{error}</p> : null}
    </li>
  );
}

/** The list of applications, with a filter by status. Changes save as soon as you make them. */
export default function Tracker({ rows }: { rows: TrackRow[] }) {
  const [filter, setFilter] = useState<'all' | StatusId>('all');
  const [statuses, setStatuses] = useState<Record<string, StatusId>>(() => Object.fromEntries(rows.map((r) => [`${r.category}-${r.slug}`, r.status])));
  const counts = STATUSES.map((s) => ({ ...s, n: Object.values(statuses).filter((v) => v === s.id).length }));
  const visible = rows.filter((r) => filter === 'all' || statuses[`${r.category}-${r.slug}`] === filter);

  return (
    <div className="trk">
      <div className="trk-filter" role="group" aria-label="Show applications by status">
        <button type="button" className="chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
          All <strong>{rows.length}</strong>
        </button>
        {counts.map((c) => (
          <button key={c.id} type="button" className="chip" aria-pressed={filter === c.id} onClick={() => setFilter(c.id)} disabled={c.n === 0 && filter !== c.id}>
            {c.label} <strong>{c.n}</strong>
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="acct-note">Nothing with that status yet.</p>
      ) : (
        <ul className="trk-list">
          {visible.map((r) => (
            <Row key={`${r.category}-${r.slug}`} initial={r} onStatus={(id, s) => setStatuses((m) => ({ ...m, [id]: s }))} />
          ))}
        </ul>
      )}
    </div>
  );
}
