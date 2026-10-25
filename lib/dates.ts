const DAY = 86_400_000;

export function startOfToday(): number {
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) return null;
  return Math.round((t - startOfToday()) / DAY);
}

export function formatDate(iso: string | null): string {
  if (!iso) return 'Rolling';
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) return 'Rolling';
  return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export type Urgency = { tone: 'open' | 'soon' | 'closed' | 'rolling'; text: string };

export function urgency(iso: string | null): Urgency {
  const d = daysUntil(iso);
  if (d === null) return { tone: 'rolling', text: 'Rolling / no fixed date' };
  if (d < 0) return { tone: 'closed', text: 'Closed' };
  if (d === 0) return { tone: 'soon', text: 'Closes today' };
  if (d <= 14) return { tone: 'soon', text: d === 1 ? 'Closes tomorrow' : `Closes in ${d} days` };
  return { tone: 'open', text: `Closes ${formatDate(iso)}` };
}

export function addDays(n: number): string {
  return new Date(startOfToday() + n * DAY).toISOString().slice(0, 10);
}
