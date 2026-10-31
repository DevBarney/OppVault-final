'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { initials, REVIEW_MAX, REVIEW_MIN, USED_FOR } from '../../lib/reviews';
import '../../app/submit/submit.css';
import './reviews.css';

type Status = 'idle' | 'loading' | 'success' | 'error';

/** Shrinks the chosen photo to a 128 x 128 square in the browser before it is sent. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas');
  const side = Math.min(bitmap.width, bitmap.height);
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  const toBlob = (type: string, q: number) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, q));
  const out = (await toBlob('image/webp', 0.82)) ?? (await toBlob('image/jpeg', 0.82));
  if (!out) throw new Error('no blob');
  return out;
}

export default function ReviewForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [usedFor, setUsedFor] = useState('');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState('');
  const [photoNote, setPhotoNote] = useState('');

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoNote('');
    try {
      const blob = await shrink(file);
      if (preview) URL.revokeObjectURL(preview);
      setPhoto(blob);
      setPreview(URL.createObjectURL(blob));
    } catch {
      setPhotoNote('Could not read that picture. Try a JPG, PNG or WebP.');
    }
  }

  function clearPhoto() {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(null);
    setPreview('');
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (rating < 1) {
      setStatus('error');
      setMessage('Choose a star rating from 1 to 5.');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      const data = new FormData();
      data.set('name', name);
      data.set('body', body);
      data.set('rating', String(rating));
      data.set('used_for', usedFor);
      data.set('company', (form.elements.namedItem('company') as HTMLInputElement).value);
      data.set('consent', (form.elements.namedItem('consent') as HTMLInputElement).checked ? 'yes' : 'no');
      if (photo) data.set('photo', photo, 'photo.webp');
      const res = await fetch('/api/reviews', { method: 'POST', body: data });
      const out = (await res.json()) as { ok: boolean; error?: string };
      if (out.ok) {
        setStatus('success');
        setName('');
        setBody('');
        setRating(0);
        setUsedFor('');
        clearPhoto();
        form.reset();
        return;
      }
      setStatus('error');
      setMessage(out.error ?? 'Something went wrong. Please try again.');
    } catch {
      setStatus('error');
      setMessage('Could not reach the server. Check your connection and try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="sub__done" role="status">
        <h2 className="sub__h">Thank you</h2>
        <p>Your review has been received. We read every review before it appears, so it may take a little while to show.</p>
        <button type="button" className="btn btn--ghost" onClick={() => setStatus('idle')}>
          <span>Write another</span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="sub__form" noValidate>
      <div className="sub__row">
        <label className="sub__label" htmlFor="rv-name">Your name</label>
        <input id="rv-name" className="sub__input" value={name} onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" />
      </div>
      <fieldset className="sub__row rv-rate-wrap" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="sub__label">Your rating</legend>
        <div className="rv-rate" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={`rv-rate__opt${n <= (hover || rating) ? ' rv-rate__opt--on' : ''}`} onMouseEnter={() => setHover(n)}>
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`} />
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />
              </svg>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="sub__row">
        <label className="sub__label" htmlFor="rv-used">What did you use OppVault for? (optional)</label>
        <select id="rv-used" className="sub__input" value={usedFor} onChange={(e: ChangeEvent<HTMLSelectElement>) => setUsedFor(e.target.value)}>
          <option value="">Choose one</option>
          {USED_FOR.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>
      <div className="sub__row">
        <label className="sub__label" htmlFor="rv-body">Your review</label>
        <textarea
          id="rv-body"
          className="sub__input"
          rows={5}
          value={body}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
          required
          minLength={REVIEW_MIN}
          maxLength={REVIEW_MAX}
          placeholder="What did you use OppVault for, and how did it help?"
        />
        <span className="rv-count" aria-live="polite">{body.length}/{REVIEW_MAX}</span>
      </div>
      <div className="sub__row">
        <span className="sub__label" id="rv-photo-label">Small photo (optional)</span>
        <div className="rv-photo">
          {preview ? (
            <img className="rv-avatar" src={preview} alt="Your chosen photo" width={48} height={48} />
          ) : (
            <span className="rv-avatar rv-avatar--initials" aria-hidden="true">{name.trim() ? initials(name) : '?'}</span>
          )}
          <label className="btn btn--ghost rv-photo__btn" aria-labelledby="rv-photo-label">
            <span>{preview ? 'Change photo' : 'Add a photo'}</span>
            <input className="rv-photo__input" type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick} />
          </label>
          {preview ? (
            <button type="button" className="btn btn--ghost" onClick={clearPhoto}>
              <span>Remove</span>
            </button>
          ) : null}
        </div>
        <p className="rv-hint">Shown as a small circle next to your review. Without one, your initials are used.</p>
        {photoNote ? <p className="sub__error" role="alert">{photoNote}</p> : null}
      </div>
      {/* Honeypot: hidden from people and screen readers. */}
      <div className="sub__trap" aria-hidden="true">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="sub__check">
        <input type="checkbox" name="consent" required />
        <span>I am happy for OppVault to show my name, review and photo (if I added one) on this website.</span>
      </label>
      {status === 'error' ? <p className="sub__error" role="alert">{message}</p> : null}
      <button type="submit" className="btn btn--primary" disabled={status === 'loading'}>
        <span>{status === 'loading' ? 'Sending...' : 'Send my review'}</span>
      </button>
    </form>
  );
}
