// Adding ONE listing by hand. It runs the form values through the same checker as the CSV import
// (checkOpportunities), so a manual listing gets exactly the same rules: https links, dates, web address.

import { CATEGORIES } from '../categories';
import { csvCell } from './csv';
import { call, dbConfigured, headers, existingFor } from './db';
import { parseCategory } from './kinds';
import { checkOpportunities, type OpportunityRow } from './validate';

export type ListingInput = {
  category?: unknown;
  title?: unknown;
  link?: unknown;
  provider?: unknown;
  summary?: unknown;
  description?: unknown;
  location?: unknown;
  level?: unknown;
  funding?: unknown;
  deadline?: unknown;
  eligibility?: unknown;
  benefits?: unknown;
  how_to_apply?: unknown;
  image_url?: unknown;
  coupon_code?: unknown;
  featured?: unknown;
  published?: unknown;
};

const TEXT_FIELDS = ['title', 'link', 'provider', 'summary', 'description', 'location', 'level', 'funding', 'deadline', 'eligibility', 'benefits', 'how_to_apply', 'image_url', 'coupon_code'] as const;

const str = (v: unknown): string => (typeof v === 'string' ? v.slice(0, 6000) : '');

export type Checked = { ok: true; row: OpportunityRow } | { ok: false; error: string };

/** `externalId` is set when approving a visitor suggestion, so the listing can be traced back to it. */
export function checkListing(input: ListingInput, externalId?: string): Checked {
  const category = parseCategory(str(input.category));
  if (!category) return { ok: false, error: `Pick a type: ${CATEGORIES.map((c) => c.label).join(', ')}.` };

  const headerNames: string[] = ['category'];
  const cells: string[] = [category];
  for (const f of TEXT_FIELDS) {
    headerNames.push(f);
    cells.push(str(input[f]));
  }
  headerNames.push('featured', 'published');
  cells.push(input.featured === true ? 'yes' : 'no', input.published === false ? 'no' : 'yes');
  if (externalId) {
    headerNames.push('opportunity_id');
    cells.push(externalId);
  }

  const text = `${headerNames.join(',')}\n${cells.map(csvCell).join(',')}\n`;
  const checked = checkOpportunities(text, category);
  if (checked.fileError) return { ok: false, error: checked.fileError };
  if (checked.rows.length !== 1) return { ok: false, error: checked.issues[0]?.message ?? 'That listing could not be read.' };
  return { ok: true, row: checked.rows[0].data };
}

export type Clash =
  | { kind: 'none' }
  | { kind: 'replace'; ref: string } // same internal ID: saving would overwrite this listing (ref = its web address)
  | { kind: 'address'; ref: string } // same web address under another ID: cannot be saved
  | { kind: 'link'; title: string }; // same official link already listed

/** Looks for a listing this one would replace, collide with, or repeat. */
export async function findClash(row: OpportunityRow): Promise<Clash> {
  if (!dbConfigured()) return { kind: 'none' };
  const existing = await existingFor(row.category);
  const sameId = existing.find((e) => e.external_id === row.external_id);
  if (sameId) return { kind: 'replace', ref: sameId.slug };
  const sameSlug = existing.find((e) => e.slug === row.slug);
  if (sameSlug) return { kind: 'address', ref: sameSlug.slug };
  const r = await call(`opportunities?select=title&category=eq.${encodeURIComponent(row.category)}&source_url=eq.${encodeURIComponent(row.source_url)}&limit=1`, { headers: headers() });
  if (r.ok && Array.isArray(r.body) && r.body[0]) return { kind: 'link', title: String((r.body[0] as { title: unknown }).title) };
  return { kind: 'none' };
}

/** How many visitor suggestions are waiting. Shown at the top of the admin page. */
export async function countPendingSubmissions(): Promise<number> {
  if (!dbConfigured()) return 0;
  const r = await call('submissions?select=id&status=eq.pending&limit=1000', { headers: headers() });
  return r.ok && Array.isArray(r.body) ? r.body.length : 0;
}
