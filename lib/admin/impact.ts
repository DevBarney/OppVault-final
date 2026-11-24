// Numbers for /admin/impact: counts only, nothing that names a person. Server only.
import { call, dbConfigured, headers } from './db';
import { listContacts, mailConfigured, mainSegment } from './mail';

export type Counted = { category: string; n: number };
export type Top = { category: string; slug: string; title: string; n: number };
export type Week = { week: string; accounts: number; saves: number; applied: number; clicks: number; joins: number };
export type Trio = { total: number; period: number; previous: number };

export type Impact = {
  days: number;
  generated_at: string;
  accounts: Trio;
  saves: Trio & { people: number };
  applied: Trio & { people: number };
  clicks: Trio & { first_day: string | null };
  joins: { total: number; period: number; by_source: { src: string; n: number }[] };
  listings: { published: number; by_category: Counted[] };
  visitor_suggestions: { total: number; approved: number };
  reviews: { approved: number };
  clicks_by_category: Counted[];
  applied_by_category: Counted[];
  top_clicked: Top[];
  top_applied: Top[];
  weekly: Week[];
};

export const RANGES = [
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
  { days: 365, label: 'Last 12 months' },
] as const;

export function rangeDays(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? '', 10);
  return RANGES.some((r) => r.days === n) ? n : 30;
}

export async function getImpact(days: number): Promise<Impact | null> {
  if (!dbConfigured()) return null;
  const r = await call('rpc/impact_stats', { method: 'POST', headers: headers(), body: JSON.stringify({ p_days: days }) });
  if (!r.ok || !r.body || typeof r.body !== 'object') return null;
  return r.body as Impact;
}

/** Email subscribers live in Resend, not the database. Returns null when email is not connected. */
export async function getSubscribers(): Promise<{ total: number; active: number } | null> {
  if (!mailConfigured().ok) return null;
  try {
    const contacts = await listContacts(mainSegment() as string);
    return { total: contacts.length, active: contacts.filter((c) => !c.unsubscribed).length };
  } catch {
    return null;
  }
}

/** "+25%" against the period before, or "New" when there was nothing before to compare with. */
export function change(now: number, before: number): string {
  if (before <= 0) return now > 0 ? 'New' : 'No change';
  const pct = Math.round(((now - before) / before) * 100);
  return pct === 0 ? 'No change' : `${pct > 0 ? '+' : ''}${pct}%`;
}

export function csvCell(v: string | number): string {
  const s = String(v);
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s; // a spreadsheet must not run a cell as a formula
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
