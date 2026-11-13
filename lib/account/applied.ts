// "I applied": a signed-in visitor marks an opportunity as applied. Same rules as saved items: reads and writes
// use the visitor's own token, so row level security keeps every list private. Server only.

import { NOTE_MAX, isStatus, type StatusId } from './statuses';
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

export type Tracked = AppliedRef & { status: StatusId; applied_on: string; note: string };

/** Everything the tracker page shows, newest first. */
export async function listTracked(token: string): Promise<Tracked[]> {
  const res = await rest('applied_items?select=category,slug,status,applied_on,note&order=applied_on.desc,created_at.desc&limit=500', token, { method: 'GET' });
  if (!res || !res.ok) return [];
  const rows = (await res.json()) as unknown;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((r) => {
    const row = r as Record<string, unknown>;
    const ref = validRef(row.category, row.slug);
    if (!ref) return [];
    return [{ ...ref, status: isStatus(row.status) ? row.status : 'applied', applied_on: typeof row.applied_on === 'string' ? row.applied_on : '', note: typeof row.note === 'string' ? row.note : '' }];
  });
}

export type TrackPatch = { status?: StatusId; applied_on?: string; note?: string };

/** A real calendar date, written YYYY-MM-DD, not more than a day ahead. */
function cleanDate(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const t = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== value) return null;
  return t <= Date.now() + 2 * 86400000 && t >= Date.UTC(2000, 0, 1) ? value : null;
}

/** Check what the browser sent. Returns null when nothing usable was given. */
export function cleanPatch(body: Record<string, unknown> | null): TrackPatch | null {
  if (!body) return null;
  const patch: TrackPatch = {};
  if ('status' in body) {
    if (!isStatus(body.status)) return null;
    patch.status = body.status;
  }
  if ('applied_on' in body) {
    const d = cleanDate(body.applied_on);
    if (!d) return null;
    patch.applied_on = d;
  }
  if ('note' in body) {
    if (typeof body.note !== 'string') return null;
    patch.note = body.note.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, NOTE_MAX);
  }
  return Object.keys(patch).length ? patch : null;
}

export async function updateTracked(token: string, ref: AppliedRef, patch: TrackPatch): Promise<boolean> {
  const res = await rest(
    `applied_items?category=eq.${encodeURIComponent(ref.category)}&slug=eq.${encodeURIComponent(ref.slug)}`,
    token,
    { method: 'PATCH', body: { ...patch, updated_at: new Date().toISOString() }, prefer: 'return=representation' },
  );
  if (!res || !res.ok) return false;
  const rows = (await res.json().catch(() => [])) as unknown;
  return Array.isArray(rows) && rows.length > 0;
}
