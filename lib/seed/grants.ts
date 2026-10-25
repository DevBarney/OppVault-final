// Sample grants (shown with a "Sample" badge only while Supabase is not connected).
import { toOpportunities, type Seed } from './_shared';

const ROWS: Seed[] = [
  { slug: 'sample-community-project-grant', title: 'Community Project Grant (sample)', provider: 'Example Community Fund', summary: 'A sample listing for small grants that support community-led projects.', location: 'Global', level: 'All levels', funding: 'Small (under $5,000)', inDays: 30, featured: true },
  { slug: 'sample-student-startup-grant', title: 'Student Startup Grant (sample)', provider: 'Example Enterprise Trust', summary: 'A sample listing for student founders at the earliest stage of a business.', location: 'Africa', level: 'Undergraduate', funding: 'Medium ($5,000 to $25,000)', inDays: 52 },
  { slug: 'sample-research-seed-grant', title: 'Research Seed Grant (sample)', provider: 'Example Science Council', summary: 'A sample listing for seed funding to start a research project.', location: 'Online', level: 'Postgraduate', funding: 'Medium ($5,000 to $25,000)', inDays: 7 },
  { slug: 'sample-creative-arts-grant', title: 'Creative Arts Grant (sample)', provider: 'Example Arts Council', summary: 'A sample listing for artists and creative teams producing new work.', location: 'Ghana', level: 'All levels', funding: 'Small (under $5,000)', inDays: null },
];

export const SEED_GRANTS = toOpportunities('grants', ROWS);
