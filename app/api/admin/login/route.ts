import { adminConfigured, checkPassword, createToken, sameOrigin, sessionCookie } from '../../../../lib/admin/auth';
import { dbConfigured } from '../../../../lib/admin/db';
import { json } from '../../../../lib/admin/http';
import { cleanEmail, findByEmail, updateUser, verifyHash } from '../../../../lib/admin/users';
import { clientKey, rateLimited } from '../../../../lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false, error: 'Request not allowed.' }, 403);
  if (!adminConfigured()) {
    return json({ ok: false, error: 'The admin area is not switched on yet. Add ADMIN_PASSWORD (at least 12 characters) in Vercel.' }, 503);
  }
  if (rateLimited(`admin-login:${clientKey(request.headers)}`)) {
    return json({ ok: false, error: 'Too many attempts. Please wait ten minutes.' }, 429);
  }
  let body: { password?: unknown; email?: unknown };
  try {
    body = (await request.json()) as { password?: unknown; email?: unknown };
  } catch {
    return json({ ok: false, error: 'That request could not be read.' }, 400);
  }
  const password = typeof body.password === 'string' ? body.password : '';
  const emailGiven = typeof body.email === 'string' && body.email.trim() !== '';

  // No email: the owner password.
  if (!emailGiven) {
    if (!checkPassword(password)) return json({ ok: false, error: 'That password is not right.' }, 401);
    const token = createToken();
    return token ? json({ ok: true, role: 'owner' }, 200, { 'set-cookie': sessionCookie(token) }) : json({ ok: false, error: 'Sign-in is unavailable.' }, 503);
  }

  // Email given: a team member (writer).
  const bad = json({ ok: false, error: 'That email or password is not right.' }, 401);
  const email = cleanEmail(body.email);
  if (!email || !dbConfigured()) {
    verifyHash(password, null);
    return bad;
  }
  const user = await findByEmail(email);
  const good = verifyHash(password, user?.password_hash);
  if (!user || !good || !user.active) return bad;
  const token = createToken(Date.now(), user.id, 'writer');
  if (!token) return json({ ok: false, error: 'Sign-in is unavailable.' }, 503);
  await updateUser(user.id, { last_login: new Date().toISOString() });
  return json({ ok: true, role: 'writer' }, 200, { 'set-cookie': sessionCookie(token) });
}
