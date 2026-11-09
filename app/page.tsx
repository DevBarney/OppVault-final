import type { Metadata } from 'next';
import Link from 'next/link';
import OpportunityCard from '../components/OpportunityCard';
import Reveal from '../components/Reveal';
import FinePrint from '../components/FinePrint';
import StepsTrack from '../components/StepsTrack';
import VaultOpen from '../components/VaultOpen';
import { ArrowIcon, CategoryIcon, SearchIcon } from '../components/Icons';
import { CATEGORIES } from '../lib/categories';
import ReviewGrid from '../components/reviews/ReviewCard';
import { getCounts, getOpportunities, getPosts, getReviews } from '../lib/data';
import { daysUntil, formatDate } from '../lib/dates';
import { withSocial } from '../lib/seo';
import HeroDial from '../components/HeroDial';
import { HeroVaultStatus, HeroVaultWall } from '../components/HeroVaultWall';

export const metadata: Metadata = withSocial({ alternates: { canonical: '/' } });

const STEPS = [
  { title: 'We collect', text: 'Opportunities are gathered from selected sources, so you do not have to search them all yourself.' },
  { title: 'We organise', text: 'Each listing shows the essentials: provider, summary, eligibility and deadline, sorted into clear categories.' },
  { title: 'You check and apply', text: 'Every listing links to the official announcement, so you can confirm the requirements before you apply.' },
];

export default async function HomePage() {
  const [counts, closing, posts, reviews] = await Promise.all([
    getCounts(),
    getOpportunities({ limit: 6 }),
    getPosts(3),
    getReviews(3),
  ]);

  return (
    <>
      <section className="hero hero--home">
        <div className="hero__aurora" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <HeroVaultWall />
        <HeroDial next={closing.items.find((o) => o.deadline && (daysUntil(o.deadline) ?? -1) >= 0)} />
        <div className="container hero__grid">
          <div className="hero__head">
            <h1 className="hero__title">
              <span>Unlocking Opportunities,</span> <span className="hero__accent">Empowering Potential.</span>
            </h1>
          </div>

          <div className="hero__copy">
            <p className="hero__lead">
              Find opportunities in one organised place, each with its deadline and a link to the official source.
            </p>
            <form className="hsearch" action="/search" method="get" role="search" aria-label="Search all opportunities">
              <label className="hsearch__field">
                <span className="visually-hidden">Search opportunities</span>
                <SearchIcon className="hsearch__icon" />
                <input type="search" name="q" placeholder="Search all opportunities" maxLength={60} />
              </label>
              <button className="btn btn--primary hsearch__btn" type="submit">
                <span>Search</span>
                <ArrowIcon className="btn__arrow" />
              </button>
            </form>
            <ul className="chips" aria-label="Browse by type">
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link className="chip" href={`/${c.slug}`} data-cat={c.slug}>
                    <CategoryIcon name={c.icon} className="chip__icon" />
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
            <HeroVaultStatus counts={counts} />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="browse-title">
        <div className="container">
          <Reveal>
            <h2 id="browse-title" className="h2">
              Browse by type
            </h2>
          </Reveal>
          <ul className="tiles">
            {CATEGORIES.map((c, i) => (
              <Reveal as="li" key={c.slug} delay={Math.min(i, 5) * 60}>
                <Link className="tile" href={`/${c.slug}`}>
                  <span className="tile__icon">
                    <CategoryIcon name={c.icon} className="tile__svg" />
                  </span>
                  <span className="tile__body">
                    <span className="tile__name">{c.label}</span>
                    <span className="tile__text">{c.intro}</span>
                  </span>
                  <span className="tile__count">{counts[c.slug]} listed</span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {closing.items.length > 0 ? (
        <section className="section section--tint" aria-labelledby="soon-title">
          <div className="container">
            <div className="section__head">
              <h2 id="soon-title" className="h2">
                Closing soon
              </h2>
              <Link className="more" href="/search">
                Search everything <ArrowIcon className="more__icon" />
              </Link>
            </div>
            <ul className="grid">
              {closing.items.map((item, i) => (
                <VaultOpen key={item.id} delay={Math.min(i, 5) * 140}>
                  <OpportunityCard item={item} showCategory />
                </VaultOpen>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="section" aria-labelledby="how-title">
        <div className="container">
          <Reveal>
            <h2 id="how-title" className="h2">
              How OppVault helps
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

      {posts.length > 0 ? (
        <section className="section section--tint section--defer" aria-labelledby="blog-title">
          <div className="container">
            <div className="section__head">
              <h2 id="blog-title" className="h2">
                From the blog
              </h2>
              <Link className="more" href="/blog">
                All articles <ArrowIcon className="more__icon" />
              </Link>
            </div>
            <ul className="grid">
              {posts.map((p) => (
                <li key={p.slug}>
                  <article className="card card--post">
                    <Link className="card__link" href={`/blog/${p.slug}`}>
                      <div className="card__top">
                        <span className="tag tag--plain">{p.tags[0] ?? 'Guide'}</span>
                      </div>
                      <h3 className="card__title">{p.title}</h3>
                      <p className="card__summary">{p.excerpt}</p>
                      <div className="card__foot">
                        <span className="urgency urgency--open">
                          {formatDate(p.published_at)} · {p.read_minutes} min read
                        </span>
                        <span className="card__go" aria-hidden="true">
                          <ArrowIcon className="card__go-icon" />
                        </span>
                      </div>
                    </Link>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="section section--defer" aria-labelledby="reviews-title">
        <div className="container">
          <div className="section__head">
            <h2 id="reviews-title" className="h2">
              What people say
            </h2>
            <Link className="more" href="/reviews">
              {reviews.length > 0 ? 'All reviews' : 'Leave a review'} <ArrowIcon className="more__icon" />
            </Link>
          </div>
          {reviews.length > 0 ? (
            <ReviewGrid reviews={reviews} />
          ) : (
            <p className="rv-empty">
              Used OppVault? <Link href="/reviews">Tell others how it went.</Link>
            </p>
          )}
        </div>
      </section>
    </>
  );
}
