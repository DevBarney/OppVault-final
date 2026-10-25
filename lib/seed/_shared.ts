// Shared helpers for sample content. Not a place to add listings - see the per-category files.
import type { CategorySlug } from '../categories';
import type { Opportunity } from '../types';
import { addDays } from '../dates';

export type Seed = {
  slug: string;
  title: string;
  provider: string;
  summary: string;
  location: string;
  level: string;
  funding: string;
  /** days from today until the deadline; null means rolling */
  inDays: number | null;
  featured?: boolean;
};

const COMMON_ELIGIBILITY = [
  'Read the official announcement for the full list of requirements.',
  'Check the age, location and level of study that apply to you.',
  'Prepare any documents the provider asks for before you start the form.',
];

const COMMON_BENEFITS = ['See the official announcement for what is included.'];

/** Turns compact sample rows into full Opportunity objects, always flagged is_sample. */
export function toOpportunities(category: CategorySlug, seeds: Seed[]): Opportunity[] {
  return seeds.map((s, i) => ({
    id: `seed-${category}-${s.slug}`,
    slug: s.slug,
    category,
    title: s.title,
    provider: s.provider,
    summary: s.summary,
    description: `${s.summary}\n\nThis is a sample listing, written to show how real listings will look once OppVault opens. It does not describe a real programme and has no official link.`,
    eligibility: COMMON_ELIGIBILITY,
    benefits: COMMON_BENEFITS,
    how_to_apply:
      'Real listings link to the provider\'s official page. Always confirm the requirements and the deadline there before you apply.',
    location: s.location,
    level: s.level,
    funding: s.funding,
    deadline: s.inDays === null ? null : addDays(s.inDays),
    source_url: null,
    featured: Boolean(s.featured),
    is_sample: true,
    created_at: addDays(-(i % 9) - 1),
  }));
}
