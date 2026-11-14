// Shared limiter (kept in the database, so every server instance sees the same count) with an in-memory
// fallback if the database cannot be reached. Also a small in-memory limiter: 5 attempts per IP every 10 minutes.
// On serverless hosts each instance keeps its own counter, so treat this as a basic
// brake against accidental double-submits and simple abuse, not a hard guarantee.

import { call, dbConfigured, headers } from './admin/db';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;
const hits = new Map<string, number[]>();

export function rateLimited(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 5000) {
    for (const [k, list] of hits) {
      if (list.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

export function clientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip') || 'unknown';
}

/**
 * Counts one attempt for `key` and says whether the limit is passed. Shared across all server instances.
 * If the database is unreachable it falls back to the per-instance counter, so a database problem never locks people out.
 */
export async function tooMany(key: string, max = MAX_HITS, windowSeconds = WINDOW_MS / 1000): Promise<boolean> {
  if (dbConfigured()) {
    try {
      const r = await call('rpc/rl_hit', { method: 'POST', headers: headers(), body: JSON.stringify({ p_key: key, p_window: windowSeconds }) });
      if (r.ok && typeof r.body === 'number') return r.body > max;
    } catch {
      /* fall through to the local counter */
    }
  }
  return rateLimited(`local:${key}:${max}`, Date.now());
}

/** Several limits at once: by address, and by the target (an email address) so one inbox cannot be flooded from many addresses. */
export async function limitedBy(headersIn: Headers, name: string, target: string | null, perAddress = 5, perTarget = 3, windowSeconds = 3600): Promise<boolean> {
  if (await tooMany(`${name}:ip:${clientKey(headersIn)}`, perAddress, windowSeconds)) return true;
  if (target && (await tooMany(`${name}:to:${target.toLowerCase()}`, perTarget, windowSeconds))) return true;
  return false;
}
