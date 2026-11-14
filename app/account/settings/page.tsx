import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AccountActions from '../../../components/account/AccountActions';
import AccountTabs from '../../../components/account/AccountTabs';
import SettingsForms from '../../../components/account/SettingsForms';
import { currentVisitor } from '../../../lib/account/server';
import '../../../components/account/account.css';

export const metadata: Metadata = { title: 'Account settings', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const visitor = await currentVisitor();
  if (visitor === 'refresh') redirect('/api/account/refresh?next=%2Faccount%2Fsettings');
  if (!visitor) redirect('/account/sign-in?next=%2Faccount%2Fsettings');

  return (
    <>
      <section className="phead acct-shero">
        <div className="hero__aurora" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="container phead__inner">
          <p className="phead__eyebrow">Your account</p>
          <h1 className="phead__title">Settings</h1>
          <div className="phead__text">
            <p>Your name, your password and where you are signed in.</p>
          </div>
        </div>
      </section>
      <section className="section section--list">
        <div className="container">
          <AccountTabs current="settings" />
          <div className="set">
            <SettingsForms email={visitor.user.email} name={visitor.user.name} />
            <AccountActions email={visitor.user.email} />
          </div>
        </div>
      </section>
    </>
  );
}
