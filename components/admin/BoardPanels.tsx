import Link from 'next/link';
import { CATEGORIES } from '../../lib/categories';
import { daysUntil, formatDate } from '../../lib/dates';
import type { Duplicates, Overview, Queue, QueueItem } from '../../lib/admin/board';
import type { BrokenLink } from '../../lib/admin/linkcheck';
import LinkCheckButton from './LinkCheckButton';
import ListingRows, { type Row } from './ListingRows';

export type TabId = 'overview' | 'listings' | 'queue' | 'links' | 'email' | 'blog';

const TAB_DEFS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'listings', label: 'Listings' },
  { id: 'queue', label: 'Review queue' },
  { id: 'links', label: 'Link health' },
  { id: 'email', label: 'Email' },
  { id: 'blog', label: 'Blog' },
];

export function isTab(v: unknown): v is TabId {
  return typeof v === 'string' && TAB_DEFS.some((t) => t.id === v);
}

const nf = new Intl.NumberFormat('en-GB');
const catLabel = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;

export function AdminTabs({ active, badges }: { active: TabId; badges: Partial<Record<TabId, number>> }) {
  return (
    <nav className="adm__tabs" aria-label="Admin sections">
      {TAB_DEFS.map((t) => (
        <Link key={t.id} href={t.id === 'overview' ? '/admin' : `/admin?tab=${t.id}`} className={`adm__tab${active === t.id ? ' is-on' : ''}`} aria-current={active === t.id ? 'page' : undefined}>
          {t.label}
          {badges[t.id] ? <span className="adm__badge">{badges[t.id]}</span> : null}
        </Link>
      ))}
      <Link href="/admin/impact" className="adm__tab">
        Impact
      </Link>
    </nav>
  );
}

