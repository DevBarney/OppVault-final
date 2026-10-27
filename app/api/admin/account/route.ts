import { sameOrigin, sessionFromRequest } from '../../../../lib/admin/auth';
import { json } from '../../../../lib/admin/http';
import { findById, hashPassword, updateUser, validPassword, verifyHash } from '../../../../lib/admin/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** A writer changes their own password. (The owner password is changed in Vercel.) */
export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false, error: 'Request not allowed.' }, 403);
  const session = sessionFromRequest(request);
  if (!session || session.role !== 'writer') return json({ ok: false, error: 'Please sign in again.' }, 401);
  let b: { current?: unknown; next?: unknown };
  try {
    b = (await request.json()) as typeof b;
  } catch {
    return json({ ok: false, error: 'That request could not be read.' }, 400);
  }
  const user = await findById(session.uid);
  if (!user || !user.active || typeof b.current !== 'string' || !verifyHash(b.current, user.password_hash)) {
    return json({ ok: false, error: 'Your current password is not right.' }, 401);
  }
  if (!validPassword(b.next)) return json({ ok: false, error: 'The new password needs at least 10 characters.' }, 400);
  return (await updateUser(user.id, { password_hash: hashPassword(b.next) })) ? json({ ok: true }) : json({ ok: false, error: 'Could not change the password.' }, 502);
}
