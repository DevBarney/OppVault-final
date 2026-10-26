import { adminConfigured, checkPassword, createToken, sameOrigin, sessionCookie } from '../../../../lib/admin/auth';
import { json } from '../../../../lib/admin/http';
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
  let body: { password?: unknown };
  try {
    body = (await request.json()) as { password?: unknown };
  } catch {
    return json({ ok: false, error: 'That request could not be read.' }, 400);
  }
  if (!checkPassword(body.password)) return json({ ok: false, error: 'That password is not right.' }, 401);
  const token = createToken();
  if (!token) return json({ ok: false, error: 'Sign-in is unavailable.' }, 503);
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie(token) });
}
