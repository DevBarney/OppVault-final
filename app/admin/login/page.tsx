import { redirect } from 'next/navigation';
import LoginForm from '../../../components/admin/LoginForm';
import { adminConfigured } from '../../../lib/admin/auth';
import { isSignedIn } from '../../../lib/admin/session';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  if (await isSignedIn()) redirect('/admin');
  return (
    <section className="adm__login">
      <div className="adm__panel adm__panel--narrow">
        <p className="adm__eyebrow">OppVault admin</p>
        <h1 className="adm__h1">Sign in</h1>
        {adminConfigured() ? (
          <LoginForm />
        ) : (
          <p className="adm__notice adm__notice--warn">
            The admin area is not switched on yet. In Vercel, add an environment variable called <code>ADMIN_PASSWORD</code> (at least 12
            characters), then redeploy.
          </p>
        )}
      </div>
    </section>
  );
}
