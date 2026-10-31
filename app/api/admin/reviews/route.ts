import { revalidatePath } from 'next/cache';
import { isAdminRequest, sameOrigin } from '../../../../lib/admin/auth';
import { removeStoredAvatar } from '../../../../lib/admin/avatar';
import { dbConfigured, deleteReview, getReview, listReviews, setReviewStatus } from '../../../../lib/admin/db';
import { json } from '../../../../lib/admin/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  if (!isAdminRequest(request)) return json({ ok: false, error: 'Please sign in again.' }, 401);
  if (!dbConfigured()) return json({ ok: false, error: 'The database connection is not set up yet (SUPABASE_SERVICE_ROLE_KEY).' }, 503);
  const s = new URL(request.url).searchParams.get('status');
  const status = s === 'approved' || s === 'rejected' ? s : 'pending';
  return json({ ok: true, items: await listReviews(status) });
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false, error: 'Request not allowed.' }, 403);
  if (!isAdminRequest(request)) return json({ ok: false, error: 'Please sign in again.' }, 401);
  if (!dbConfigured()) return json({ ok: false, error: 'The database connection is not set up yet.' }, 503);

  let body: { id?: unknown; action?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, error: 'That request could not be read.' }, 400);
  }
  const id = typeof body.id === 'string' ? body.id : '';
  const action = body.action;
  if (action !== 'approve' && action !== 'reject' && action !== 'delete') return json({ ok: false, error: 'That request was not valid.' }, 400);

  const review = await getReview(id);
  if (!review) return json({ ok: false, error: 'That review was not found.' }, 404);

  let ok: boolean;
  if (action === 'delete') {
    ok = await deleteReview(id);
    if (ok) await removeStoredAvatar(review.avatar_url);
  } else {
    ok = await setReviewStatus(id, action === 'approve' ? 'approved' : 'rejected');
    if (ok && action === 'reject') await removeStoredAvatar(review.avatar_url);
  }
  if (!ok) return json({ ok: false, error: 'Nothing was changed.' }, 502);
  revalidatePath('/', 'layout');
  return json({ ok: true });
}
