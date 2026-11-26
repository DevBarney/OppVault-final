import Link from 'next/link';
import { redirect } from 'next/navigation';
import PrintButton from '../../../components/admin/PrintButton';
import { dbConfigured } from '../../../lib/admin/db';
import { change, getExtra, getImpact, getSubscribers, RANGES, rangeDays, type Counted, type Top, type Week } from '../../../lib/admin/impact';
import { requireSession } from '../../../lib/admin/session';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Impact report', robots: { index: false, follow: false } };

const CATEGORY: Record<string, string> = { scholarships: 'Scholarships', fellowships: 'Fellowships', internships: 'Internships', grants: 'Grants', courses: 'Courses', events: 'Events', 'student-offers': 'Student offers' };
const SOURCE: Record<string, string> = { site: 'Sign-up band and site buttons', footer: 'Footer', about: 'About page', save: 'After saving a listing', applied: 'After "I applied"', closing: 'Closing soonest view', email: 'Welcome email', newsletter: 'Newsletters', flyer: 'Flyer QR code', video: 'Videos', apply: 'After tapping Apply', share: 'Shared WhatsApp messages' };
const fmt = (n: number) => n.toLocaleString('en-GB');
const label = (c: string) => CATEGORY[c] ?? c;

function Tile({ name, total, period, previous, days, note }: { name: string; total: number; period: number; previous: number; days: number; note?: string }) {
  return (
    <div className="imp__tile">
      <p className="imp__tile-name">{name}</p>
      <p className="imp__tile-num">{fmt(total)}</p>
      <p className="imp__tile-sub">
        {fmt(period)} in the last {days} days. {change(period, previous)} on the period before.
      </p>
      {note ? <p className="imp__tile-note">{note}</p> : null}
    </div>
  );
}

