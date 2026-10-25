import type { Metadata } from 'next';
import OpportunityCard from '../../components/OpportunityCard';
import PageHeader from '../../components/PageHeader';
import { SearchIcon } from '../../components/Icons';
import { getOpportunities } from '../../lib/data';

export const metadata: Metadata = { title: 'Search', robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const q = (raw ?? '').slice(0, 60).trim();
  const { items, total } = q ? await getOpportunities({ q, limit: 24 }) : { items: [], total: 0 };

  return (
    <>
      <PageHeader eyebrow="Search" title={q ? `Results for “${q}”` : 'Search OppVault'} />
      <section className="section section--list">
        <div className="container">
          <form className="filters filters--solo" action="/search" method="get" role="search">
            <label className="filters__search">
              <span className="visually-hidden">Search opportunities</span>
              <SearchIcon className="filters__icon" />
              <input type="search" name="q" defaultValue={q} placeholder="Search all opportunities" maxLength={60} />
            </label>
            <button className="btn btn--primary btn--sm" type="submit">
              <span>Search</span>
            </button>
          </form>

          {q ? (
            <p className="results-count" aria-live="polite">
              {total === 0 ? 'No listings found' : `${total} ${total === 1 ? 'listing' : 'listings'}`}
            </p>
          ) : null}

          {items.length > 0 ? (
            <ul className="grid">
              {items.map((item) => (
                <li key={item.id}>
                  <OpportunityCard item={item} showCategory />
                </li>
              ))}
            </ul>
          ) : q ? (
            <div className="empty">
              <h2 className="empty__title">Nothing matches that search</h2>
              <p>Try a different word, or browse a category from the menu.</p>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
