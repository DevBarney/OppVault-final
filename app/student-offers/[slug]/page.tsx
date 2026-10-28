import type { Metadata } from 'next';
import { withSocial } from '../../../lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowIcon, ClockIcon, ExternalIcon, PinIcon } from '../../../components/Icons';
import Prose from '../../../components/Prose';
import CheckBeforeYouBuy from '../../../components/student-offers/CheckBeforeYouBuy';
import OfferCard from '../../../components/student-offers/OfferCard';
import { offerTiming, steps } from '../../../components/student-offers/timing';
import { getCategory } from '../../../lib/categories';
import { getOpportunities, getOpportunity } from '../../../lib/data';
import '../offers.css';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getOpportunity('student-offers', slug);
  if (!item) return {};
  return withSocial({
    title: item.title,
    description: item.summary,
    alternates: { canonical: `/student-offers/${slug}` },
    robots: item.is_sample ? { index: false, follow: false } : undefined,
  });
}

export default async function StudentOfferPage({ params }: Props) {
  const { slug } = await params;
  const cat = getCategory('student-offers');
  if (!cat) notFound();
  const [item, { items: related }] = await Promise.all([
    getOpportunity('student-offers', slug),
    getOpportunities({ category: 'student-offers', limit: 4 }),
  ]);
  if (!item) notFound();

  const t = offerTiming(item.deadline);
  const verify = steps(item.how_to_apply);
  const more = related.filter((r) => r.id !== item.id).slice(0, 3);

  return (
    <>
      <section className="phead phead--detail">
        <div className="hero__aurora" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="container phead__inner">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/student-offers">{cat.label}</Link>
          </nav>
          <p className="phead__eyebrow">{item.provider}</p>
          <h1 className="phead__title phead__title--detail">{item.title}</h1>
          <div className="phead__badges">
            <span className={`urgency urgency--${t.tone} urgency--on-dark`}>
              <ClockIcon className="urgency__icon" />
              {t.text}
            </span>
            {item.funding ? <span className="off-chip">{item.funding}</span> : null}
            {item.is_sample ? <span className="badge-sample">Sample listing</span> : null}
          </div>
        </div>
      </section>

      <section className="section section--list">
        <div className="container detail">
          <article className="detail__main">
            {t.ended ? (
              <p className="off-endednote" role="note">
                This offer ended on the date shown. Check the provider&rsquo;s page before you rely on it.
              </p>
            ) : null}
            {item.image_url ? (
              <div className="detail__image">
                <img src={item.image_url} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
              </div>
            ) : null}

            <h2 className="detail__h off-first">What the offer is</h2>
            <p className="detail__lead">{item.summary}</p>
            {item.description ? <Prose text={item.description} /> : null}

            {item.eligibility.length > 0 ? (
              <>
                <h2 className="detail__h">Who can use it</h2>
                <ul className="ticks">
                  {item.eligibility.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </>
            ) : null}

            {item.benefits.length > 0 ? (
              <>
                <h2 className="detail__h">What you get</h2>
                <ul className="ticks">
                  {item.benefits.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </>
            ) : null}

            <h2 className="detail__h">How to verify you are a student</h2>
            {verify.length > 0 ? (
              <ol className="off-steps">
                {verify.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            ) : (
              <p>The listing does not say how the provider checks student status. Look for this on the provider&rsquo;s page before you start.</p>
            )}

            <CheckBeforeYouBuy ended={t.ended} />

            <p className="note">
              OppVault helps you discover offers. Providers can change or withdraw them at any time, so always confirm the details with the provider
              before you pay.
            </p>
          </article>

          <aside className="detail__side" aria-label="Key facts">
            <div className="facts">
              <dl>
                <div>
                  <dt>{cat.dateLabel}</dt>
                  <dd>{t.text}</dd>
                </div>
                <div>
                  <dt>{cat.fundingLabel}</dt>
                  <dd>{item.funding || 'See official source'}</dd>
                </div>
                <div>
                  <dt>Level</dt>
                  <dd>{item.level}</dd>
                </div>
                <div>
                  <dt>Available in</dt>
                  <dd>
                    <PinIcon className="facts__icon" />
                    {item.location}
                  </dd>
                </div>
              </dl>
              {item.coupon_code && !t.ended ? (
                <p className="facts__coupon">
                  <span>Code</span>
                  <code>{item.coupon_code}</code>
                </p>
              ) : null}
              {item.coupon_code && !t.ended ? <p className="facts__note">Codes can expire early. Try it on the provider&rsquo;s page.</p> : null}
              {item.source_url ? (
                <a className="btn btn--primary facts__cta" href={item.source_url} target="_blank" rel="noopener noreferrer nofollow">
                  <span>Go to the provider&rsquo;s page</span>
                  <ExternalIcon className="btn__arrow" />
                </a>
              ) : (
                <p className="facts__note">Sample listings have no official link. Real listings always do.</p>
              )}
            </div>
          </aside>
        </div>
      </section>

      {more.length > 0 ? (
        <section className="section section--tint">
          <div className="container">
            <div className="section__head">
              <h2 className="h2">More student offers</h2>
              <Link className="more" href="/student-offers">
                See all <ArrowIcon className="more__icon" />
              </Link>
            </div>
            <ul className="grid">
              {more.map((m) => (
                <li key={m.id}>
                  <OfferCard item={m} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
