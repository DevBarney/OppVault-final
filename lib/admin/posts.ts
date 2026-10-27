// Single blog posts written on the admin page (as opposed to CSV imports).
import { call, dbConfigured, headers } from './db';
import { parseDate, slugify } from './validate';

export type PostStatus = 'draft' | 'review' | 'published';

export type PostRecord = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  author: string;
  author_id: string | null;
  tags: string[];
  read_minutes: number;
  image_url: string | null;
  status: PostStatus;
  published: boolean;
  published_at: string;
  review_note: string;
  updated_at: string;
};

export type PostInput = {
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  image_url: string | null;
  published_at: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(v: unknown, max: number): string {
  // eslint-disable-next-line no-control-regex
  return typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max) : '';
}

export function validatePost(b: Record<string, unknown>): { ok: true; data: PostInput } | { ok: false; error: string } {
  const title = text(b.title, 200);
  if (title.length < 4) return { ok: false, error: 'Add a title (at least 4 characters).' };
  const body = typeof b.body === 'string' ? b.body.replace(/\r\n?/g, '\n').slice(0, 40000).trim() : '';
  if (body.length < 40) return { ok: false, error: 'The post is too short. Write at least a couple of sentences.' };
  let excerpt = text(b.excerpt, 400);
  if (!excerpt) excerpt = body.replace(/^#+\s.*$/gm, '').replace(/^- /gm, '').replace(/\s+/g, ' ').trim().slice(0, 200);
  const tagsRaw = Array.isArray(b.tags) ? b.tags.join(',') : text(b.tags, 300);
  const tags = tagsRaw.split(/[,|]/).map((t) => text(t, 30)).filter(Boolean).slice(0, 8);
  const imageRaw = text(b.image_url, 600);
  let image_url: string | null = null;
  if (imageRaw) {
    try {
      const u = new URL(imageRaw);
      if (u.protocol !== 'https:') throw new Error('x');
      image_url = u.toString();
    } catch {
      return { ok: false, error: 'The cover image must be a full https:// link.' };
    }
  }
  const dateRaw = text(b.published_at, 40);
  const date = dateRaw ? parseDate(dateRaw) : new Date().toISOString().slice(0, 10);
  if (!date) return { ok: false, error: 'The date should look like 2026-11-01 or 01/11/2026.' };
  return { ok: true, data: { title, excerpt, body, tags, image_url, published_at: date } };
}

export function readMinutes(body: string): number {
  return Math.max(1, Math.ceil(body.split(/\s+/).filter(Boolean).length / 200));
}

const SELECT = 'id,slug,title,excerpt,body,author,author_id,tags,read_minutes,image_url,status,published,published_at,review_note,updated_at';

export async function listPosts(authorId: string | null, status?: string): Promise<Partial<PostRecord>[]> {
  if (!dbConfigured()) return [];
  const filters = [authorId ? `&author_id=eq.${authorId}` : '', status && ['draft', 'review', 'published'].includes(status) ? `&status=eq.${status}` : ''].join('');
  const r = await call(`posts?select=id,slug,title,author,author_id,status,published,published_at,updated_at${filters}&order=updated_at.desc&limit=200`, { headers: headers() });
  return r.ok && Array.isArray(r.body) ? (r.body as Partial<PostRecord>[]) : [];
}

export async function getPostById(id: string): Promise<PostRecord | null> {
  if (!UUID.test(id)) return null;
  const r = await call(`posts?select=${SELECT}&id=eq.${id}&limit=1`, { headers: headers() });
  return r.ok && Array.isArray(r.body) ? ((r.body[0] as PostRecord | undefined) ?? null) : null;
}

async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const r = await call(`posts?select=id&slug=eq.${encodeURIComponent(slug)}&limit=1`, { headers: headers() });
  if (!r.ok || !Array.isArray(r.body) || r.body.length === 0) return false;
  return (r.body[0] as { id: string }).id !== exceptId;
}

export async function uniqueSlug(title: string, exceptId?: string): Promise<string> {
  const base = slugify(title) || 'post';
  let slug = base;
  for (let i = 2; i < 30 && (await slugTaken(slug, exceptId)); i++) slug = `${base.slice(0, 70)}-${i}`;
  return slug;
}

export async function createPost(input: PostInput, author: string, authorId: string | null, status: PostStatus): Promise<{ ok: boolean; id?: string; error?: string }> {
  const slug = await uniqueSlug(input.title);
  const r = await call('posts', {
    method: 'POST',
    headers: headers({ prefer: 'return=representation' }),
    body: JSON.stringify({
      slug,
      title: input.title,
      excerpt: input.excerpt,
      body: input.body,
      tags: input.tags,
      image_url: input.image_url,
      published_at: input.published_at,
      read_minutes: readMinutes(input.body),
      author,
      author_id: authorId,
      status,
      published: status === 'published',
    }),
  });
  const row = r.ok && Array.isArray(r.body) ? (r.body[0] as { id: string } | undefined) : undefined;
  return row ? { ok: true, id: row.id } : { ok: false, error: 'The post could not be saved.' };
}

export async function updatePost(id: string, patch: Record<string, unknown>, onlyAuthorId?: string): Promise<boolean> {
  if (!UUID.test(id)) return false;
  const guard = onlyAuthorId ? `&author_id=eq.${onlyAuthorId}` : '';
  const r = await call(`posts?id=eq.${id}${guard}&select=id`, { method: 'PATCH', headers: headers({ prefer: 'return=representation' }), body: JSON.stringify(patch) });
  // A request that matches no row still succeeds in PostgREST, so check that a row really changed.
  return r.ok && Array.isArray(r.body) && r.body.length > 0;
}

export async function deletePost(id: string, onlyAuthorId?: string): Promise<boolean> {
  if (!UUID.test(id)) return false;
  const guard = onlyAuthorId ? `&author_id=eq.${onlyAuthorId}&status=neq.published` : '';
  const r = await call(`posts?id=eq.${id}${guard}&select=id`, { method: 'DELETE', headers: headers({ prefer: 'return=representation' }) });
  return r.ok && Array.isArray(r.body) && r.body.length > 0;
}
