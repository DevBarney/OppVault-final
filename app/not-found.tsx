import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '../components/PageHeader';
import { CATEGORIES } from '../lib/categories';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false, follow: false } };

/** Shown for any address that does not exist. The page is still sent with a real 404 status. */
export default function NotFound() {
  return (
    <>
      <PageHeader eyebrow="Error 404" title="That page is not in the vault.">
        <p>The link may be old, or the listing may have closed. Try one of these instead.</p>
      </PageHeader>
      <section className="section">
        <div className="container">
          <p>
            <Link className="btn btn--primary" href="/">
              Back to the home page
            </Link>
          </p>
          <ul className="nf-links">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/${c.slug}`}>{c.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/search">Search</Link>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
