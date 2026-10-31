import { formatDate } from '../../lib/dates';
import { initials } from '../../lib/reviews';
import type { Review } from '../../lib/types';
import './reviews.css';

export function ReviewCard({ review }: { review: Review }) {
  return (
    <figure className="rv-card">
      <blockquote className="rv-card__body">{review.body}</blockquote>
      <figcaption className="rv-card__who">
        {review.avatar_url ? (
          <img className="rv-avatar" src={review.avatar_url} alt="" width={48} height={48} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
        ) : (
          <span className="rv-avatar rv-avatar--initials" aria-hidden="true">{initials(review.name)}</span>
        )}
        <div>
          <p className="rv-card__name">{review.name}</p>
          <p className="rv-card__date">{formatDate(review.created_at)}</p>
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
