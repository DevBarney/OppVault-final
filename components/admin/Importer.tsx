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


const MAX_FILE = 10 * 1024 * 1024;
const MAX_ROWS = 20000;
const CHUNK_CHARS = 600 * 1024;
const CHUNK_ROWS = 900;

/** Splits CSV text into parts the server accepts. Each part repeats the header. Empty rows are dropped. */
function splitCsv(raw: string): { chunks: { text: string; offset: number }[]; rows: number; blank: number } {
  const text = raw.replace(/^\uFEFF/, '');
  const records: string[] = [];
  let start = 0;
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') inQuotes = !inQuotes;
    else if (c === '\n' && !inQuotes) {
      records.push(text.slice(start, i).replace(/\r$/, ''));
      start = i + 1;
    }
  }
  if (start < text.length) records.push(text.slice(start).replace(/\r$/, ''));
  if (records.length === 0) return { chunks: [], rows: 0, blank: 0 };
  const header = records[0];
  const chunks: { text: string; offset: number }[] = [];
  let cur: string[] = [];
  let size = 0;
  let firstIdx = 1;
  let blank = 0;
  let rows = 0;
  const flush = () => {
    if (cur.length === 0) return;
    chunks.push({ text: [header, ...cur].join('\n'), offset: firstIdx - 1 });
    cur = [];
    size = 0;
  };
  for (let i = 1; i < records.length; i++) {
    const rec = records[i];
    if (rec.replace(/[,;\s"]/g, '') === '') {
      blank++;
      continue;
    }
    if (cur.length === 0) firstIdx = i + 1;
    cur.push(rec);
    rows++;
    size += rec.length + 1;
    if (size >= CHUNK_CHARS || cur.length >= CHUNK_ROWS) flush();
  }
  flush();
  return { chunks, rows, blank };
}

function partNote(mode: 'check' | 'import', done: Result): string {
  if (mode === 'import' && (done.saved ?? 0) > 0) return `${done.saved} rows from the earlier parts were already saved. Upload the file again to finish: rows already saved are simply updated, never duplicated. `;
  return 'Nothing has been saved. ';
}

export default function Importer({ kinds, canImport }: { kinds: Kind[]; canImport: boolean }) {
  const [kind, setKind] = useState(kinds[0]?.kind ?? 'courses');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [blankNote, setBlankNote] = useState(0);
  const current = kinds.find((k) => k.kind === kind);

  async function send(mode: 'check' | 'import') {
    if (!file) return;
    if (file.size > MAX_FILE) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setResult({ ok: false, error: `This file is ${mb} MB. The limit is 10 MB. Remove empty rows and very long text columns, or split it into two files.` });
      return;
    }
    setBusy(true);
    setProgress('');
    // Read the file now, so a file that was edited or moved after it was chosen is caught here with a clear message.
    let text: string;
    try {
      text = await file.text();
    } catch {
      setResult({ ok: false, error: 'This file changed or moved after you chose it. Choose the file again, then press the button.' });
      setBusy(false);
      return;
    }
    const split = splitCsv(text);
    if (split.chunks.length === 0) {
      setResult({ ok: false, error: 'No rows were found in that file. Check that it has a header row and at least one listing.' });
      setBusy(false);
      return;
    }
    if (split.rows > MAX_ROWS) {
      setResult({ ok: false, error: `That file has ${split.rows.toLocaleString()} rows with data. The limit is ${MAX_ROWS.toLocaleString()} per upload. Split it into two files.` });
      setBusy(false);
      return;
    }
    // The server accepts about 1 MB at a time, so a bigger file is sent in parts and the answers are combined.
    const total: Result = { ok: true, mode, total: 0, valid: 0, invalid: 0, created: 0, updated: 0, saved: 0, unknownColumns: [], issues: [], failed: [], moreIssues: 0, preview: [] };
    for (let i = 0; i < split.chunks.length; i++) {
      const chunk = split.chunks[i];
      if (split.chunks.length > 1) setProgress(`${mode === 'import' ? 'Importing' : 'Checking'} part ${i + 1} of ${split.chunks.length}...`);
      const body = new FormData();
      body.set('kind', kind);
      body.set('mode', mode);
      body.set('file', new File([chunk.text], file.name, { type: 'text/csv' }));
      let res: Response;
      try {
        res = await fetch('/api/admin/import', { method: 'POST', body });
      } catch {
        setResult({ ok: false, error: `Could not reach the server on part ${i + 1} of ${split.chunks.length}. ${partNote(mode, total)}Check your connection and try again.` });
        setBusy(false);
        setProgress('');
        return;
      }
      let r: Result;
      try {
        r = (await res.json()) as Result;
      } catch {
        setResult({
          ok: false,
          error:
            (res.status === 401 || res.status === 403
              ? 'Please sign in again, then upload the file. '
              : `The server answered with an error (${res.status}) on part ${i + 1} of ${split.chunks.length}. `) + partNote(mode, total),
        });
        setBusy(false);
        setProgress('');
        return;
      }
      if (!r.ok) {
        setResult({ ok: false, error: `${r.error ?? 'Something went wrong.'}${split.chunks.length > 1 ? ` (part ${i + 1} of ${split.chunks.length}). ${partNote(mode, total)}` : ''}` });
        setBusy(false);
        setProgress('');
        return;
      }
      total.total = (total.total ?? 0) + (r.total ?? 0);
      total.valid = (total.valid ?? 0) + (r.valid ?? 0);
      total.invalid = (total.invalid ?? 0) + (r.invalid ?? 0);
      total.created = (total.created ?? 0) + (r.created ?? 0);
      total.updated = (total.updated ?? 0) + (r.updated ?? 0);
      total.saved = (total.saved ?? 0) + (r.saved ?? 0);
      total.unknownColumns = [...new Set([...(total.unknownColumns ?? []), ...(r.unknownColumns ?? [])])];
      const off = chunk.offset;
      const room = 50 - (total.issues?.length ?? 0);
      const mine = (r.issues ?? []).map((x) => ({ line: x.line + off, message: x.message }));
      total.issues = [...(total.issues ?? []), ...mine.slice(0, Math.max(0, room))];
      total.moreIssues = (total.moreIssues ?? 0) + (r.moreIssues ?? 0) + Math.max(0, mine.length - Math.max(0, room));
      total.failed = [...(total.failed ?? []), ...(r.failed ?? []).map((x) => ({ line: x.line + off, message: x.message }))].slice(0, 50);
      if (i === 0) total.preview = r.preview;
    }
    setResult(total);
    setBlankNote(split.blank);
    setProgress('');
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

      {busy && progress ? <p className="adm__muted" role="status">{progress}</p> : null}
      {result?.ok && blankNote > 0 ? <p className="adm__muted">{blankNote.toLocaleString()} empty rows were skipped.</p> : null}
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
