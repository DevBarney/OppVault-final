// Sample events (shown with a "Sample" badge only while Supabase is not connected).
// Every row is invented. Providers are placeholders, and none has an official link.
import type { Opportunity } from '../types';
import { toOpportunities, type Seed } from './_shared';

const ROWS: Seed[] = [
  { slug: 'sample-youth-innovation-summit', title: 'Youth Innovation Summit (sample)', provider: 'Example Summit Team', summary: 'A sample listing for a conference bringing young innovators together.', location: 'Lagos, Nigeria', level: 'All levels', funding: 'Funded places', inDays: 54, featured: true },
  { slug: 'sample-virtual-career-fair', title: 'Virtual Career Fair (sample)', provider: 'Example Careers Network', summary: 'A sample listing for an online fair where students meet employers.', location: 'Online', level: 'All levels', funding: 'Free', inDays: 16 },
  { slug: 'sample-research-conference', title: 'Global Research Conference (sample)', provider: 'Example Academic Society', summary: 'A sample listing for a conference where researchers present their work.', location: 'Nairobi, Kenya', level: 'Postgraduate', funding: 'Paid', inDays: 90 },
  { slug: 'sample-women-in-tech-meetup', title: 'Women in Tech Meetup (sample)', provider: 'Example Tech Community', summary: 'A sample listing for a community meetup with talks and networking.', location: 'Accra, Ghana', level: 'All levels', funding: 'Free', inDays: 11 },
  { slug: 'sample-health-innovation-forum', title: 'Health Innovation Forum (sample)', provider: 'Example Health Network', summary: 'A sample listing for a forum that people can join in person or online.', location: 'Abuja, Nigeria and online', level: 'All levels', funding: 'Free', inDays: 30 },
  { slug: 'sample-student-leadership-retreat', title: 'Student Leadership Retreat (sample)', provider: 'Example Youth Network', summary: 'A sample listing for a retreat whose date has not been announced yet.', location: 'Ibadan, Nigeria', level: 'Undergraduate', funding: 'Funded places', inDays: null },
  { slug: 'sample-community-science-fair', title: 'Community Science Fair (sample)', provider: 'Example Science Club', summary: 'A sample listing for a science fair that has already taken place.', location: 'Kumasi, Ghana', level: 'All levels', funding: 'Free', inDays: -21 },
];

const SAMPLE = 'This is a sample listing. It does not describe a real event and has no official link.';

type Detail = Pick<Opportunity, 'description' | 'eligibility' | 'benefits' | 'how_to_apply'>;

const DETAILS: Record<string, Detail> = {
  'sample-youth-innovation-summit': {
    description: `A two-day conference with talks, workshops and a project showcase for young innovators.\n\nThe organiser sets aside a number of funded places. Who qualifies and what the funding covers would be explained on the official page.\n\n${SAMPLE}`,
    eligibility: ['Open to students and early-career people.', 'Funded places need a short application, with its own closing date.'],
    benefits: ['Talks and hands-on workshops.', 'A showcase where attendees present projects.', 'Networking sessions with other attendees.'],
    how_to_apply: 'Register on the official page|Apply separately for a funded place, if you want one|Wait for the organiser to confirm your place before you book travel',
  },
  'sample-virtual-career-fair': {
    description: `A one-day online fair where students speak to employers in short video sessions.\n\n${SAMPLE}`,
    eligibility: ['Open to students and recent graduates.', 'You need a stable internet connection and a camera.'],
    benefits: ['Short video chats with employers.', 'Sessions on CVs and interviews.'],
    how_to_apply: 'Register on the official page|Upload a CV if the form asks for one|Join with the link the organiser sends you',
  },
  'sample-research-conference': {
    description: `A three-day conference where researchers present papers and posters.\n\nA fee applies. Fee waivers, if any, would be explained on the official page.\n\n${SAMPLE}`,
    eligibility: ['Aimed at postgraduate students and researchers.', 'Presenters submit an abstract before the stated deadline.'],
    benefits: ['Paper and poster sessions.', 'Keynote talks.', 'Time to meet researchers in your field.'],
    how_to_apply: 'Read the call for abstracts on the official page|Submit an abstract if you want to present|Register and pay the fee once your place is confirmed',
  },
  'sample-women-in-tech-meetup': {
    description: `An evening meetup with short talks and time to meet people working in technology.\n\n${SAMPLE}`,
    eligibility: ['Open to everyone who works in or studies technology.'],
    benefits: ['Short talks.', 'Open networking time.'],
    how_to_apply: 'Reserve a seat on the official page|Arrive a little early, as venues can have a fixed capacity',
  },
  'sample-health-innovation-forum': {
    description: `A one-day forum on new ideas in health care. People can attend in the room or follow online.\n\n${SAMPLE}`,
    eligibility: ['Open to students, practitioners and anyone interested in health.'],
    benefits: ['Panel talks.', 'A live stream for people who join online.'],
    how_to_apply: 'Register on the official page and choose in person or online|Check the time zone of the live stream before you join',
  },
  'sample-student-leadership-retreat': {
    description: `A residential retreat on leadership skills. The date has not been announced yet, so the listing shows "Date to be confirmed".\n\n${SAMPLE}`,
    eligibility: ['Aimed at undergraduate students.'],
    benefits: ['Workshops on leadership and teamwork.'],
    how_to_apply: 'Watch the official page for the date and the application form',
  },
  'sample-community-science-fair': {
    description: `A one-day science fair where students showed projects to the public. It has already taken place, so this listing is labelled as a past event.\n\n${SAMPLE}`,
    eligibility: ['Was open to students of all levels.'],
    benefits: ['Project displays and demonstrations.'],
    how_to_apply: 'Registration is closed. Check the official page to see whether the fair runs again.',
  },
};

export const SEED_EVENTS: Opportunity[] = toOpportunities('events', ROWS).map((o) => ({ ...o, ...(DETAILS[o.slug] ?? {}) }));
