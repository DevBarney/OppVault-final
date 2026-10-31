// Builds a calendar file (.ics) for a listing's date, with reminders. Works in Apple, Google and Outlook calendars.

export type CalendarKind = 'deadline' | 'event' | 'offer';

const WHAT: Record<CalendarKind, { prefix: string; verb: string }> = {
  deadline: { prefix: 'Deadline', verb: 'closes' },
  event: { prefix: 'Event', verb: 'takes place' },
  offer: { prefix: 'Offer ends', verb: 'ends' },
};

/** Reminder offsets in days before the date. Each fires at 9am on its day. */
export const REMINDER_DAYS = [14, 7, 2, 0] as const;

function esc(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\;').replace(/,/g, '\\,');
}

/** Lines longer than 75 bytes must be folded (RFC 5545). */
function fold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 74) return line;
  const out: string[] = [];
  let cur = '';
  for (const ch of line) {
    if (enc.encode(cur + ch).length > (out.length === 0 ? 74 : 73)) {
      out.push(cur);
      cur = ch;
    } else cur += ch;
  }
  out.push(cur);
  return out.join('\r\n ');
}

const compact = (iso: string) => iso.replace(/-/g, '');

export function nextDay(iso: string): string {
  const t = Date.parse(`${iso}T00:00:00Z`) + 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

export function buildIcs(input: { uid: string; title: string; date: string; kind: CalendarKind; pageUrl: string; officialUrl?: string | null; now?: Date; daysLeft?: number }): string {
  const w = WHAT[input.kind];
  const stamp = (input.now ?? new Date()).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const description = [
    `${input.title} ${w.verb} on ${input.date}.`,
    'Always check the official page for the latest date and requirements.',
    input.officialUrl ? `Official page: ${input.officialUrl}` : '',
    `On OppVault: ${input.pageUrl}`,
  ]
    .filter(Boolean)
    .join('\n');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OppVault//Opportunities//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${input.uid}@oppvault.app`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(input.date)}`,
    `DTEND;VALUE=DATE:${compact(nextDay(input.date))}`,
    `SUMMARY:${esc(`${w.prefix}: ${input.title}`)}`,
    `DESCRIPTION:${esc(description)}`,
    `URL:${input.pageUrl}`,
    'TRANSP:TRANSPARENT',
  ];
  for (const d of REMINDER_DAYS) {
    // Skip reminders that would already be in the past.
    if (input.daysLeft !== undefined && d > input.daysLeft) continue;
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(d === 0 ? `${w.prefix} is today: ${input.title}` : `${w.prefix} in ${d} days: ${input.title}`)}`,
      // All-day events start at 00:00, so "9am on the day" is (d days) minus 9 hours.
      `TRIGGER:${d === 0 ? 'PT9H' : `-P${d - 1}DT15H`}`,
      'END:VALARM',
    );
  }
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
