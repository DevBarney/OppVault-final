import { daysUntil, formatDate } from '../../lib/dates';

export type Timing = { tone: 'open' | 'soon' | 'closed' | 'rolling'; text: string; past: boolean };

/**
 * Wording for an event date. Events happen on a date; they do not "close".
 * The stored `deadline` is treated as the event date (see docs/agents/status/agent-5.md).
 */
export function eventTiming(iso: string | null): Timing {
  const d = daysUntil(iso);
  if (d === null) return { tone: 'rolling', text: 'Date to be confirmed', past: false };
  if (d < 0) return { tone: 'closed', text: 'Past event', past: true };
  if (d === 0) return { tone: 'soon', text: 'Today', past: false };
  if (d === 1) return { tone: 'soon', text: 'Tomorrow', past: false };
  if (d <= 14) return { tone: 'soon', text: `In ${d} days`, past: false };
  return { tone: 'open', text: `In ${d} days`, past: false };
}

export type Venue = 'online' | 'hybrid' | 'in-person' | 'unknown';

export function venueKind(location: string): Venue {
  const l = location.trim().toLowerCase();
  if (l === '' || l === 'global') return 'unknown';
  if (l === 'online' || l === 'virtual') return 'online';
  if (/\b(online|virtual|hybrid)\b/.test(l)) return 'hybrid';
  return 'in-person';
}

export function venueLabel(v: Venue): string {
  switch (v) {
    case 'online':
      return 'Online';
    case 'hybrid':
      return 'In person and online';
    case 'in-person':
      return 'In person';
    default:
      return 'Check the official page';
  }
}

export { formatDate };
