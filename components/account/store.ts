'use client';

// One shared copy of "who is signed in and what have they saved" for the whole page, so a page full of
// cards makes a single request. Nothing here is secret: the real session is in HttpOnly cookies.

import { useSyncExternalStore } from 'react';

export type AccountState = {
  status: 'idle' | 'loading' | 'ready';
  signedIn: boolean;
  email: string;
  name: string;
  saved: ReadonlySet<string>;
};

const EMPTY: AccountState = { status: 'idle', signedIn: false, email: '', name: '', saved: new Set() };
let state: AccountState = EMPTY;
let started = false;
const listeners = new Set<() => void>();

function set(next: AccountState) {
  state = next;
  listeners.forEach((l) => l());
}

export function refreshAccount(): Promise<void> {
  started = true;
  if (state.status === 'idle') set({ ...state, status: 'loading' });
  return fetch('/api/account/saved', { credentials: 'same-origin', cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : { signedIn: false, items: [] }))
    .catch(() => ({ signedIn: false, items: [] }))
    .then((d: { signedIn?: boolean; email?: string; name?: string; items?: string[] }) => {
      set({
        status: 'ready',
        signedIn: Boolean(d.signedIn),
        email: d.email ?? '',
        name: d.name ?? '',
        saved: new Set(Array.isArray(d.items) ? d.items : []),
      });
    });
}

/** The sign-in flag cookie (see lib/account/session.ts). No flag means nobody is signed in, so no request is needed. */
function mayBeSignedIn(): boolean {
  try {
    return /(?:^|;\s*)ov_s=1(?:;|$)/.test(document.cookie);
  } catch {
    return true;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!started) {
    started = true;
    if (mayBeSignedIn()) void refreshAccount();
    else set({ ...EMPTY, status: 'ready' });
  }
  return () => {
    listeners.delete(listener);
  };
}

export function useAccount(): AccountState {
  return useSyncExternalStore(subscribe, () => state, () => EMPTY);
}

/** Save or unsave. Updates the heart straight away and puts it back if the server says no. */
export async function setSaved(category: string, slug: string, wantSaved: boolean): Promise<boolean> {
  const key = `${category}/${slug}`;
  const before = state.saved;
  const next = new Set(before);
  if (wantSaved) next.add(key);
  else next.delete(key);
  set({ ...state, saved: next });
  try {
    const res = await fetch('/api/account/saved', {
      method: wantSaved ? 'POST' : 'DELETE',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ category, slug }),
    });
    if (res.status === 401) {
      set({ ...state, signedIn: false, saved: new Set() });
      return false;
    }
    if (!res.ok) throw new Error('failed');
    return true;
  } catch {
    set({ ...state, saved: before });
    return false;
  }
}

export function forgetAccount() {
  set({ ...EMPTY, status: 'ready' });
}
