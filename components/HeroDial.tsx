import Link from 'next/link';
import { ArrowIcon } from './Icons';
import VaultDoor from './VaultDoor';
import { getCategory } from '../lib/categories';
import { daysUntil } from '../lib/dates';
import type { Opportunity } from '../lib/types';

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
        <VaultDoor />
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
