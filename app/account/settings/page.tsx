import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AccountActions from '../../../components/account/AccountActions';
import Avatar from '../../../components/account/Avatar';
import { initialsOf } from '../../../lib/account/initials';
import CookieSettingsLink from '../../../components/CookieSettingsLink';
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
            <p>Your profile, your password and where you are signed in.</p>
          </div>
        </div>
      </section>
      <section className="section section--list">
        <div className="container">
          <AccountTabs current="settings" />
          <div className="set">
            <div className="set-id">
              <Avatar src={visitor.user.avatar ?? ''} initials={initialsOf(visitor.user.name, visitor.user.email)} size="xl" />
              <div className="set-id__text">
                <p className="set-id__name">{visitor.user.name || 'Your account'}</p>
                <p className="set-id__mail">{visitor.user.email}</p>
              </div>
            </div>

            <SettingsForms email={visitor.user.email} name={visitor.user.name} />

            <section className="set-sec" id="sessions" aria-labelledby="set-sessions">
              <div className="set-sec__head">
                <h2 id="set-sessions">Sessions</h2>
                <p>Control where you are signed in.</p>
              </div>
              <AccountActions part="sessions" />
            </section>

            <section className="set-sec" id="privacy" aria-labelledby="set-privacy">
              <div className="set-sec__head">
                <h2 id="set-privacy">Privacy</h2>
                <p>What we keep, and the choices you have.</p>
              </div>
              <div className="set-card">
                <ul className="set-links">
                  <li><a href="/privacy">Privacy policy</a></li>
                  <li><a href="/terms">Terms of use</a></li>
                  <li><CookieSettingsLink /></li>
                  <li><a href="/support">Help and contact</a></li>
                </ul>
              </div>
            </section>

            <section className="set-sec set-sec--danger" id="delete" aria-labelledby="set-delete">
              <div className="set-sec__head">
                <h2 id="set-delete">Delete account</h2>
                <p>Permanent. Please read before you continue.</p>
              </div>
              <AccountActions part="delete" />
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
