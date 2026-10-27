import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Filters from '../../components/Filters';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import Reveal from '../../components/Reveal';
import OfferCard from '../../components/student-offers/OfferCard';
import { getCategory } from '../../lib/categories';
import { getFacets, getOpportunities, usingSupabase } from '../../lib/data';
import './offers.css';

const PER_PAGE = 9;

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const one = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v) || undefined;

export function generateMetadata(): Metadata {
  const cat = getCategory('student-offers');
  return {
    title: cat?.label ?? 'Student offers',
    description: cat?.intro,
    alternates: { canonical: '/student-offers' },
  };
}

export default async function StudentOffersPage({ searchParams }: Props) {
  const cat = getCategory('student-offers');
  if (!cat) notFound();
  const sp = await searchParams;
  const values = { q: one(sp.q)?.slice(0, 60), funding: one(sp.funding), level: one(sp.level), location: one(sp.location) };
  const page = Math.max(1, Math.min(200, Number.parseInt(one(sp.page) ?? '1', 10) || 1));

  // Offers that have ended are hidden by the shared query, so the list only shows offers you can still use.
  const [{ items, total }, facets] = await Promise.all([
    getOpportunities({ category: 'student-offers', ...values, limit: PER_PAGE, offset: (page - 1) * PER_PAGE }),
    getFacets('student-offers'),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const filtered = Boolean(values.q || values.funding || values.level || values.location);

  return (
    <>
      <PageHeader eyebrow={cat.tagline} title={cat.label}>
        <p>{cat.intro}</p>
      </PageHeader>

      <section className="section section--list">
        <div className="container">
          <p className="off-lead">
            OppVault lists these offers for information. We do not sell them, we have not tested them and we do not endorse them. Each page links to the
            provider, where you confirm the price, the terms and the end date.
          </p>

          <Filters category={cat} levels={facets.levels} locations={facets.locations} values={values} />

          <p className="results-count" aria-live="polite">
            {total === 0 ? 'No offers found' : `${total} ${total === 1 ? 'offer' : 'offers'}`}
            {filtered ? ' match your search' : ''}
          </p>

          {items.length > 0 ? (
            <ul className="grid">
              {items.map((item, i) => (
                <Reveal as="li" key={item.id} delay={Math.min(i, 5) * 60}>
                  <OfferCard item={item} />
                </Reveal>
              ))}
            </ul>
          ) : (
            <div className="empty">
              <h2 className="empty__title">{filtered ? 'Nothing matches that search' : 'No student offers listed yet'}</h2>
              <p>
                {filtered
                  ? 'Try fewer filters or a different word.'
                  : usingSupabase
                    ? 'We are adding offers now. Join the list below and we will email you when new ones go live.'
                    : 'Offers will appear here once they are added.'}
              </p>
            </div>
          )}

          <Pagination
            basePath="/student-offers"
            params={{ q: values.q, funding: values.funding, level: values.level, location: values.location }}
            page={page}
            pages={pages}
          />
        </div>
      </section>
    </>
  );
}
