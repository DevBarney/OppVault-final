import type { Metadata } from 'next';
import { withSocial } from '../../lib/seo';
import { CONTACT } from '../../lib/config';
import { ANALYTICS_AVAILABLE } from '../../lib/analytics';

export const metadata: Metadata = withSocial({
  title: 'Privacy notice',
  description: 'What OppVault collects when you subscribe to updates, why, and how to change your mind.',
  alternates: { canonical: '/privacy' },
});

export default function PrivacyPage() {
  return (
    <div className="privacy">
      <div className="container prose">
        <a className="prose__back" href="/">
          Back to OppVault
        </a>
        <h1>Privacy notice</h1>
        <p className="prose__meta">Last updated 5 November 2026</p>

        <p>
          This page explains what happens to your details when you subscribe to updates on OppVault.
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
          This site does not use advertising trackers. See Cookies below for the cookies it does set. Our hosting provider receives technical
          details such as your IP address when you load the page, which it needs in order to serve the page and to limit
          abuse.
        </p>

        <h2 id="cookies">Cookies</h2>
        {ANALYTICS_AVAILABLE ? (
          <p>
            OppVault uses the cookies it needs to work, and Google Analytics only if you allow it. We do not use advertising cookies. Analytics is off until
            you choose &ldquo;Accept all&rdquo; or switch it on in the cookie settings, and nothing is sent to Google before then. When it is on, Google
            receives page views and technical details such as your approximate location and device, so we can see which pages are useful. We turn off
            advertising features and Google signals, and your IP address is not stored in full. You can switch it off again at any time.
          </p>
        ) : (
          <p>
            OppVault uses only the cookies it needs. We do not use advertising cookies, and we do not use analytics cookies at the moment. If we add
            analytics later, it will stay off unless you turn it on in the cookie settings.
          </p>
        )}
        <ul>
          <li>
            <strong>ov_at and ov_rt</strong>: keep you signed in if you create an account. They are set only when you sign in, are not readable by page
            scripts, and the longer one lasts up to 30 days.
          </li>
          <li>
            <strong>ov_s</strong>: a small marker that says a sign-in may exist, so signed-out visitors do not make needless requests. It holds no personal
            details and lasts up to 30 days.
          </li>
          <li>
            <strong>ov_consent</strong>: remembers your cookie choice for 180 days.
          </li>
          {ANALYTICS_AVAILABLE ? (
            <li>
              <strong>_ga and _ga_ followed by letters</strong>: set by Google Analytics, only if you allow analytics. They tell visits apart and last up to
              2 years. Switching analytics off removes them.
            </li>
          ) : null}
          <li>
            <strong>oppvault_admin</strong>: used only by the people who run OppVault, to sign in to the admin area. Visitors never receive it.
          </li>
        </ul>
        <p>
          You can change your choice at any time with &ldquo;Cookie settings&rdquo; in the footer. You can also clear cookies in your browser, which signs you
          out.
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
    </div>
  );
}
