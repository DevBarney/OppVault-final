import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import AccountActions from '../../../components/account/AccountActions';
import EventCard from '../../../components/events/EventCard';
import OfferCard from '../../../components/student-offers/OfferCard';
import OpportunityCard from '../../../components/OpportunityCard';
import PageHeader from '../../../components/PageHeader';
import { listSaved } from '../../../lib/account/saved';
import { currentVisitor } from '../../../lib/account/server';
import { getOpportunity } from '../../../lib/data';
import type { CategorySlug } from '../../../lib/categories';
import '../../../components/account/account.css';

export const metadata: Metadata = { title: 'My saved', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const SHOW_MAX = 60;

export default async function SavedPage() {
  const visitor = await currentVisitor();
  if (visitor === 'refresh') redirect('/api/account/refresh?next=%2Faccount%2Fsaved');
  if (!visitor) redirect('/account/sign-in?next=%2Faccount%2Fsaved');

  const refs = await listSaved(visitor.accessToken);
  const found = await Promise.all(refs.slice(0, SHOW_MAX).map((r) => getOpportunity(r.category as CategorySlug, r.slug)));
  const items = found.flatMap((o) => (o ? [o] : []));
  const gone = Math.min(refs.length, SHOW_MAX) - items.length;

  return (
    <>
      <PageHeader eyebrow="Your account" title="My saved">
        <p>The opportunities you have saved, newest first. Always check the official page for the latest deadline before you apply.</p>
      </PageHeader>
      <section className="section section--list">
        <div className="container">
          {items.length === 0 ? (
            <div className="acct-empty">
              <h2 className="acct-empty__title">Nothing saved yet</h2>
              <p>Tap the heart on any opportunity to keep it here.</p>
              <p>
                <Link className="btn btn--primary" href="/scholarships">
                  Browse scholarships
                </Link>
              </p>
            </div>
          ) : (
            <>
              <p className="results-count">
                {items.length} saved {items.length === 1 ? 'opportunity' : 'opportunities'}
              </p>
              <ul className="grid">
                {items.map((item) => (
                  <li key={`${item.category}/${item.slug}`}>
                    {item.category === 'events' ? (
                      <EventCard item={item} />
                    ) : item.category === 'student-offers' ? (
                      <OfferCard item={item} />
                    ) : (
                      <OpportunityCard item={item} showCategory />
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
          {gone > 0 ? (
            <p className="acct-note">
              {gone} saved {gone === 1 ? 'item is' : 'items are'} no longer listed, so {gone === 1 ? 'it is' : 'they are'} not shown here.
            </p>
          ) : null}
          {refs.length > SHOW_MAX ? <p className="acct-note">Showing your newest {SHOW_MAX} saved opportunities.</p> : null}
          <AccountActions email={visitor.user.email} />
        </div>
      </section>
    </>
  );
}
