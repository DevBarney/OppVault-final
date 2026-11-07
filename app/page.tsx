import Image from 'next/image';
import FinePrint from '../components/FinePrint';
import StepsTrack from '../components/StepsTrack';
import VaultDoor from '../components/VaultDoor';
import Reveal from '../components/Reveal';
import SubscribeForm from '../components/SubscribeForm';
import WhatsAppButton from '../components/WhatsAppButton';
import { ArrowIcon, ArrowUpIcon, CategoryIcon, CheckIcon, StarIcon } from '../components/Icons';
import { CONTACT, TAGLINE, WHATSAPP_URL } from '../lib/config';

// ---- Page copy lives here so it is easy to edit ----------------------------------------

const AREAS = [
  {
    name: 'Scholarships',
    icon: 'cap' as const,
    text: 'Funding for study, with eligibility criteria and deadlines in one place.',
  },
  {
    name: 'Internships',
    icon: 'compass' as const,
    text: 'Ways for students and early-career people to gain practical experience.',
  },
  {
    name: 'Fellowships',
    icon: 'pen' as const,
    text: 'Programmes for professional growth, research, leadership and specialised training.',
  },
  {
    name: 'Grants',
    icon: 'coins' as const,
    text: 'Financial support for individuals, researchers, entrepreneurs and project teams.',
  },
  {
    name: 'Conferences and events',
    icon: 'calendar' as const,
    text: 'Events where you can learn, present ideas and meet people in your field.',
  },
  {
    name: 'Free courses',
    icon: 'book' as const,
    text: 'Free or accessible learning, including online courses and skills programmes.',
  },
  {
    name: 'Student offers',
    icon: 'tag' as const,
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
      <section className="hero lh">
        <div className="hero__aurora" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="lh__art" aria-hidden="true">
          <VaultDoor />
        </div>
        <div className="container hero__grid lh__grid">
          <div className="lh__text">
            <p className="pill">
              <StarIcon className="pill__star" />
              Preview. The vault opens soon.
            </p>
            <h1 className="hero__title">
              <span>Unlocking Opportunities,</span> <span className="hero__accent">Empowering Potential.</span>
            </h1>
            <p className="hero__lead">
              OppVault is being built to bring scholarships, internships, fellowships, grants and more into one
              organised place. Join the list to hear first when it opens.
            </p>

            <div className="hero__actions" id="subscribe">
              <SubscribeForm variant="dark" whatsappUrl={WHATSAPP_URL} />
              <div className="hero__or">
                <span>Prefer to follow along on WhatsApp?</span>
                <WhatsAppButton url={WHATSAPP_URL} variant="dark" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What OppVault will cover */}
      <section className="section" id="areas" aria-labelledby="areas-title">
        <div className="container">
          <Reveal className="lp-head">
            <h2 id="areas-title" className="h2">
              What we plan to bring together
            </h2>
            <p className="body">
              These are the areas we are building towards. What is available on day one may change as we test and
              improve.
            </p>
          </Reveal>
          <ul className="lp-areas">
            {AREAS.map((area, i) => (
              <Reveal as="li" className="lp-area" key={area.name} delay={Math.min(i, 3) * 70}>
                <span className="lp-area__tile" aria-hidden="true">
                  <CategoryIcon name={area.icon} className="lp-area__icon" />
                </span>
                <h3 className="lp-area__name">{area.name}</h3>
                <p className="lp-area__text">{area.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* A look at one listing */}
      <section className="section section--tint" id="peek" aria-labelledby="peek-title">
        <div className="container lp-peek">
          <Reveal className="lp-peek__copy">
            <h2 id="peek-title" className="h2">
              Every listing, the same clear way
            </h2>
            <p className="body">
              No hunting through long pages. Each opportunity shows what you need to decide, with a link to the official
              announcement for the full details.
            </p>
            <ul className="lp-peek__list">
              {['Who provides it', 'What it offers', 'Who can apply', 'The deadline'].map((t) => (
                <li key={t}>
                  <CheckIcon className="lp-peek__tick" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="lp-peek__card" delay={120}>
            <article className="lp-sample" aria-label="Example listing">
              <p className="lp-sample__flag">Example only, not a real listing</p>
              <div className="lp-sample__top">
                <span className="tag">Scholarship</span>
                <span className="lp-sample__days">Closes in 21 days</span>
              </div>
              <h3 className="lp-sample__title">Example Foundation Scholarship</h3>
              <p className="lp-sample__provider">Example Foundation</p>
              <dl className="lp-sample__facts">
                <div>
                  <dt>Offers</dt>
                  <dd>Tuition support for one year</dd>
                </div>
                <div>
                  <dt>Who can apply</dt>
                  <dd>Undergraduate students</dd>
                </div>
                <div>
                  <dt>Deadline</dt>
                  <dd>30 January</dd>
                </div>
              </dl>
              <span className="lp-sample__link" aria-hidden="true">
                Read the official announcement <ArrowIcon className="lp-sample__arrow" />
              </span>
            </article>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section className="section" id="how" aria-labelledby="how-title">
        <div className="container">
          <Reveal>
            <h2 id="how-title" className="h2">
              How OppVault will help
            </h2>
          </Reveal>
          <StepsTrack count={STEPS.length}>
            {STEPS.map((step, i) => (
              <li className="steps__item" key={step.title} data-step={i + 1}>
                <span className="badge" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="steps__title">{step.title}</h3>
                <p className="steps__text">{step.text}</p>
              </li>
            ))}
          </StepsTrack>
          <FinePrint />
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
        <div className="container">
          <div className="footer__top">
            <div className="footer__brand">
              <Image
                className="footer__logo"
                src="/logo-horizontal.png"
                alt="OppVault"
                width={1459}
                height={427}
                sizes="220px"
              />
              <p className="footer__tagline">{TAGLINE}</p>
              <a className="footer__join" href="/#subscribe">
                <span>Join the list</span>
                <ArrowIcon className="footer__join-arrow" />
              </a>
            </div>

            <nav className="footer__cols" aria-label="Footer">
              <div className="footer__col">
                <h2 className="footer__heading">Explore</h2>
                <ul>
                  <li><a href="/#areas">What we cover</a></li>
                  <li><a href="/#how">How it helps</a></li>
                  <li><a href="/#join">Community</a></li>
                </ul>
              </div>
              <div className="footer__col">
                <h2 className="footer__heading">Connect</h2>
                <ul>
                  <li><a href={`mailto:${CONTACT.email}`}>Email us</a></li>
                  <li>
                    <a href={CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram</a>
                  </li>
                  <li>
                    <a href={CONTACT.xUrl} target="_blank" rel="noopener noreferrer">X</a>
                  </li>
                  {WHATSAPP_URL ? (
                    <li>
                      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">WhatsApp community</a>
                    </li>
                  ) : null}
                </ul>
              </div>
              <div className="footer__col">
                <h2 className="footer__heading">Legal</h2>
                <ul>
                  <li><a href="/privacy">Privacy notice</a></li>
                </ul>
              </div>
            </nav>
          </div>

          <div className="footer__bar">
            <p>
              &copy; {year} OppVault. A preview page; details may change before launch.
            </p>
            <a className="footer__top-link" href="#main" aria-label="Back to top">
              <span>Back to top</span>
              <ArrowUpIcon className="footer__top-icon" />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
