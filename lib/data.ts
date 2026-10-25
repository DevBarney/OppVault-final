// Data access for the platform.
//
// With NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY set, everything is read from
// Supabase through its REST API (no extra package needed). Without them, sample content from
// lib/seed.ts is used so the site still works in development.
//
// Reads use the public anon key and are protected by row level security (see supabase/schema.sql):
// only rows with published = true can be read.

import type { Opportunity, Post } from './types';
import type { CategorySlug } from './categories';
import { SEED_OPPORTUNITIES, SEED_POSTS } from './seed/index';
import { daysUntil } from './dates';

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const REVALIDATE_SECONDS = 300;

export const usingSupabase = Boolean(URL_BASE && ANON_KEY);

async function rest<T>(table: string, query: Record<string, string>): Promise<T[]> {
  if (!URL_BASE || !ANON_KEY) return [];
  const qs = new URLSearchParams(query).toString();
  try {
    const res = await fetch(`${URL_BASE}/rest/v1/${table}?${qs}`, {
      headers: {
        apikey: ANON_KEY,
        // legacy anon keys are JWTs and can be sent as a bearer token; sb_publishable_ keys are not
        ...(ANON_KEY.startsWith('eyJ') ? { authorization: `Bearer ${ANON_KEY}` } : {}),
        accept: 'application/json',
      },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`[data] supabase ${table} failed: ${res.status}`);
      return [];
    }
    return (await res.json()) as T[];
  } catch (err) {
    console.error(`[data] supabase ${table} error:`, err instanceof Error ? err.message : err);
    return [];
  }
}

/** Remove characters that have a meaning inside a PostgREST filter, so search text stays plain text. */
function cleanSearch(raw: string | undefined): string {
  return (raw ?? '').replace(/[^\p{L}\p{N} .'-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
}

export type Filters = {
  category?: CategorySlug;
  q?: string;
  funding?: string;
  level?: string;
  location?: string;
  /** hide listings whose deadline has passed (default true) */
  hideClosed?: boolean;
  featuredOnly?: boolean;
  limit?: number;
  offset?: number;
};

export type Page<T> = { items: T[]; total: number };

function sortByDeadline(a: Opportunity, b: Opportunity): number {
  // soonest deadline first, rolling listings last
  const da = a.deadline ?? '9999-12-31';
  const db = b.deadline ?? '9999-12-31';
  return da === db ? b.created_at.localeCompare(a.created_at) : da.localeCompare(db);
}

function matches(o: Opportunity, f: Filters): boolean {
  if (f.category && o.category !== f.category) return false;
  if (f.funding && o.funding !== f.funding) return false;
  if (f.level && o.level !== f.level) return false;
  if (f.location && o.location !== f.location) return false;
  if (f.featuredOnly && !o.featured) return false;
  if (f.hideClosed !== false) {
    const d = daysUntil(o.deadline);
    if (d !== null && d < 0) return false;
  }
  const q = cleanSearch(f.q).toLowerCase();
  if (q) {
    const hay = `${o.title} ${o.provider} ${o.summary} ${o.location} ${o.level}`.toLowerCase();
    if (!q.split(' ').every((word) => hay.includes(word))) return false;
  }
  return true;
}

export async function getOpportunities(filters: Filters = {}): Promise<Page<Opportunity>> {
  const limit = filters.limit ?? 12;
  const offset = filters.offset ?? 0;

  if (!usingSupabase) {
    const all = SEED_OPPORTUNITIES.filter((o) => matches(o, filters)).sort(sortByDeadline);
    return { items: all.slice(offset, offset + limit), total: all.length };
  }

  const query: Record<string, string> = {
    select: '*',
    published: 'eq.true',
    order: 'deadline.asc.nullslast,created_at.desc',
  };
  if (filters.category) query.category = `eq.${filters.category}`;
  if (filters.funding) query.funding = `eq.${filters.funding}`;
  if (filters.level) query.level = `eq.${filters.level}`;
  if (filters.location) query.location = `eq.${filters.location}`;
  if (filters.featuredOnly) query.featured = 'eq.true';
  const today = new Date().toISOString().slice(0, 10);
  const ors: string[] = [];
  if (filters.hideClosed !== false) ors.push(`deadline.is.null`, `deadline.gte.${today}`);
  const rows = await rest<Opportunity>('opportunities', {
    ...query,
    ...(ors.length ? { or: `(${ors.join(',')})` } : {}),
    limit: '500',
  });
  // Text search and paging happen here so the query stays simple and safe.
  const all = rows.map(normaliseOpportunity).filter((o) => matches(o, { ...filters, category: undefined, funding: undefined, level: undefined, location: undefined, featuredOnly: false }));
  return { items: all.slice(offset, offset + limit), total: all.length };
}

function normaliseOpportunity(o: Opportunity): Opportunity {
  return {
    ...o,
    eligibility: Array.isArray(o.eligibility) ? o.eligibility : [],
    benefits: Array.isArray(o.benefits) ? o.benefits : [],
    description: o.description ?? '',
    how_to_apply: o.how_to_apply ?? '',
    is_sample: false,
  };
}

export async function getOpportunity(category: CategorySlug, slug: string): Promise<Opportunity | null> {
  if (!usingSupabase) {
    return SEED_OPPORTUNITIES.find((o) => o.category === category && o.slug === slug) ?? null;
  }
  const rows = await rest<Opportunity>('opportunities', {
    select: '*',
    published: 'eq.true',
    category: `eq.${category}`,
    slug: `eq.${slug.replace(/[^a-z0-9-]/gi, '')}`,
    limit: '1',
  });
  return rows[0] ? normaliseOpportunity(rows[0]) : null;
}

/** Distinct values used to build the filter drop-downs for a category. */
export async function getFacets(category: CategorySlug): Promise<{ levels: string[]; locations: string[] }> {
  const { items } = await getOpportunities({ category, hideClosed: false, limit: 500 });
  const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  return { levels: uniq(items.map((i) => i.level)), locations: uniq(items.map((i) => i.location)) };
}

export async function getCounts(): Promise<Record<CategorySlug, number>> {
  const { items } = await getOpportunities({ limit: 1000 });
  const counts = { scholarships: 0, fellowships: 0, grants: 0, courses: 0, events: 0, 'student-offers': 0 } as Record<
    CategorySlug,
    number
  >;
  for (const o of items) counts[o.category] += 1;
  return counts;
}

export async function getPosts(limit = 50): Promise<Post[]> {
  if (!usingSupabase) {
    return [...SEED_POSTS].sort((a, b) => b.published_at.localeCompare(a.published_at)).slice(0, limit);
  }
  const rows = await rest<Post>('posts', {
    select: '*',
    published: 'eq.true',
    order: 'published_at.desc',
    limit: String(limit),
  });
  return rows.map((p) => ({ ...p, tags: Array.isArray(p.tags) ? p.tags : [] }));
}

export async function getPost(slug: string): Promise<Post | null> {
  if (!usingSupabase) return SEED_POSTS.find((p) => p.slug === slug) ?? null;
  const rows = await rest<Post>('posts', {
    select: '*',
    published: 'eq.true',
    slug: `eq.${slug.replace(/[^a-z0-9-]/gi, '')}`,
    limit: '1',
  });
  return rows[0] ? { ...rows[0], tags: Array.isArray(rows[0].tags) ? rows[0].tags : [] } : null;
}
