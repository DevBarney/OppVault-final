'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { CATEGORIES } from '../lib/categories';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function SubmitForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          category: get('category'),
          title: get('title'),
          provider: get('provider'),
          link: get('link'),
          summary: get('summary'),
          deadline: get('deadline'),
          location: get('location'),
          level: get('level'),
          funding: get('funding'),
          name: get('name'),
          email: get('email'),
          company: get('company'),
          consent: (form.elements.namedItem('consent') as HTMLInputElement).checked,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setStatus('success');
        form.reset();
        return;
      }
      setStatus('error');
      setMessage(data.error ?? 'Something went wrong. Please try again.');
    } catch {
      setStatus('error');
      setMessage('Could not reach the server. Check your connection and try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="sub__done" role="status">
        <h2 className="sub__h">Thank you</h2>
        <p>
          Your suggestion has been received. We check every submission against the official source before anything is published, so it
          may take a little while. We only contact you if we have a question.
        </p>
        <button type="button" className="btn btn--ghost" onClick={() => setStatus('idle')}>
          <span>Suggest another</span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="sub__form" noValidate>
      <div className="sub__row">
        <label className="sub__label" htmlFor="sub-category">Type</label>
        <select id="sub-category" name="category" className="sub__input" required defaultValue="">
          <option value="" disabled>Choose a type</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>{c.label}</option>
          ))}
        </select>
      </div>
      <div className="sub__row">
        <label className="sub__label" htmlFor="sub-title">Name of the opportunity</label>
        <input id="sub-title" name="title" className="sub__input" required maxLength={200} />
      </div>
      <div className="sub__row">
        <label className="sub__label" htmlFor="sub-link">Official web address</label>
        <input id="sub-link" name="link" type="url" inputMode="url" placeholder="https://" className="sub__input" required maxLength={600} />
      </div>
      <div className="sub__row">
        <label className="sub__label" htmlFor="sub-provider">Who offers it? (optional)</label>
        <input id="sub-provider" name="provider" className="sub__input" maxLength={160} />
      </div>
      <div className="sub__row">
        <label className="sub__label" htmlFor="sub-summary">What is it, and who is it for? (optional)</label>
        <textarea id="sub-summary" name="summary" className="sub__input" rows={4} maxLength={1000} />
      </div>
      <div className="sub__grid">
        <div className="sub__row">
          <label className="sub__label" htmlFor="sub-deadline">Deadline (optional)</label>
          <input id="sub-deadline" name="deadline" className="sub__input" placeholder="31/12/2026" maxLength={40} />
        </div>
        <div className="sub__row">
          <label className="sub__label" htmlFor="sub-location">Country or Online (optional)</label>
          <input id="sub-location" name="location" className="sub__input" maxLength={120} />
        </div>
        <div className="sub__row">
          <label className="sub__label" htmlFor="sub-level">Level (optional)</label>
          <input id="sub-level" name="level" className="sub__input" placeholder="Undergraduate, Early career..." maxLength={80} />
        </div>
        <div className="sub__row">
          <label className="sub__label" htmlFor="sub-funding">Funding or cost (optional)</label>
          <input id="sub-funding" name="funding" className="sub__input" maxLength={120} />
        </div>
      </div>
      <div className="sub__grid">
        <div className="sub__row">
          <label className="sub__label" htmlFor="sub-name">Your name (optional)</label>
          <input id="sub-name" name="name" className="sub__input" autoComplete="name" maxLength={120} />
        </div>
        <div className="sub__row">
          <label className="sub__label" htmlFor="sub-email">Your email</label>
          <input id="sub-email" name="email" type="email" className="sub__input" autoComplete="email" required maxLength={200} />
        </div>
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
        <span>I am happy for OppVault to review this and to contact me by email about it.</span>
      </label>
      {status === 'error' ? <p className="sub__error" role="alert">{message}</p> : null}
      <button type="submit" className="btn btn--primary" disabled={status === 'loading'}>
        <span>{status === 'loading' ? 'Sending...' : 'Send for review'}</span>
      </button>
    </form>
  );
}
