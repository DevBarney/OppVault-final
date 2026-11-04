import Link from 'next/link';
import { ArrowIcon, CategoryIcon } from './Icons';

/** Top of the blog: a fanned stack of pages with a pen, the number of guides, and a link to the newest one. */
export default function BlogHero({ count, latest }: { count: number; latest?: { slug: string; title: string } }) {
  return (
    <section className="phead chero bhero">
      <div className="hero__aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="chero__emblem bhero__emblem" aria-hidden="true">
        <span className="chero__glow" />
        <span className="bhero__sheet bhero__sheet--3" />
        <span className="bhero__sheet bhero__sheet--2" />
        <span className="bhero__sheet bhero__sheet--1">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="chero__tile bhero__tile">
          <CategoryIcon name="pen" className="chero__icon" />
        </span>
      </div>
      <div className="container chero__inner">
        <p className="phead__eyebrow">The OppVault blog</p>
        <h1 className="phead__title">Guides for applying with confidence</h1>
        <div className="phead__text">
          <p>Practical, honest advice on finding opportunities and putting your best application forward.</p>
        </div>
        <div className="chero__meta">
          {count > 0 ? (
            <span className="chero__count">
              <span className="chero__dot" aria-hidden="true" />
              {count} {count === 1 ? 'guide' : 'guides'}
            </span>
          ) : null}
          {latest ? (
            <Link className="chero__go bhero__latest" href={`/blog/${latest.slug}`}>
              <span className="bhero__latest-text">Newest: {latest.title}</span> <ArrowIcon className="chero__arrow bhero__arrow" />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
