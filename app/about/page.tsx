import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '../../components/Reveal';
import WhatsAppButton from '../../components/WhatsAppButton';
import { ArrowIcon, CategoryIcon } from '../../components/Icons';
import { CATEGORIES } from '../../lib/categories';
import { CONTACT, WHATSAPP_URL } from '../../lib/config';
import './about.css';

export const metadata: Metadata = {
  title: 'About',
  description:
    'OppVault exists to help people find the opportunities that are open to them and feel included. Here is what we do, how a listing gets in, and what we promise.',
  alternates: { canonical: '/about' },
};

const SCATTERED = [
  'A flyer in a group chat',
  'A post you scrolled past',
  'A link someone sent you in March',
  'A PDF on a page nobody visits',
  'A deadline you never saw',
  'A screenshot you forgot to save',
];

const LISTING_FIELDS = [
  { label: 'Provider', value: 'Who is offering it' },
  { label: 'Deadline', value: 'When it closes' },
  { label: 'Who can apply', value: 'The eligibility, in plain language' },
  { label: 'What it offers', value: 'The benefits, without the jargon' },
  { label: 'Official source', value: 'A link to the original announcement' },
];

const STEPS = [
  {
    title: 'Spotted',
    text: 'An opportunity turns up in an official announcement, or one of you suggests it.',
  },
  {
    title: 'Checked',
    text: 'We open the official page and confirm the provider, the eligibility and the deadline.',
  },
  {
    title: 'Written plainly',
    text: 'We turn the small print into a short summary: who can apply, what it offers, how to apply.',
  },
  {
    title: 'Linked back',
    text: 'Every listing sends you to the official source, so you can confirm it yourself before you apply.',
  },
];

const WILL = [
  'Show the provider, deadline and eligibility on every listing',
  'Link to the official source, always',
  'Fix mistakes quickly when you tell us about them',
  'Mark anything we have not verified as a sample',
];

const WONT = [
  'Promise that you will be selected for anything',
  'Invent deadlines, rankings or success stories',
  'Hide where an opportunity really comes from',
  'Let a suggestion go live before it has been reviewed',
];

/** The ring of tick marks around the vault door. Computed once, so server and browser always agree. */
const TICKS = Array.from({ length: 36 }, (_, i) => {
  const angle = (i * 10 * Math.PI) / 180;
  const long = i % 3 === 0;
  const r1 = long ? 160 : 166;
  const r2 = 174;
  return {
    key: i,
    x1: (200 + r1 * Math.sin(angle)).toFixed(2),
    y1: (200 - r1 * Math.cos(angle)).toFixed(2),
    x2: (200 + r2 * Math.sin(angle)).toFixed(2),
    y2: (200 - r2 * Math.cos(angle)).toFixed(2),
    long,
  };
});

