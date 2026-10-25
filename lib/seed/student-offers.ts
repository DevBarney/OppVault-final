// Sample student-offers (shown with a "Sample" badge only while Supabase is not connected).
import { toOpportunities, type Seed } from './_shared';

const ROWS: Seed[] = [
  { slug: 'sample-design-tools-student-plan', title: 'Design Tools Student Plan (sample)', provider: 'Example Design Software', summary: 'A sample listing for a free student plan on a design tool.', location: 'Global', level: 'All levels', funding: 'Free', inDays: null, featured: true },
  { slug: 'sample-cloud-credits', title: 'Cloud Credits for Students (sample)', provider: 'Example Cloud Provider', summary: 'A sample listing for credits students can use to learn and build.', location: 'Global', level: 'Undergraduate', funding: 'Free trial', inDays: 40 },
  { slug: 'sample-laptop-discount', title: 'Student Laptop Discount (sample)', provider: 'Example Electronics', summary: 'A sample listing for a seasonal discount on laptops for verified students.', location: 'Nigeria', level: 'All levels', funding: 'Discount', inDays: 12 },
  { slug: 'sample-reading-subscription', title: 'Reading Subscription Offer (sample)', provider: 'Example Publishing', summary: 'A sample listing for a discounted digital reading subscription.', location: 'Global', level: 'All levels', funding: 'Discount', inDays: null },
];

export const SEED_STUDENT_OFFERS = toOpportunities('student-offers', ROWS);
