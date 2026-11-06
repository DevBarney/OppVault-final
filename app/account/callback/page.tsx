import type { Metadata } from 'next';
import CallbackClient from '../../../components/account/CallbackClient';
import '../../../components/account/account.css';

export const metadata: Metadata = { title: 'Signing in', robots: { index: false, follow: false } };

export default function CallbackPage() {
  return (
    <section className="acct-auth-page">
      <div className="hero__aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="container acct-auth-page__in">
        <CallbackClient />
      </div>
    </section>
  );
}
