import type { Metadata } from 'next';
import Link from 'next/link';
import MotifHero, { JumpLink } from '../../components/MotifHero';
import { CONTACT } from '../../lib/config';
import { withSocial } from '../../lib/seo';
import './support.css';

export const metadata: Metadata = withSocial({
  title: 'Help & contact',
  description: 'Need help with your OppVault account, spotted something wrong on a listing, or want to work with us? Here is who to write to.',
  alternates: { canonical: '/support' },
});

const CARDS = [
  {
    title: 'Need help?',
    text: 'Something not working, or a question about your account.',
    items: ['Sign-in or password problems', 'Deleting your account', 'Removing a review you left', 'A page that is broken'],
    email: CONTACT.supportEmail,
  },
  {
    title: 'Something wrong on a listing?',
    text: 'Tell us and we will check it against the official source.',
    items: ['A wrong or missing deadline', 'A broken official link', 'You run the programme and want it corrected or added', 'Business, partnerships and press'],
    email: CONTACT.infoEmail,
  },
  {
    title: 'Just saying hello',
    text: 'Feedback, ideas, or a kind word. We read all of it.',
    items: ['What would make OppVault more useful?', 'Something that helped you', 'Questions about the newsletter'],
    email: CONTACT.email,
  },
];

const FAQ = [
  { q: 'Do I need an account to use OppVault?', a: 'No. You can browse, search and open every listing without one. An account is only for saving opportunities so you can find them again.' },
  { q: 'How do I save an opportunity?', a: 'Tap the heart on any card or listing page. If you are not signed in, we take you to sign in first and save it as soon as you are back.' },
  { q: 'I forgot my password.', a: 'On the sign-in page, choose the reset option and we will email you a link. If no email arrives, check your spam folder, then write to us.' },
  { q: 'How do I delete my account?', a: 'Sign in, open My saved, and use the delete option at the bottom of the page. If that does not work, email us and we will do it for you.' },
  { q: 'A deadline looks wrong. What should I do?', a: 'Always trust the official page over ours. Please email us the listing and what you saw, and we will check and fix it.' },
  { q: 'Can you guarantee I will win a scholarship or get a place?', a: 'No. We collect and organise opportunities, but we do not run them and cannot influence who is chosen. Always check the official page before you apply.' },
  { q: 'I would like to suggest an opportunity.', a: 'Use the suggestion form. We check every suggestion against the official source before anything is published.' },
];

export default function SupportPage() {
  return (
    <>
      <MotifHero motif="help" eyebrow="We are here" title="Help & contact" meta={<JumpLink href="#contact">Choose who to write to</JumpLink>}>
        <p>Write to the address that fits, and your message gets to the right person faster.</p>
      </MotifHero>
      <section className="section section--list" id="contact">
        <div className="container">
          <ul className="help-grid">
            {CARDS.map((c) => (
              <li key={c.title}>
                <div className="help-card">
                  <h2 className="help-card__title">{c.title}</h2>
                  <p className="help-card__text">{c.text}</p>
                  <ul className="help-card__list">
                    {c.items.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                  <a className="help-card__mail" href={`mailto:${c.email}`}>
                    {c.email}
                  </a>
                </div>
              </li>
            ))}
          </ul>
          <p className="help-note">
            We read every message. Replies can take a few days. Please never send passwords or card details by email.
          </p>
        </div>
      </section>
      <section className="section section--tint" aria-labelledby="faq-title">
        <div className="container">
          <h2 id="faq-title" className="h2">Quick answers</h2>
          <div className="help-faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <p className="help-note">
            Want to share an opportunity? <Link href="/submit">Suggest one here</Link>. Used OppVault? <Link href="/reviews">Leave a review</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
