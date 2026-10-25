// Sample content used ONLY while Supabase is not connected (local development and previews).
// Each file below is owned by one agent - see AGENTS.md. Add new sample files here.
import type { Opportunity } from '../types';
import { SEED_SCHOLARSHIPS } from './scholarships';
import { SEED_FELLOWSHIPS } from './fellowships';
import { SEED_GRANTS } from './grants';
import { SEED_COURSES } from './courses';
import { SEED_EVENTS } from './events';
import { SEED_STUDENT_OFFERS } from './student-offers';

export { SEED_POSTS } from './posts';

export const SEED_OPPORTUNITIES: Opportunity[] = [
  ...SEED_SCHOLARSHIPS,
  ...SEED_FELLOWSHIPS,
  ...SEED_GRANTS,
  ...SEED_COURSES,
  ...SEED_EVENTS,
  ...SEED_STUDENT_OFFERS,
];
