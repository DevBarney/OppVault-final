'use client';

import { useEffect, useState } from 'react';
import './account.css';

/** The round picture: the provider's photo when there is one, the initials otherwise (and if the photo fails to load). */
export default function Avatar({ src, initials, size }: { src: string; initials: string; size?: 'md' | 'lg' | 'xl' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <span className={`acct-avatar${size ? ` acct-avatar--${size}` : ''}`} aria-hidden="true">
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="acct-avatar__img" src={src} alt="" width={72} height={72} referrerPolicy="no-referrer" decoding="async" onError={() => setFailed(true)} />
      ) : (
        initials
      )}
    </span>
  );
}

export function initialsOf(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (email[0] ?? '?').toUpperCase();
}
