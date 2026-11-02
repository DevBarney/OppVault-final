import type { CategorySlug } from '../lib/categories';

/**
 * A wall of vault boxes behind the home hero. Every box belongs to one of the six kinds of opportunity.
 * Point at (or tab to) a kind in the hero and its boxes light up, with the real count underneath.
 * It is pure CSS (:has), so there is no extra JavaScript to load.
 */
const KINDS: { slug: CategorySlug; noun: string; verb: string }[] = [
  { slug: 'scholarships', noun: 'scholarships', verb: 'open now' },
  { slug: 'fellowships', noun: 'fellowships', verb: 'open now' },
  { slug: 'grants', noun: 'grants', verb: 'open now' },
  { slug: 'courses', noun: 'courses', verb: 'open now' },
  { slug: 'events', noun: 'events', verb: 'coming up' },
  { slug: 'student-offers', noun: 'student offers', verb: 'available' },
];

const COLS = 14;
const ROWS = 9;
const CELLS = Array.from({ length: COLS * ROWS }, (_, i) => ({
  i,
  kind: KINDS[(i * 7 + Math.floor(i / COLS) * 3) % 6].slug,
}));
/** The one gold box that is waiting to be opened. */
const GOLD = 3 * COLS + 9;

export function HeroVaultWall() {
  return (
    <div className="vw" aria-hidden="true">
      <div className="vw__grid">
        {CELLS.map((c) => (
          <span key={c.i} className={c.i === GOLD ? 'vw__cell vw__cell--gold' : 'vw__cell'} data-cat={c.kind} />
        ))}
      </div>
    </div>
  );
}

export function HeroVaultStatus({ counts }: { counts: Partial<Record<CategorySlug, number>> }) {
  const total = KINDS.reduce((sum, k) => sum + (counts[k.slug] ?? 0), 0);
  return (
    <p className="vw__status" aria-live="off">
      <span className="vw__line vw__line--all">
        {total > 0 ? `${total} listings across six kinds, each linked to its official source.` : 'Six kinds of opportunity, one vault.'}
      </span>
      {KINDS.map((k) => {
        const n = counts[k.slug] ?? 0;
        return (
          <span key={k.slug} className="vw__line" data-cat={k.slug}>
            {n > 0 ? `${n} ${k.noun} ${k.verb}` : `${k.noun[0].toUpperCase()}${k.noun.slice(1)}, added as we verify them`}
          </span>
        );
      })}
    </p>
  );
}
