import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import AccountTabs from '../../../components/account/AccountTabs';
import MarkApplied, { type SavedPick } from '../../../components/account/MarkApplied';
import Tracker, { type TrackRow } from '../../../components/account/Tracker';
import VaultDoor from '../../../components/VaultDoor';
import { listTracked } from '../../../lib/account/applied';
import { listSaved } from '../../../lib/account/saved';
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

  const [allTracked, saved] = await Promise.all([listTracked(visitor.accessToken), listSaved(visitor.accessToken)]);
  // Live applications first, finished ones (not selected, withdrawn) after, each group keeping its newest-first order.
  const finished = (st: string) => st === 'not_selected' || st === 'withdrawn';
  const tracked = [...allTracked.filter((t) => !finished(t.status)), ...allTracked.filter((t) => finished(t.status))].slice(0, SHOW_MAX);
  const have = new Set(allTracked.map((t) => `${t.category}/${t.slug}`));
  const notYet = saved.filter((r) => !have.has(`${r.category}/${r.slug}`));
  const pickFound = await Promise.all(notYet.slice(0, 5).map((r) => getOpportunity(r.category as CategorySlug, r.slug)));
  const picks: SavedPick[] = pickFound.flatMap((o) => (o ? [{ category: o.category, slug: o.slug, title: o.title, provider: o.provider }] : []));
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
          <p className="acct-note acct-note--lead">The status, date and note are yours. They are not confirmed by the provider, so always check the official page for the real outcome.</p>
          {picks.length > 0 ? <MarkApplied picks={picks} more={Math.max(0, notYet.length - picks.length)} /> : null}
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
