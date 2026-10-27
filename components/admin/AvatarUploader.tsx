'use client';

import { useState } from 'react';
import type { ChangeEvent } from 'react';

/** Shrinks the chosen picture to a 256 x 256 square in the browser, then uploads it. */
export default function AvatarUploader({ current, userId, label = 'Change photo', onDone }: { current?: string | null; userId?: string; label?: string; onDone?: (url: string) => void }) {
  const [url, setUrl] = useState(current ?? '');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErr('');
    setMsg('');
    setBusy(true);
    try {
      const blob = await shrink(file);
      const form = new FormData();
      form.set('file', blob, 'avatar.webp');
      if (userId) form.set('userId', userId);
      const res = await fetch('/api/admin/avatar', { method: 'POST', body: form });
      const d = (await res.json()) as { ok: boolean; error?: string; url?: string };
      if (d.ok && d.url) {
        setUrl(d.url);
        setMsg('Photo saved.');
        onDone?.(d.url);
      } else setErr(d.error ?? 'Could not save the photo.');
    } catch {
      setErr('Could not read that picture. Try a JPG, PNG or WebP.');
    }
    setBusy(false);
  }

  return (
    <div className="adm__avatar">
      {url ? <img className="adm__avatarimg" src={url} alt="" width={56} height={56} /> : <span className="adm__avatarimg adm__avatarimg--empty" aria-hidden="true" />}
      <label className="adm__ghost adm__filebtn">
        {busy ? 'Saving...' : label}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick} disabled={busy} className="adm__fileinput" />
      </label>
      {err ? <span className="adm__notice adm__notice--error" role="alert">{err}</span> : null}
      {msg ? <span className="adm__muted" aria-live="polite">{msg}</span> : null}
    </div>
  );
}

async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas');
  const side = Math.min(bitmap.width, bitmap.height);
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  const toBlob = (type: string, q: number) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, q));
  const out = (await toBlob('image/webp', 0.85)) ?? (await toBlob('image/jpeg', 0.85));
  if (!out) throw new Error('no blob');
  return out;
}
