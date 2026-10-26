import Importer from '../../components/admin/Importer';
import Manager from '../../components/admin/Manager';
import Submissions from '../../components/admin/Submissions';
import SignOutButton from '../../components/admin/SignOutButton';
import { dbConfigured } from '../../lib/admin/db';
import { KINDS } from '../../lib/admin/kinds';
import { requireAdmin } from '../../lib/admin/session';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await requireAdmin();
  const connected = dbConfigured();
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

      <div className="adm__panel">
        <h2 className="adm__h2">1. Upload a CSV</h2>
        <p className="adm__muted">
          Pick what you are uploading, download the template, fill it in (Excel or Google Sheets, then save as CSV), and upload it. The
          file is checked first and nothing is saved until you press Import. Uploading the same <b>opportunity_id</b> again updates that
          listing instead of creating a duplicate.
        </p>
        <Importer kinds={KINDS} canImport={connected} />
      </div>

      <div className="adm__panel">
        <h2 className="adm__h2">2. Manage what is live</h2>
        <p className="adm__muted">Hide a listing without deleting it, show it again, or remove it for good.</p>
        <Manager kinds={KINDS} />
      </div>

      <div className="adm__panel">
        <h2 className="adm__h2">3. Suggestions from visitors</h2>
        <p className="adm__muted">
          People can suggest opportunities at <code>/submit</code>. Open the official link and check it is genuine before you approve.
          Approving creates the listing (published or as a hidden draft); rejecting keeps a record; nothing goes live by itself.
        </p>
        <Submissions />
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
