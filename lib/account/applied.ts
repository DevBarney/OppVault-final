// "I applied": a signed-in visitor marks an opportunity as applied. Same rules as saved items: reads and writes
// use the visitor's own token, so row level security keeps every list private. Server only.

import { rest, validRef, type SavedRef } from './saved';

export { validRef };
export type AppliedRef = SavedRef;

export async function listApplied(token: string): Promise<AppliedRef[]> {
  const res = await rest('applied_items?select=category,slug&order=created_at.desc&limit=500', token, { method: 'GET' });
  if (!res || !res.ok) return [];
  const rows = (await res.json()) as unknown;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((r) => {
    const ref = validRef((r as AppliedRef).category, (r as AppliedRef).slug);
    return ref ? [ref] : [];
  });
}

export async function addApplied(token: string, ref: AppliedRef): Promise<boolean> {
  const res = await rest('applied_items', token, { method: 'POST', body: ref, prefer: 'resolution=ignore-duplicates,return=minimal' });
  return Boolean(res && res.ok);
}

export async function removeApplied(token: string, ref: AppliedRef): Promise<boolean> {
  const res = await rest(`applied_items?category=eq.${encodeURIComponent(ref.category)}&slug=eq.${encodeURIComponent(ref.slug)}`, token, { method: 'DELETE' });
  return Boolean(res && res.ok);
}
