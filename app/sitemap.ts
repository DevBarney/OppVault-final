import type { MetadataRoute } from 'next';
import { CATEGORIES } from '../lib/categories';
import { getOpportunities, getPosts, usingSupabase } from '../lib/data';
import { SITE_URL } from '../lib/config';
import type { Opportunity } from '../lib/types';

const PAGE = 1000; // rows per request; the database never returns more than this at once
const MAX_PAGES = 40; // a sitemap can hold 50,000 addresses, so this is a safety stop, not a limit you will meet

/** Every published listing, fetched a page at a time so none are silently dropped. */
async function allListings(): Promise<Opportunity[]> {
  const all: Opportunity[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { items } = await getOpportunities({ limit: PAGE, offset: page * PAGE, hideClosed: false });
    all.push(...items);
    if (items.length < PAGE) break;
  }
  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages with no real "last changed" date say nothing, rather than claiming they changed just now.
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/` },
    { url: `${SITE_URL}/about` },
    { url: `${SITE_URL}/blog` },
    { url: `${SITE_URL}/privacy` },
    { url: `${SITE_URL}/submit` },
    ...CATEGORIES.map((c) => ({ url: `${SITE_URL}/${c.slug}` })),
  ];
  // Sample listings are never put in the sitemap.
  if (usingSupabase) {
    const items = await allListings();
    pages.push(
      ...items.map((o) => ({
        url: `${SITE_URL}/${o.category}/${o.slug}`,
        lastModified: new Date(o.updated_at ?? o.created_at),
      })),
    );
  }
  const posts = await getPosts(200);
  pages.push(...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: new Date(p.published_at) })));
  return pages;
}
