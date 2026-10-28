// One place that builds the search and social tags, so every page says the right thing when it is shared.
//
// Why this exists: in Next.js a page that sets its own `openGraph` replaces the layout's whole openGraph,
// and a page that sets none inherits the layout's. Either way the title, address or image could be wrong.
// withSocial() gives every page its own complete Open Graph and Twitter tags.

import type { Metadata } from 'next';
import { TAGLINE } from './config';

const DEFAULT_IMAGE = { url: '/og.png', width: 1200, height: 630, alt: `OppVault. ${TAGLINE}` };

type Options = { type?: 'website' | 'article'; image?: string; publishedTime?: string };

function plainTitle(title: Metadata['title']): string | undefined {
  if (typeof title === 'string') return title;
  if (title && typeof title === 'object') {
    if ('absolute' in title && typeof title.absolute === 'string') return title.absolute;
    if ('default' in title && typeof title.default === 'string') return title.default;
  }
  return undefined;
}

/** Add Open Graph and Twitter tags that match the page's own title, description and address. */
export function withSocial(meta: Metadata, options: Options = {}): Metadata {
  const base = plainTitle(meta.title);
  const title = base ? (/oppvault/i.test(base) ? base : `${base} | OppVault`) : `OppVault | ${TAGLINE}`;
  const description = typeof meta.description === 'string' ? meta.description : undefined;
  const canonical = typeof meta.alternates?.canonical === 'string' ? meta.alternates.canonical : undefined;
  const image = options.image ? { url: options.image, alt: base ?? 'OppVault' } : DEFAULT_IMAGE;

  return {
    ...meta,
    openGraph: {
      type: options.type ?? 'website',
      siteName: 'OppVault',
      locale: 'en_GB',
      title,
      ...(description ? { description } : {}),
      ...(canonical ? { url: canonical } : {}),
      images: [image],
      ...(options.type === 'article' && options.publishedTime ? { publishedTime: options.publishedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      site: '@oppvault',
      title,
      ...(description ? { description } : {}),
      images: [image.url],
    },
  };
}

type Query = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/**
 * Address and indexing rules for a list page.
 * Page 2, 3... point at themselves. Filtered or searched views are kept out of the index (links still followed),
 * so thousands of filter combinations do not compete with the real page.
 */
export function listIndexing(path: string, query: Query): { alternates: { canonical: string }; robots?: { index: boolean; follow: boolean } } {
  const page = Math.max(1, Math.min(200, Number.parseInt(first(query.page) ?? '1', 10) || 1));
  const filtered = Boolean(first(query.q) || first(query.funding) || first(query.level) || first(query.location));
  return {
    alternates: { canonical: filtered || page === 1 ? path : `${path}?page=${page}` },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}