/** One small bar chart per measure, 12 weeks, drawn on the server as an SVG. */
function Bars({ title, weeks, pick }: { title: string; weeks: Week[]; pick: (w: Week) => number }) {
  const values = weeks.map(pick);
  const max = Math.max(1, ...values);
  const W = 480;
  const H = 150;
  const bw = W / values.length;
  const summary = `${title}, by week for the last ${weeks.length} weeks: ${weeks.map((w, i) => `${w.week} ${values[i]}`).join(', ')}.`;
  return (
    <figure className="imp__chart">
      <figcaption className="imp__chart-title">{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H + 22}`} role="img" aria-label={summary} className="imp__svg">
        {values.map((v, i) => {
          const h = Math.max(v > 0 ? 3 : 0, (v / max) * (H - 18));
          return (
            <g key={weeks[i].week}>
              <rect x={i * bw + 5} y={H - h} width={bw - 10} height={h} rx="3" className="imp__bar" />
              {v > 0 ? (
                <text x={i * bw + bw / 2} y={H - h - 5} textAnchor="middle" className="imp__val">{v}</text>
              ) : null}
              <text x={i * bw + bw / 2} y={H + 16} textAnchor="middle" className="imp__tick">{weeks[i].week.slice(8)}/{weeks[i].week.slice(5, 7)}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

function Table({ title, head, rows }: { title: string; head: [string, string]; rows: [string, number][] }) {
  return (
    <div className="imp__card">
      <h2 className="adm__h2">{title}</h2>
      {rows.length === 0 ? (
        <p className="adm__muted">Nothing recorded in this period yet.</p>
      ) : (
        <table className="imp__table">
          <thead>
            <tr><th scope="col">{head[0]}</th><th scope="col" className="imp__num">{head[1]}</th></tr>
          </thead>
          <tbody>
            {rows.map(([name, n]) => (
              <tr key={name}><th scope="row">{name}</th><td className="imp__num">{fmt(n)}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const byCategory = (rows: Counted[]): [string, number][] => rows.map((r) => [label(r.category), r.n]);
const topRows = (rows: Top[]): [string, number][] => rows.map((r) => [`${r.title} (${label(r.category)})`, r.n]);

export default async function ImpactPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const session = await requireSession();
  if (session.role !== 'owner') redirect('/admin/blog');
  const days = rangeDays((await searchParams).days);
  const [d, subs, extra] = await Promise.all([getImpact(days), getSubscribers(), getExtra(days)]);

  return (
    <section className="adm__wrap imp">
      <header className="adm__head">
        <div>
          <p className="adm__eyebrow">OppVault admin</p>
          <h1 className="adm__h1">Impact report</h1>
        </div>
        <div className="adm__actions imp__noprint">
          <Link className="adm__ghost imp__back" href="/admin">Back to admin</Link>
        </div>
      </header>

      {!dbConfigured() || !d ? (
        <p className="adm__notice adm__notice--warn">The numbers could not be loaded. Check that the database is connected, then refresh.</p>
      ) : (
        <>
          <div className="adm__actions imp__noprint imp__bar-row">
            <nav className="imp__ranges" aria-label="Period">
              {RANGES.map((r) => (
                <Link key={r.days} href={`/admin/impact?days=${r.days}`} className={`imp__range${r.days === days ? ' is-on' : ''}`} aria-current={r.days === days ? 'true' : undefined}>
                  {r.label}
                </Link>
              ))}
            </nav>
            <a className="adm__ghost imp__dl" href={`/api/admin/impact?days=${days}`}>Download spreadsheet (CSV)</a>
            <PrintButton />
          </div>
          <p className="adm__muted imp__asof">
            OppVault impact report, last {d.days} days. Generated {new Date(d.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' })}.
          </p>

          <div className="imp__tiles">
            <Tile name="Accounts created" {...d.accounts} days={days} />
            <Tile name="Listings saved" {...d.saves} days={days} note={`By ${fmt(d.saves.people)} ${d.saves.people === 1 ? 'person' : 'people'}.`} />
            <Tile name="Applications tracked" {...d.applied} days={days} note={`By ${fmt(d.applied.people)} ${d.applied.people === 1 ? 'person' : 'people'} marking "I applied".`} />
            <Tile name="Official site clicks" {...d.clicks} days={days} note="People sent on to the official application page." />
            {extra ? (
              <Tile
                name="People sent to an official page"
                {...extra.people}
                days={days}
                note={extra.people.first_day ? `Different people, counted once a day. Recorded since ${new Date(`${extra.people.first_day}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}. Account not needed.` : 'Different people, counted once a day. Account not needed. Counting has just started.'}
              />
            ) : null}
            <div className="imp__tile">
              <p className="imp__tile-name">WhatsApp group opens</p>
              <p className="imp__tile-num">{fmt(d.joins.total)}</p>
              <p className="imp__tile-sub">{fmt(d.joins.period)} in the last {days} days.</p>
            </div>
            <div className="imp__tile">
              <p className="imp__tile-name">Email subscribers</p>
              <p className="imp__tile-num">{subs ? fmt(subs.active) : 'Not available'}</p>
              <p className="imp__tile-sub">{subs ? `${fmt(subs.total - subs.active)} unsubscribed.` : 'Email is not connected.'}</p>
            </div>
          </div>

          <div className="imp__card">
            <h2 className="adm__h2">Week by week</h2>
            <p className="adm__muted">The last 12 weeks. Each bar is one week, labelled with the day it starts.</p>
            <div className="imp__charts">
              <Bars title="New accounts" weeks={d.weekly} pick={(w) => w.accounts} />
              <Bars title="Official site clicks" weeks={d.weekly} pick={(w) => w.clicks} />
              <Bars title="Applications tracked" weeks={d.weekly} pick={(w) => w.applied} />
              <Bars title="Listings saved" weeks={d.weekly} pick={(w) => w.saves} />
            </div>
          </div>

          {extra ? (
            <div className="imp__card">
              <h2 className="adm__h2">Month by month</h2>
              <p className="adm__muted">The last 12 months. "People" adds up the different people each day, so someone who returns on another day counts again.</p>
              <table className="imp__table">
                <thead>
                  <tr>
                    <th scope="col">Month</th>
                    <th scope="col" className="imp__num">Apply clicks</th>
                    <th scope="col" className="imp__num">People</th>
                    <th scope="col" className="imp__num">WhatsApp opens</th>
                    <th scope="col" className="imp__num">Accounts</th>
                    <th scope="col" className="imp__num">Saves</th>
                    <th scope="col" className="imp__num">Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {extra.monthly.map((m) => (
                    <tr key={m.month}>
                      <th scope="row">{new Date(`${m.month}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</th>
                      <td className="imp__num">{fmt(m.clicks)}</td>
                      <td className="imp__num">{fmt(m.people)}</td>
                      <td className="imp__num">{fmt(m.joins)}</td>
                      <td className="imp__num">{fmt(m.accounts)}</td>
                      <td className="imp__num">{fmt(m.saves)}</td>
                      <td className="imp__num">{fmt(m.applied)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="imp__grid">
            <Table title="Official site clicks by category" head={['Category', 'Clicks']} rows={byCategory(d.clicks_by_category)} />
            <Table title="Applications tracked by category" head={['Category', 'Applications']} rows={byCategory(d.applied_by_category)} />
            <Table title="Most clicked listings" head={['Listing', 'Clicks']} rows={topRows(d.top_clicked)} />
            <Table title="Most applied-to listings" head={['Listing', 'Applications']} rows={topRows(d.top_applied)} />
            <Table title="Where WhatsApp opens came from" head={['Source', 'Opens']} rows={d.joins.by_source.map((s): [string, number] => [SOURCE[s.src] ?? s.src, s.n])} />
            <Table title="Published listings" head={['Category', 'Listings']} rows={byCategory(d.listings.by_category)} />
          </div>

          <div className="imp__card">
            <h2 className="adm__h2">How to read these numbers</h2>
            <ul className="adm__list">
              <li>All figures are counts. Nothing here names a person, and it is safe to share the printed report or the spreadsheet.</li>
              <li>
                Official site clicks are recorded from {d.clicks.first_day ? new Date(`${d.clicks.first_day}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'the day tracking began'}. A click means someone was sent to the official page, not that they finished applying.
              </li>
              <li>Applications tracked are self-reported: a signed-in person tapped "I applied". The real number of applications is likely higher, because not everyone tracks.</li>
              <li>Accounts, saves and applications count people who created an account. Visitors without an account are counted only in official site clicks and WhatsApp opens.</li>
              <li>
                People sent to an official page are counted without an account, cookie or stored address. Each person gets a code that is made fresh every day and cannot be traced back, so the same person on two days counts twice. Read it as "person-days" of people helped.
              </li>
              <li>Visitors to the site (page views) are in the Vercel Analytics tab. Google Search Console shows how people find the site.</li>
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
