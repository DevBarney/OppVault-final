import type { Metadata } from 'next';
import { withSocial } from '../../lib/seo';
import { CONTACT } from '../../lib/config';
import LegalLayout from '../../components/legal/LegalLayout';
import type { LegalHighlight, LegalSection } from '../../components/legal/LegalLayout';

export const metadata: Metadata = withSocial({
  title: 'Terms of use',
  description: 'The plain-language rules for using OppVault: what we do, what we do not promise, and what we ask of you.',
  alternates: { canonical: '/terms' },
});

const HIGHLIGHTS: LegalHighlight[] = [
  { icon: 'doc', title: 'We inform, you decide', text: 'OppVault lists opportunities. We do not run them or choose who gets them.' },
  { icon: 'check', title: 'Check the source', text: 'Deadlines and rules change. Confirm on the official page before you apply.' },
  { icon: 'warn', title: 'Never pay us to win', text: 'We will never ask for money to help you get an opportunity.' },
  { icon: 'user', title: 'Leave any time', text: 'Delete your account whenever you like from My saved.' },
];

const SECTIONS: LegalSection[] = [
  {
    id: 'what',
    title: 'What OppVault is',
    icon: 'doc',
    body: (
      <p>
        OppVault is an information service. We gather scholarships, fellowships, grants, courses, events and student offers in one place, so they are
        easier to find. We are not the provider of any opportunity, we do not take applications, and we do not decide who is selected.
      </p>
    ),
  },
  {
    id: 'promise',
    title: 'What we do not promise',
    icon: 'shield',
    body: (
      <ul>
        <li>We cannot guarantee that you will be selected for, or receive, any opportunity you find here.</li>
        <li>
          We work to keep listings accurate, but details such as deadlines, eligibility and amounts can change, and we can make mistakes. Always confirm the
          details on the official page before you apply. The decision to apply is yours.
        </li>
        <li>A listing is not an endorsement. We do not vouch for providers, and we cannot promise that an offer or event will go ahead as described.</li>
        <li>We cannot promise that the site will always be available or free of errors.</li>
      </ul>
    ),
  },
  {
    id: 'pay',
    title: 'Never pay to apply through us',
    icon: 'warn',
    body: (
      <p>
        OppVault does not charge you to see a listing, and we will never ask you for money to help you win an opportunity. If someone claims to be OppVault
        and asks you to pay, please tell us at <a href={`mailto:${CONTACT.supportEmail}`}>{CONTACT.supportEmail}</a>. Be careful with any opportunity that
        asks for payment, and check it with the official source.
      </p>
    ),
  },
  {
    id: 'account',
    title: 'Your account',
    icon: 'user',
    body: (
      <ul>
        <li>You can browse without an account. An account lets you save listings, mark what you have applied for and leave reviews.</li>
        <li>Give a real email address, keep your password private, and tell us if you think someone else has used your account.</li>
        <li>You can delete your account at any time from the My saved page. Doing so removes your account and your saved list.</li>
        <li>We may close an account that is used to break these terms.</li>
      </ul>
    ),
  },
  {
    id: 'sent',
    title: 'What you send us',
    icon: 'pen',
    body: (
      <p>
        This covers reviews, suggested opportunities and messages. Please send only things that are true and that you have the right to share. Do not post
        anything unlawful, abusive, misleading, or that includes someone else&rsquo;s private details. By sending a review or suggestion, you allow us to
        show, edit for clarity, or remove it. We review suggestions before they go live, and we may remove a review that breaks these terms. You keep
        ownership of your own words.
      </p>
    ),
  },
  {
    id: 'fair',
    title: 'Using the site fairly',
    icon: 'check',
    body: (
      <ul>
        <li>Do not try to break, overload or get around the security of the site.</li>
        <li>Do not copy the whole site or collect its listings automatically without asking us first.</li>
        <li>Do not use OppVault to send spam or to pretend to be someone else.</li>
      </ul>
    ),
  },
  {
    id: 'links',
    title: 'Links, offers and codes',
    icon: 'link',
    body: (
      <p>
        Many listings link to other websites. We do not control those sites and are not responsible for what they say or do. Student offers and discount
        codes belong to the companies that issue them, and they can change or end without notice. Check the terms on the provider&rsquo;s own page.
      </p>
    ),
  },
  {
    id: 'content',
    title: 'Our content',
    icon: 'doc',
    body: (
      <p>
        The OppVault name, logo, design and the way we write and organise listings belong to OppVault. Facts about opportunities belong to their providers.
        You may share a link to any page and quote a short part with credit. Please ask before reusing more than that.
      </p>
    ),
  },
  {
    id: 'responsibility',
    title: 'Our responsibility',
    icon: 'shield',
    body: (
      <p>
        We are responsible for what the law says we must be, and no more. Where the law allows, OppVault is not liable for losses that come from relying on
        a listing, from a missed or changed deadline, or from a third-party site. Nothing in these terms limits any right you have that cannot lawfully be
        limited.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes',
    icon: 'refresh',
    body: (
      <p>
        OppVault is still growing, so these terms may change. We will update the date at the top when they do. If you keep using the site after a change,
        you accept the new terms.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    icon: 'mail',
    body: (
      <p>
        Questions about these terms? Email <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>. How we handle your details is explained in our{' '}
        <a href="/privacy">privacy notice</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      kind="Legal"
      title="Terms of use"
      updated="6 November 2026"
      lead="The rules for using OppVault, in plain language: what we do, what we do not promise, and what we ask of you."
      highlights={HIGHLIGHTS}
      sections={SECTIONS}
      other={{ href: '/privacy', label: 'Privacy notice' }}
    />
  );
}
