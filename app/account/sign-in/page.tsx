import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AuthForm from '../../../components/account/AuthForm';
import { accountsConfigured, safeNext } from '../../../lib/account/config';
import { currentVisitor } from '../../../lib/account/server';
import '../../../components/account/account.css';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to OppVault to save opportunities and find them again in one place.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; save?: string; mode?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const visitor = await currentVisitor();
  if (visitor === 'refresh') redirect(`/api/account/refresh?next=${encodeURIComponent(next)}`);
  if (visitor) redirect(next);

  return (
    <section className="acct-page">
      <div className="container">
        {accountsConfigured ? (
          <AuthForm next={next} save={typeof sp.save === 'string' ? sp.save : null} startOn={sp.mode === 'signup' ? 'signup' : 'signin'} />
        ) : (
          <div className="acct-card acct-card--narrow">
            <h1 className="acct-title">Accounts open soon</h1>
            <p className="acct-lead">Saving opportunities is not switched on yet. Please check back shortly.</p>
          </div>
        )}
      </div>
    </section>
  );
}
