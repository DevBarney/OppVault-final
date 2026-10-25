import Link from 'next/link';
import { ArrowIcon, CategoryIcon, ClockIcon, PinIcon } from './Icons';
import { getCategory } from '../lib/categories';
import { urgency } from '../lib/dates';
import type { Opportunity } from '../lib/types';

export default function OpportunityCard({ item, showCategory = false }: { item: Opportunity; showCategory?: boolean }) {
  const cat = getCategory(item.category);
  const u = urgency(item.deadline);
  return (
    <article className="card">
      <Link className="card__link" href={`/${item.category}/${item.slug}`}>
        <div className="card__top">
          {showCategory && cat ? (
            <span className="tag">
              <CategoryIcon name={cat.icon} className="tag__icon" />
              {cat.singular}
            </span>
          ) : (
            <span className="tag tag--plain">{item.provider}</span>
          )}
          {item.is_sample ? <span className="badge-sample">Sample</span> : null}
          {item.featured && !item.is_sample ? <span className="badge-featured">Featured</span> : null}
        </div>
        <h3 className="card__title">{item.title}</h3>
        {showCategory ? <p className="card__provider">{item.provider}</p> : null}
        <p className="card__summary">{item.summary}</p>
        <ul className="card__meta">
          <li>
            <PinIcon className="card__meta-icon" />
            {item.location}
          </li>
          <li>{item.level}</li>
          {item.funding ? <li>{item.funding}</li> : null}
        </ul>
        <div className="card__foot">
          <span className={`urgency urgency--${u.tone}`}>
            <ClockIcon className="urgency__icon" />
            {u.text}
          </span>
          <span className="card__go" aria-hidden="true">
            <ArrowIcon className="card__go-icon" />
          </span>
        </div>
      </Link>
    </article>
  );
}
