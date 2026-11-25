import { getOpportunities } from './data';
import { SITE_URL } from './config';
import { daysUntil, formatDate } from './dates';
import type { Opportunity } from './types';

// The weekly "closing soon" email: scholarships, fellowships, internships and grants that close in the next two weeks.
const APPLY_KINDS = ['scholarships', 'fellowships', 'internships', 'grants'];
const MIN_ITEMS = 3;
const MAX_WEEK = 8;
const MAX_NEXT = 6;

/** Titles go inside [text](url), so brackets and asterisks would break the link. */
const clean = (s: string) => s.replace(/[\[\]*]/g, '').replace(/\s+/g, ' ').trim();

/** Long headlines are shortened to the part before the first colon or bar, when that part is still a real name. */
function short(title: string): string {
  const t = clean(title);
  const cut = t.search(/\s[|:]\s|:\s/);
  return cut >= 18 ? t.slice(0, cut).trim() : t;
}

const KIND: Record<string, string> = { scholarships: 'Scholarship', fellowships: 'Fellowship', internships: 'Internship', grants: 'Grant' };

const link = (o: Opportunity) => `${SITE_URL}/${o.category}/${o.slug}`;

function when(o: Opportunity): string {
  const d = daysUntil(o.deadline);
  const day = d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`;
  return `${formatDate(o.deadline)} (${day})`;
}

function line(o: Opportunity): string {
  return `- **[${short(o.title)}](${link(o)})** (${KIND[o.category] ?? 'Opportunity'}). Closes ${when(o)}.`;
}

export type Digest = { subject: string; previewText: string; body: string; count: number } | null;

/** The ISO week, so the same week can never be sent twice: "2026-w48". */
export function weekId(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-w${String(week).padStart(2, '0')}`;
}

/** Returns null when there is too little to send (fewer than three listings). */
export async function buildDigest(): Promise<Digest> {
  const { items } = await getOpportunities({ sort: 'closing', raw: true, hideClosed: true, limit: 1000 });
  // The same opportunity is sometimes listed under two categories, or twice by one provider: keep the first.
  const seen = new Set<string>();
  const live = items.filter((o) => {
    if (o.is_sample || !o.deadline || !APPLY_KINDS.includes(o.category)) return false;
    const keys = [o.slug, `${o.provider}|${o.deadline}`];
    if (keys.some((k) => seen.has(k))) return false;
    keys.forEach((k) => seen.add(k));
    return true;
  });
  // Starts two days out, so everything listed still leaves time to apply.
  const within = (o: Opportunity, from: number, to: number) => {
    const d = daysUntil(o.deadline);
    return d !== null && d >= from && d <= to;
  };
  const week = live.filter((o) => within(o, 2, 8)).slice(0, MAX_WEEK);
  const next = live.filter((o) => within(o, 9, 16)).slice(0, MAX_NEXT);
  const count = week.length + next.length;
  if (count < MIN_ITEMS) return null;

  const parts: string[] = ['Hi,', 'These opportunities are closing soon. Open each one for the full details, and always check the official page before you apply.'];
  if (week.length) parts.push('## Closing this week', week.map(line).join('\n'));
  if (next.length) parts.push('## Closing next week', next.map(line).join('\n'));
  parts.push(`[button: See everything closing soonest | ${SITE_URL}/scholarships?sort=closing]`);
  parts.push('Applied to one? Open it on OppVault and tap "I applied" to keep track in My applications.');

  const lead = (week[0] ?? next[0]) as Opportunity;
  return {
    subject: `${count} opportunities closing soon on OppVault`,
    previewText: `${short(lead.title)} and more. See what closes in the next two weeks.`,
    body: parts.join('\n\n'),
    count,
  };
}
