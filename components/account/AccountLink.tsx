'use client';

import Link from 'next/link';
import './account.css';
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
  const label = signedIn ? 'My saved' : 'Sign in';
  const href = signedIn ? '/account/saved' : '/account/sign-in';
  if (variant === 'text') {
    return (
      <Link className="acct-mnavlink" href={href} onClick={onNavigate}>
        {label}
      </Link>
    );
  }
  return (
    <Link className="acct-navlink" href={href} onClick={onNavigate} title={label}>
      {signedIn ? <HeartIcon /> : <PersonIcon />}
      <span className="visually-hidden">{label}</span>
    </Link>
  );
}
