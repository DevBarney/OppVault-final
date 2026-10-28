import Link from 'next/link';
import SaveButton from './account/SaveButton';
import { ArrowIcon, CategoryIcon, ClockIcon, PinIcon } from './Icons';
import { getCategory } from '../lib/categories';
import { urgency } from '../lib/dates';
import type { Opportunity } from '../lib/types';

/** `priority` is for cards at the top of a page: their picture loads straight away instead of waiting until it scrolls near. */
export default function OpportunityCard({
  item,
  showCategory = false,
  priority = false,
}: {
  item: Opportunity;
  showCategory?: boolean;
  priority?: boolean;
}) {
  const cat = getCategory(item.category);
  const u = urgency(item.deadline);
  return (
    <article className="card">
      {item.is_sample ? null : <SaveButton category={item.category} slug={item.slug} title={item.title} variant="icon" />}
      <Link className="card__link" href={`/${item.category}/${item.slug}`}>
        {item.image_url ? (
          <span className="card__thumb">
            {/* Plain img: thumbnails come from many sites, so next/image domain settings are not used. */}
            <img
              src={item.image_url}
              alt=""
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </span>
        ) : null}
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
