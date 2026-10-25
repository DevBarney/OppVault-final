// Sample content used ONLY while Supabase is not connected (local development and previews).
// Every entry is invented for layout purposes and is shown with a "Sample" badge.
// Once NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set, none of this is used.

import type { CategorySlug } from './categories';
import type { Opportunity, Post } from './types';
import { addDays } from './dates';

type Seed = {
  category: CategorySlug;
  slug: string;
  title: string;
  provider: string;
  summary: string;
  location: string;
  level: string;
  funding: string;
  inDays: number | null;
  featured?: boolean;
};

const COMMON_ELIGIBILITY = [
  'Read the official announcement for the full list of requirements.',
  'Check the age, location and level of study that apply to you.',
  'Prepare any documents the provider asks for before you start the form.',
];

const COMMON_BENEFITS = ['See the official announcement for what is included.'];

const SEEDS: Seed[] = [
  // Scholarships
  { category: 'scholarships', slug: 'sample-global-merit-scholarship', title: 'Global Merit Scholarship (sample)', provider: 'Example Education Foundation', summary: 'A sample listing showing how a scholarship appears: provider, summary, eligibility and deadline at a glance.', location: 'Global', level: 'Undergraduate', funding: 'Fully funded', inDays: 38, featured: true },
  { category: 'scholarships', slug: 'sample-regional-stem-award', title: 'Regional STEM Award (sample)', provider: 'Example STEM Trust', summary: 'A sample listing for a science and technology award open to students in one region.', location: 'West Africa', level: 'Undergraduate', funding: 'Partially funded', inDays: 9 },
  { category: 'scholarships', slug: 'sample-postgraduate-research-bursary', title: 'Postgraduate Research Bursary (sample)', provider: 'Example University Fund', summary: 'A sample listing for a bursary supporting master\'s and doctoral research.', location: 'United Kingdom', level: 'Postgraduate', funding: 'Tuition only', inDays: 61 },
  { category: 'scholarships', slug: 'sample-first-generation-scholars', title: 'First-Generation Scholars Programme (sample)', provider: 'Example Access Initiative', summary: 'A sample listing for a programme supporting first-generation university students.', location: 'Online', level: 'All levels', funding: 'Partially funded', inDays: null },
  // Fellowships
  { category: 'fellowships', slug: 'sample-emerging-leaders-fellowship', title: 'Emerging Leaders Fellowship (sample)', provider: 'Example Leadership Institute', summary: 'A sample listing for a year-long leadership programme with mentorship and a cohort of peers.', location: 'Global', level: 'Early career', funding: 'Stipend', inDays: 45, featured: true },
  { category: 'fellowships', slug: 'sample-policy-research-fellowship', title: 'Policy Research Fellowship (sample)', provider: 'Example Policy Centre', summary: 'A sample listing for a research placement focused on public policy.', location: 'Kenya', level: 'Postgraduate', funding: 'Fully funded', inDays: 22 },
  { category: 'fellowships', slug: 'sample-health-innovation-fellowship', title: 'Health Innovation Fellowship (sample)', provider: 'Example Health Network', summary: 'A sample listing for early-career health professionals building new ideas.', location: 'Online', level: 'Early career', funding: 'Mentorship only', inDays: 75 },
  { category: 'fellowships', slug: 'sample-journalism-fellowship', title: 'Journalism Fellowship (sample)', provider: 'Example Media Fund', summary: 'A sample listing for reporters working on public-interest stories.', location: 'Nigeria', level: 'Early career', funding: 'Stipend', inDays: 13 },
  // Grants
  { category: 'grants', slug: 'sample-community-project-grant', title: 'Community Project Grant (sample)', provider: 'Example Community Fund', summary: 'A sample listing for small grants that support community-led projects.', location: 'Global', level: 'All levels', funding: 'Small (under $5,000)', inDays: 30, featured: true },
  { category: 'grants', slug: 'sample-student-startup-grant', title: 'Student Startup Grant (sample)', provider: 'Example Enterprise Trust', summary: 'A sample listing for student founders at the earliest stage of a business.', location: 'Africa', level: 'Undergraduate', funding: 'Medium ($5,000 to $25,000)', inDays: 52 },
  { category: 'grants', slug: 'sample-research-seed-grant', title: 'Research Seed Grant (sample)', provider: 'Example Science Council', summary: 'A sample listing for seed funding to start a research project.', location: 'Online', level: 'Postgraduate', funding: 'Medium ($5,000 to $25,000)', inDays: 7 },
  { category: 'grants', slug: 'sample-creative-arts-grant', title: 'Creative Arts Grant (sample)', provider: 'Example Arts Council', summary: 'A sample listing for artists and creative teams producing new work.', location: 'Ghana', level: 'All levels', funding: 'Small (under $5,000)', inDays: null },
  // Courses
  { category: 'courses', slug: 'sample-intro-data-skills', title: 'Introduction to Data Skills (sample)', provider: 'Example Online Academy', summary: 'A sample listing for a free, self-paced course on working with data.', location: 'Online', level: 'All levels', funding: 'Free', inDays: null, featured: true },
  { category: 'courses', slug: 'sample-writing-for-work', title: 'Writing for Work (sample)', provider: 'Example Learning Hub', summary: 'A sample listing for a short course on clear professional writing.', location: 'Online', level: 'All levels', funding: 'Free to audit', inDays: null },
  { category: 'courses', slug: 'sample-project-management-basics', title: 'Project Management Basics (sample)', provider: 'Example Skills Partnership', summary: 'A sample listing for a beginner course on planning and running projects.', location: 'Online', level: 'Early career', funding: 'Low cost', inDays: 20 },
  { category: 'courses', slug: 'sample-web-development-starter', title: 'Web Development Starter (sample)', provider: 'Example Code School', summary: 'A sample listing for a free introduction to building websites.', location: 'Online', level: 'All levels', funding: 'Free', inDays: 33 },
  // Events
  { category: 'events', slug: 'sample-youth-innovation-summit', title: 'Youth Innovation Summit (sample)', provider: 'Example Summit Team', summary: 'A sample listing for a conference bringing young innovators together.', location: 'Lagos, Nigeria', level: 'All levels', funding: 'Funded places', inDays: 54, featured: true },
  { category: 'events', slug: 'sample-virtual-career-fair', title: 'Virtual Career Fair (sample)', provider: 'Example Careers Network', summary: 'A sample listing for an online fair where students meet employers.', location: 'Online', level: 'All levels', funding: 'Free', inDays: 16 },
  { category: 'events', slug: 'sample-research-conference', title: 'Global Research Conference (sample)', provider: 'Example Academic Society', summary: 'A sample listing for a conference where researchers present their work.', location: 'Nairobi, Kenya', level: 'Postgraduate', funding: 'Paid', inDays: 90 },
  { category: 'events', slug: 'sample-women-in-tech-meetup', title: 'Women in Tech Meetup (sample)', provider: 'Example Tech Community', summary: 'A sample listing for a community meetup with talks and networking.', location: 'Accra, Ghana', level: 'All levels', funding: 'Free', inDays: 11 },
  // Student offers
  { category: 'student-offers', slug: 'sample-design-tools-student-plan', title: 'Design Tools Student Plan (sample)', provider: 'Example Design Software', summary: 'A sample listing for a free student plan on a design tool.', location: 'Global', level: 'All levels', funding: 'Free', inDays: null, featured: true },
  { category: 'student-offers', slug: 'sample-cloud-credits', title: 'Cloud Credits for Students (sample)', provider: 'Example Cloud Provider', summary: 'A sample listing for credits students can use to learn and build.', location: 'Global', level: 'Undergraduate', funding: 'Free trial', inDays: 40 },
  { category: 'student-offers', slug: 'sample-laptop-discount', title: 'Student Laptop Discount (sample)', provider: 'Example Electronics', summary: 'A sample listing for a seasonal discount on laptops for verified students.', location: 'Nigeria', level: 'All levels', funding: 'Discount', inDays: 12 },
  { category: 'student-offers', slug: 'sample-reading-subscription', title: 'Reading Subscription Offer (sample)', provider: 'Example Publishing', summary: 'A sample listing for a discounted digital reading subscription.', location: 'Global', level: 'All levels', funding: 'Discount', inDays: null },
];

