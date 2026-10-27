'use client';

import { validRefClient } from './refs';

/** After signing in: save the opportunity they were looking at (if any), then go where they were headed. */
export async function finishSignIn(next: string, save: string | null): Promise<void> {
  const ref = validRefClient(save);
  if (ref) {
    try {
      await fetch('/api/account/saved', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(ref),
      });
    } catch {
      // Not saving is not worth stopping the sign-in for.
    }
  }
  window.location.assign(next);
}
