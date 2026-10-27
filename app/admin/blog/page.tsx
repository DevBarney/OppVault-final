import Link from 'next/link';
import BlogEditor from '../../../components/admin/BlogEditor';
import ChangePassword from '../../../components/admin/ChangePassword';
import SignOutButton from '../../../components/admin/SignOutButton';
import { requireSession } from '../../../lib/admin/session';

export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const session = await requireSession();
  const owner = session.role === 'owner';
  return (
    <section className="adm__wrap">
      <header className="adm__head">
        <div>
          <p className="adm__eyebrow">OppVault admin</p>
          <h1 className="adm__h1">{owner ? 'Blog posts' : 'Write for the OppVault blog'}</h1>
        </div>
        <div className="adm__actions">
          {owner ? <Link className="adm__ghost adm__linkbtn" href="/admin">Back to admin</Link> : null}
          <SignOutButton />
        </div>
      </header>
      <div className="adm__panel">
        <p className="adm__muted">
          {owner
            ? 'Write and publish posts, check what your writers have sent for review, and take posts offline.'
            : 'Write a draft, preview it, then send it for review. The owner checks it and publishes it. You can edit and delete your own posts until they go live.'}
        </p>
        <BlogEditor role={session.role} />
      </div>
      {owner ? null : (
        <div className="adm__panel">
          <h2 className="adm__h2">Change your password</h2>
          <ChangePassword />
        </div>
      )}
    </section>
  );
}
