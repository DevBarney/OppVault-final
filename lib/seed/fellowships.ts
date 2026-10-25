// Sample fellowships (shown with a "Sample" badge only while Supabase is not connected).
import { toOpportunities, type Seed } from './_shared';

const ROWS: Seed[] = [
  { slug: 'sample-emerging-leaders-fellowship', title: 'Emerging Leaders Fellowship (sample)', provider: 'Example Leadership Institute', summary: 'A sample listing for a year-long leadership programme with mentorship and a cohort of peers.', location: 'Global', level: 'Early career', funding: 'Stipend', inDays: 45, featured: true },
  { slug: 'sample-policy-research-fellowship', title: 'Policy Research Fellowship (sample)', provider: 'Example Policy Centre', summary: 'A sample listing for a research placement focused on public policy.', location: 'Kenya', level: 'Postgraduate', funding: 'Fully funded', inDays: 22 },
  { slug: 'sample-health-innovation-fellowship', title: 'Health Innovation Fellowship (sample)', provider: 'Example Health Network', summary: 'A sample listing for early-career health professionals building new ideas.', location: 'Online', level: 'Early career', funding: 'Mentorship only', inDays: 75 },
  { slug: 'sample-journalism-fellowship', title: 'Journalism Fellowship (sample)', provider: 'Example Media Fund', summary: 'A sample listing for reporters working on public-interest stories.', location: 'Nigeria', level: 'Early career', funding: 'Stipend', inDays: 13 },
];

export const SEED_FELLOWSHIPS = toOpportunities('fellowships', ROWS);