export const SEED_OPPORTUNITIES: Opportunity[] = SEEDS.map((s, i) => ({
  id: `sample-${i + 1}`,
  slug: s.slug,
  category: s.category,
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

export const SEED_POSTS: Post[] = [
  {
    slug: 'how-to-read-eligibility-criteria',
    title: 'How to read eligibility criteria before you apply',
    excerpt: 'A few minutes spent checking the rules can save you hours on an application that was never going to be considered.',
    author: 'OppVault team',
    tags: ['Applications', 'Scholarships'],
    read_minutes: 4,
    published_at: addDays(-6),
    body: `Most rejected applications are not rejected because they were weak. They are rejected because the applicant did not meet a basic requirement. Reading the criteria carefully is the cheapest way to improve your chances of spending your time well.

## Start with the hard requirements

Look for the things that cannot be negotiated: age range, country of citizenship or residence, level of study, field of study and the date by which you must have graduated or enrolled. If you do not meet one of these, the best use of your time is usually to move on.

## Then read the soft requirements

These are things like leadership experience, community involvement or a minimum grade. Providers often describe them as "preferred" rather than required. Be honest with yourself about where you stand, and plan how to show evidence for each one.

## Check the documents list early

Many applications need transcripts, reference letters, a CV or proof of identity. Referees need time, so ask them as soon as you decide to apply.

## Write it down

- The deadline, including the time zone.
- Every document you need, and who has to supply it.
- The one sentence from the announcement that best describes who they want.

Eligibility rules differ between providers and change from year to year, so always confirm the details on the official announcement before you apply.`,
  },
  {
    slug: 'track-application-deadlines',
    title: 'A simple system for tracking application deadlines',
    excerpt: 'You do not need an app. A single list and two reminders are enough to stop deadlines from catching you out.',
    author: 'OppVault team',
    tags: ['Planning', 'Productivity'],
    read_minutes: 3,
    published_at: addDays(-13),
    body: `Missing a deadline by a day is one of the most avoidable ways to lose an opportunity. A simple system is better than a clever one that you stop using after a week.

## Keep one list

Put every opportunity you are considering in one place: a notes app, a spreadsheet or a page in a notebook. For each one, write the name, the real deadline and the link to the official page.

## Set two reminders

- One reminder two weeks before the deadline, to start or to decide that you will not apply.
- One reminder three days before, to submit.

## Work backwards

Treat the deadline as the day your referees and documents must already be ready, not the day you begin. If a form takes an evening, leave a week.

## Check the time zone

Deadlines are often given in the provider's local time. Convert it to your own so that you are not caught out by a few hours.

## Review once a week

Spend ten minutes each week removing what is closed and adding what is new. A short list that you trust is more useful than a long one you avoid.`,
  },
  {
    slug: 'personal-statement-structure',
    title: 'Writing a personal statement: a practical structure',
    excerpt: 'A clear structure helps your reader see who you are quickly. Here is one you can adapt.',
    author: 'OppVault team',
    tags: ['Writing', 'Applications'],
    read_minutes: 5,
    published_at: addDays(-20),
    body: `A personal statement is read by someone with many others to get through. A clear structure makes it easy for them to understand what you have done and what you want to do next.

## Open with a specific moment

Skip general statements about being passionate. Begin with something particular: a problem you noticed, a project you worked on or a question you could not stop thinking about.

## Show what you did

Describe two or three experiences and say what you did yourself, what you learned and what changed. Use numbers or concrete details where you honestly can.

## Connect it to this opportunity

Explain why this programme, at this point in your life. Refer to something specific in the announcement, so that it is clear you have read it.

## Look ahead

Say what you plan to do with the opportunity and how you will use it to help others or to grow. Be realistic. Nobody expects you to have everything planned.

## Edit with fresh eyes

- Cut anything that repeats your CV without adding meaning.
- Read it aloud to catch awkward sentences.
- Ask someone you trust to tell you what they remember after reading it.

A well-written statement improves your application, but it cannot guarantee an outcome. Selection depends on many things outside your control.`,
  },
  {
    slug: 'spot-opportunity-scams',
    title: 'What to check before you apply for any opportunity online',
    excerpt: 'Genuine opportunities do not ask you to pay to be considered. Here are the checks that protect you.',
    author: 'OppVault team',
    tags: ['Safety', 'Applications'],
    read_minutes: 4,
    published_at: addDays(-27),
    body: `Online, it can be hard to tell a real opportunity from a fake one. A few quick checks will protect your money and your personal information.

## Never pay to be considered

Be very cautious about anything that asks for an application fee, a "processing" charge or payment to guarantee a place. Many genuine programmes do not charge to apply, and nobody can honestly guarantee that you will be selected.

## Find the official source

Search for the provider yourself and compare the announcement with what is on their official website. If you cannot find it there, treat it with suspicion.

## Look at the details

- Does the email come from the provider's real domain?
- Is the writing careful, or full of errors and urgent language?
- Does the offer sound too generous for what is being asked?

## Protect your documents

Only share passports, bank details or national ID numbers when you are sure who is asking and why. Most applications do not need them at the first stage.

## Ask someone

If you are unsure, ask a teacher, a careers adviser or someone who has applied before. A second opinion costs nothing.

OppVault links every listing to its official announcement so that you can confirm the details yourself before you apply.`,
  },
];
