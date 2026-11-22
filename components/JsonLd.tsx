import { CONTACT, SITE_URL } from '../lib/config';

/** Renders one schema.org block. The `<` escape stops a title from closing the script tag early. */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

/** Home > Category > Listing trail, so search results can show the path instead of a bare address. */
export function breadcrumbs(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: `${SITE_URL}${t.path}` })),
  };
}

export const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'OppVault',
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  // The official profiles, so search engines tie them to this one brand.
  sameAs: [CONTACT.instagramUrl, CONTACT.xUrl],
};

export const WEBSITE = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'OppVault',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};
