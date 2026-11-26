import { formatDate, formatLongDate } from './dates';

const DATE_WORDS: Record<string, string> = {
  events: 'Date:',
  courses: 'Enrol by',
  'student-offers': 'Offer ends',
};

/** WhatsApp turns *text* into bold, so a stray asterisk in a title would break the layout. */
const plain = (s: string) => s.replace(/\*/g, '').replace(/\s+/g, ' ').trim();

/**
 * The text a visitor shares to WhatsApp:
 *
 * *Title:*
 *
 * One-line summary
 *
 * Apply by November 30, 2026 (30 Nov 2026).
 *
 * *Details on OppVault:*
 * https://www.oppvault.app/...
 *
 * *Join our WhatsApp group:*
 * https://www.oppvault.app/join?src=share
 *
 * The date line is left out for rolling listings and for dates that have passed.
 */
export function whatsappMessage(o: { category: string; title: string; summary: string; deadline: string | null; upcoming: boolean; url: string }): string {
  const title = plain(o.title).replace(/[:\s]+$/, '');
  const summary = plain(o.summary);
  const parts = [`*${title}:*`];
  if (summary && summary.toLowerCase() !== title.toLowerCase()) parts.push(summary);
  if (o.deadline && o.upcoming) {
    const word = DATE_WORDS[o.category] ?? 'Apply by';
    const long = formatLongDate(o.deadline);
    if (long) parts.push(`${word} ${long} (${formatDate(o.deadline)}).`);
  }
  parts.push(`*Details on OppVault:*\n${o.url}`);
  // Every shared message carries the group link, so people who receive it can join. The open is counted as "share".
  try {
    parts.push(`*Join our WhatsApp group:*\n${new URL(o.url).origin}/join?src=share`);
  } catch {
    /* an odd address: send the message without the group line */
  }
  return parts.join('\n\n');
}
