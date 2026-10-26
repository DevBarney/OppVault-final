// Server-only writes to Supabase with the service role key (SUPABASE_SERVICE_ROLE_KEY).
// That key bypasses row level security, so it must only ever be read here, on the server,
// and never be given a NEXT_PUBLIC_ name.

import { type Kind, kindTable } from './kinds';
import type { OpportunityRow, PostRow } from './validate';

const URL_BASE = () => process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
const SERVICE_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

export function dbConfigured(): boolean {
  return Boolean(URL_BASE() && SERVICE_KEY());
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const key = SERVICE_KEY() as string;
  return {
    apikey: key,
    ...(key.startsWith('eyJ') ? { authorization: `Bearer ${key}` } : {}),
    'content-type': 'application/json',
    ...extra,
  };
}

async function call(path: string, init: RequestInit): Promise<{ ok: boolean; status: number; body: unknown }> {
  const res = await fetch(`${URL_BASE()}/rest/v1/${path}`, { ...init, cache: 'no-store', signal: AbortSignal.timeout(20000) });
  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { ok: res.ok, status: res.status, body };
}

function describe(body: unknown): string {
  if (body && typeof body === 'object' && 'message' in body) return String((body as { message: unknown }).message).slice(0, 200);
  return 'the database refused the row';
}

export type ExistingRef = { external_id: string; slug: string };

/** Rows already stored for a category, used to say "new" or "update" and to catch web address clashes. */
export async function existingFor(category: string): Promise<ExistingRef[]> {
  if (!dbConfigured()) return [];
  const r = await call(`opportunities?select=external_id,slug&category=eq.${encodeURIComponent(category)}&limit=5000`, { headers: headers() });
  return r.ok && Array.isArray(r.body) ? (r.body as ExistingRef[]) : [];
}

export async function existingPostSlugs(): Promise<string[]> {
  if (!dbConfigured()) return [];
  const r = await call('posts?select=slug&limit=5000', { headers: headers() });
  return r.ok && Array.isArray(r.body) ? (r.body as { slug: string }[]).map((x) => x.slug) : [];
}

export type ImportResult = { saved: number; failed: { line: number; message: string }[] };

