'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Result = { ok: boolean; error?: string; checked?: number; ok_count?: number; broken?: number; unsure?: number; remaining?: boolean };

/** Checks the next batch of links straight away, without waiting for the nightly run. */
export default function LinkCheckButton({ waiting }: { waiting: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [bad, setBad] = useState(false);

  async function run() {
    setBusy(true);
    setBad(false);
    setMsg('Checking links. This takes up to a minute.');
    try {
      const res = await fetch('/api/admin/links', { method: 'POST' });
      const data = (await res.json()) as Result & { ok: boolean; checked?: number; broken?: number; unsure?: number; remaining?: boolean };
      if (data.ok) {
        const okN = (data.checked ?? 0) - (data.broken ?? 0) - (data.unsure ?? 0);
        setMsg(
          `Checked ${data.checked ?? 0} links: ${okN} fine, ${data.broken ?? 0} broken, ${data.unsure ?? 0} need a look.` +
            (data.remaining || waiting > (data.checked ?? 0) ? ' More are still waiting. Press the button again.' : ' Everything has been checked.'),
        );
        router.refresh();
      } else {
        setBad(true);
        setMsg(data.error ?? 'The check did not run.');
      }
    } catch {
      setBad(true);
      setMsg('The check took too long or the server could not be reached. Press the button again; progress is saved.');
    }
    setBusy(false);
  }

  return (
    <div className="adm__stack">
      <p>
        <button type="button" className="adm__ghost adm__ghost--on" disabled={busy} onClick={() => void run()}>
          {busy ? 'Checking' : 'Check links now'}
        </button>
      </p>
      {msg ? (
        <p className={`adm__notice${bad ? ' adm__notice--error' : ''}`} role="status">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
