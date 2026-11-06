import type { Metadata } from 'next';
import { withSocial } from '../../lib/seo';
import { CONTACT } from '../../lib/config';
import { ANALYTICS_AVAILABLE } from '../../lib/analytics';
import LegalLayout from '../../components/legal/LegalLayout';
import type { LegalHighlight, LegalSection } from '../../components/legal/LegalLayout';

export const metadata: Metadata = withSocial({
  title: 'Privacy notice',
  description: 'What OppVault collects when you browse, subscribe, create an account or leave a review, why, and how to change your mind.',
  alternates: { canonical: '/privacy' },
});

const HIGHLIGHTS: LegalHighlight[] = [
  { icon: 'shield', title: 'We do not sell your details', text: 'Your information is used to run OppVault, not to sell to anyone.' },
  { icon: 'cookie', title: 'No advertising cookies', text: ANALYTICS_AVAILABLE ? 'Analytics stays off until you say yes.' : 'We only use the cookies the site needs to work.' },
  { icon: 'mail', title: 'Unsubscribe in one tap', text: 'Every email we send has an unsubscribe link.' },
  { icon: 'user', title: 'Delete it yourself', text: 'You can delete your account and saved list from My saved.' },
];

const SECTIONS: LegalSection[] = [
  {
    id: 'collect',
    title: 'What we collect',
    icon: 'doc',
    body: (
      <>
        <ul>
          <li>The email address you enter in the sign-up form for updates.</li>
          <li>
            If you arrived through a tagged link (for example from one of our social posts), a short tag such as &ldquo;instagram&rdquo;, so we can see which
            posts bring people in.
          </li>
          <li>If you create an account: your email address, an optional name, and which sign-in method you used (email, Google, LinkedIn or X).</li>
          <li>What you do with an account: the opportunities you save and the ones you mark as applied for.</li>
          <li>If you leave a review: your name, your rating and review, and a photo if you add one.</li>
          <li>If you suggest an opportunity or write to us: what you send.</li>
        </ul>
        <p>
          This site does not use advertising trackers. Our hosting provider receives technical details such as your IP address when you load the page, which it
          needs in order to serve the page and to limit abuse.
        </p>
      </>
    ),
  },
  {
    id: 'why',
    title: 'Why we collect it',
    icon: 'check',
    body: (
      <ul>
        <li>To email you about OppVault, if you subscribed: news about the platform and new opportunities. We do not sell your details.</li>
        <li>To keep you signed in and to show your saved list and applied marks, if you have an account.</li>
        <li>To show your review on the site, only if you agreed to that when you wrote it.</li>
        <li>To keep the site safe and to understand which pages are useful.</li>
      </ul>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies',
    icon: 'cookie',
    body: (
      <>
        {ANALYTICS_AVAILABLE ? (
          <p>
            OppVault uses the cookies it needs to work, and Google Analytics only if you allow it. We do not use advertising cookies. Analytics is off until you
            choose &ldquo;Accept all&rdquo; or switch it on in the cookie settings, and nothing is sent to Google before then. When it is on, Google receives
            page views and technical details such as your approximate location and device, so we can see which pages are useful. We turn off advertising
            features and Google signals, and your IP address is not stored in full. You can switch it off again at any time.
          </p>
        ) : (
          <p>
            OppVault uses only the cookies it needs. We do not use advertising cookies, and we do not use analytics cookies at the moment. If we add analytics
            later, it will stay off unless you turn it on in the cookie settings.
          </p>
        )}
        <ul>
          <li>
            <strong>ov_at and ov_rt</strong>: keep you signed in if you create an account. They are set only when you sign in, are not readable by page scripts,
            and the longer one lasts up to 30 days.
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
              <strong>_ga and _ga_ followed by letters</strong>: set by Google Analytics, only if you allow analytics. They tell visits apart and last up to 2
              years. Switching analytics off removes them.
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
      </>
    ),
  },
  {
    id: 'handlers',
    title: 'Who handles it',
    icon: 'link',
    body: (
      <>
        <p>
          We use a few services to run OppVault, and they handle your details only on our behalf and only for this purpose: a database and sign-in provider that
          stores accounts, saved items and reviews, an email service that sends our updates, and our website host.
        </p>
        <p>
          If you sign in with Google, LinkedIn or X, that company tells us your email address and name, and handles your sign-in under its own privacy
          policy. We never see your password for those accounts. Passwords for email sign-ups are handled by our sign-in provider and are never stored by
          OppVault code.
        </p>
      </>
    ),
  },
  {
    id: 'whatsapp',
    title: 'The WhatsApp community',
    icon: 'chat',
    body: (
      <p>
        Joining the WhatsApp community is optional and happens inside WhatsApp, under WhatsApp&rsquo;s own terms and privacy policy. Depending on your WhatsApp
        settings, other members may be able to see your name or phone number.
      </p>
    ),
  },
  {
    id: 'choices',
    title: 'Your choices',
    icon: 'user',
    body: (
      <>
        <ul>
          <li>Every email we send includes a way to unsubscribe.</li>
          <li>You can delete your account and saved list for good from the My saved page.</li>
          <li>
            To see, correct or delete anything else we hold about you, including a review, email <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
          </li>
        </ul>
        <p>We keep your email address for updates until you unsubscribe or ask us to remove it, and we keep account details until you delete the account.</p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes',
    icon: 'refresh',
    body: <p>OppVault is still being built, so this notice may change. We will update the date at the top when it does.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      kind="Legal"
      title="Privacy notice"
      updated="6 November 2026"
      lead="What OppVault collects when you browse, subscribe, create an account or leave a review, why we collect it, and how to change your mind."
      highlights={HIGHLIGHTS}
      sections={SECTIONS}
      other={{ href: '/terms', label: 'Terms of use' }}
    />
  );
}
