// Sample courses (shown with a "Sample" badge only while Supabase is not connected).
import { toOpportunities, type Seed } from './_shared';

const ROWS: Seed[] = [
  { slug: 'sample-intro-data-skills', title: 'Introduction to Data Skills (sample)', provider: 'Example Online Academy', summary: 'A sample listing for a free, self-paced course on working with data.', location: 'Online', level: 'All levels', funding: 'Free', inDays: null, featured: true },
  { slug: 'sample-writing-for-work', title: 'Writing for Work (sample)', provider: 'Example Learning Hub', summary: 'A sample listing for a short course on clear professional writing.', location: 'Online', level: 'All levels', funding: 'Free to audit', inDays: null },
  { slug: 'sample-project-management-basics', title: 'Project Management Basics (sample)', provider: 'Example Skills Partnership', summary: 'A sample listing for a beginner course on planning and running projects.', location: 'Online', level: 'Early career', funding: 'Low cost', inDays: 20 },
  { slug: 'sample-web-development-starter', title: 'Web Development Starter (sample)', provider: 'Example Code School', summary: 'A sample listing for a free introduction to building websites.', location: 'Online', level: 'All levels', funding: 'Free', inDays: 33 },
];

export const SEED_COURSES = toOpportunities('courses', ROWS);
