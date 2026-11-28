// Numbers and lists for the admin overview. Server only.
import { call, dbConfigured, headers } from './db';

export type Overview = {
  published: number;
  open: number;
  closing7: number;
  expired_live: number;
  drafts: number;
  pending_submissions: number;
  pending_reviews: number;
  links: { ok: number; broken: number; unsure: number; waiting: number; last_checked: string | null };
  by_category: { category: string; n: number }[];
};
export type QueueItem = { id: string; category: string; slug: string; title: string; provider: string; deadline: string };
export type Queue = { closing: QueueItem[]; expired: QueueItem[] };
export type DupItem = { id: string; category: string; slug: string; title: string; provider: string; deadline: string | null; created_at: string };
export type DupGroup = { reason: string; key: string; items: DupItem[] };
export type Duplicates = { total: number; groups: DupGroup[] };

async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T | null> {
  if (!dbConfigured()) return null;
  const r = await call(`rpc/${name}`, { method: 'POST', headers: headers(), body: JSON.stringify(args) });
  return r.ok && r.body && typeof r.body === 'object' ? (r.body as T) : null;
}

export const getOverview = () => rpc<Overview>('admin_overview');
export const getQueue = () => rpc<Queue>('admin_queue');
export const getDuplicates = () => rpc<Duplicates>('admin_duplicates', { p_limit: 40 });