async function upsertBatch(table: string, conflict: string, rows: object[]) {
  return call(`${table}?on_conflict=${conflict}`, {
    method: 'POST',
    headers: headers({ prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify(rows),
  });
}

/** Saves rows in batches. If a batch fails, its rows are retried one by one so each error is pinned to a line. */
export async function importRows(kind: Kind, rows: { line: number; data: OpportunityRow | PostRow }[]): Promise<ImportResult> {
  const table = kindTable(kind);
  const conflict = table === 'posts' ? 'slug' : 'category,external_id';
  const result: ImportResult = { saved: 0, failed: [] };
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const r = await upsertBatch(table, conflict, batch.map((b) => b.data));
    if (r.ok) {
      result.saved += batch.length;
      continue;
    }
    for (const b of batch) {
      const one = await upsertBatch(table, conflict, [b.data]);
      if (one.ok) result.saved += 1;
      else result.failed.push({ line: b.line, message: describe(one.body) });
    }
  }
  return result;
}

export type ListedItem = {
  id: string;
  title: string;
  slug: string;
  category?: string;
  published: boolean;
  deadline?: string | null;
  published_at?: string;
  source_url?: string | null;
};

export async function listItems(kind: Kind): Promise<ListedItem[]> {
  const table = kindTable(kind);
  const select = table === 'posts' ? 'id,title,slug,published,published_at' : 'id,title,slug,category,published,deadline,source_url';
  const filter = table === 'opportunities' && kind !== 'opportunities' ? `&category=eq.${kind}` : '';
  const r = await call(`${table}?select=${select}${filter}&order=created_at.desc&limit=200`, { headers: headers() });
  return r.ok && Array.isArray(r.body) ? (r.body as ListedItem[]) : [];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function changeItems(kind: Kind, ids: string[], action: 'publish' | 'unpublish' | 'delete'): Promise<{ ok: boolean; count: number }> {
  const clean = ids.filter((id) => UUID.test(id)).slice(0, 200);
  if (clean.length === 0) return { ok: false, count: 0 };
  const table = kindTable(kind);
  const filter = `id=in.(${clean.join(',')})`;
  const r =
    action === 'delete'
      ? await call(`${table}?${filter}`, { method: 'DELETE', headers: headers({ prefer: 'return=minimal' }) })
      : await call(`${table}?${filter}`, {
          method: 'PATCH',
          headers: headers({ prefer: 'return=minimal' }),
          body: JSON.stringify({ published: action === 'publish' }),
        });
  return { ok: r.ok, count: clean.length };
}

// ---- Opportunities submitted by visitors ----

export type SubmissionRow = {
  id: string;
  category: string;
  title: string;
  provider: string;
  link: string;
  summary: string;
  deadline: string | null;
  location: string;
  level: string;
  funding: string;
  submitter_name: string;
  submitter_email: string;
  status: 'pending' | 'approved' | 'rejected';
  review_note: string;
  created_at: string;
};

export async function createSubmission(data: object): Promise<boolean> {
  if (!dbConfigured()) return false;
  const r = await call('submissions', { method: 'POST', headers: headers({ prefer: 'return=minimal' }), body: JSON.stringify(data) });
  return r.ok;
}

export async function pendingLinkExists(link: string): Promise<boolean> {
  const r = await call(`submissions?select=id&status=eq.pending&link=eq.${encodeURIComponent(link)}&limit=1`, { headers: headers() });
  return r.ok && Array.isArray(r.body) && r.body.length > 0;
}

export async function listSubmissions(status: 'pending' | 'approved' | 'rejected'): Promise<SubmissionRow[]> {
  const r = await call(`submissions?select=*&status=eq.${status}&order=created_at.desc&limit=100`, { headers: headers() });
  return r.ok && Array.isArray(r.body) ? (r.body as SubmissionRow[]) : [];
}

export async function getSubmission(id: string): Promise<SubmissionRow | null> {
  if (!UUID.test(id)) return null;
  const r = await call(`submissions?select=*&id=eq.${id}&limit=1`, { headers: headers() });
  return r.ok && Array.isArray(r.body) && r.body[0] ? (r.body[0] as SubmissionRow) : null;
}

export async function setSubmissionStatus(id: string, status: 'approved' | 'rejected', note = ''): Promise<boolean> {
  if (!UUID.test(id)) return false;
  const r = await call(`submissions?id=eq.${id}`, {
    method: 'PATCH',
    headers: headers({ prefer: 'return=minimal' }),
    body: JSON.stringify({ status, review_note: note.slice(0, 500), reviewed_at: new Date().toISOString() }),
  });
  return r.ok;
}

export async function deleteSubmission(id: string): Promise<boolean> {
  if (!UUID.test(id)) return false;
  const r = await call(`submissions?id=eq.${id}`, { method: 'DELETE', headers: headers({ prefer: 'return=minimal' }) });
  return r.ok;
}

// ---- Newsletter batches sent (one row per campaign and batch) ----

export type MailSend = { campaign: string; subject: string; batch: number; recipients: number; broadcast_id: string | null; created_at: string };

export async function listMailSends(): Promise<MailSend[]> {
  const r = await call('mail_sends?select=campaign,subject,batch,recipients,broadcast_id,created_at&order=created_at.desc&limit=100', { headers: headers() });
  return r.ok && Array.isArray(r.body) ? (r.body as MailSend[]) : [];
}

/** Claims a batch for a campaign. Returns false if it was already claimed (so it can never be sent twice). */
export async function claimBatch(campaign: string, subject: string, batch: number, recipients: number): Promise<boolean> {
  const r = await call('mail_sends', {
    method: 'POST',
    headers: headers({ prefer: 'return=minimal' }),
    body: JSON.stringify({ campaign, subject, batch, recipients }),
  });
  return r.ok;
}

export async function finishBatch(campaign: string, batch: number, broadcastId: string): Promise<void> {
  await call(`mail_sends?campaign=eq.${encodeURIComponent(campaign)}&batch=eq.${batch}`, {
    method: 'PATCH',
    headers: headers({ prefer: 'return=minimal' }),
    body: JSON.stringify({ broadcast_id: broadcastId }),
  });
}

export async function releaseBatch(campaign: string, batch: number): Promise<void> {
  await call(`mail_sends?campaign=eq.${encodeURIComponent(campaign)}&batch=eq.${batch}&broadcast_id=is.null`, { method: 'DELETE', headers: headers() });
}
