import type { MetadataRoute } from 'next';
import { CATEGORIES } from '../lib/categories';
import { getOpportunities, getPosts, usingSupabase } from '../lib/data';
import { SITE_URL } from '../lib/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now },
    { url: `${SITE_URL}/about`, lastModified: now },
    { url: `${SITE_URL}/blog`, lastModified: now },
    { url: `${SITE_URL}/privacy`, lastModified: now },
    { url: `${SITE_URL}/submit`, lastModified: now },
    ...CATEGORIES.map((c) => ({ url: `${SITE_URL}/${c.slug}`, lastModified: now })),
  ];
  // Sample listings are never put in the sitemap.
  if (usingSupabase) {
    const { items } = await getOpportunities({ limit: 1000, hideClosed: false });
    pages.push(...items.map((o) => ({ url: `${SITE_URL}/${o.category}/${o.slug}`, lastModified: now })));
  }
  const posts = await getPosts(200);
  pages.push(...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: new Date(p.published_at) })));
  return pages;
}
