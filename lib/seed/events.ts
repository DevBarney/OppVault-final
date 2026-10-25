// Sample events (shown with a "Sample" badge only while Supabase is not connected).
import { toOpportunities, type Seed } from './_shared';

const ROWS: Seed[] = [
  { slug: 'sample-youth-innovation-summit', title: 'Youth Innovation Summit (sample)', provider: 'Example Summit Team', summary: 'A sample listing for a conference bringing young innovators together.', location: 'Lagos, Nigeria', level: 'All levels', funding: 'Funded places', inDays: 54, featured: true },
  { slug: 'sample-virtual-career-fair', title: 'Virtual Career Fair (sample)', provider: 'Example Careers Network', summary: 'A sample listing for an online fair where students meet employers.', location: 'Online', level: 'All levels', funding: 'Free', inDays: 16 },
  { slug: 'sample-research-conference', title: 'Global Research Conference (sample)', provider: 'Example Academic Society', summary: 'A sample listing for a conference where researchers present their work.', location: 'Nairobi, Kenya', level: 'Postgraduate', funding: 'Paid', inDays: 90 },
  { slug: 'sample-women-in-tech-meetup', title: 'Women in Tech Meetup (sample)', provider: 'Example Tech Community', summary: 'A sample listing for a community meetup with talks and networking.', location: 'Accra, Ghana', level: 'All levels', funding: 'Free', inDays: 11 },
];

export const SEED_EVENTS = toOpportunities('events', ROWS);
