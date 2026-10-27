import { revalidatePath } from 'next/cache';
import { sameOrigin, sessionFromRequest, type Session } from '../../../../lib/admin/auth';
import { dbConfigured } from '../../../../lib/admin/db';
import { json } from '../../../../lib/admin/http';
import { createPost, deletePost, getPostById, listPosts, updatePost, validatePost, readMinutes, uniqueSlug } from '../../../../lib/admin/posts';
import { activeWriter } from '../../../../lib/admin/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Who = { session: Session; name: string; avatar: string | null };

/** Owner or an active writer. Writers are re-checked against the database on every request. */
async function who(request: Request): Promise<Who | Response> {
  const session = sessionFromRequest(request);
  if (!session) return json({ ok: false, error: 'Please sign in again.' }, 401);
  if (!dbConfigured()) return json({ ok: false, error: 'The database connection is not set up yet (SUPABASE_SERVICE_ROLE_KEY).' }, 503);
  if (session.role === 'owner') return { session, name: 'OppVault team', avatar: null };
  const u = await activeWriter(session.uid);
  if (!u) return json({ ok: false, error: 'This account is switched off. Ask the owner.' }, 401);
  return { session, name: u.name, avatar: u.avatar_url };
}

export async function GET(request: Request): Promise<Response> {
  const w = await who(request);
  if (w instanceof Response) return w;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const owner = w.session.role === 'owner';
  if (id) {
    const post = await getPostById(id);
    if (!post || (!owner && post.author_id !== w.session.uid)) return json({ ok: false, error: 'Post not found.' }, 404);
    return json({ ok: true, post });
  }
  const items = await listPosts(owner ? null : w.session.uid, url.searchParams.get('status') ?? undefined);
  return json({ ok: true, items, role: w.session.role });
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false, error: 'Request not allowed.' }, 403);
  const w = await who(request);
  if (w instanceof Response) return w;
  const owner = w.session.role === 'owner';
  const mine = owner ? undefined : w.session.uid;

  let b: Record<string, unknown>;
  try {
    b = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'That request could not be read.' }, 400);
  }
  const action = b.action;
  const id = typeof b.id === 'string' ? b.id : '';

  if (action === 'save' || action === 'submit' || action === 'publish') {
    if (action === 'publish' && !owner) return json({ ok: false, error: 'Only the owner can publish. Use "Send for review".' }, 403);
    const v = validatePost(b);
    if (!v.ok) return json({ ok: false, error: v.error }, 400);
    const status = action === 'publish' ? 'published' : action === 'submit' ? 'review' : 'draft';

    if (!id) {
      const created = await createPost(v.data, w.name, owner ? null : w.session.uid, status, w.avatar);
      if (!created.ok) return json({ ok: false, error: created.error ?? 'Could not save.' }, 502);
      if (status === 'published') revalidatePath('/', 'layout');
      return json({ ok: true, id: created.id, status });
    }

    const existing = await getPostById(id);
    if (!existing || (!owner && existing.author_id !== w.session.uid)) return json({ ok: false, error: 'Post not found.' }, 404);
    if (!owner && existing.status === 'published') return json({ ok: false, error: 'This post is live. Ask the owner to change it.' }, 403);

    const patch: Record<string, unknown> = {
      title: v.data.title,
      excerpt: v.data.excerpt,
      body: v.data.body,
      tags: v.data.tags,
      image_url: v.data.image_url,
      published_at: v.data.published_at,
      read_minutes: readMinutes(v.data.body),
      status: owner && action === 'save' ? existing.status : status,
      published: owner && action === 'save' ? existing.published : status === 'published',
    };
    if (!owner) patch.author_avatar = w.avatar;
    if (owner && typeof b.author === 'string' && b.author.trim()) patch.author = b.author.trim().slice(0, 80);
    if (owner && typeof b.slug === 'string' && b.slug.trim()) {
      const slug = await uniqueSlug(b.slug, id);
      patch.slug = slug;
    }
    if (status === 'review') patch.review_note = '';
    const ok = await updatePost(id, patch, mine);
    if (!ok) return json({ ok: false, error: 'The post could not be saved. The web address may already be used.' }, 409);
    if (existing.published || status === 'published') revalidatePath('/', 'layout');
    return json({ ok: true, id, status: patch.status });
  }

  if (action === 'unpublish' || action === 'to_draft' || action === 'reject') {
    if (!owner) return json({ ok: false, error: 'Only the owner can do that.' }, 403);
    const note = typeof b.note === 'string' ? b.note.slice(0, 500) : '';
    const ok = await updatePost(id, { status: 'draft', published: false, ...(action === 'reject' ? { review_note: note } : {}) });
    if (!ok) return json({ ok: false, error: 'Nothing was changed.' }, 400);
    revalidatePath('/', 'layout');
    return json({ ok: true });
  }

  if (action === 'delete') {
    const ok = await deletePost(id, mine);
    if (!ok) return json({ ok: false, error: owner ? 'Nothing was deleted.' : 'You can only delete your own posts that are not live.' }, 400);
    revalidatePath('/', 'layout');
    return json({ ok: true });
  }

  return json({ ok: false, error: 'That request was not valid.' }, 400);
}
