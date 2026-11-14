// The "Popular" order. Two things decide where a listing sits:
//   1. how much other visitors engage with it (applied, saved, clicks on its official site), and
//   2. how close its deadline is (closing today or tomorrow lifts it).
// Engagement is squashed with a logarithm so one very busy listing cannot bury everything else, and
// urgency is a bounded boost, so a listing nobody has touched yet can still surface when it is about to close.
// Listings with no activity and no near deadline score 0 and simply follow closing-date order.

export type Engagement = { applied: number; saved: number; clicks: number };

export const NO_ACTIVITY: Engagement = { applied: 0, saved: 0, clicks: 0 };

/** Weights: applying says most, saving some, a click on the official site least (it is easy to do). */
const W_APPLIED = 3;
const W_SAVED = 1.5;
const W_CLICK = 1;

export function engagementScore(e: Engagement): number {
  return Math.log(1 + W_APPLIED * e.applied + W_SAVED * e.saved + W_CLICK * e.clicks);
}

/** Boost for a deadline `days` away (0 = today). Past or missing deadlines get none. */
export function urgencyBoost(days: number | null): number {
  if (days === null || days < 0) return 0;
  if (days === 0) return 6;
  if (days === 1) return 5;
  if (days <= 3) return 4;
  if (days <= 7) return 2.5;
  if (days <= 14) return 1;
  return 0;
}

export function rankScore(e: Engagement, days: number | null): number {
  return engagementScore(e) + urgencyBoost(days);
}