function VaultDoor() {
  return (
    <svg className="abt-vault" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
      <circle cx="200" cy="200" r="192" className="abt-vault__outer" />
      <g className="abt-vault__dial">
        {TICKS.map((t) => (
          <line
            key={t.key}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            className={t.long ? 'abt-vault__tick abt-vault__tick--long' : 'abt-vault__tick'}
          />
        ))}
      </g>
      <circle cx="200" cy="200" r="148" className="abt-vault__ring" />
      <circle cx="200" cy="200" r="112" className="abt-vault__disc" />
      <g className="abt-vault__bolts">
        <rect x="190" y="70" width="20" height="34" rx="6" />
        <rect x="190" y="296" width="20" height="34" rx="6" />
        <rect x="70" y="190" width="34" height="20" rx="6" />
        <rect x="296" y="190" width="34" height="20" rx="6" />
      </g>
      <circle cx="200" cy="190" r="64" className="abt-vault__glow" />
      <circle cx="200" cy="184" r="19" className="abt-vault__key" />
      <path d="M190 196h20l7 44h-34l7-44Z" className="abt-vault__key" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <>
      <section className="phead abt-hero">
        <div className="hero__aurora" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="container abt-hero__grid">
          <div className="abt-hero__copy">
            <p className="phead__eyebrow">About OppVault</p>
            <h1 className="phead__title">The door was always there. Now you can find it.</h1>
            <div className="phead__text">
              <p>
                Scholarships, fellowships, grants, courses, events and student offers, gathered into one organised
                place, so finding what is open to you takes minutes, not weeks.
              </p>
            </div>
            <p className="abt-hero__tagline">Unlocking Opportunities, Empowering Potential.</p>
          </div>
          <div className="abt-hero__art">
            <VaultDoor />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <p className="abt-eyebrow">Why we are building it</p>
            <h2 className="h2 abt-h2">Opportunities are everywhere. Finding them should not be a talent.</h2>
          </Reveal>
          <div className="abt-compare">
            <Reveal className="abt-compare__side">
              <h3 className="abt-compare__title">Before</h3>
              <p className="abt-compare__lead">
                Listings live on hundreds of websites, posts and group chats. The people who find them are often the
                people who already know where to look.
              </p>
              <ul className="abt-scatter">
                {SCATTERED.map((s) => (
                  <li key={s} className="abt-chip">
                    {s}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal className="abt-compare__side abt-compare__side--after" delay={120}>
              <h3 className="abt-compare__title">With OppVault</h3>
              <p className="abt-compare__lead">
                One place, the same clear shape every time. Here is what every listing is built to show you.
              </p>
              <dl className="abt-card">
                {LISTING_FIELDS.map((f) => (
                  <div className="abt-card__row" key={f.label}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="abt-card__caption">An illustration of the layout, not a real listing.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="abt-quote">
        <div className="hero__aurora" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="container abt-quote__inner">
          <Reveal>
            <blockquote className="abt-quote__text">
              <p>
                <span className="abt-quote__mark">Involve me, involve me.</span>
              </p>
              <footer>
                The voice behind OppVault. People want to be included, and finding out what exists is the first step.
              </footer>
            </blockquote>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <p className="abt-eyebrow">How a listing gets in</p>
            <h2 className="h2 abt-h2">From announcement to the vault, in four steps.</h2>
          </Reveal>
          <ol className="abt-steps">
            {STEPS.map((s, i) => (
              <Reveal as="li" className="abt-step" key={s.title} delay={i * 90}>
                <span className="abt-step__num" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="abt-step__title">{s.title}</h3>
                <p>{s.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--tint">
        <div className="container">
          <Reveal>
            <p className="abt-eyebrow">What is inside</p>
            <h2 className="h2 abt-h2">Six keys, one vault.</h2>
          </Reveal>
          <ul className="abt-keys">
            {CATEGORIES.map((c, i) => (
              <Reveal as="li" className="abt-key" key={c.slug} delay={Math.min(i, 5) * 70}>
                <Link href={`/${c.slug}`} className="abt-key__link">
                  <span className="abt-key__icon">
                    <CategoryIcon name={c.icon} />
                  </span>
                  <span className="abt-key__name">{c.label}</span>
                  <span className="abt-key__text">{c.intro}</span>
                  <span className="abt-key__go" aria-hidden="true">
                    Browse <ArrowIcon />
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <p className="abt-eyebrow">How we work</p>
            <h2 className="h2 abt-h2">What we will do, and what we never will.</h2>
          </Reveal>
          <div className="abt-promise">
            <Reveal className="abt-promise__col abt-promise__col--will">
              <h3 className="abt-promise__title">We will</h3>
              <ul>
                {WILL.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal className="abt-promise__col abt-promise__col--wont" delay={100}>
              <h3 className="abt-promise__title">We will not</h3>
              <ul>
                {WONT.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal>
            <p className="note">
              OppVault helps you discover opportunities. It cannot guarantee that you will be selected for any of them.
              Requirements and deadlines can change, so always confirm them with the official source.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="abt-join">
        <div className="hero__aurora" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="container abt-join__inner">
          <Reveal>
            <h2 className="abt-join__title">Help us fill the vault.</h2>
            <p className="abt-join__text">
              Spotted an opportunity we should list, or a mistake we should fix? Tell us. Every suggestion is checked by
              a person before anything is published.
            </p>
            <div className="abt-join__actions">
              <Link href="/submit" className="btn btn--primary">
                Suggest an opportunity
              </Link>
              <WhatsAppButton url={WHATSAPP_URL} variant="dark" />
            </div>
            <p className="abt-join__small">
              Or write to <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>, or find us on{' '}
              <a href={CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>{' '}
              and{' '}
              <a href={CONTACT.xUrl} target="_blank" rel="noopener noreferrer">
                X
              </a>
              .
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
