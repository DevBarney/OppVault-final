'use client';

import { useEffect, useState } from 'react';
import { ChatIcon } from './Icons';

const OFF_KEY = 'ov_join_off';
const SEEN_KEY = 'ov_join_seen';
const QUIET_DAYS = 30;

/** Other components ask for the prompt with this event: window.dispatchEvent(new CustomEvent('ov:join', { detail: { src: 'save' } })). */
export function askToJoin(src: 'save' | 'applied') {
  try {
    window.dispatchEvent(new CustomEvent('ov:join', { detail: { src } }));
  } catch {
    /* no prompt is fine */
  }
}

function quiet(): boolean {
  try {
    if (sessionStorage.getItem(SEEN_KEY)) return true;
    const until = Number(localStorage.getItem(OFF_KEY) ?? 0);
    return until > Date.now();
  } catch {
    return false;
  }
}

/**
 * A small prompt after someone saves a listing or taps "I applied". It shows once per visit, and stays away for
 * 30 days once it is closed or used.
 */
export default function JoinToast() {
  const [src, setSrc] = useState<'save' | 'applied' | null>(null);

  useEffect(() => {
    let timer = 0;
    function onAsk(e: Event) {
      const s = (e as CustomEvent<{ src?: string }>).detail?.src === 'applied' ? 'applied' : 'save';
      if (quiet()) return;
      try {
        sessionStorage.setItem(SEEN_KEY, '1');
      } catch {
        /* ignore */
      }
      setSrc(s);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setSrc(null), 15000);
    }
    window.addEventListener('ov:join', onAsk);
    return () => {
      window.removeEventListener('ov:join', onAsk);
      window.clearTimeout(timer);
    };
  }, []);

  function silence() {
    try {
      localStorage.setItem(OFF_KEY, String(Date.now() + QUIET_DAYS * 86400000));
    } catch {
      /* ignore */
    }
    setSrc(null);
  }

  if (!src) return null;
  return (
    <div className="join-toast" role="status">
      <ChatIcon className="join-toast__icon" />
      <p className="join-toast__text">{src === 'applied' ? 'Applied? Others are too. Compare notes in the group.' : 'Applying to this? Others are too. Join the group.'}</p>
      <a className="btn btn--primary btn--sm" href={`/join?src=${src}`} target="_blank" rel="noopener noreferrer" onClick={silence}>
        Join the group<span className="visually-hidden"> (opens in a new tab)</span>
      </a>
      <button type="button" className="join-toast__close" aria-label="Dismiss" onClick={silence}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" /></svg>
      </button>
    </div>
  );
}
