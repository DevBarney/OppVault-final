'use client';

import { useState } from 'react';
import type { ChangeEvent } from 'react';

type Batch = { n: number; total: number; active: number; unsubscribed: number };
type Send = { campaign: string; subject: string; batch: number; recipients: number; created_at: string };
type Summary = {
  batchSize: number;
  total: number;
  active: number;
  unsubscribed: number;
  batches: Batch[];
  sends: Send[];
  fromSet: boolean;
  historyAvailable: boolean;
};

const newCampaign = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2));

const STARTER = `Hello,

Here is what is new on OppVault this week.

## Closing soon
- Add the first opportunity here
- Add the second one here

[button: See all opportunities | https://oppvault.app]

Always check the official source before you apply.

The OppVault team`;

export default function Mailing() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [campaign, setCampaign] = useState(newCampaign);
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [body, setBody] = useState(STARTER);
  const [testTo, setTestTo] = useState('');
  const [html, setHtml] = useState('');

  async function load() {
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/mail');
      const d = (await res.json()) as { ok: boolean; error?: string } & Partial<Summary>;
      if (d.ok) setSummary(d as Summary);
      else setErr(d.error ?? 'Could not load subscribers.');
    } catch {
      setErr('Could not reach the server.');
    }
    setBusy(false);
  }

  async function call(payload: Record<string, unknown>) {
    const res = await fetch('/api/admin/mail', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ subject, previewText, body, campaign, ...payload }),
    });
    return (await res.json()) as { ok: boolean; error?: string; message?: string; html?: string; remaining?: number; added?: number };
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      await fn();
    } catch {
      setErr('Could not reach the server.');
    }
    setBusy(false);
  }

  const preview = () =>
    run(async () => {
      const d = await call({ action: 'preview' });
      if (d.ok) setHtml(d.html ?? '');
      else setErr(d.error ?? 'Could not build the preview.');
    });

  const test = () =>
    run(async () => {
      const d = await call({ action: 'test', to: testTo });
      if (d.ok) setMsg(d.message ?? 'Test sent.');
      else setErr(d.error ?? 'Test failed.');
    });

  const prepare = (n: number) =>
    run(async () => {
      for (let i = 0; i < 40; i++) {
        const d = await call({ action: 'sync', batch: n });
        if (!d.ok) {
          setErr(d.error ?? 'Could not prepare the batch.');
          return;
        }
        setMsg(d.remaining ? `Preparing batch ${n}... ${d.remaining} to go.` : `Batch ${n} is ready.`);
        if (!d.remaining) return;
      }
      setMsg('Still preparing. Press Prepare again to continue.');
    });

  const send = (b: Batch) =>
    run(async () => {
      if (!window.confirm(`Send "${subject}" to batch ${b.n}: ${b.active} subscribers? This cannot be undone.`)) return;
      const d = await call({ action: 'send', batch: b.n });
      if (d.ok) {
        setMsg(d.message ?? 'Sent.');
        await load();
      } else setErr(d.error ?? 'Sending failed.');
    });

  const sentFor = (n: number) => summary?.sends.find((s) => s.campaign === campaign && s.batch === n);
  const multi = (summary?.batches.length ?? 0) > 1 || (summary?.total ?? 0) > (summary?.batchSize ?? 1000);

  return (
    <div className="adm__form">
      <div className="adm__actions">
        <button type="button" className="adm__ghost" disabled={busy} onClick={load}>
          {summary ? 'Refresh subscribers' : 'Load subscribers'}
        </button>
      </div>
      {err ? <p className="adm__notice adm__notice--error" role="alert">{err}</p> : null}
      {msg ? <p className="adm__notice adm__notice--ok" aria-live="polite">{msg}</p> : null}

      {summary ? (
        <>
          <p className="adm__notice">
            <b>{summary.active}</b> subscribed · {summary.unsubscribed} unsubscribed · {summary.batches.length} {summary.batches.length === 1 ? 'batch' : 'batches'} of up to {summary.batchSize}.
            {summary.fromSet ? '' : ' RESEND_FROM is not set yet, so sending is switched off until your domain is verified.'}
          </p>
          {multi ? <p className="adm__muted">With more than {summary.batchSize} subscribers, each batch must be prepared once (it gets its own list in Resend) before it can be sent.</p> : null}
        </>
      ) : null}

      <label className="adm__label" htmlFor="mail-subject">Subject</label>
      <input id="mail-subject" className="adm__input" value={subject} maxLength={150} onChange={(e: ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)} />
      <label className="adm__label" htmlFor="mail-preview">Preview text (shown next to the subject in inboxes, optional)</label>
      <input id="mail-preview" className="adm__input" value={previewText} maxLength={150} onChange={(e: ChangeEvent<HTMLInputElement>) => setPreviewText(e.target.value)} />
      <label className="adm__label" htmlFor="mail-body">Message</label>
      <textarea id="mail-body" className="adm__input adm__textarea" rows={14} value={body} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)} />
      <p className="adm__muted">
        Blank line = new paragraph. <code>## Heading</code>, <code>- bullet</code>, <code>**bold**</code>, <code>[link text](https://...)</code>, and a button on its own line:{' '}
        <code>[button: Label | https://...]</code>. The OppVault header, footer and unsubscribe link are added for you.
      </p>

      <div className="adm__actions">
        <button type="button" className="adm__ghost" disabled={busy} onClick={preview}>Preview</button>
        <input className="adm__input" type="email" placeholder="your@email.com" aria-label="Send a test to" value={testTo} onChange={(e: ChangeEvent<HTMLInputElement>) => setTestTo(e.target.value)} />
        <button type="button" className="adm__ghost" disabled={busy || !testTo} onClick={test}>Send test to me</button>
      </div>

      {html ? <iframe title="Email preview" className="adm__preview" sandbox="" srcDoc={html} /> : null}

      {summary ? (
        <>
          <h3 className="adm__subtitle">Send to subscribers</h3>
          <ul className="adm__rows">
            {summary.batches.map((b) => {
              const done = sentFor(b.n);
              return (
                <li key={b.n}>
                  <div className="adm__rowtitle" style={{ padding: '10px 12px' }}>
                    Batch {b.n}: {b.active} subscribed{b.unsubscribed ? ` (${b.unsubscribed} unsubscribed)` : ''}
                    {done ? <span className="adm__chip">sent</span> : null}
                  </div>
                  <div className="adm__rowtools">
                    {multi ? (
                      <button type="button" className="adm__ghost" disabled={busy} onClick={() => prepare(b.n)}>Prepare</button>
                    ) : null}
                    <button type="button" className="adm__ghost adm__ghost--on" disabled={busy || Boolean(done) || !subject || !summary.fromSet || b.active === 0} onClick={() => send(b)}>
                      {done ? 'Already sent' : `Send to batch ${b.n}`}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="adm__actions">
            <button
              type="button"
              className="adm__ghost"
              onClick={() => {
                setCampaign(newCampaign());
                setSubject('');
                setPreviewText('');
                setBody(STARTER);
                setHtml('');
                setMsg('');
              }}
            >
              Start a new email
            </button>
          </div>
          <p className="adm__muted">Each batch can be sent once per email. Starting a new email lets you send to every batch again.</p>
          {summary.sends.length > 0 ? (
            <>
              <h3 className="adm__subtitle">Recent sends</h3>
              <ul className="adm__list">
                {summary.sends.slice(0, 10).map((s) => (
                  <li key={`${s.campaign}-${s.batch}`}>
                    {new Date(s.created_at).toLocaleString('en-GB')}: "{s.subject}", batch {s.batch}, {s.recipients} subscribers
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
