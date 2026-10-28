import type { Metadata } from 'next';
import { listIndexing, withSocial } from '../../lib/seo';
import { Fragment } from 'react';
import { notFound } from 'next/navigation';
import EventCard from '../../components/events/EventCard';
import Filters from '../../components/Filters';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import Reveal from '../../components/Reveal';
import { getCategory } from '../../lib/categories';
import { getFacets, getOpportunities, usingSupabase } from '../../lib/data';
import { daysUntil } from '../../lib/dates';
import './events.css';

const PER_PAGE = 9;

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const one = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v) || undefined;

export async function generateMetadata({ searchParams }: Pick<Props, 'searchParams'>): Promise<Metadata> {
  const cat = getCategory('events');
  return withSocial({ title: cat?.label ?? 'Events', description: cat?.intro, ...listIndexing('/events', await searchParams) });
}

export default async function EventsPage({ searchParams }: Props) {
  const cat = getCategory('events');
  if (!cat) notFound();
  const sp = await searchParams;
  const values = { q: one(sp.q)?.slice(0, 60), funding: one(sp.funding), level: one(sp.level), location: one(sp.location) };
  const page = Math.max(1, Math.min(200, Number.parseInt(one(sp.page) ?? '1', 10) || 1));

  // The shared query hides past dates by default. Events keep them, labelled, after the upcoming ones.
  const [{ items: all }, facets] = await Promise.all([
    getOpportunities({ category: 'events', ...values, hideClosed: false, limit: 500 }),
    getFacets('events'),
  ]);
  const isPast = (iso: string | null) => {
    const d = daysUntil(iso);
    return d !== null && d < 0;
  };
  const upcoming = all.filter((e) => !isPast(e.deadline)); // soonest first, undated last (from the data layer)
  const past = all.filter((e) => isPast(e.deadline)).sort((a, b) => (b.deadline ?? '').localeCompare(a.deadline ?? '')); // most recent first
  const ordered = [...upcoming, ...past];
  const total = ordered.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const offset = (page - 1) * PER_PAGE;
  const items = ordered.slice(offset, offset + PER_PAGE);
  const filtered = Boolean(values.q || values.funding || values.level || values.location);

  return (
    <>
      <PageHeader eyebrow={cat.tagline} title={cat.label}>
        <p>{cat.intro}</p>
      </PageHeader>

      <section className="section section--list">
        <div className="container">
          <Filters category={cat} levels={facets.levels} locations={facets.locations} values={values} />

          <p className="results-count" aria-live="polite">
            {total === 0
              ? 'No events found'
              : `${total} ${total === 1 ? 'event' : 'events'}${filtered ? ' match your search' : ''}: ${upcoming.length} upcoming, ${past.length} past`}
          </p>

          {total > 0 && upcoming.length === 0 ? (
            <p className="evt-none">No upcoming events match right now. Past events are shown below for reference.</p>
          ) : null}

          {items.length > 0 ? (
            <ul className="grid">
              {items.map((item, i) => (
                <Fragment key={item.id}>
                  {offset + i === upcoming.length && past.length > 0 ? (
                    <li className="evt-divider-row">
                      <h2 className="evt-divider">Past events</h2>
                    </li>
                  ) : null}
                  <Reveal as="li" delay={Math.min(i, 5) * 60}>
                    <EventCard item={item} />
                  </Reveal>
                </Fragment>
              ))}
            </ul>
          ) : (
            <div className="empty">
              <h2 className="empty__title">{filtered ? 'Nothing matches that search' : 'No events listed yet'}</h2>
              <p>
                {filtered
                  ? 'Try fewer filters or a different word.'
                  : usingSupabase
                    ? 'We are adding events now. Join the list below and we will email you when new ones go live.'
                    : 'Events will appear here once they are added.'}
              </p>
            </div>
          )}

          <Pagination
            basePath="/events"
            params={{ q: values.q, funding: values.funding, level: values.level, location: values.location }}
            page={page}
            pages={pages}
          />
        </div>
      </section>
    </>
  );
}
