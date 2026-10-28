import Importer from '../../components/admin/Importer';
import Mailing from '../../components/admin/Mailing';
import Manager from '../../components/admin/Manager';
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

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await requireSession();
  if (session.role !== 'owner') redirect('/admin/blog');
  const connected = dbConfigured();
  const pending = connected ? await countPendingSubmissions() : 0;
  return (
    <section className="adm__wrap">
      <header className="adm__head">
        <div>
          <p className="adm__eyebrow">OppVault admin</p>
          <h1 className="adm__h1">Upload and manage content</h1>
        </div>
        <SignOutButton />
      </header>

      {connected ? null : (
        <p className="adm__notice adm__notice--warn">
          The database is not connected for writing yet. You can still check files and download templates. To import, add{' '}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> in Vercel (Supabase dashboard, Project settings, API keys, secret key) and redeploy.
        </p>
      )}

      {pending > 0 ? (
        <p className="adm__notice adm__notice--warn" role="status">
          {pending} visitor {pending === 1 ? 'suggestion is' : 'suggestions are'} waiting for review. <a className="adm__link" href="#suggestions">Review {pending === 1 ? 'it' : 'them'}</a>
        </p>
      ) : null}

      <div className="adm__panel">
        <h2 className="adm__h2">1. Upload a CSV</h2>
        <p className="adm__muted">
          Pick what you are uploading, download the template, fill it in (Excel or Google Sheets, then save as CSV), and upload it. The
          file is checked first and nothing is saved until you press Import. Uploading the same <b>opportunity_id</b> again updates that
          listing instead of creating a duplicate.
        </p>
        <Importer kinds={KINDS} canImport={connected} />
      </div>

      <div className="adm__panel" id="add-one">
        <h2 className="adm__h2">2. Add one listing</h2>
        <p className="adm__muted">
          Type in a single scholarship, fellowship, grant, course, event or student offer. It is checked by the same rules as a CSV row. If the title or
          the official link is already listed, you are warned before anything is saved.
        </p>
        <ListingForm canSave={connected} />
      </div>

      <div className="adm__panel">
        <h2 className="adm__h2">3. Manage what is live</h2>
        <p className="adm__muted">Hide a listing without deleting it, show it again, or remove it for good.</p>
        <Manager kinds={KINDS} />
      </div>

      <div className="adm__panel" id="suggestions">
        <h2 className="adm__h2">4. Suggestions from visitors</h2>
        <p className="adm__muted">
          People can suggest opportunities at <code>/submit</code>. Open the official link and check it is genuine before you approve.
          Use Review and edit to fix or add details before approving. Approve and publish sends it live as it is; Approve as draft keeps it hidden; rejecting keeps a record. Nothing goes live by itself.
        </p>
        <Submissions pending={pending} />
      </div>

      <div className="adm__panel">
        <h2 className="adm__h2">5. Email your subscribers</h2>
        <p className="adm__muted">
          Write an email, preview it, send yourself a test, then send it to one batch of up to 1,000 subscribers at a time. People who unsubscribe are skipped
          automatically and every email carries an unsubscribe link.
        </p>
        <Mailing />
      </div>

      <div className="adm__panel">
        <h2 className="adm__h2">6. Blog posts and writers</h2>
        <p className="adm__muted">
          Write a single post here, or give a team member a writer account. Writers can only write drafts and send them to you for review. You publish.
          (To upload many posts at once, use section 1 with the Blog posts type.)
        </p>
        <p><Link className="adm__link" href="/admin/blog">Open the blog editor</Link></p>
        <Team />
      </div>

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
    </section>
  );
}
