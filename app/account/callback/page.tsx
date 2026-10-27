import type { Metadata } from 'next';
import CallbackClient from '../../../components/account/CallbackClient';
import '../../../components/account/account.css';

export const metadata: Metadata = { title: 'Signing in', robots: { index: false, follow: false } };

export default function CallbackPage() {
  return (
    <section className="acct-page">
      <div className="container">
        <CallbackClient />
      </div>
    </section>
  );
}
