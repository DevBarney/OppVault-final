import { formatDate } from '../../lib/dates';
import { initials } from '../../lib/reviews';
import type { Review } from '../../lib/types';
import './reviews.css';

function Stars({ rating }: { rating: number }) {
  return (
    <p className="rv-stars" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} className={n <= rating ? 'rv-star rv-star--on' : 'rv-star'} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />
        </svg>
      ))}
    </p>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  return (
    <figure className="rv-card">
      {review.rating ? <Stars rating={review.rating} /> : null}
      <blockquote className="rv-card__body">{review.body}</blockquote>
      <figcaption className="rv-card__who">
        {review.avatar_url ? (
          <img className="rv-avatar" src={review.avatar_url} alt="" width={48} height={48} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
        ) : (
          <span className="rv-avatar rv-avatar--initials" aria-hidden="true">{initials(review.name)}</span>
        )}
        <div>
          <p className="rv-card__name">{review.name}</p>
          <p className="rv-card__date">
            {review.used_for ? `Used for ${review.used_for.toLowerCase()} · ` : ''}
            {formatDate(review.created_at)}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}

export default function ReviewGrid({ reviews }: { reviews: Review[] }) {
  return (
    <ul className="rv-grid">
      {reviews.map((r) => (
        <li key={r.id}>
          <ReviewCard review={r} />
        </li>
      ))}
    </ul>
  );
}
