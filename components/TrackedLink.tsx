'use client';

import type { ReactNode } from 'react';
import { askToJoin } from './JoinToast';

/** The "official site" button. It opens the link as normal and quietly tells us it was used, to help rank listings. */
export default function TrackedLink({ href, gaRef, className, children }: { href: string; gaRef: string; className?: string; children: ReactNode }) {
  function count() {
    askToJoin('apply');
    try {
      void fetch('/api/click', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ref: gaRef }),
        keepalive: true,
        // Same-origin cookies are sent so that, for a signed-in visitor, the listing is kept under Pending. Nothing is stored for others.
        credentials: 'same-origin',
      }).catch(() => undefined);
    } catch {
      /* counting must never get in the way of the link */
    }
  }
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer nofollow" onClick={count} onAuxClick={count}>
      {children}
    </a>
  );
}
