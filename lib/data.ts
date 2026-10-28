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

/** Like rest(), but also returns the total number of matching rows (Supabase sends it in Content-Range). */
async function restPage<T>(table: string, query: Record<string, string>): Promise<{ rows: T[]; total: number }> {
  if (!URL_BASE || !ANON_KEY) return { rows: [], total: 0 };
  const qs = new URLSearchParams(query).toString();
  try {
    const res = await fetch(`${URL_BASE}/rest/v1/${table}?${qs}`, {
      headers: {
        apikey: ANON_KEY,
        ...(ANON_KEY.startsWith('eyJ') ? { authorization: `Bearer ${ANON_KEY}` } : {}),
        accept: 'application/json',
        prefer: 'count=exact',
      },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`[data] supabase ${table} failed: ${res.status}`);
      return { rows: [], total: 0 };
    }
    const rows = (await res.json()) as T[];
    const range = res.headers.get('content-range') ?? '';
    const total = Number.parseInt(range.split('/')[1] ?? '', 10);
    return { rows, total: Number.isFinite(total) ? total : rows.length };
  } catch (err) {
    console.error(`[data] supabase ${table} error:`, err instanceof Error ? err.message : err);
    return { rows: [], total: 0 };
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

// What a card needs. The long text (description, eligibility, benefits, how to apply) is only loaded on a detail page.
const LIST_COLUMNS =
  'id,slug,category,title,provider,summary,location,level,funding,deadline,source_url,image_url,coupon_code,featured,created_at,updated_at';

const todayIso = () => new Date().toISOString().slice(0, 10);

export async function getOpportunities(filters: Filters = {}): Promise<Page<Opportunity>> {
  const limit = filters.limit ?? 12;
  const offset = filters.offset ?? 0;

  if (!usingSupabase) {
    const all = SEED_OPPORTUNITIES.filter((o) => matches(o, filters)).sort(sortByDeadline);
    return { items: all.slice(offset, offset + limit), total: all.length };
  }

  // Filtering, text search and paging all happen in the database, so a page only ever downloads the rows it shows.
  const query: Record<string, string> = {
    select: LIST_COLUMNS,
    published: 'eq.true',
    order: 'deadline.asc.nullslast,created_at.desc',
    limit: String(Math.min(Math.max(limit, 1), 1000)),
    offset: String(Math.max(offset, 0)),
  };
  if (filters.category) query.category = `eq.${filters.category}`;
  if (filters.funding) query.funding = `eq.${filters.funding}`;
  if (filters.level) query.level = `eq.${filters.level}`;
  if (filters.location) query.location = `eq.${filters.location}`;
  if (filters.featuredOnly) query.featured = 'eq.true';

  const and: string[] = [];
  if (filters.hideClosed !== false) and.push(`or(deadline.is.null,deadline.gte.${todayIso()})`);
  const words = cleanSearch(filters.q).split(' ').filter(Boolean).slice(0, 5);
  for (const w of words) {
    and.push(`or(${['title', 'provider', 'summary', 'location', 'level'].map((col) => `${col}.ilike.*${w}*`).join(',')})`);
  }
  if (and.length) query.and = `(${and.join(',')})`;

  const { rows, total } = await restPage<Opportunity>('opportunities', query);
  return { items: rows.map(normaliseOpportunity), total };
}

function normaliseOpportunity(o: Opportunity): Opportunity {
  return {
    ...o,
    eligibility: Array.isArray(o.eligibility) ? o.eligibility : [],
    benefits: Array.isArray(o.benefits) ? o.benefits : [],
    description: o.description ?? '',
    how_to_apply: o.how_to_apply ?? '',
    image_url: o.image_url ?? null,
    coupon_code: o.coupon_code ?? null,
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
  const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  if (!usingSupabase) {
    const items = SEED_OPPORTUNITIES.filter((o) => o.category === category);
    return { levels: uniq(items.map((i) => i.level)), locations: uniq(items.map((i) => i.location)) };
  }
  const rows = await rest<{ level: string; location: string }>('opportunities', {
    select: 'level,location',
    published: 'eq.true',
    category: `eq.${category}`,
    limit: '1000',
  });
  return { levels: uniq(rows.map((r) => r.level)), locations: uniq(rows.map((r) => r.location)) };
}

/** How many open listings each category has. One tiny count query per category instead of downloading rows. */
export async function getCounts(): Promise<Record<CategorySlug, number>> {
  const counts = { scholarships: 0, fellowships: 0, grants: 0, courses: 0, events: 0, 'student-offers': 0 } as Record<
    CategorySlug,
    number
  >;
  if (!usingSupabase) {
    for (const o of SEED_OPPORTUNITIES) {
      const d = daysUntil(o.deadline);
      if (d === null || d >= 0) counts[o.category] += 1;
    }
    return counts;
  }
  const today = todayIso();
  await Promise.all(
    (Object.keys(counts) as CategorySlug[]).map(async (category) => {
      const { total } = await restPage<{ id: string }>('opportunities', {
        select: 'id',
        published: 'eq.true',
        category: `eq.${category}`,
        and: `(or(deadline.is.null,deadline.gte.${today}))`,
        limit: '1',
      });
      counts[category] = total;
    }),
  );
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
