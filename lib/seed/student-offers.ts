// Sample student-offers (shown with a "Sample" badge only while Supabase is not connected).
// Every row is invented. Providers are placeholders, and none has an official link.
import type { Opportunity } from '../types';
import { toOpportunities, type Seed } from './_shared';

const ROWS: Seed[] = [
  { slug: 'sample-design-tools-student-plan', title: 'Design Tools Student Plan (sample)', provider: 'Example Design Software', summary: 'A sample listing for a free student plan on a design tool.', location: 'Global', level: 'All levels', funding: 'Free', inDays: null, featured: true },
  { slug: 'sample-cloud-credits', title: 'Cloud Credits for Students (sample)', provider: 'Example Cloud Provider', summary: 'A sample listing for credits students can use to learn and build.', location: 'Global', level: 'Undergraduate', funding: 'Free trial', inDays: 40 },
  { slug: 'sample-laptop-discount', title: 'Student Laptop Discount (sample)', provider: 'Example Electronics', summary: 'A sample listing for a seasonal discount on laptops for verified students.', location: 'Nigeria', level: 'All levels', funding: 'Discount', inDays: 12 },
  { slug: 'sample-reading-subscription', title: 'Reading Subscription Offer (sample)', provider: 'Example Publishing', summary: 'A sample listing for a discounted digital reading subscription.', location: 'Global', level: 'All levels', funding: 'Discount', inDays: null },
  { slug: 'sample-bootcamp-discount', title: 'Coding Bootcamp Student Discount (sample)', provider: 'Example Learning Lab', summary: 'A sample listing for an offer that has already ended.', location: 'Global', level: 'All levels', funding: 'Discount', inDays: -6 },
];

const SAMPLE = 'This is a sample listing. It does not describe a real offer, and the code shown is not a working code.';

type Detail = Pick<Opportunity, 'description' | 'eligibility' | 'benefits' | 'how_to_apply'> & { coupon_code?: string };

const DETAILS: Record<string, Detail> = {
  'sample-design-tools-student-plan': {
    description: `A free plan for students on a design tool, with the main features unlocked.\n\n${SAMPLE}`,
    eligibility: ['Open to students at accredited schools.', 'Needs proof that you are currently enrolled.'],
    benefits: ['Access to the main features at no charge while you are a student.'],
    how_to_apply: 'Go to the provider\u2019s student page|Sign in with your school email, if the provider accepts it|Upload proof of enrolment if the provider asks for it',
  },
  'sample-cloud-credits': {
    description: `Credits that students can spend while they learn to build and run applications.\n\n${SAMPLE}`,
    eligibility: ['Open to undergraduate students.', 'The provider may ask for a card to open the account.'],
    benefits: ['Credits for a limited time.', 'Free learning material from the provider.'],
    how_to_apply: 'Create an account with your school email|Confirm your student status with the provider|Read what happens when the credits run out',
  },
  'sample-laptop-discount': {
    description: `A seasonal discount on selected laptops for verified students.\n\n${SAMPLE}`,
    eligibility: ['Open to verified students in Nigeria.', 'Selected models only.'],
    benefits: ['A reduced price on selected laptops while the offer runs.'],
    how_to_apply: 'Open the provider\u2019s student store|Verify your student status with your school email or student ID|Enter the code at checkout',
    coupon_code: 'SAMPLE-CODE',
  },
  'sample-reading-subscription': {
    description: `A reduced price on a digital reading subscription for students.\n\n${SAMPLE}`,
    eligibility: ['Open to students with a school email address.'],
    benefits: ['A lower monthly price than the standard plan.'],
    how_to_apply: 'Open the provider\u2019s student page|Sign up with your school email|Check the price after the discount period ends',
  },
  'sample-bootcamp-discount': {
    description: `A discount on a coding bootcamp. This offer has ended, so the page shows the ended state.\n\n${SAMPLE}`,
    eligibility: ['Was open to current students.'],
    benefits: ['A reduced course fee.'],
    how_to_apply: 'The offer has ended. Check the provider\u2019s page for any new student offer.',
    coupon_code: 'SAMPLE-ENDED',
  },
};

export const SEED_STUDENT_OFFERS: Opportunity[] = toOpportunities('student-offers', ROWS).map((o) => ({ ...o, ...(DETAILS[o.slug] ?? {}) }));
