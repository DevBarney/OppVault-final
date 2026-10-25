import type { CategorySlug } from './categories';

export type Opportunity = {
  id: string;
  slug: string;
  category: CategorySlug;
  title: string;
  provider: string;
  summary: string;
  description: string; // paragraphs separated by a blank line
  eligibility: string[];
  benefits: string[];
  how_to_apply: string;
  location: string; // "Online", "Global", "Nigeria", ...
  level: string; // "Undergraduate", "Postgraduate", "Early career", "All levels", ...
  funding: string; // one of the category's fundingOptions
  deadline: string | null; // ISO date (YYYY-MM-DD); null means rolling / no fixed date
  source_url: string | null; // the official announcement
  featured: boolean;
  is_sample: boolean; // sample listings are shown with a "Sample" badge
  created_at: string;
};

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  body: string; // "## Heading", "- bullet" and blank-line separated paragraphs
  author: string;
  tags: string[];
  read_minutes: number;
  published_at: string;
};
