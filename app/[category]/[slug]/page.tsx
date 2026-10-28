import type { Metadata } from 'next';
import { withSocial } from '../../../lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SaveButton from '../../../components/account/SaveButton';
import OpportunityCard from '../../../components/OpportunityCard';
import Prose from '../../../components/Prose';
import { ArrowIcon, ClockIcon, ExternalIcon, PinIcon } from '../../../components/Icons';
import { getCategory, isCategorySlug } from '../../../lib/categories';
import { getOpportunities, getOpportunity } from '../../../lib/data';
import { formatDate, urgency } from '../../../lib/dates';

type Props = { params: Promise<{ category: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  if (!isCategorySlug(category)) return {};
  const item = await getOpportunity(category, slug);
  if (!item) return {};
  return withSocial({
    title: item.title,
    description: item.summary,
    alternates: { canonical: `/${category}/${slug}` },
    robots: item.is_sample ? { index: false, follow: false } : undefined,
  });
}

export default async function OpportunityPage({ params }: Props) {
  const { category, slug } = await params;
  const cat = getCategory(category);
  if (!cat || !isCategorySlug(category)) notFound();
  // Fetch the listing and the related ones at the same time, not one after the other.
  const [item, { items: related }] = await Promise.all([getOpportunity(category, slug), getOpportunities({ category, limit: 4 })]);
  if (!item) notFound();

  const u = urgency(item.deadline);
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
            <Link href={`/${cat.slug}`}>{cat.label}</Link>
          </nav>
          <p className="phead__eyebrow">{item.provider}</p>
          <h1 className="phead__title phead__title--detail">{item.title}</h1>
          <div className="phead__badges">
            <span className={`urgency urgency--${u.tone} urgency--on-dark`}>
              <ClockIcon className="urgency__icon" />
              {u.text}
            </span>
            {item.is_sample ? <span className="badge-sample">Sample listing</span> : null}
          </div>
        </div>
      </section>

      <section className="section section--list">
        <div className="container detail">
          <article className="detail__main">
            {item.image_url ? (
              <div className="detail__image">
                <img src={item.image_url} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
              </div>
            ) : null}
            <p className="detail__lead">{item.summary}</p>
            {item.description ? <Prose text={item.description} /> : null}

            {item.eligibility.length > 0 ? (
              <>
                <h2 className="detail__h">Who can apply</h2>
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

            {item.how_to_apply ? (
              <>
                <h2 className="detail__h">How to apply</h2>
                <Prose text={item.how_to_apply} />
              </>
            ) : null}

            <p className="note">
              OppVault helps you discover opportunities. It cannot guarantee that you will be selected, and details can
              change, so always confirm the requirements and the deadline with the official source before you apply.
            </p>
          </article>

          <aside className="detail__side" aria-label="Key facts">
            <div className="facts">
              <dl>
                <div>
                  <dt>{cat.dateLabel}</dt>
                  <dd>{item.deadline ? formatDate(item.deadline) : 'Rolling / no fixed date'}</dd>
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
                  <dt>Location</dt>
                  <dd>
                    <PinIcon className="facts__icon" />
                    {item.location}
                  </dd>
                </div>
              </dl>
              {item.coupon_code ? (
                <p className="facts__coupon">
                  <span>Coupon code</span>
                  <code>{item.coupon_code}</code>
                </p>
              ) : null}
              {item.source_url ? (
                <a className="btn btn--primary facts__cta" href={item.source_url} target="_blank" rel="noopener noreferrer nofollow">
                  <span>Visit the official source</span>
                  <ExternalIcon className="btn__arrow" />
                </a>
              ) : (
                <p className="facts__note">Sample listings have no official link. Real listings always do.</p>
              )}
              {!item.is_sample ? <SaveButton category={item.category} slug={item.slug} title={item.title} variant="full" /> : null}
            </div>
          </aside>
        </div>
      </section>

      {more.length > 0 ? (
        <section className="section section--tint">
          <div className="container">
            <div className="section__head">
              <h2 className="h2">More {cat.label.toLowerCase()}</h2>
              <Link className="more" href={`/${cat.slug}`}>
                See all <ArrowIcon className="more__icon" />
              </Link>
            </div>
            <ul className="grid">
              {more.map((m) => (
                <li key={m.id}>
                  <OpportunityCard item={m} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
