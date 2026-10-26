// Newsletter sending through Resend Broadcasts, in batches of 1,000 subscribers.
// Server only. Uses RESEND_API_KEY, RESEND_SEGMENT_ID (the main subscriber list) and RESEND_FROM.
//
// Free-plan note: Resend's free plan allows 1,000 marketing contacts. Batches matter once the list is larger,
// so batching is built in, but a list above 1,000 needs a paid Resend plan.

export const BATCH_SIZE = 1000;

const API = 'https://api.resend.com';
const apiKey = () => process.env.RESEND_API_KEY?.trim();
export const mainSegment = () => process.env.RESEND_SEGMENT_ID?.trim();
export const fromAddress = () => process.env.RESEND_FROM?.trim();

export function mailConfigured(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!apiKey()) missing.push('RESEND_API_KEY');
  if (!mainSegment()) missing.push('RESEND_SEGMENT_ID');
  return { ok: missing.length === 0, missing };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function rs<T = unknown>(path: string, init: RequestInit = {}, retry = true): Promise<{ ok: boolean; status: number; data: T | null; error: string }> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${apiKey()}`, 'content-type': 'application/json', ...(init.headers ?? {}) },
    cache: 'no-store',
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 429 && retry) {
    await sleep(1100);
    return rs<T>(path, init, false);
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  const error = !res.ok && data && typeof data === 'object' && 'message' in data ? String((data as { message: unknown }).message) : res.ok ? '' : `Resend returned ${res.status}`;
  return { ok: res.ok, status: res.status, data: data as T, error };
}

export type Contact = { id: string; email: string; unsubscribed: boolean; created_at: string };

/** All contacts of a segment, oldest first (max 5,000 for safety). */
export async function listContacts(segmentId: string): Promise<Contact[]> {
  const all: Contact[] = [];
  let after: string | undefined;
  for (let page = 0; page < 50; page++) {
    const q = `/contacts?segment_id=${encodeURIComponent(segmentId)}&limit=100${after ? `&after=${encodeURIComponent(after)}` : ''}`;
    const r = await rs<{ data?: Contact[]; has_more?: boolean }>(q);
    if (!r.ok) throw new Error(r.error || 'Could not read the subscriber list.');
    const rows = Array.isArray(r.data?.data) ? (r.data?.data as Contact[]) : [];
    all.push(...rows);
    if (!r.data?.has_more || rows.length === 0) break;
    after = rows[rows.length - 1].id;
    await sleep(120);
  }
  return all.sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
}

export type BatchInfo = { n: number; total: number; active: number; unsubscribed: number };

export function splitBatches(contacts: Contact[]): { info: BatchInfo[]; slices: Contact[][] } {
  const slices: Contact[][] = [];
  for (let i = 0; i < contacts.length; i += BATCH_SIZE) slices.push(contacts.slice(i, i + BATCH_SIZE));
  const info = slices.map((s, i) => ({
    n: i + 1,
    total: s.length,
    active: s.filter((c) => !c.unsubscribed).length,
    unsubscribed: s.filter((c) => c.unsubscribed).length,
  }));
  return { info, slices };
}

async function findOrCreateSegment(name: string): Promise<string> {
  let after: string | undefined;
  for (let page = 0; page < 10; page++) {
    const r = await rs<{ data?: { id: string; name: string }[]; has_more?: boolean }>(`/segments?limit=100${after ? `&after=${after}` : ''}`);
    if (!r.ok) throw new Error(r.error || 'Could not read segments.');
    const rows = r.data?.data ?? [];
    const hit = rows.find((s) => s.name === name);
    if (hit) return hit.id;
    if (!r.data?.has_more || rows.length === 0) break;
    after = rows[rows.length - 1].id;
  }
  const created = await rs<{ id: string }>('/segments', { method: 'POST', body: JSON.stringify({ name }) });
  if (!created.ok || !created.data?.id) throw new Error(created.error || 'Could not create the batch segment.');
  return created.data.id;
}

/**
 * Makes sure the people in one batch belong to that batch's own segment. Does a limited amount of work per call
 * and reports how many are still missing, so the page can call it again until it reaches 0.
 */
export async function syncBatch(n: number, slice: Contact[], limit = 40): Promise<{ segmentId: string; added: number; remaining: number }> {
  const segmentId = await findOrCreateSegment(`OppVault Batch ${n}`);
  const members = new Set((await listContacts(segmentId)).map((c) => c.id));
  const missing = slice.filter((c) => !members.has(c.id));
  let added = 0;
  for (const c of missing.slice(0, limit)) {
    const r = await rs(`/contacts/${encodeURIComponent(c.id)}/segments/${encodeURIComponent(segmentId)}`, { method: 'POST' });
    if (!r.ok) throw new Error(r.error || 'Could not add a subscriber to the batch.');
    added++;
    await sleep(110);
  }
  return { segmentId, added, remaining: Math.max(0, missing.length - added) };
}

/** The segment that holds batch n: the main list itself when everyone fits in one batch, otherwise a batch segment. */
export async function segmentForBatch(n: number, totalContacts: number): Promise<string> {
  if (totalContacts <= BATCH_SIZE) return mainSegment() as string;
  return findOrCreateSegment(`OppVault Batch ${n}`);
}

export async function sendBroadcast(input: { segmentId: string; name: string; subject: string; previewText: string; html: string; text: string }): Promise<string> {
  const from = fromAddress();
  if (!from) throw new Error('RESEND_FROM is not set. Verify your domain in Resend, then set RESEND_FROM to something like: OppVault <hello@oppvault.app>');
  const created = await rs<{ id: string }>('/broadcasts', {
    method: 'POST',
    body: JSON.stringify({
      segment_id: input.segmentId,
      from,
      reply_to: ['hello@oppvault.app'],
      subject: input.subject,
      preview_text: input.previewText || undefined,
      name: input.name,
      html: input.html,
      text: input.text,
    }),
  });
  if (!created.ok || !created.data?.id) throw new Error(created.error || 'Resend could not create the broadcast.');
  const sent = await rs(`/broadcasts/${created.data.id}/send`, { method: 'POST', body: JSON.stringify({}) });
  if (!sent.ok) throw new Error(sent.error || 'Resend could not send the broadcast.');
  return created.data.id;
}

export async function sendTest(to: string, subject: string, html: string, text: string): Promise<void> {
  const from = fromAddress();
  if (!from) throw new Error('RESEND_FROM is not set. Verify your domain in Resend, then set RESEND_FROM to something like: OppVault <hello@oppvault.app>');
  const r = await rs('/emails', {
    method: 'POST',
    body: JSON.stringify({
      from,
      to: [to],
      subject: `[Test] ${subject}`,
      html: html.replace(/\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}/g, '#'),
      text: text.replace(/\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}/g, '(unsubscribe link appears here)'),
      reply_to: ['hello@oppvault.app'],
    }),
  });
  if (!r.ok) throw new Error(r.error || 'Resend could not send the test email.');
}
