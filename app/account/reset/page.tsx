import type { Metadata } from 'next';
import ResetClient from '../../../components/account/ResetClient';
import '../../../components/account/account.css';

export const metadata: Metadata = { title: 'Choose a new password', robots: { index: false, follow: false } };

export default function ResetPage() {
  return (
    <section className="acct-page">
      <div className="container">
        <ResetClient />
      </div>
    </section>
  );
}
