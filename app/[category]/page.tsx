import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Filters from '../../components/Filters';
import OpportunityCard from '../../components/OpportunityCard';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import Reveal from '../../components/Reveal';
import { CATEGORIES, getCategory } from '../../lib/categories';
import { getFacets, getOpportunities, usingSupabase } from '../../lib/data';

export const dynamicParams = false;
const PER_PAGE = 9;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const one = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v) || undefined;

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const cat = getCategory((await params).category);
  if (!cat) return {};
  return {
    title: cat.label,
    description: cat.intro,
    alternates: { canonical: `/${cat.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const cat = getCategory((await params).category);
  if (!cat) notFound();
  const sp = await searchParams;
  const values = { q: one(sp.q)?.slice(0, 60), funding: one(sp.funding), level: one(sp.level), location: one(sp.location) };
  const page = Math.max(1, Math.min(200, Number.parseInt(one(sp.page) ?? '1', 10) || 1));

  const [{ items, total }, facets] = await Promise.all([
    getOpportunities({ category: cat.slug, ...values, limit: PER_PAGE, offset: (page - 1) * PER_PAGE }),
    getFacets(cat.slug),
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
          <Filters category={cat} levels={facets.levels} locations={facets.locations} values={values} />

          <p className="results-count" aria-live="polite">
            {total === 0 ? 'No listings found' : `${total} ${total === 1 ? 'listing' : 'listings'}`}
            {filtered ? ' match your search' : ''}
          </p>

          {items.length > 0 ? (
            <ul className="grid">
              {items.map((item, i) => (
                <Reveal as="li" key={item.id} delay={Math.min(i, 5) * 60}>
                  <OpportunityCard item={item} />
                </Reveal>
              ))}
            </ul>
          ) : (
            <div className="empty">
              <h2 className="empty__title">{filtered ? 'Nothing matches that search' : `No ${cat.label.toLowerCase()} listed yet`}</h2>
              <p>
                {filtered
                  ? 'Try fewer filters or a different word.'
                  : usingSupabase
                    ? 'We are adding listings now. Join the list below and we will email you when new ones go live.'
                    : 'Listings will appear here once they are added.'}
              </p>
            </div>
          )}

          <Pagination
            basePath={`/${cat.slug}`}
            params={{ q: values.q, funding: values.funding, level: values.level, location: values.location }}
            page={page}
            pages={pages}
          />
        </div>
      </section>
    </>
  );
}
