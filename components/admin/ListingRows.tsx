'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export type Row = {
  id: string;
  title: string;
  meta: string;
  /** Path of the live page, for example /scholarships/some-slug */
  href: string;
  /** A short line under the title, such as "Page not found (404)". */
  note?: string;
  /** The official link, opened in a new tab so it can be checked by hand. */
  external?: string;
};

type Props = {
  rows: Row[];
  empty: string;
  /** When set, a button hides every row in one go. */
  bulkLabel?: string;
};

/** A list of live listings with a Hide button on each. Hiding keeps the listing; it only takes it off the website. */
export default function ListingRows({ rows, empty, bulkLabel }: Props) {
  const router = useRouter();
  const [gone, setGone] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const shown = rows.filter((r) => !gone.includes(r.id));

  async function hide(ids: string[]) {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/items', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: 'opportunities', ids, action: 'unpublish' }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setGone((g) => [...g, ...ids]);
        setMsg(ids.length === 1 ? 'Hidden. It is no longer on the website.' : `${ids.length} listings hidden. They are no longer on the website.`);
        router.refresh();
      } else setMsg(data.error ?? 'Nothing was changed.');
    } catch {
      setMsg('Could not reach the server.');
    }
    setBusy(false);
  }

  if (shown.length === 0) return <p className="adm__notice adm__notice--ok">{empty}</p>;

  return (
    <div className="adm__queue">
      {bulkLabel ? (
        <p>
          <button
            type="button"
            className="adm__ghost adm__ghost--danger"
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Hide ${shown.length} listings from the website? They stay in your list and you can show them again.`)) void hide(shown.slice(0, 200).map((r) => r.id));
            }}
          >
            {bulkLabel} ({Math.min(shown.length, 200)})
          </button>
        </p>
      ) : null}
      <ul className="adm__rows adm__rows--plain">
        {shown.map((r) => (
          <li key={r.id}>
            <div className="adm__rowmain">
              <a className="adm__rowtitle adm__link" href={r.href} target="_blank" rel="noreferrer">
                {r.title}
              </a>
              <span className="adm__rowmeta">{r.meta}</span>
              {r.note ? <span className="adm__rownote">{r.note}</span> : null}
            </div>
            <div className="adm__rowtools">
              {r.external ? (
                <a className="adm__ghost adm__linkbtn" href={r.external} target="_blank" rel="noreferrer noopener">
                  Open link
                </a>
              ) : null}
              <button type="button" className="adm__ghost" disabled={busy} onClick={() => void hide([r.id])}>
                Hide
              </button>
            </div>
          </li>
        ))}
      </ul>
      {msg ? (
        <p className="adm__notice" role="status">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
