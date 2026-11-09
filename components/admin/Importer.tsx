'use client';

import { useState, type ChangeEvent } from 'react';

type Kind = { kind: string; label: string; note: string };
type Result = {
  ok: boolean;
  error?: string;
  mode?: 'check' | 'import';
  total?: number;
  valid?: number;
  invalid?: number;
  created?: number;
  updated?: number;
  saved?: number;
  unknownColumns?: string[];
  issues?: { line: number; message: string }[];
  moreIssues?: number;
  failed?: { line: number; message: string }[];
  preview?: { line: number; title: string; status: 'new' | 'update' | null; published: boolean }[];
};

export default function Importer({ kinds, canImport }: { kinds: Kind[]; canImport: boolean }) {
  const [kind, setKind] = useState(kinds[0]?.kind ?? 'courses');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const current = kinds.find((k) => k.kind === kind);

  async function send(mode: 'check' | 'import') {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setResult({ ok: false, error: `This file is ${mb} MB. The limit is 1 MB (about 1,000 rows). Split it into smaller CSV files, or remove very long text columns, then upload each part.` });
      return;
    }
    setBusy(true);
    // Read the file now, so a file that was edited or moved after it was chosen is caught here with a clear message.
    let text: string;
    try {
      text = await file.text();
    } catch {
      setResult({ ok: false, error: 'This file changed or moved after you chose it. Choose the file again, then press the button.' });
      setBusy(false);
      return;
    }
    const body = new FormData();
    body.set('kind', kind);
    body.set('mode', mode);
    body.set('file', new File([text], file.name, { type: 'text/csv' }));
    let res: Response | null = null;
    try {
      res = await fetch('/api/admin/import', { method: 'POST', body });
    } catch {
      setResult({ ok: false, error: 'Could not reach the server. Check your connection and try again.' });
    }
    if (res) {
      try {
        setResult((await res.json()) as Result);
      } catch {
        setResult({
          ok: false,
          error:
            res.status === 401 || res.status === 403
              ? 'Please sign in again, then upload the file.'
              : res.status === 413
                ? 'This file is too large for the server. Split it into smaller CSV files (under 1 MB each) and upload them one at a time.'
                : `The server answered with an error (${res.status}). Try again in a moment, and if it repeats, tell Barnabas the time.`,
        });
      }
    }
    setBusy(false);
  }

  const imported = result?.mode === 'import' && result.ok;

  return (
    <div className="adm__form">
      <label className="adm__label" htmlFor="adm-kind">What are you uploading?</label>
      <select
        id="adm-kind"
        className="adm__input"
        value={kind}
        onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
          setKind(e.target.value);
          setResult(null);
        }}
      >
        {kinds.map((k) => (
          <option key={k.kind} value={k.kind}>{k.label}</option>
        ))}
      </select>
      {current ? <p className="adm__muted">{current.note}</p> : null}
      <p>
        <a className="adm__link" href={`/api/admin/template?kind=${encodeURIComponent(kind)}`}>
          Download the {current?.label.toLowerCase()} template (CSV)
        </a>
      </p>

      <label className="adm__label" htmlFor="adm-file">CSV file</label>
      <input
        id="adm-file"
        type="file"
        accept=".csv,text/csv"
        className="adm__input"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          setFile(e.target.files?.[0] ?? null);
          setResult(null);
        }}
      />

      <div className="adm__actions">
        <button type="button" className="btn btn--primary" disabled={!file || busy} onClick={() => send('check')}>
          <span>{busy ? 'Working...' : 'Check file'}</span>
        </button>
        {result?.ok && result.mode === 'check' && (result.valid ?? 0) > 0 ? (
          <button type="button" className="btn btn--primary" disabled={busy || !canImport} onClick={() => send('import')}>
            <span>Import {result.valid} {result.valid === 1 ? 'row' : 'rows'}</span>
          </button>
        ) : null}
      </div>

      {result && !result.ok ? <p className="adm__notice adm__notice--error" role="alert">{result.error}</p> : null}

      {result?.ok ? (
        <div className="adm__result" aria-live="polite">
          {imported ? (
            <p className="adm__notice adm__notice--ok">
              Saved {result.saved} {result.saved === 1 ? 'row' : 'rows'}. The site updates within a few moments.
              {result.invalid ? ` ${result.invalid} row(s) were skipped (listed below).` : ''}
            </p>
          ) : (
            <p className="adm__notice">
              {result.total} rows read: <b>{result.valid} ready</b>
              {result.created !== undefined && result.valid ? ` (${result.created} new, ${result.updated} updates)` : ''}
              {result.invalid ? `, ${result.invalid} with problems` : ''}. Nothing has been saved yet.
            </p>
          )}
          {result.unknownColumns && result.unknownColumns.length > 0 ? (
            <p className="adm__muted">Ignored columns (not recognised): {result.unknownColumns.join(', ')}</p>
          ) : null}
          {result.preview && result.preview.length > 0 && !imported ? (
            <ul className="adm__list">
              {result.preview.map((p) => (
                <li key={p.line}>
                  Row {p.line}: {p.title}
                  {p.status ? <span className="adm__chip">{p.status}</span> : null}
                  {!p.published ? <span className="adm__chip adm__chip--draft">draft</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
          {result.failed && result.failed.length > 0 ? (
            <ul className="adm__list adm__list--bad">
              {result.failed.map((f) => (
                <li key={`f${f.line}`}>Row {f.line} not saved: {f.message}</li>
              ))}
            </ul>
          ) : null}
          {result.issues && result.issues.length > 0 ? (
            <ul className="adm__list adm__list--bad">
              {result.issues.map((i) => (
                <li key={i.line}>Row {i.line}: {i.message}</li>
              ))}
              {result.moreIssues ? <li>...and {result.moreIssues} more.</li> : null}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
