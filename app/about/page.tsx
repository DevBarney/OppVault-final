import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '../../components/PageHeader';
import Reveal from '../../components/Reveal';
import WhatsAppButton from '../../components/WhatsAppButton';
import { CATEGORIES } from '../../lib/categories';
import { CONTACT, WHATSAPP_URL } from '../../lib/config';

export const metadata: Metadata = {
  title: 'About',
  description: 'OppVault exists to help people discover opportunities and be included. Here is what we do and how we work.',
  alternates: { canonical: '/about' },
};

const VALUES = [
  { title: 'Honest', text: 'We tell you what we know and what we do not. We never promise an outcome, because nobody can.' },
  { title: 'Clear', text: 'Every listing shows the provider, a short summary, the eligibility and the deadline, in plain language.' },
  { title: 'Sourced', text: 'Each listing links to the official announcement so you can confirm the details yourself before you apply.' },
  { title: 'Inclusive', text: 'Opportunity should not depend on who you know. We want more people to find what is open to them.' },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="About OppVault" title="Unlocking Opportunities, Empowering Potential.">
        <p>
          OppVault brings scholarships, fellowships, grants, courses, events and student offers into one organised
          place, so that finding what is open to you takes minutes, not weeks.
        </p>
      </PageHeader>

      <section className="section">
        <div className="container split">
          <Reveal>
            <h2 className="h2">Why we are building it</h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="prose-body">
              <p>
                Opportunities are scattered across hundreds of websites, social posts and group chats. The people who
                find them are often the people who already know where to look. The rest of us miss deadlines we never
                saw.
              </p>
              <p>
                OppVault is our answer: one place where listings are gathered, organised into clear categories and
                linked to the original announcement. The voice behind it is simple: <em>involve me, involve me.</em>{' '}
                People want to be included, and finding out what exists is the first step.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section section--tint">
        <div className="container">
          <Reveal>
            <h2 className="h2">What you will find here</h2>
          </Reveal>
          <ul className="areas__list areas__list--cols">
            {CATEGORIES.map((c, i) => (
              <Reveal as="li" className="areas__item" key={c.slug} delay={Math.min(i, 4) * 70}>
                <h3 className="areas__name">
                  <Link href={`/${c.slug}`}>{c.label}</Link>
                </h3>
                <p className="areas__text">{c.intro}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <h2 className="h2">How we work</h2>
          </Reveal>
          <ul className="values">
            {VALUES.map((v, i) => (
              <Reveal as="li" className="values__item" key={v.title} delay={i * 90}>
                <h3 className="values__title">{v.title}</h3>
                <p>{v.text}</p>
              </Reveal>
            ))}
          </ul>
          <Reveal>
            <p className="note">
              OppVault helps you discover opportunities. It cannot guarantee that you will be selected for any of them.
              Requirements and deadlines can change, so always confirm them with the official source.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section section--tint">
        <div className="container split">
          <Reveal>
            <h2 className="h2">Talk to us</h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="prose-body">
              <p>
                Spotted a listing we should add, or a mistake we should fix? Email{' '}
                <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> or find us on{' '}
                <a href={CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>{' '}
                and{' '}
                <a href={CONTACT.xUrl} target="_blank" rel="noopener noreferrer">
                  X
                </a>
                .
              </p>
              <p>
                <WhatsAppButton url={WHATSAPP_URL} />
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
