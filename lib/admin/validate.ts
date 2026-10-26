// Turns CSV rows into rows the database accepts, and explains every problem in plain words.

import type { CategorySlug } from '../categories';
import { CATEGORIES } from '../categories';
import { parseCsv } from './csv';
import { type Kind, parseCategory } from './kinds';

export const MAX_ROWS = 1000;
export const MAX_BYTES = 1_000_000;

const ALIASES: Record<string, string[]> = {
  opportunity_id: ['opportunity_id', 'id', 'course_id', 'external_id', 'ref', 'reference', 'post_id'],
  title: ['title', 'name', 'course_name', 'scholarship_name', 'fellowship_name', 'grant_name', 'event_name', 'offer_name', 'opportunity_name', 'post_title'],
  provider: ['provider', 'organisation', 'organization', 'institution', 'platform', 'host', 'company', 'offered_by'],
  summary: ['summary', 'short_description', 'tagline'],
  description: ['description', 'details', 'about'],
  link: ['link', 'url', 'course_link', 'source_url', 'official_link', 'apply_link', 'website', 'application_link'],
  image_url: ['image', 'image_url', 'thumbnail', 'thumbnail_url', 'thumbnail_link', 'image_link', 'cover', 'cover_image'],
  coupon_code: ['coupon', 'coupon_code', 'promo_code', 'discount_code', 'code'],
  location: ['location', 'country', 'place', 'where'],
  level: ['level', 'study_level', 'audience'],
  funding: ['funding', 'cost', 'price', 'amount', 'funding_type', 'fee'],
  deadline: ['deadline', 'closing_date', 'end_date', 'date', 'deadline_date', 'closes'],
  eligibility: ['eligibility', 'requirements', 'who_can_apply'],
  benefits: ['benefits', 'what_you_get', 'includes'],
  how_to_apply: ['how_to_apply', 'apply_steps', 'application_process', 'instructions'],
  featured: ['featured', 'highlight'],
  published: ['published', 'publish', 'live', 'visible'],
  slug: ['slug', 'url_slug'],
  category: ['category', 'type'],
  // blog
  excerpt: ['excerpt', 'blurb'],
  body: ['body', 'content', 'article', 'text'],
  author: ['author', 'written_by'],
  tags: ['tags', 'topics'],
  read_minutes: ['read_minutes', 'reading_time', 'minutes'],
  published_at: ['published_at', 'publish_date', 'post_date'],
};

const LOOKUP = new Map<string, string>();
for (const [canonical, names] of Object.entries(ALIASES)) for (const n of names) if (!LOOKUP.has(n)) LOOKUP.set(n, canonical);

