import type { Metadata } from 'next';
import Link from 'next/link';
import MotifHero from '../components/MotifHero';
import { CategoryIcon, SearchIcon, ArrowIcon } from '../components/Icons';
import { CATEGORIES } from '../lib/categories';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false, follow: false } };

/** Shown for any address that does not exist. The page is still sent with a real 404 status. */
export default function NotFound() {
  return (
    <>
      <MotifHero motif="lost" eyebrow="Error 404" title="That page is not in the vault.">
        <p>The link may be old, or the listing may have closed. Search for what you were after, or pick a kind below.</p>
      </MotifHero>
      <section className="section">
        <div className="container nf">
          <form className="nf__search" action="/search" method="get" role="search" aria-label="Search all opportunities">
            <label className="nf__field">
              <span className="visually-hidden">Search opportunities</span>
              <SearchIcon className="nf__icon" />
              <input type="search" name="q" placeholder="Search scholarships, grants, courses..." maxLength={60} />
            </label>
            <button className="btn btn--primary" type="submit">
              Search
            </button>
          </form>
          <ul className="nf__tiles">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link className="nf__tile" href={`/${c.slug}`}>
                  <span className="nf__tile-icon">
                    <CategoryIcon name={c.icon} className="nf__tile-svg" />
                  </span>
                  <span className="nf__tile-name">{c.label}</span>
                  <ArrowIcon className="nf__tile-go" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="nf__home">
            <Link className="btn btn--ghost" href="/">
              Back to the home page
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