function Tile({ label, value, note, href, tone }: { label: string; value: number | string; note?: string; href?: string; tone?: 'warn' | 'bad' | 'good' }) {
  const inner = (
    <>
      <span className="adm__tile-name">{label}</span>
      <span className="adm__tile-num">{typeof value === 'number' ? nf.format(value) : value}</span>
      {note ? <span className="adm__tile-note">{note}</span> : null}
    </>
  );
  const cls = `adm__tile${tone ? ` adm__tile--${tone}` : ''}`;
  return href ? (
    <Link className={cls} href={href}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

const toRow = (q: QueueItem): Row => ({ id: q.id, title: q.title, meta: `${catLabel(q.category)} | ${q.provider} | closed ${formatDate(q.deadline)}`, href: `/${q.category}/${q.slug}` });

export function OverviewTab({ o, queue }: { o: Overview; queue: Queue | null }) {
  const closing = queue?.closing ?? [];
  const expired = queue?.expired ?? [];
  const max = Math.max(1, ...o.by_category.map((c) => c.n));
  return (
    <>
      <div className="adm__tiles">
        <Tile label="Live on the website" value={o.published} note={`${nf.format(o.open)} open to apply`} />
        <Tile label="Closing in 7 days" value={o.closing7} note="See the list below" href="#closing" tone={o.closing7 > 0 ? 'warn' : undefined} />
        <Tile label="Live after the deadline" value={o.expired_live} note={o.expired_live > 0 ? 'Hide or update these' : 'Nothing out of date'} href="#expired" tone={o.expired_live > 0 ? 'bad' : 'good'} />
        <Tile label="Waiting for review" value={o.pending_submissions + o.pending_reviews} note={`${o.pending_submissions} suggestions, ${o.pending_reviews} reviews`} href="/admin?tab=queue" tone={o.pending_submissions + o.pending_reviews > 0 ? 'warn' : undefined} />
        <Tile label="Broken links" value={o.links.broken} note={o.links.waiting > 0 ? `${nf.format(o.links.waiting)} not checked yet` : `${nf.format(o.links.unsure)} need a look`} href="/admin?tab=links" tone={o.links.broken > 0 ? 'bad' : undefined} />
        <Tile label="Hidden drafts" value={o.drafts} note="Not on the website" href="/admin?tab=listings" />
      </div>

      <div className="adm__panel">
        <h2 className="adm__h2">What is live, by category</h2>
        <ul className="adm__bars">
          {o.by_category.map((c) => (
            <li key={c.category}>
              <span className="adm__bars-name">{catLabel(c.category)}</span>
              <span className="adm__bars-track" aria-hidden="true">
                <span className="adm__bars-fill" style={{ width: `${Math.max(2, Math.round((c.n / max) * 100))}%` }} />
              </span>
              <span className="adm__bars-n">{nf.format(c.n)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="adm__panel" id="closing">
        <h2 className="adm__h2">Closing in the next 7 days</h2>
        <p className="adm__muted">These are the listings people should hear about now. Share them on WhatsApp or feature them before they close.</p>
        {closing.length === 0 ? (
          <p className="adm__notice adm__notice--ok">Nothing closes in the next week.</p>
        ) : (
          <ul className="adm__rows adm__rows--plain">
            {closing.map((q) => {
              const d = daysUntil(q.deadline);
              return (
                <li key={q.id}>
                  <div className="adm__rowmain">
                    <a className="adm__rowtitle adm__link" href={`/${q.category}/${q.slug}`} target="_blank" rel="noreferrer">
                      {q.title}
                    </a>
                    <span className="adm__rowmeta">{`${catLabel(q.category)} | ${q.provider}`}</span>
                  </div>
                  <span className={`adm__due${d !== null && d <= 2 ? ' adm__due--hot' : ''}`}>{d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `${d} days`}</span>
                </li>
              );
            })}
          </ul>
        )}
        {o.closing7 > closing.length ? <p className="adm__muted">Showing the {closing.length} closing soonest, of {nf.format(o.closing7)}.</p> : null}
      </div>

      <div className="adm__panel" id="expired">
        <h2 className="adm__h2">Still live after the deadline</h2>
        <p className="adm__muted">
          The website already marks these as closed, but they still take space in the lists and the search. Hide them, or fix the date if the deadline was extended (Listings tab, Manage what is live).
        </p>
        <ListingRows rows={expired.map(toRow)} empty="No listing is live past its deadline." bulkLabel="Hide all shown" />
        {o.expired_live > expired.length ? <p className="adm__muted">Showing the {expired.length} most recent, of {nf.format(o.expired_live)}. Hide these, then reload for the next ones.</p> : null}
      </div>
    </>
  );
}

export function LinksTab({ o, broken, unsure }: { o: Overview; broken: BrokenLink[]; unsure: BrokenLink[] }) {
  const toLinkRow = (b: BrokenLink): Row => ({
    id: b.opportunity_id,
    title: b.opportunities.title,
    meta: `${catLabel(b.opportunities.category)} | ${b.opportunities.provider}`,
    href: `/${b.opportunities.category}/${b.opportunities.slug}`,
    note: `${b.detail} (checked ${formatDate(b.checked_at.slice(0, 10))})`,
    external: b.url,
  });
  const total = o.links.ok + o.links.broken + o.links.unsure;
  return (
    <>
      <div className="adm__tiles">
        <Tile label="Links that open" value={o.links.ok} tone="good" />
        <Tile label="Broken" value={o.links.broken} tone={o.links.broken > 0 ? 'bad' : undefined} note="Page gone or site missing" />
        <Tile label="Need a look" value={o.links.unsure} note="Site refuses robots, or slow" />
        <Tile label="Not checked yet" value={o.links.waiting} note={total === 0 ? 'Nothing checked so far' : undefined} />
      </div>

      <div className="adm__panel">
        <h2 className="adm__h2">Check the official links</h2>
        <p className="adm__muted">
          Every night the oldest-checked links are opened to see whether the page still exists. Nothing on the website changes by itself: broken listings stay live until you hide them here.{' '}
          {o.links.last_checked ? `Last check: ${formatDate(o.links.last_checked.slice(0, 10))}.` : 'No check has run yet.'}
        </p>
        <LinkCheckButton waiting={o.links.waiting} />
      </div>

      <div className="adm__panel">
        <h2 className="adm__h2">Broken links</h2>
        <p className="adm__muted">Open the link to confirm, then hide the listing or fix the link (Listings tab). Courses are the most likely to expire.</p>
        <ListingRows rows={broken.map(toLinkRow)} empty={total === 0 ? 'No check has run yet. Press Check links now.' : 'No broken links found.'} />
      </div>

      <details className="adm__panel adm__fold">
        <summary className="adm__h2">Needs a look ({unsure.length})</summary>
        <p className="adm__muted">Many sites block automatic checks even when the page is fine. Open a few to see; hide only what is really gone.</p>
        <ListingRows rows={unsure.map(toLinkRow)} empty="Nothing here." />
      </details>
    </>
  );
}

export function DuplicatesPanel({ dup }: { dup: Duplicates | null }) {
  return (
    <div className="adm__panel" id="duplicates">
      <h2 className="adm__h2">Possible duplicates</h2>
      <p className="adm__muted">Live listings that share the same official link or the same title in one category. Keep the best one and hide the rest. The oldest is listed first.</p>
      {!dup || dup.groups.length === 0 ? (
        <p className="adm__notice adm__notice--ok">No duplicates found.</p>
      ) : (
        <>
          <p className="adm__muted">{nf.format(dup.total)} groups found{dup.total > dup.groups.length ? `, showing the first ${dup.groups.length}` : ''}.</p>
          <div className="adm__stack">
            {dup.groups.map((g) => (
              <div key={`${g.reason}:${g.key}`} className="adm__sub">
                <p className="adm__subtitle">{g.reason}</p>
                <p className="adm__muted adm__break">{g.key}</p>
                <ListingRows
                  rows={g.items.map((i) => ({
                    id: i.id,
                    title: i.title,
                    meta: `${catLabel(i.category)} | ${i.provider} | ${i.deadline ? `closes ${formatDate(i.deadline)}` : 'rolling'}`,
                    href: `/${i.category}/${i.slug}`,
                  }))}
                  empty="All hidden."
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
