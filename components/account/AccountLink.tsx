'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import './account.css';
import { ArrowIcon } from '../Icons';
import { useAccount } from './store';

function PersonIcon() {
  return (
    <svg className="acct-navicon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.5 20c.9-3.6 3.8-5.5 7.5-5.5s6.6 1.9 7.5 5.5" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="acct-navicon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M12 20.5s-7.5-4.6-9.2-9.3C1.7 8 3.5 4.8 6.8 4.8c2 0 3.5 1.1 5.2 3.1 1.7-2 3.2-3.1 5.2-3.1 3.3 0 5.1 3.2 4 6.4-1.7 4.7-9.2 9.3-9.2 9.3Z" />
    </svg>
  );
}

/**
 * "Sign in" for visitors, "My saved" once they are in.
 * In the header it is a small icon button (with a text label for screen readers); in the phone menu it is text.
 */
export default function AccountLink({ variant = 'icon', onNavigate }: { variant?: 'icon' | 'text'; onNavigate?: () => void }) {
  const account = useAccount();
  const signedIn = account.status === 'ready' && account.signedIn;
  const count = signedIn ? account.saved.size : 0;
  const prev = useRef<number | null>(null); // null until the first real answer, so loading your saved list does not count as a new save
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (account.status !== 'ready') return;
    if (prev.current !== null && count > prev.current) {
      prev.current = count;
      setBump(true);
      window.setTimeout(() => setBump(false), 600);
      return;
    }
    prev.current = count;
  }, [count, account.status]);
  const label = signedIn ? (count > 0 ? `My saved (${count})` : 'My saved') : 'Sign in';
  const href = signedIn ? '/account/saved' : '/account/sign-in';
  if (variant === 'text') {
    return (
      <Link className="nav__mlink acct-mnavlink" href={href} onClick={onNavigate}>
        <span>{label}</span>
        <ArrowIcon className="nav__marrow" />
      </Link>
    );
  }
  return (
    <Link className={`acct-navlink${bump ? ' is-bump' : ''}`} href={href} onClick={onNavigate} title={label} data-acct-nav="">
      {signedIn ? <HeartIcon /> : <PersonIcon />}
      {count > 0 ? <span className="acct-badge" aria-hidden="true">{count > 99 ? '99+' : count}</span> : null}
      <span className="visually-hidden">{label}</span>
    </Link>
  );
}

/** "My applications": a second header icon on desktop and a menu row on phones, for signed-in visitors only. */
export function AppliedLink({ variant = 'icon', onNavigate }: { variant?: 'icon' | 'text'; onNavigate?: () => void }) {
  const account = useAccount();
  if (!(account.status === 'ready' && account.signedIn)) return null;
  if (variant === 'text') {
    return (
      <Link className="nav__mlink acct-mnavlink" href="/account/applications" onClick={onNavigate}>
        <span>My applications</span>
        <ArrowIcon className="nav__marrow" />
      </Link>
    );
  }
  return (
    <Link className="acct-navlink acct-navlink--applied" href="/account/applications" onClick={onNavigate} title="My applications">
      <svg className="acct-navicon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="4.5" width="14" height="16" rx="2.5" />
        <path d="M9 4.5V3.5h6v1M8.8 12.8l2.2 2.2 4.2-4.4" />
      </svg>
      <span className="visually-hidden">My applications</span>
    </Link>
  );
}
