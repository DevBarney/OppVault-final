// Where an application stands. Shared by the server and the tracker page.

export const STATUSES = [
  { id: 'applied', label: 'Applied' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'interview', label: 'Interview or assessment' },
  { id: 'offer', label: 'Offer or awarded' },
  { id: 'not_selected', label: 'Not selected' },
  { id: 'withdrawn', label: 'Withdrawn' },
] as const;

export type StatusId = (typeof STATUSES)[number]['id'];

export function isStatus(value: unknown): value is StatusId {
  return typeof value === 'string' && STATUSES.some((s) => s.id === value);
}

export const NOTE_MAX = 600;
