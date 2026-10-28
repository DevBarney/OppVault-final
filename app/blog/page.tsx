import type { Metadata } from 'next';
import { withSocial } from '../../lib/seo';
import Link from 'next/link';
import PageHeader from '../../components/PageHeader';
import Reveal from '../../components/Reveal';
import { ArrowIcon } from '../../components/Icons';
import { getPosts } from '../../lib/data';
import { formatDate } from '../../lib/dates';

export const metadata: Metadata = withSocial({
  title: 'Blog',
  description: 'Practical guides on finding and applying for scholarships, fellowships, grants and other opportunities.',
  alternates: { canonical: '/blog' },
});

export default async function BlogPage() {
  const posts = await getPosts();
  return (
    <>
      <PageHeader eyebrow="The OppVault blog" title="Guides for applying with confidence">
        <p>Practical, honest advice on finding opportunities and putting your best application forward.</p>
      </PageHeader>
      <section className="section section--list">
        <div className="container">
          {posts.length === 0 ? (
            <div className="empty">
              <h2 className="empty__title">Articles are on their way</h2>
              <p>Join the list below and we will tell you when the first ones are published.</p>
            </div>
          ) : (
            <ul className="grid">
              {posts.map((p, i) => (
                <Reveal as="li" key={p.slug} delay={Math.min(i, 5) * 60}>
                  <article className="card card--post">
                    <Link className="card__link" href={`/blog/${p.slug}`}>
                      <div className="card__top">
                        <span className="tag tag--plain">{p.tags[0] ?? 'Guide'}</span>
                      </div>
                      <h2 className="card__title">{p.title}</h2>
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
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
