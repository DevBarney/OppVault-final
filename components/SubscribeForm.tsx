'use client';

import { useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowIcon, CheckIcon } from './Icons';
import WhatsAppButton from './WhatsAppButton';

type Props = {
  variant?: 'light' | 'dark';
  whatsappUrl?: string;
};

type Status = 'idle' | 'loading' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Reads ?utm_source=... or ?ref=... so you can see which social post a sign-up came from. */
function readSource(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('utm_source') || params.get('ref') || '';
  } catch {
    return '';
  }
}

export default function SubscribeForm({ variant = 'light', whatsappUrl }: Props) {
  const uid = useId();
  const inputId = `${uid}-email`;
  const hintId = `${uid}-hint`;
  const rowRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  /** A quick sideways shake on the field when something is wrong. Skipped if motion is reduced. */
  function shake() {
    const el = rowRef.current;
    if (!el || typeof el.animate !== 'function') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-8px)' },
        { transform: 'translateX(7px)' },
        { transform: 'translateX(-5px)' },
        { transform: 'translateX(3px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 440, easing: 'cubic-bezier(0.36, 0.07, 0.19, 0.97)' },
    );
  }

  function fail(text: string) {
    setStatus('error');
    setMessage(text);
    shake();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'loading') return;

    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    const company = String(data.get('company') ?? '');

    if (!EMAIL_RE.test(email)) {
      fail('Enter a valid email address, like name@example.com.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, company, source: readSource() }),
      });
      const result = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        confirmation?: boolean;
        error?: string;
      };

      if (res.ok && result.ok) {
        setNeedsConfirmation(Boolean(result.confirmation));
        setStatus('success');
        return;
      }
      fail(result.error || 'Something went wrong. Please try again in a moment.');
    } catch {
      fail('We could not reach the server. Check your connection and try again.');
    }
  }

  const root = `signup${variant === 'dark' ? ' signup--dark' : ''}`;

  if (status === 'success') {
    return (
      <div className={`${root} signup--done`} role="status">
        <span className="signup__check">
          <CheckIcon className="signup__check-icon" />
        </span>
        <div>
          <p className="signup__done-title">{needsConfirmation ? 'Almost there.' : 'You are on the list.'}</p>
          <p className="signup__done-text">
            {needsConfirmation
              ? 'We have sent you an email. Open it and confirm your address to finish subscribing. Check your spam folder if it does not arrive.'
              : 'Thanks for subscribing. We will email you as OppVault takes shape.'}
          </p>
          <div className="signup__next">
            <WhatsAppButton url={whatsappUrl} variant={variant} label="Next, join the WhatsApp community" />
          </div>
        </div>
      </div>
    );
  }

  const loading = status === 'loading';

  return (
    <form className={root} onSubmit={onSubmit} noValidate>
      <label className="visually-hidden" htmlFor={inputId}>
        Email address
      </label>
      <div className="signup__row" ref={rowRef}>
        <input
          id={inputId}
          className="signup__input"
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          maxLength={254}
          aria-describedby={hintId}
          aria-invalid={status === 'error' ? true : undefined}
          disabled={loading}
        />
        {/* Honeypot: hidden from people, tempting to bots. */}
        <div className="signup__trap" aria-hidden="true">
          <label>
            Company
            <input type="text" name="company" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>
        <button className="btn btn--primary signup__submit" type="submit" disabled={loading} aria-busy={loading}>
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              <span>Subscribing</span>
            </>
          ) : (
            <>
              <span>Subscribe</span>
              <ArrowIcon className="btn__arrow" />
            </>
          )}
        </button>
      </div>
      {status === 'error' ? (
        <p id={hintId} className="signup__hint signup__hint--error" role="alert">
          {message}
        </p>
      ) : (
        <p id={hintId} className="signup__hint">
          Updates about OppVault by email. No spam, and you can unsubscribe at any time.{' '}
          <a href="/privacy">Privacy notice</a>
        </p>
      )}
    </form>
  );
}
