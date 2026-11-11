import type { Metadata } from 'next';
import Callout from '../../../components/Callout';
import AppliedButton from '../../../components/account/AppliedButton';
import SaveButton from '../../../components/account/SaveButton';
import ShareActions from '../../../components/ShareActions';
import { SITE_URL } from '../../../lib/config';
import { withSocial } from '../../../lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EventCard from '../../../components/events/EventCard';
import PlanYourAttendance from '../../../components/events/PlanYourAttendance';
import { eventTiming, venueKind, venueLabel } from '../../../components/events/timing';
import { ArrowIcon, ClockIcon, ExternalIcon, PinIcon } from '../../../components/Icons';
import Prose from '../../../components/Prose';
import { getCategory } from '../../../lib/categories';
import { APPLIED_MIN_PUBLIC, getAppliedCount, getOpportunities, getOpportunity } from '../../../lib/data';
import { formatDate, daysUntil } from '../../../lib/dates';
import '../events.css';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getOpportunity('events', slug);
  if (!item) return {};
  return withSocial({
    title: item.title,
    description: item.summary,
    alternates: { canonical: `/events/${slug}` },
    robots: item.is_sample ? { index: false, follow: false } : undefined,
  });
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const cat = getCategory('events');
  if (!cat) notFound();
  const [item, { items: related }, appliedCount] = await Promise.all([getOpportunity('events', slug), getOpportunities({ category: 'events', limit: 4 }), getAppliedCount('events', slug)]);
  if (!item) notFound();

  const t = eventTiming(item.deadline);
  const venue = venueKind(item.location);
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
            <Link href="/events">{cat.label}</Link>
          </nav>
          <p className="phead__eyebrow">{item.provider}</p>
          <h1 className="phead__title phead__title--detail">{item.title}</h1>
          <div className="phead__badges">
            <span className={`urgency urgency--${t.tone} urgency--on-dark`}>
              <ClockIcon className="urgency__icon" />
              {t.text}
            </span>
            {item.funding ? <span className="evt-chip">{item.funding}</span> : null}
            {item.is_sample ? <span className="badge-sample">Sample listing</span> : null}
          </div>
        </div>
      </section>

      <section className="section section--list">
        <div className="container detail">
          <article className="detail__main">
            {t.past ? (
              <Callout tone="quiet" icon="calendar" title="This event has passed">
                The details stay here for reference. Check the official page to see whether it runs again.
              </Callout>
            ) : null}
            {item.image_url ? (
              <div className="detail__image">
                <img src={item.image_url} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
              </div>
            ) : null}
            <p className="detail__lead">{item.summary}</p>
            {item.description ? <Prose text={item.description} protect /> : null}

            {item.eligibility.length > 0 ? (
              <>
                <h2 className="detail__h">Who can attend</h2>
                <ul className="ticks">
                  {item.eligibility.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </>
            ) : null}

            {item.benefits.length > 0 ? (
              <>
                <h2 className="detail__h">What is included</h2>
                <ul className="ticks">
                  {item.benefits.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </>
            ) : null}

            {item.how_to_apply ? (
              <>
                <h2 className="detail__h">How to register</h2>
                <Prose text={item.how_to_apply} />
              </>
            ) : null}

            <PlanYourAttendance venue={venue} fundedPlaces={item.funding === 'Funded places'} past={t.past} />

            <Callout icon="keyhole" title="Confirm before you plan">
              OppVault helps you discover events. It cannot guarantee a place, funding or a visa, and details can change, so always
              confirm the date, the cost and the registration deadline with the organiser before you plan.
            </Callout>
          </article>

          <aside className="detail__side" aria-label="Key facts">
            <div className="facts">
              <dl>
                <div>
                  <dt>Date</dt>
                  <dd>{item.deadline ? <time dateTime={item.deadline}>{formatDate(item.deadline)}</time> : 'To be confirmed'}</dd>
                </div>
                <div>
                  <dt>Format</dt>
                  <dd>{venueLabel(venue)}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>
                    <PinIcon className="facts__icon" />
                    {item.location}
                  </dd>
                </div>
                <div>
                  <dt>{cat.fundingLabel}</dt>
                  <dd>{item.funding || 'See official source'}</dd>
                </div>
                <div>
                  <dt>Level</dt>
                  <dd>{item.level}</dd>
                </div>
              </dl>
              {item.source_url ? (
                <a className="btn btn--primary facts__cta" href={item.source_url} target="_blank" rel="noopener noreferrer nofollow">
                  <span>Register</span>
                  <span className="visually-hidden"> on the official website (opens in a new tab)</span>
                  <ExternalIcon className="btn__arrow" />
                </a>
              ) : (
                <p className="facts__note">Sample listings have no official link. Real listings always do.</p>
              )}
              {!item.is_sample ? <SaveButton category={item.category} slug={item.slug} title={item.title} variant="full" /> : null}
              {!item.is_sample ? <AppliedButton category={item.category} slug={item.slug} baseCount={appliedCount} minPublic={APPLIED_MIN_PUBLIC} /> : null}
              <ShareActions category={item.category} slug={item.slug} title={item.title} url={`${SITE_URL}/${item.category}/${item.slug}`} hasDate={(daysUntil(item.deadline) ?? -1) >= 0} dateLabel={item.deadline ? formatDate(item.deadline) : 'rolling'} />
              <p className="facts__note">Registration may close before the event. The official page has the programme and the registration deadline.</p>
            </div>
          </aside>
        </div>
      </section>

      {more.length > 0 ? (
        <section className="section section--tint">
          <div className="container">
            <div className="section__head">
              <h2 className="h2">More events</h2>
              <Link className="more" href="/events">
                See all <ArrowIcon className="more__icon" />
              </Link>
            </div>
            <ul className="grid">
              {more.map((m) => (
                <li key={m.id}>
                  <EventCard item={m} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
