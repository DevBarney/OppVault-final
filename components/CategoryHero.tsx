import { ArrowIcon, CategoryIcon } from './Icons';
import type { Category } from '../lib/categories';

/** Ticks around each emblem differ a little, so the six pages feel related but not identical. */
const TICKS: Record<Category['slug'], number> = { scholarships: 36, fellowships: 30, grants: 24, courses: 40, events: 28, 'student-offers': 32 };

function Emblem({ cat }: { cat: Category }) {
  const n = TICKS[cat.slug];
  const ticks = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const long = i % 4 === 0;
    const r1 = long ? 158 : 166;
    return {
      i,
      long,
      x1: (200 + r1 * Math.sin(a)).toFixed(2),
      y1: (200 - r1 * Math.cos(a)).toFixed(2),
      x2: (200 + 176 * Math.sin(a)).toFixed(2),
      y2: (200 - 176 * Math.cos(a)).toFixed(2),
    };
  });
  return (
    <div className="chero__emblem" data-cat={cat.slug} aria-hidden="true">
      <span className="chero__glow" />
      <svg viewBox="0 0 400 400" className="chero__dial" focusable="false">
        <circle cx="200" cy="200" r="192" className="chero__rim" />
        <g className="chero__ticks">
          {ticks.map((t) => (
            <line key={t.i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} className={t.long ? 'chero__tick chero__tick--long' : 'chero__tick'} />
          ))}
        </g>
        <circle cx="200" cy="200" r="140" className="chero__ring" />
        <circle cx="200" cy="200" r="112" className="chero__ring chero__ring--dash" />
      </svg>
      <span className="chero__tile">
        <CategoryIcon name={cat.icon} className="chero__icon" />
      </span>
    </div>
  );
}

/**
 * The dark band at the top of each category page: what it is, how many are listed, and a vault-dial emblem
 * carrying the category's icon. On a phone the emblem sits quietly behind the text, like the About page.
 */
export default function CategoryHero({ cat, count, noun }: { cat: Category; count?: number; noun: string }) {
  return (
    <section className="phead chero">
      <div className="hero__aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <Emblem cat={cat} />
      <div className="container chero__inner">
        <p className="phead__eyebrow">{cat.tagline}</p>
        <h1 className="phead__title">{cat.label}</h1>
        <div className="phead__text">
          <p>{cat.intro}</p>
        </div>
        <div className="chero__meta">
          {typeof count === 'number' && count > 0 ? (
            <span className="chero__count">
              <span className="chero__dot" aria-hidden="true" />
              {count} {count === 1 ? noun : `${noun}s`} listed
            </span>
          ) : null}
          <a className="chero__go" href="#listings">
            See the list <ArrowIcon className="chero__arrow" />
          </a>
        </div>
      </div>
    </section>
  );
}
