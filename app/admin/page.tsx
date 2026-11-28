import Importer from '../../components/admin/Importer';
import Mailing from '../../components/admin/Mailing';
import Manager from '../../components/admin/Manager';
import Reviews from '../../components/admin/Reviews';
import Submissions from '../../components/admin/Submissions';
import SignOutButton from '../../components/admin/SignOutButton';
import { dbConfigured } from '../../lib/admin/db';
import ListingForm from '../../components/admin/ListingForm';
import { countPendingSubmissions } from '../../lib/admin/listing';
import { KINDS } from '../../lib/admin/kinds';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Team from '../../components/admin/Team';
import { requireSession } from '../../lib/admin/session';
import { getDuplicates, getOverview, getQueue } from '../../lib/admin/board';
import { listProblemLinks } from '../../lib/admin/linkcheck';
import { AdminTabs, DuplicatesPanel, LinksTab, OverviewTab, isTab, type TabId } from '../../components/admin/BoardPanels';

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await requireSession();
  if (session.role !== 'owner') redirect('/admin/blog');
  const connected = dbConfigured();
  const { tab: rawTab } = await searchParams;
  const tab: TabId = isTab(rawTab) ? rawTab : 'overview';
  const [pending, overview] = connected ? await Promise.all([countPendingSubmissions(), getOverview()]) : [0, null];
  const waiting = overview ? overview.pending_submissions + overview.pending_reviews : pending;
  return (
    <section className="adm__wrap adm__wrap--board">
      <header className="adm__head">
        <div>
          <p className="adm__eyebrow">OppVault admin</p>
          <h1 className="adm__h1">Admin board</h1>
        </div>
        <div className="adm__actions">
          <SignOutButton />
        </div>
      </header>

      {connected ? null : (
        <p className="adm__notice adm__notice--warn">
          The database is not connected for writing yet. You can still check files and download templates. To import, add{' '}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> in Vercel (Supabase dashboard, Project settings, API keys, secret key) and redeploy.
        </p>
      )}

      <AdminTabs active={tab} badges={{ queue: waiting, links: overview?.links.broken ?? 0 }} />

      {pending > 0 ? (
        <p className="adm__notice adm__notice--warn" role="status">
          {pending} visitor {pending === 1 ? 'suggestion is' : 'suggestions are'} waiting for review. <Link className="adm__link" href="/admin?tab=queue#suggestions">Review {pending === 1 ? 'it' : 'them'}</Link>
        </p>
      ) : null}

      {tab === 'overview' ? (
        overview ? (
          <OverviewTab o={overview} queue={await getQueue()} />
        ) : (
          <p className="adm__notice adm__notice--warn">The overview needs the database connection.</p>
        )
      ) : null}

      {tab === 'listings' ? (
        <>
      <div className="adm__panel">
        <h2 className="adm__h2">Upload a CSV</h2>
        <p className="adm__muted">
          Pick what you are uploading, download the template, fill it in (Excel or Google Sheets, then save as CSV), and upload it. The
          file is checked first and nothing is saved until you press Import. Uploading the same <b>opportunity_id</b> again updates that
          listing instead of creating a duplicate.
        </p>
        <Importer kinds={KINDS} canImport={connected} />
      </div>

      <div className="adm__panel" id="add-one">
        <h2 className="adm__h2">Add one listing</h2>
        <p className="adm__muted">
          Type in a single scholarship, fellowship, grant, course, event or student offer. It is checked by the same rules as a CSV row. If the title or
          the official link is already listed, you are warned before anything is saved.
        </p>
        <ListingForm canSave={connected} />
      </div>

      <div className="adm__panel">
        <h2 className="adm__h2">Manage what is live</h2>
        <p className="adm__muted">Hide a listing without deleting it, show it again, or remove it for good.</p>
        <Manager kinds={KINDS} />
      </div>

          <DuplicatesPanel dup={connected ? await getDuplicates() : null} />
      <div className="adm__panel">
        <h2 className="adm__h2">Column guide</h2>
        <ul className="adm__list">
          <li><b>opportunity_id</b>: your own reference for the listing (any text, no duplicates). Optional; the title is used if empty.</li>
          <li><b>title</b> (or course_name) and <b>link</b> (or course_link, url): required. The link must start with https://.</li>
          <li><b>image_url</b> (or thumbnail): a direct https link to a picture. Optional.</li>
          <li><b>coupon_code</b>: shown on the listing page. Optional.</li>
          <li><b>summary</b>, <b>description</b>, <b>provider</b>, <b>location</b>, <b>level</b>, <b>funding</b> (or cost) are optional.</li>
          <li><b>deadline</b>: 2026-12-31 or 31/12/2026. Leave empty for rolling or no fixed date.</li>
          <li><b>eligibility</b>, <b>benefits</b>, <b>how_to_apply</b>: separate several items with a | character.</li>
          <li><b>featured</b>, <b>published</b>: yes or no. Published defaults to yes; use no to upload a draft.</li>
        </ul>
        <p className="adm__muted">Only add real listings you have checked against the official source. Invented ones should never be uploaded.</p>
      </div>
        </>
      ) : null}

      {tab === 'queue' ? (
        <>
      <div className="adm__panel" id="suggestions">
        <h2 className="adm__h2">Suggestions from visitors</h2>
        <p className="adm__muted">
          People can suggest opportunities at <code>/submit</code>. Open the official link and check it is genuine before you approve.
          Use Review and edit to fix or add details before approving. Approve and publish sends it live as it is; Approve as draft keeps it hidden; rejecting keeps a record. Nothing goes live by itself.
        </p>
        <Submissions pending={pending} />
      </div>

      <div className="adm__panel" id="reviews">
        <h2 className="adm__h2">Reviews from visitors</h2>
        <p className="adm__muted">
          People can leave a review at <code>/reviews</code>. Nothing appears on the website until you approve it. Rejecting a review also removes its photo.
        </p>
        <Reviews />
      </div>

        </>
      ) : null}

      {tab === 'links' ? (
        overview ? (
          <LinksTab o={overview} broken={await listProblemLinks('broken')} unsure={await listProblemLinks('unsure')} />
        ) : (
          <p className="adm__notice adm__notice--warn">Link health needs the database connection.</p>
        )
      ) : null}

      {tab === 'email' ? (
        <>
      <div className="adm__panel">
        <h2 className="adm__h2">Email your subscribers</h2>
        <p className="adm__muted">
          Write an email, preview it, send yourself a test, then send it to one batch of up to 1,000 subscribers at a time. People who unsubscribe are skipped
          automatically and every email carries an unsubscribe link.
        </p>
        <Mailing />
      </div>

        </>
      ) : null}

      {tab === 'blog' ? (
        <>
      <div className="adm__panel">
        <h2 className="adm__h2">Blog posts and writers</h2>
        <p className="adm__muted">
          Write a single post here, or give a team member a writer account. Writers can only write drafts and send them to you for review. You publish.
          (To upload many posts at once, use section 1 with the Blog posts type.)
        </p>
        <p><Link className="adm__link" href="/admin/blog">Open the blog editor</Link></p>
        <Team />
      </div>

        </>
      ) : null}
    </section>
  );
}
