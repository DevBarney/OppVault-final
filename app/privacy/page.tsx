import type { Metadata } from 'next';
import { CONTACT } from '../../lib/config';

export const metadata: Metadata = {
  title: 'Privacy notice | OppVault',
  description: 'What OppVault collects when you subscribe to updates, why, and how to change your mind.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main id="main">
      <div className="container prose">
        <a className="prose__back" href="/">
          Back to OppVault
        </a>
        <h1>Privacy notice</h1>
        <p className="prose__meta">Last updated 24 October 2026</p>

        <p>
          This page explains what happens to your details when you subscribe to updates on the OppVault preview page.
          It is written to be read, so we have kept it short.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>The email address you enter in the sign-up form.</li>
          <li>
            If you arrived through a tagged link (for example from one of our social posts), a short tag such as
            &ldquo;instagram&rdquo;, so we can see which posts bring people in.
          </li>
        </ul>
        <p>
          This page does not use advertising trackers or analytics cookies. Our hosting provider receives technical
          details such as your IP address when you load the page, which it needs in order to serve the page and to limit
          abuse.
        </p>

        <h2>Why we collect it</h2>
        <p>
          To email you about OppVault: news about the launch, how the platform is progressing, and when it opens. We do
          not sell your details.
        </p>

        <h2>Who handles it</h2>
        <p>
          Your email address is stored with the email service we use to send updates. That service handles it on our
          behalf and only for this purpose.
        </p>

        <h2>The WhatsApp community</h2>
        <p>
          Joining the WhatsApp community is optional and happens inside WhatsApp, under WhatsApp&rsquo;s own terms and
          privacy policy. Depending on your WhatsApp settings, other members may be able to see your name or phone
          number.
        </p>

        <h2>Your choices</h2>
        <ul>
          <li>Every email we send includes a way to unsubscribe.</li>
          <li>
            To see, correct or delete the details we hold about you, email{' '}
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
          </li>
        </ul>
        <p>We keep your email address until you unsubscribe or ask us to remove it.</p>

        <h2>Changes</h2>
        <p>
          OppVault is still being built, so this notice may change. We will update the date above when it does.
        </p>
      </div>
    </main>
  );
}
