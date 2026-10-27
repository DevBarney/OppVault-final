// A signed-in visitor's saved opportunities. Reads and writes go to Supabase with the visitor's own
// token, so row level security makes sure nobody can see or change anyone else's list. Server only.

import { CATEGORIES } from '../categories';
import { PUBLIC_KEY, SUPABASE_URL } from './config';

export type SavedRef = { category: string; slug: string };

export function validRef(category: unknown, slug: unknown): SavedRef | null {
  if (typeof category !== 'string' || typeof slug !== 'string') return null;
  if (!CATEGORIES.some((c) => c.slug === category)) return null;
  if (!/^[a-z0-9][a-z0-9-]{0,199}$/i.test(slug)) return null;
  return { category, slug };
}

async function rest(path: string, token: string, init: { method: string; body?: unknown; prefer?: string }): Promise<Response | null> {
  if (!SUPABASE_URL || !PUBLIC_KEY) return null;
  try {
    return await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method: init.method,
      headers: {
        apikey: PUBLIC_KEY,
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        ...(init.prefer ? { prefer: init.prefer } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return null;
  }
}

export async function listSaved(token: string): Promise<SavedRef[]> {
  const res = await rest('saved_items?select=category,slug&order=created_at.desc&limit=500', token, { method: 'GET' });
  if (!res || !res.ok) return [];
  const rows = (await res.json()) as unknown;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((r) => {
    const ref = validRef((r as SavedRef).category, (r as SavedRef).slug);
    return ref ? [ref] : [];
  });
}

export async function addSaved(token: string, ref: SavedRef): Promise<boolean> {
  const res = await rest('saved_items', token, { method: 'POST', body: ref, prefer: 'resolution=ignore-duplicates,return=minimal' });
  return Boolean(res && res.ok);
}

export async function removeSaved(token: string, ref: SavedRef): Promise<boolean> {
  const res = await rest(
    `saved_items?category=eq.${encodeURIComponent(ref.category)}&slug=eq.${encodeURIComponent(ref.slug)}`,
    token,
    { method: 'DELETE' },
  );
  return Boolean(res && res.ok);
}
