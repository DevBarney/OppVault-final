'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { OPEN_COOKIES_EVENT, readConsent, saveConsent } from '../lib/consent';

/**
 * The cookie notice. It tells visitors plainly what OppVault stores, and lets them choose.
 * Both choices have the same weight, and the site works the same whichever one is picked.
 */
export default function CookieNotice() {
  const [visible, setVisible] = useState(false);
  const [settings, setSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [hasChosen, setHasChosen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = readConsent();
    if (saved) {
      setHasChosen(true);
      setAnalytics(saved.analytics);
      return;
    }
    const t = window.setTimeout(() => setVisible(true), 900);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const open = () => {
      const saved = readConsent();
      setAnalytics(saved?.analytics ?? false);
      setSettings(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_COOKIES_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIES_EVENT, open);
  }, []);

  const choose = useCallback((value: boolean) => {
    saveConsent({ analytics: value });
    setAnalytics(value);
    setHasChosen(true);
    setSettings(false);
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hasChosen) setVisible(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, hasChosen]);

  useEffect(() => {
    if (visible && settings) cardRef.current?.focus();
  }, [visible, settings]);

  if (!visible) return null;

  return (
    <div className="ck" role="dialog" aria-modal="false" aria-labelledby="ck-title" aria-describedby="ck-text" ref={cardRef} tabIndex={-1}>
      <span className="ck__seal" aria-hidden="true">
        <svg viewBox="0 0 40 52" className="ck__key">
          <circle cx="20" cy="17" r="8" />
          <path d="M16 22h8l3 20H13l3-20Z" />
        </svg>
      </span>
      <div className="ck__body">
        <h2 id="ck-title" className="ck__title">
          A quick word about cookies
        </h2>
        <p id="ck-text" className="ck__text">
          We use a few small cookies to keep you signed in and to remember your choices. We do not use advertising or tracking cookies.{' '}
          <Link href="/privacy#cookies">Read the details</Link>
        </p>

        {settings ? (
          <ul className="ck__list">
            <li className="ck__row">
              <span className="ck__row-text">
                <strong>Essential</strong>
                <span>Sign-in and your cookie choice. These are needed for the site to work.</span>
              </span>
              <span className="ck__always">Always on</span>
            </li>
            <li className="ck__row">
              <span className="ck__row-text">
                <strong id="ck-an">Analytics</strong>
                <span>Would show us which pages are useful. We do not use any yet. If we add it, it stays off unless you turn it on.</span>
              </span>
              <button type="button" role="switch" aria-checked={analytics} aria-labelledby="ck-an" className="ck__switch" onClick={() => setAnalytics((v) => !v)}>
                <span className="ck__knob" />
              </button>
            </li>
          </ul>
        ) : null}

        <div className="ck__actions">
          {settings ? (
            <>
              <button type="button" className="ck__btn ck__btn--solid" onClick={() => choose(analytics)}>
                Save choices
              </button>
              <button type="button" className="ck__btn" onClick={() => setSettings(false)}>
                Back
              </button>
            </>
          ) : (
            <>
              <button type="button" className="ck__btn ck__btn--solid" onClick={() => choose(true)}>
                Accept all
              </button>
              <button type="button" className="ck__btn" onClick={() => choose(false)}>
                Essential only
              </button>
              <button type="button" className="ck__link" onClick={() => setSettings(true)}>
                Choose
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
