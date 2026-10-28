import Link from 'next/link';
import SaveButton from '../account/SaveButton';
import { ArrowIcon, ClockIcon, PinIcon } from '../Icons';
import type { Opportunity } from '../../lib/types';
import { offerTiming } from './timing';

/** Student offer card. Shows when the offer ends, and the code if the listing has one. */
export default function OfferCard({ item }: { item: Opportunity }) {
  const t = offerTiming(item.deadline);
  return (
    <article className="card off-card">
      {item.is_sample ? null : <SaveButton category={item.category} slug={item.slug} title={item.title} variant="icon" />}
      <Link className="card__link" href={`/student-offers/${item.slug}`}>
        {item.image_url ? (
          <span className="card__thumb">
            <img src={item.image_url} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
          </span>
        ) : null}
        <div className="card__top">
          <span className="tag tag--plain">{item.provider}</span>
          {item.funding ? <span className="off-kind">{item.funding}</span> : null}
          {item.is_sample ? <span className="badge-sample">Sample</span> : null}
        </div>
        <h3 className="card__title">{item.title}</h3>
        <p className="card__summary">{item.summary}</p>
        <ul className="card__meta">
          <li>
            <PinIcon className="card__meta-icon" />
            {item.location}
          </li>
          <li>{item.level}</li>
          {item.coupon_code ? <li className="off-code">Code: {item.coupon_code}</li> : null}
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
