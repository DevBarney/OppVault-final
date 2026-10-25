// The six kinds of opportunity OppVault lists. Everything about a category lives here,
// so adding or renaming one is a one-file change.

export type CategorySlug = 'scholarships' | 'fellowships' | 'grants' | 'courses' | 'events' | 'student-offers';

export type Category = {
  slug: CategorySlug;
  label: string; // nav + headings, plural
  singular: string;
  tagline: string;
  intro: string;
  /** The label for the "funding / cost" facet on this page. */
  fundingLabel: string;
  fundingOptions: string[];
  /** Label for the date shown on cards (deadline for most, event date for events). */
  dateLabel: string;
  icon: 'cap' | 'compass' | 'coins' | 'book' | 'calendar' | 'tag';
};

export const CATEGORIES: Category[] = [
  {
    slug: 'scholarships',
    label: 'Scholarships',
    singular: 'scholarship',
    tagline: 'Funding for study',
    intro: 'Funding for study, with the eligibility criteria and deadlines in one place.',
    fundingLabel: 'Funding',
    fundingOptions: ['Fully funded', 'Partially funded', 'Tuition only'],
    dateLabel: 'Deadline',
    icon: 'cap',
  },
  {
    slug: 'fellowships',
    label: 'Fellowships',
    singular: 'fellowship',
    tagline: 'Growth, research and leadership',
    intro: 'Programmes for professional growth, research, leadership and specialised training.',
    fundingLabel: 'Support',
    fundingOptions: ['Stipend', 'Fully funded', 'Mentorship only'],
    dateLabel: 'Deadline',
    icon: 'compass',
  },
  {
    slug: 'grants',
    label: 'Grants',
    singular: 'grant',
    tagline: 'Money for people and projects',
    intro: 'Financial support for individuals, researchers, entrepreneurs and project teams.',
    fundingLabel: 'Amount',
    fundingOptions: ['Small (under $5,000)', 'Medium ($5,000 to $25,000)', 'Large (over $25,000)'],
    dateLabel: 'Deadline',
    icon: 'coins',
  },
  {
    slug: 'courses',
    label: 'Courses',
    singular: 'course',
    tagline: 'Free and accessible learning',
    intro: 'Free or accessible learning, including online courses and skills programmes.',
    fundingLabel: 'Cost',
    fundingOptions: ['Free', 'Free to audit', 'Low cost'],
    dateLabel: 'Starts or closes',
    icon: 'book',
  },
  {
    slug: 'events',
    label: 'Events',
    singular: 'event',
    tagline: 'Conferences and meetups',
    intro: 'Conferences and events where you can learn, present ideas and meet people in your field.',
    fundingLabel: 'Attendance',
    fundingOptions: ['Free', 'Funded places', 'Paid'],
    dateLabel: 'Date',
    icon: 'calendar',
  },
  {
    slug: 'student-offers',
    label: 'Student Offers',
    singular: 'student offer',
    tagline: 'Discounts and tools',
    intro: 'Discounts, tools and software that can help students and learners.',
    fundingLabel: 'Offer',
    fundingOptions: ['Free', 'Discount', 'Free trial'],
    dateLabel: 'Offer ends',
    icon: 'tag',
  },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function isCategorySlug(slug: string): slug is CategorySlug {
  return CATEGORIES.some((c) => c.slug === slug);
}
