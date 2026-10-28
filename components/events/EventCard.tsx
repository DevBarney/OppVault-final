import Link from 'next/link';
import SaveButton from '../account/SaveButton';
import { ArrowIcon, CategoryIcon, ClockIcon, PinIcon } from '../Icons';
import { formatDate } from '../../lib/dates';
import type { Opportunity } from '../../lib/types';
import { eventTiming } from './timing';

/** Event card. The shared OpportunityCard says "Closes in N days", which is the wrong wording for an event. */
export default function EventCard({ item }: { item: Opportunity }) {
  const t = eventTiming(item.deadline);
  return (
    <article className={`card evt-card${t.past ? ' evt-card--past' : ''}`}>
      {item.is_sample ? null : <SaveButton category={item.category} slug={item.slug} title={item.title} variant="icon" />}
      <Link className="card__link" href={`/events/${item.slug}`}>
        {item.image_url ? (
          <span className="card__thumb">
            <img src={item.image_url} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
          </span>
        ) : null}
        <div className="card__top">
          <span className="tag tag--plain">{item.provider}</span>
          {t.past ? <span className="evt-badge-past">Past event</span> : null}
          {item.is_sample ? <span className="badge-sample">Sample</span> : null}
          {item.featured && !item.is_sample && !t.past ? <span className="badge-featured">Featured</span> : null}
        </div>
        <h3 className="card__title">{item.title}</h3>
        <p className="card__summary">{item.summary}</p>
        <ul className="card__meta">
          <li>
            <CategoryIcon name="calendar" className="card__meta-icon" />
            {item.deadline ? <time dateTime={item.deadline}>{formatDate(item.deadline)}</time> : 'Date to be confirmed'}
          </li>
          <li>
            <PinIcon className="card__meta-icon" />
            {item.location}
          </li>
          {item.funding ? <li>{item.funding}</li> : null}
        </ul>
        <div className="card__foot">
          <span className={`urgency urgency--${t.tone}`}>
            <ClockIcon className="urgency__icon" />
            {t.text}
          </span>
          <span className="card__go" aria-hidden="true">
            <ArrowIcon className="card__go-icon" />
          </span>
        </div>
      </Link>
    </article>
  );
}
