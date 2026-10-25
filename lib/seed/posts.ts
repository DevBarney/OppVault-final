// Sample blog posts (shown only while Supabase is not connected).
import type { Post } from '../types';
import { addDays } from '../dates';

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
