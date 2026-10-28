import type { Metadata } from 'next';
import { withSocial } from '../../lib/seo';
import PageHeader from '../../components/PageHeader';
import SubmitForm from '../../components/SubmitForm';
import './submit.css';

export const metadata: Metadata = withSocial({
  title: 'Suggest an opportunity',
  description: 'Know a scholarship, fellowship, grant, course, event or student offer that others should see? Send it to OppVault for review.',
  alternates: { canonical: '/submit' },
});

export default function SubmitPage() {
  return (
    <>
      <PageHeader eyebrow="Share what you know" title="Suggest an opportunity">
        <p>Found something worth sharing? Send it to us. We check every suggestion against the official source before it is published.</p>
      </PageHeader>
      <section className="section section--list">
        <div className="container sub">
          <p className="sub__intro">
            Please only send opportunities from official sources, and include the official link. We do not publish anything we cannot
            verify. We never promise that a listing will be published, and we will only use your email to ask about your suggestion.
          </p>
          <SubmitForm />
        </div>
      </section>
    </>
  );
}
