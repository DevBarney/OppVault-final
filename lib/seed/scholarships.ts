// Sample scholarships (shown with a "Sample" badge only while Supabase is not connected).
import { toOpportunities, type Seed } from './_shared';

const ROWS: Seed[] = [
  { slug: 'sample-global-merit-scholarship', title: 'Global Merit Scholarship (sample)', provider: 'Example Education Foundation', summary: 'A sample listing showing how a scholarship appears: provider, summary, eligibility and deadline at a glance.', location: 'Global', level: 'Undergraduate', funding: 'Fully funded', inDays: 38, featured: true },
  { slug: 'sample-regional-stem-award', title: 'Regional STEM Award (sample)', provider: 'Example STEM Trust', summary: 'A sample listing for a science and technology award open to students in one region.', location: 'West Africa', level: 'Undergraduate', funding: 'Partially funded', inDays: 9 },
  { slug: 'sample-postgraduate-research-bursary', title: 'Postgraduate Research Bursary (sample)', provider: 'Example University Fund', summary: 'A sample listing for a bursary supporting master\'s and doctoral research.', location: 'United Kingdom', level: 'Postgraduate', funding: 'Tuition only', inDays: 61 },
  { slug: 'sample-first-generation-scholars', title: 'First-Generation Scholars Programme (sample)', provider: 'Example Access Initiative', summary: 'A sample listing for a programme supporting first-generation university students.', location: 'Online', level: 'All levels', funding: 'Partially funded', inDays: null },
];

export const SEED_SCHOLARSHIPS = toOpportunities('scholarships', ROWS);
