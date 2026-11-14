'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './account.css';
import { forgetAccount, useAccount } from './store';

function initialsOf(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (email[0] ?? '?').toUpperCase();
}

/** Desktop header: a round avatar that opens the account menu. Shows nothing for visitors who are not signed in. */
export default function AccountMenu() {
  const account = useAccount();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const [busy, setBusy] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      if (window.innerWidth < 1180) return setOpen(false);
      setPos({ top: Math.round(r.bottom + 10), right: Math.max(12, Math.round(window.innerWidth - r.right)) });
    };
    place();
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      } else if (e.key === 'Tab') {
        const items = [...(panelRef.current?.querySelectorAll<HTMLElement>('a, button') ?? [])];
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if ((!e.shiftKey && document.activeElement === last) || (e.shiftKey && document.activeElement === first)) {
          e.preventDefault();
          setOpen(false);
          btnRef.current?.focus();
        }
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener('resize', place);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('resize', place);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  if (!(account.status === 'ready' && account.signedIn)) return null;
  const who = account.name || 'Your account';
  const initials = initialsOf(account.name, account.email);
  const saved = account.saved.size;

  async function signOut() {
    setBusy(true);
    try {
      await fetch('/api/account/signout', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: '{}' });
    } catch {
      /* the page reload below shows the true state either way */
    }
    forgetAccount();
    window.location.assign('/');
  }

  const panel = (
    <div id="acct-menu" ref={panelRef} className="acct-pop" role="group" aria-label="Account" style={{ top: pos.top, right: pos.right }}>
      <div className="acct-pop__who">
        <span className="acct-avatar acct-avatar--lg" aria-hidden="true">{initials}</span>
        <span className="acct-pop__text">
          <span className="acct-pop__name">{who}</span>
          <span className="acct-pop__email">{account.email}</span>
        </span>
      </div>
      <ul className="acct-pop__list">
        <li><Link href="/account/saved">My saved{saved > 0 ? <span className="acct-pop__count">{saved}</span> : null}</Link></li>
        <li><Link href="/account/applications">My applications</Link></li>
        <li><Link href="/account/settings">Account settings</Link></li>
        <li><Link href="/support">Help and contact</Link></li>
      </ul>
      <button type="button" className="acct-pop__out" onClick={signOut} disabled={busy}>{busy ? 'Signing out…' : 'Sign out'}</button>
    </div>
  );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="acct-avatar acct-avatar--btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="acct-menu"
        aria-label={`Account menu for ${who}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e: { key: string; preventDefault: () => void }) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {initials}
      </button>
      {mounted && open ? createPortal(panel, document.body) : null}
    </>
  );
}
