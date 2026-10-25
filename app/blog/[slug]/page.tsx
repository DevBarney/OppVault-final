import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Prose from '../../../components/Prose';
import { ArrowIcon } from '../../../components/Icons';
import { getPost, getPosts } from '../../../lib/data';
import { formatDate } from '../../../lib/dates';
import { SITE_URL } from '../../../lib/config';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: 'article', title: post.title, description: post.excerpt, publishedTime: post.published_at },
  };
}

export default async function PostPage({ params }: Props) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const others = (await getPosts(4)).filter((p) => p.slug !== post.slug).slice(0, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at,
    author: { '@type': 'Organization', name: post.author },
    publisher: { '@type': 'Organization', name: 'OppVault' },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <>
      <section className="phead phead--detail">
        <div className="hero__aurora" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="container phead__inner">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/blog">Blog</Link>
          </nav>
          <p className="phead__eyebrow">
            {formatDate(post.published_at)} · {post.read_minutes} min read
          </p>
          <h1 className="phead__title phead__title--detail">{post.title}</h1>
        </div>
      </section>

      <section className="section section--list">
        <div className="container article">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
          <p className="detail__lead">{post.excerpt}</p>
          <Prose text={post.body} />
          <p className="article__by">Written by {post.author}</p>
        </div>
      </section>

      {others.length > 0 ? (
        <section className="section section--tint">
          <div className="container">
            <div className="section__head">
              <h2 className="h2">Keep reading</h2>
              <Link className="more" href="/blog">
                All articles <ArrowIcon className="more__icon" />
              </Link>
            </div>
            <ul className="grid">
              {others.map((p) => (
                <li key={p.slug}>
                  <article className="card card--post">
                    <Link className="card__link" href={`/blog/${p.slug}`}>
                      <h3 className="card__title">{p.title}</h3>
                      <p className="card__summary">{p.excerpt}</p>
                      <div className="card__foot">
                        <span className="urgency urgency--open">{p.read_minutes} min read</span>
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
    </>
  );
}
