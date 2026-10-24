import Image from 'next/image';
import HeroArt from '../components/HeroArt';
import Reveal from '../components/Reveal';
import SubscribeForm from '../components/SubscribeForm';
import WhatsAppButton from '../components/WhatsAppButton';
import { StarIcon } from '../components/Icons';
import { CONTACT, TAGLINE, WHATSAPP_URL } from '../lib/config';

// ---- Page copy lives here so it is easy to edit ----------------------------------------

const AREAS = [
  {
    name: 'Scholarships',
    text: 'Funding for study, with eligibility criteria and deadlines in one place.',
  },
  {
    name: 'Internships',
    text: 'Ways for students and early-career people to gain practical experience.',
  },
  {
    name: 'Fellowships',
    text: 'Programmes for professional growth, research, leadership and specialised training.',
  },
  {
    name: 'Grants',
    text: 'Financial support for individuals, researchers, entrepreneurs and project teams.',
  },
  {
    name: 'Conferences and events',
    text: 'Events where you can learn, present ideas and meet people in your field.',
  },
  {
    name: 'Free courses',
    text: 'Free or accessible learning, including online courses and skills programmes.',
  },
  {
    name: 'Student offers',
    text: 'Discounts, tools and software that can help students and learners.',
  },
];

const STEPS = [
  {
    title: 'We collect',
    text: 'Opportunities are gathered from selected sources, so you do not have to search them all yourself.',
  },
  {
    title: 'We organise',
    text: 'Listings are sorted into clear categories, each showing the essentials: provider, summary, eligibility and deadline.',
  },
  {
    title: 'You check and apply',
    text: 'Every listing links to the original announcement, so you can confirm the requirements before you apply.',
  },
];

// ----------------------------------------------------------------------------------------

// The header (logo, links, "Join the list") is in components/Nav.tsx and is added by app/layout.tsx.

export default function Page() {
  const year = new Date().getFullYear();

  return (
    <>
      <main id="main">
      {/* Hero */}
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <p className="pill">
              <StarIcon className="pill__star" />
              Preview. The full platform is on its way.
            </p>
            <h1 className="hero__title">
              <span>Unlocking Opportunities,</span> <span>Empowering Potential.</span>
            </h1>
            <p className="hero__lead">
              OppVault is being built to bring scholarships, internships, fellowships, grants and more into one
              organised place. Join the list to hear first when it opens.
            </p>

            <div className="hero__actions" id="subscribe">
              <SubscribeForm whatsappUrl={WHATSAPP_URL} />
              <div className="hero__or">
                <span>Prefer to follow along on WhatsApp?</span>
                <WhatsAppButton url={WHATSAPP_URL} />
              </div>
            </div>
          </div>

          <HeroArt />
        </div>
      </section>

      {/* What OppVault will cover */}
      <section className="section" id="areas" aria-labelledby="areas-title">
        <div className="container areas">
          <Reveal className="areas__intro">
            <h2 id="areas-title" className="h2">
              What we plan to bring together
            </h2>
            <p className="body">
              These are the areas we are building towards. What is available on day one may change as we test and
              improve.
            </p>
          </Reveal>
          <ul className="areas__list">
            {AREAS.map((area, i) => (
              <Reveal as="li" className="areas__item" key={area.name} delay={Math.min(i, 4) * 70}>
                <h3 className="areas__name">{area.name}</h3>
                <p className="areas__text">{area.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="section section--tint" id="how" aria-labelledby="how-title">
        <div className="container">
          <Reveal>
            <h2 id="how-title" className="h2">
              How OppVault will help
            </h2>
          </Reveal>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <Reveal as="li" className="steps__item" key={step.title} delay={i * 110}>
                <span className="badge" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="steps__title">{step.title}</h3>
                <p className="steps__text">{step.text}</p>
              </Reveal>
            ))}
          </ol>
          <Reveal>
            <p className="note">
              OppVault helps you discover opportunities. It cannot guarantee that you will be selected for any of them,
              so always confirm the details with the official source.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Join */}
      <section className="band" id="join" aria-labelledby="join-title">
        <div className="container band__grid">
          <Reveal className="band__copy">
            <h2 id="join-title" className="band__quote">
              &ldquo;Involve me, involve me!&rdquo;
            </h2>
            <p className="band__text">
              That is the voice behind OppVault: people who want to be included. Join early, and you will be among the
              first to know when we open.
            </p>
          </Reveal>
          <Reveal className="band__card" delay={140}>
            <SubscribeForm variant="dark" whatsappUrl={WHATSAPP_URL} />
            <div className="band__or">
              <WhatsAppButton url={WHATSAPP_URL} variant="dark" />
            </div>
          </Reveal>
        </div>
      </section>
      </main>

      <footer className="footer">
        <div className="container footer__grid">
          <div className="footer__brand">
            <Image
              className="footer__logo"
              src="/logo-horizontal.png"
              alt="OppVault"
              width={1400}
              height={418}
              sizes="180px"
            />
            <p className="footer__tagline">{TAGLINE}</p>
          </div>
          <ul className="footer__links">
            <li>
              <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            </li>
            <li>
              <a href={CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer">
                Instagram: {CONTACT.instagramHandle}
              </a>
            </li>
            <li>
              <a href={CONTACT.xUrl} target="_blank" rel="noopener noreferrer">
                X: @{CONTACT.xHandle}
              </a>
            </li>
            <li>
              <a href="/privacy">Privacy notice</a>
            </li>
          </ul>
        </div>
        <div className="container footer__fine">
          <p>&copy; {year} OppVault. This is a preview page, and details may change before launch.</p>
        </div>
      </footer>
    </>
  );
}