export function normaliseHeader(h: string): string {
  return h.replace(/^﻿/, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

export type OpportunityRow = {
  category: CategorySlug;
  external_id: string;
  slug: string;
  title: string;
  provider: string;
  summary: string;
  description: string;
  eligibility: string[];
  benefits: string[];
  how_to_apply: string;
  location: string;
  level: string;
  funding: string;
  deadline: string | null;
  source_url: string;
  image_url: string | null;
  coupon_code: string | null;
  featured: boolean;
  published: boolean;
};

export type PostRow = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  author: string;
  tags: string[];
  read_minutes: number;
  published_at: string;
  image_url: string | null;
  published: boolean;
};

export type RowIssue = { line: number; message: string };
export type Checked<T> = {
  rows: { line: number; data: T }[];
  issues: RowIssue[];
  total: number;
  fileError?: string;
  unknownColumns: string[];
};

function clean(value: string | undefined, max: number): string {
  // eslint-disable-next-line no-control-regex
  return (value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
}

function httpsUrl(value: string): string | null {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}

function parseBool(value: string, fallback: boolean): boolean | null {
  const v = value.trim().toLowerCase();
  if (v === '') return fallback;
  if (['true', 'yes', 'y', '1', 'live', 'published'].includes(v)) return true;
  if (['false', 'no', 'n', '0', 'draft', 'hidden'].includes(v)) return false;
  return null;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** Accepts 2026-03-31, 31/03/2026, 31-03-2026 and 31 March 2026. Returns undefined when it cannot be read. */
export function parseDate(value: string): string | null | undefined {
  const v = value.trim();
  if (v === '' || /^(rolling|ongoing|open|none|n\/a|-)$/i.test(v)) return null;
  let y: number, m: number, d: number;
  let match: RegExpMatchArray | null;
  if ((match = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) {
    [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else if ((match = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/))) {
    [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else if ((match = v.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})$/))) {
    const mi = MONTHS.indexOf(match[2].slice(0, 3).toLowerCase());
    if (mi < 0) return undefined;
    [d, m, y] = [Number(match[1]), mi + 1, Number(match[3])];
  } else {
    return undefined;
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return undefined;
  return `${y.toString().padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function list(value: string, max = 12): string[] {
  return value
    .split(/\||\r?\n/)
    .map((s) => clean(s, 300))
    .filter(Boolean)
    .slice(0, max);
}

type Table = { headers: string[]; records: { line: number; cells: Record<string, string> }[]; unknown: string[]; fileError?: string };

function readTable(text: string): Table {
  if (text.length > MAX_BYTES) return { headers: [], records: [], unknown: [], fileError: 'That file is larger than 1 MB. Split it into smaller files.' };
  const grid = parseCsv(text);
  if (grid.length === 0) return { headers: [], records: [], unknown: [], fileError: 'The file is empty.' };
  const rawHeaders = grid[0].map(normaliseHeader);
  const mapped = rawHeaders.map((h) => LOOKUP.get(h) ?? '');
  const unknown = rawHeaders.filter((h, i) => h && !mapped[i]);
  if (grid.length - 1 > MAX_ROWS) {
    return { headers: mapped, records: [], unknown, fileError: `Too many rows (${grid.length - 1}). The limit is ${MAX_ROWS} per file.` };
  }
  const records = grid.slice(1).map((cells, i) => {
    const rec: Record<string, string> = {};
    mapped.forEach((name, idx) => {
      if (name && rec[name] === undefined) rec[name] = cells[idx] ?? '';
    });
    return { line: i + 2, cells: rec };
  });
  return { headers: mapped, records, unknown };
}

export function checkOpportunities(text: string, kind: Kind): Checked<OpportunityRow> {
  const table = readTable(text);
  const out: Checked<OpportunityRow> = { rows: [], issues: [], total: table.records.length, unknownColumns: table.unknown, fileError: table.fileError };
  if (table.fileError) return out;
  if (!table.headers.includes('title')) {
    out.fileError = 'No title column found. The first row must contain column names such as title (or course_name), link and summary.';
    return out;
  }
  if (!table.headers.includes('link')) {
    out.fileError = 'No link column found. Every listing needs an official link (column name: link, url or course_link).';
    return out;
  }
  if (kind === 'opportunities' && !table.headers.includes('category')) {
    out.fileError = 'This upload needs a category column (scholarships, fellowships, grants, courses, events or student-offers).';
    return out;
  }

  const seen = new Set<string>();
  const seenSlugs = new Set<string>();
  for (const { line, cells } of table.records) {
    const problems: string[] = [];
    const get = (k: string, max: number) => clean(cells[k], max);

    let category: CategorySlug | null = null;
    if (kind === 'opportunities') {
      category = parseCategory(get('category', 40));
      if (!category) problems.push(`category "${get('category', 40)}" is not one of ${CATEGORIES.map((c) => c.slug).join(', ')}`);
    } else {
      category = kind as CategorySlug;
      const given = get('category', 40);
      if (given && parseCategory(given) !== category) problems.push(`category "${given}" does not match this upload (${category})`);
    }

    const title = get('title', 200);
    if (!title) problems.push('title is empty');

    const link = httpsUrl(get('link', 600));
    if (!link) problems.push('link must be a full https:// web address');

    const imageRaw = get('image_url', 600);
    const image = imageRaw ? httpsUrl(imageRaw) : null;
    if (imageRaw && !image) problems.push('image/thumbnail must be a full https:// web address');

    const description = clean(cells.description, 6000);
    let summary = get('summary', 400);
    if (!summary && description) summary = description.replace(/\s+/g, ' ').slice(0, 200);

    const deadline = parseDate(get('deadline', 40));
    if (deadline === undefined) problems.push(`deadline "${get('deadline', 40)}" is not a date. Use YYYY-MM-DD, DD/MM/YYYY, or leave empty for rolling`);

    const featured = parseBool(get('featured', 10), false);
    if (featured === null) problems.push('featured must be yes or no');
    const published = parseBool(get('published', 10), true);
    if (published === null) problems.push('published must be yes or no');

    const slug = slugify(get('slug', 120) || title);
    if (!slug) problems.push('could not make a web address from the title');
    const externalId = get('opportunity_id', 120) || slug;

    if (category && slug) {
      const key = `${category}|${externalId}`;
      if (seen.has(key)) problems.push(`opportunity ID "${externalId}" appears more than once in this file`);
      seen.add(key);
      const sk = `${category}|${slug}`;
      if (seenSlugs.has(sk)) problems.push(`two rows produce the same web address (${slug}). Give one a different title or slug`);
      seenSlugs.add(sk);
    }

    if (problems.length || !category || !link || deadline === undefined || featured === null || published === null) {
      out.issues.push({ line, message: problems.join('; ') || 'row could not be read' });
      continue;
    }

    let provider = get('provider', 160);
    if (!provider) provider = new URL(link).hostname.replace(/^www\./, '');
    if (!summary) {
      // Nothing invented: a plain pointer to the official page until a real summary is added.
      const singular = CATEGORIES.find((c) => c.slug === category)?.singular ?? 'Listing';
      summary = `${singular.charAt(0).toUpperCase()}${singular.slice(1)} from ${provider}. See the official page for full details.`;
    }

    out.rows.push({
      line,
      data: {
        category,
        external_id: externalId,
        slug,
        title,
        provider,
        summary,
        description,
        eligibility: list(cells.eligibility ?? ''),
        benefits: list(cells.benefits ?? ''),
        how_to_apply: clean(cells.how_to_apply, 3000),
        location: get('location', 120) || 'Global',
        level: get('level', 80) || 'All levels',
        funding: get('funding', 120),
        deadline,
        source_url: link,
        image_url: image,
        coupon_code: get('coupon_code', 60) || null,
        featured,
        published,
      },
    });
  }
  return out;
}

export function checkPosts(text: string): Checked<PostRow> {
  const table = readTable(text);
  const out: Checked<PostRow> = { rows: [], issues: [], total: table.records.length, unknownColumns: table.unknown, fileError: table.fileError };
  if (table.fileError) return out;
  if (!table.headers.includes('title') || !table.headers.includes('body')) {
    out.fileError = 'Blog uploads need at least a title column and a body column.';
    return out;
  }
  const seen = new Set<string>();
  for (const { line, cells } of table.records) {
    const problems: string[] = [];
    const title = clean(cells.title, 200);
    if (!title) problems.push('title is empty');
    const body = clean((cells.body ?? '').replace(/\\n/g, '\n'), 40000);
    if (!body) problems.push('body is empty');
    let excerpt = clean(cells.excerpt, 400);
    if (!excerpt && body) excerpt = body.replace(/^#+\s.*$/gm, '').replace(/\s+/g, ' ').trim().slice(0, 200);
    const slug = slugify(clean(cells.slug, 120) || title);
    if (!slug) problems.push('could not make a web address from the title');
    if (seen.has(slug)) problems.push(`slug "${slug}" appears more than once in this file`);
    seen.add(slug);
    const imageRaw = clean(cells.image_url, 600);
    const image = imageRaw ? httpsUrl(imageRaw) : null;
    if (imageRaw && !image) problems.push('image must be a full https:// web address');
    const dateRaw = clean(cells.published_at, 40);
    const date = dateRaw ? parseDate(dateRaw) : new Date().toISOString().slice(0, 10);
    if (date === undefined || date === null) problems.push('published_at must be a date (YYYY-MM-DD or DD/MM/YYYY)');
    const published = parseBool(clean(cells.published, 10), true);
    if (published === null) problems.push('published must be yes or no');
    const minsRaw = clean(cells.read_minutes, 4);
    const words = body.split(/\s+/).filter(Boolean).length;
    const mins = minsRaw ? Number(minsRaw) : Math.max(1, Math.ceil(words / 200));
    if (!Number.isInteger(mins) || mins < 1 || mins > 120) problems.push('read_minutes must be a whole number');

    if (problems.length || !date || published === null) {
      out.issues.push({ line, message: problems.join('; ') || 'row could not be read' });
      continue;
    }
    out.rows.push({
      line,
      data: {
        slug,
        title,
        excerpt,
        body,
        author: clean(cells.author, 80) || 'OppVault team',
        tags: list(cells.tags ?? '', 8),
        read_minutes: mins,
        published_at: date,
        image_url: image,
        published,
      },
    });
  }
  return out;
}

/** Column lists and one example row for the downloadable templates. */
export function templateFor(kind: Kind): { headers: string[]; example: string[] } {
  if (kind === 'blog') {
    return {
      headers: ['slug', 'title', 'excerpt', 'body', 'author', 'tags', 'read_minutes', 'published_at', 'image_url', 'published'],
      example: ['how-to-plan-your-deadlines', 'How to plan your deadlines', 'A calm way to work backwards from a closing date.', '## Start with the date\nWrite the closing date down first.', 'OppVault team', 'Applications|Planning', '4', '2026-11-01', 'https://example.com/cover.jpg', 'yes'],
    };
  }
  const base = ['opportunity_id', 'title', 'provider', 'summary', 'description', 'link', 'image_url', 'location', 'level', 'funding', 'deadline', 'eligibility', 'benefits', 'how_to_apply', 'featured', 'published'];
  const example: Record<string, string> = {
    opportunity_id: 'EXAMPLE-001',
    title: 'Example title (replace me)',
    provider: 'Example provider',
    summary: 'One or two sentences on what it is and who it is for.',
    description: 'Longer details. Separate paragraphs with a blank line.',
    link: 'https://example.com/official-page',
    image_url: 'https://example.com/thumbnail.jpg',
    location: 'Online',
    level: 'All levels',
    funding: 'Free',
    deadline: '2026-12-31',
    eligibility: 'First requirement|Second requirement',
    benefits: 'First benefit|Second benefit',
    how_to_apply: 'Step one|Step two',
    featured: 'no',
    published: 'yes',
    coupon_code: 'SAVE20',
    category: 'courses',
  };
  let headers = base;
  if (kind === 'courses' || kind === 'student-offers') headers = [...base.slice(0, 7), 'coupon_code', ...base.slice(7)];
  if (kind === 'opportunities') headers = ['category', ...base.slice(0, 7), 'coupon_code', ...base.slice(7)];
  return { headers, example: headers.map((h) => example[h] ?? '') };
}
