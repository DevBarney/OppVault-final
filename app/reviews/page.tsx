import type { Metadata } from 'next';
import MotifHero, { JumpLink } from '../../components/MotifHero';
import { StarIcon } from '../../components/Icons';
import ReviewForm from '../../components/reviews/ReviewForm';
import ReviewGrid from '../../components/reviews/ReviewCard';
import { getReviews } from '../../lib/data';
import { withSocial } from '../../lib/seo';
import '../../components/reviews/reviews.css';

export const metadata: Metadata = withSocial({
  title: 'Reviews',
  description: 'What people say about OppVault, in their own words. Used OppVault? Leave a review.',
  alternates: { canonical: '/reviews' },
});

export default async function ReviewsPage() {
  const reviews = await getReviews(60);
  const rated = reviews.filter((r) => typeof r.rating === 'number' && r.rating >= 1);
  const avg = rated.length >= 3 ? (rated.reduce((sum, r) => sum + (r.rating as number), 0) / rated.length).toFixed(1) : null;
  return (
    <>
      <MotifHero
        motif="reviews"
        eyebrow="In their own words"
        title="Reviews"
        meta={
          <>
            {avg ? (
              <span className="chero__count">
                <StarIcon className="mh__mini" />
                {avg} average from {rated.length} {rated.length === 1 ? 'rating' : 'ratings'}
              </span>
            ) : null}
            <JumpLink href="#rv-leave">Leave a review</JumpLink>
          </>
        }
      >
        <p>What people say about OppVault. We read every review before it appears, and we only show what people have written.</p>
      </MotifHero>
      <section className="section section--list">
        <div className="container">
          {reviews.length > 0 ? (
            <ReviewGrid reviews={reviews} />
          ) : (
            <p className="rv-empty">
              No reviews yet. Be the first to share how OppVault has helped you. <a href="#rv-leave">Write a review</a>
            </p>
          )}
        </div>
      </section>
      <section className="section section--tint" aria-labelledby="rv-leave">
        <div className="container">
          <h2 id="rv-leave" className="h2">Leave a review</h2>
          <div className="rv-form-wrap sub">
            <p className="sub__intro">No account needed. Please keep it honest and leave web addresses out.</p>
            <ReviewForm />
          </div>
        </div>
      </section>
    </>
  );
}
