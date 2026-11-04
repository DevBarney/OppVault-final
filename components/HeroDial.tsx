import Link from 'next/link';
import { ArrowIcon } from './Icons';
import { getCategory } from '../lib/categories';
import { daysUntil } from '../lib/dates';
import type { Opportunity } from '../lib/types';

const TICKS = Array.from({ length: 36 }, (_, i) => {
  const a = (i / 36) * Math.PI * 2;
  const long = i % 3 === 0;
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

/**
 * The home hero's emblem: a vault dial with a gold keyhole, and a small card that points at the listing
 * closing next. The card only appears when a listing with a real, future deadline exists.
 */
export default function HeroDial({ next }: { next?: Opportunity }) {
  const days = next ? daysUntil(next.deadline) : null;
  const cat = next ? getCategory(next.category) : null;
  return (
    <div className="hdial">
      <div className="chero__emblem hdial__emblem" aria-hidden="true">
        <span className="chero__glow" />
        <svg viewBox="0 0 400 400" className="chero__dial" focusable="false">
          <circle cx="200" cy="200" r="192" className="chero__rim" />
          <g className="chero__ticks">
            {TICKS.map((t) => (
              <line key={t.i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} className={t.long ? 'chero__tick chero__tick--long' : 'chero__tick'} />
            ))}
          </g>
          <circle cx="200" cy="200" r="140" className="chero__ring" />
          <circle cx="200" cy="200" r="112" className="chero__ring chero__ring--dash" />
        </svg>
        <span className="chero__tile">
          <svg viewBox="0 0 40 52" className="hdial__key">
            <circle cx="20" cy="17" r="8" />
            <path d="M16 22h8l3 20H13l3-20Z" />
          </svg>
        </span>
      </div>
      {next && days !== null && days >= 0 ? (
        <Link className="hdial__card" href={`/${next.category}/${next.slug}`}>
          <span className="hdial__label">Closing next{next.is_sample ? ' (sample)' : ''}</span>
          <span className="hdial__title">{next.title}</span>
          <span className="hdial__meta">
            {cat ? `${cat.singular[0].toUpperCase()}${cat.singular.slice(1)} · ` : ''}
            {days === 0 ? 'Closes today' : days === 1 ? 'Closes tomorrow' : `Closes in ${days} days`}
            <ArrowIcon className="hdial__go" />
          </span>
        </Link>
      ) : null}
    </div>
  );
}
