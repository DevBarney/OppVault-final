// What the admin page can import. "opportunities" accepts any category through a category column.
import { CATEGORIES, type CategorySlug } from '../categories';

export type Kind = CategorySlug | 'opportunities' | 'blog';

export const KINDS: { kind: Kind; label: string; note: string }[] = [
  { kind: 'courses', label: 'Courses', note: 'Course name, link, thumbnail, coupon code and more.' },
  { kind: 'scholarships', label: 'Scholarships', note: 'Funding, level, deadline, eligibility.' },
  { kind: 'fellowships', label: 'Fellowships', note: 'Programmes with a stipend, mentorship or placement.' },
  { kind: 'grants', label: 'Grants', note: 'Project and research funding.' },
  { kind: 'events', label: 'Events and conferences', note: 'Date, place, cost.' },
  { kind: 'student-offers', label: 'Student offers', note: 'Discounts and free plans, with coupon codes.' },
  { kind: 'opportunities', label: 'All opportunities (mixed)', note: 'One file with a category column on every row.' },
  { kind: 'blog', label: 'Blog posts', note: 'Articles with a title, excerpt and body.' },
];

export function isKind(value: unknown): value is Kind {
  return typeof value === 'string' && KINDS.some((k) => k.kind === value);
}

export function kindTable(kind: Kind): 'posts' | 'opportunities' {
  return kind === 'blog' ? 'posts' : 'opportunities';
}

/** Accepts "student offers", "Student-Offers", "scholarship" and so on. */
export function parseCategory(value: string): CategorySlug | null {
  const v = value.trim().toLowerCase().replace(/[\s_]+/g, '-');
  for (const c of CATEGORIES) {
    if (v === c.slug || v === c.singular.toLowerCase().replace(/\s+/g, '-') || v + 's' === c.slug) return c.slug;
  }
  return null;
}
