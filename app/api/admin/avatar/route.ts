import { revalidatePath } from 'next/cache';
import { sameOrigin, sessionFromRequest } from '../../../../lib/admin/auth';
import { MAX_AVATAR_BYTES, sniffImage, uploadAvatar } from '../../../../lib/admin/avatar';
import { dbConfigured } from '../../../../lib/admin/db';
import { json } from '../../../../lib/admin/http';
import { activeWriter, findById, updateUser } from '../../../../lib/admin/users';
import { call, headers } from '../../../../lib/admin/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** A writer sets their own picture; the owner can set any writer's (send userId). */
export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false, error: 'Request not allowed.' }, 403);
  const session = sessionFromRequest(request);
  if (!session) return json({ ok: false, error: 'Please sign in again.' }, 401);
  if (!dbConfigured()) return json({ ok: false, error: 'The database connection is not set up yet.' }, 503);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'That upload could not be read.' }, 400);
  }
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return json({ ok: false, error: 'Choose a picture first.' }, 400);
  if (file.size > MAX_AVATAR_BYTES) return json({ ok: false, error: 'That picture is too large. Pick a smaller one.' }, 413);

  let targetId: string;
  if (session.role === 'owner') {
    targetId = typeof form.get('userId') === 'string' ? (form.get('userId') as string) : '';
    if (!(await findById(targetId))) return json({ ok: false, error: 'That writer was not found.' }, 404);
  } else {
    if (!(await activeWriter(session.uid))) return json({ ok: false, error: 'This account is switched off.' }, 401);
    targetId = session.uid;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) return json({ ok: false, error: 'Use a JPG, PNG or WebP picture.' }, 400);

  try {
    const url = await uploadAvatar(targetId, bytes, kind.ext, kind.mime);
    if (!(await updateUser(targetId, { avatar_url: url }))) return json({ ok: false, error: 'The picture was stored but the profile could not be updated.' }, 502);
    // Posts carry a copy of the picture so the public blog needs no extra lookup.
    await call(`posts?author_id=eq.${targetId}`, { method: 'PATCH', headers: headers({ prefer: 'return=minimal' }), body: JSON.stringify({ author_avatar: url }) });
    revalidatePath('/', 'layout');
    return json({ ok: true, url });
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : 'Could not save the picture.' }, 502);
  }
}
