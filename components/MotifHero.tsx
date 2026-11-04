import type { ReactNode } from 'react';
import { ArrowIcon, ChatIcon, StarIcon } from './Icons';

type Motif = 'reviews' | 'help' | 'lost';

const TICKS: Record<Motif, number> = { reviews: 30, help: 36, lost: 18 };

function Tile({ motif }: { motif: Motif }) {
  if (motif === 'reviews') return <StarIcon className="chero__icon mh__star" />;
  if (motif === 'help') return <ChatIcon className="chero__icon" />;
  return <span className="mh__num">404</span>;
}

/**
 * The dark band for the smaller pages (reviews, help, not found). Same vault-dial emblem as the category pages,
 * with a tile that says what the page is about. On a phone it sits quietly behind the text.
 */
export default function MotifHero({
  motif,
  eyebrow,
  title,
  children,
  meta,
}: {
  motif: Motif;
  eyebrow: string;
  title: string;
  children: ReactNode;
  meta?: ReactNode;
}) {
  const n = TICKS[motif];
  const ticks = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
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
  return (
    <section className={`phead chero mh mh--${motif}`}>
      <div className="hero__aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="chero__emblem" data-cat={motif === 'reviews' ? 'fellowships' : motif === 'help' ? 'courses' : 'grants'} aria-hidden="true">
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
          <Tile motif={motif} />
        </span>
      </div>
      <div className="container chero__inner">
        <p className="phead__eyebrow">{eyebrow}</p>
        <h1 className="phead__title">{title}</h1>
        <div className="phead__text">{children}</div>
        {meta ? <div className="chero__meta">{meta}</div> : null}
      </div>
    </section>
  );
}

export function JumpLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="chero__go" href={href}>
      {children} <ArrowIcon className="chero__arrow" />
    </a>
  );
}
