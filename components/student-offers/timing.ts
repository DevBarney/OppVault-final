import { daysUntil, formatDate } from '../../lib/dates';

export type OfferTiming = { tone: 'open' | 'soon' | 'closed' | 'rolling'; text: string; ended: boolean };

/** Wording for when a student offer ends. `deadline` is the expiry date. */
export function offerTiming(iso: string | null): OfferTiming {
  const d = daysUntil(iso);
  if (d === null) return { tone: 'rolling', text: 'No end date listed', ended: false };
  if (d < 0) return { tone: 'closed', text: `Ended ${formatDate(iso)}`, ended: true };
  if (d === 0) return { tone: 'soon', text: 'Ends today', ended: false };
  if (d === 1) return { tone: 'soon', text: 'Ends tomorrow', ended: false };
  if (d <= 14) return { tone: 'soon', text: `Ends in ${d} days`, ended: false };
  return { tone: 'open', text: `Ends ${formatDate(iso)}`, ended: false };
}

/** Import stores how_to_apply as one string, with steps separated by "|" or new lines. */
export function steps(text: string): string[] {
  return text
    .split(/\||\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}
