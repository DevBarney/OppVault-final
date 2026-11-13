import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import AccountTabs from '../../../components/account/AccountTabs';
import Tracker, { type TrackRow } from '../../../components/account/Tracker';
import VaultDoor from '../../../components/VaultDoor';
import { listTracked } from '../../../lib/account/applied';
import { currentVisitor } from '../../../lib/account/server';
import type { CategorySlug } from '../../../lib/categories';
import { getOpportunity } from '../../../lib/data';
import { daysUntil, formatDate } from '../../../lib/dates';
import '../../../components/account/account.css';

export const metadata: Metadata = { title: 'My applications', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const SHOW_MAX = 200;

export default async function ApplicationsPage() {
  const visitor = await currentVisitor();
  if (visitor === 'refresh') redirect('/api/account/refresh?next=%2Faccount%2Fapplications');
  if (!visitor) redirect('/account/sign-in?next=%2Faccount%2Fapplications');

  const tracked = (await listTracked(visitor.accessToken)).slice(0, SHOW_MAX);
  const found = await Promise.all(tracked.map((t) => getOpportunity(t.category as CategorySlug, t.slug)));
  const rows: TrackRow[] = tracked.map((t, i) => {
    const o = found[i];
    const d = o ? daysUntil(o.deadline) : null;
    return {
      category: t.category,
      slug: t.slug,
      title: o?.title ?? t.slug.replace(/-/g, ' '),
      provider: o?.provider ?? '',
      href: `/${t.category}/${t.slug}`,
      listed: Boolean(o),
      closes: o?.deadline ? (d !== null && d < 0 ? `Closed ${formatDate(o.deadline)}` : `Closes ${formatDate(o.deadline)}`) : '',
      status: t.status,
      applied_on: t.applied_on,
      note: t.note,
    };
  });

  return (
    <>
      <section className="phead acct-shero">
        <div className="hero__aurora" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="acct-shero__art" aria-hidden="true">
          <VaultDoor />
        </div>
        <div className="container phead__inner">
          <p className="phead__eyebrow">Your account</p>
          <h1 className="phead__title">My applications</h1>
          <div className="phead__text">
            <p>Keep track of what you have applied for and where each application stands. Only you can see this page.</p>
          </div>
        </div>
      </section>
      <section className="section section--list">
        <div className="container">
          <AccountTabs current="applications" />
          {rows.length === 0 ? (
            <div className="acct-empty">
              <h2 className="acct-empty__title">No applications yet</h2>
              <p>Open any opportunity and tap &ldquo;I applied&rdquo; once you have sent your application. It will appear here so you can follow it through.</p>
              <p>
                <Link className="btn btn--primary" href="/scholarships">Browse scholarships</Link>
              </p>
            </div>
          ) : (
            <Tracker rows={rows} />
          )}
          {tracked.length >= SHOW_MAX ? <p className="acct-note">Showing your newest {SHOW_MAX} applications.</p> : null}
        </div>
      </section>
    </>
  );
}
