import { accountsConfigured } from '../../../../lib/account/config';
import { getUser } from '../../../../lib/account/gotrue';
import { fromThisSite, readJson, reply } from '../../../../lib/account/http';
import { sessionCookies } from '../../../../lib/account/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Turns the tokens a social sign-in hands back into our own HttpOnly cookies, after checking them. */
export async function POST(request: Request): Promise<Response> {
  if (!fromThisSite(request)) return reply({ ok: false, error: 'Request not allowed.' }, 403);
  if (!accountsConfigured) return reply({ ok: false, error: 'Accounts are not switched on yet.' }, 503);
  const body = await readJson(request);
  const at = body?.access_token;
  const rt = body?.refresh_token;
  if (typeof at !== 'string' || typeof rt !== 'string' || at.length > 4000 || rt.length > 500) {
    return reply({ ok: false, error: 'That sign-in could not be completed.' }, 400);
  }
  const me = await getUser(at);
  if (!me.ok) return reply({ ok: false, error: 'That sign-in link has expired. Please try again.' }, 401);
  const expires = typeof body?.expires_in === 'number' && body.expires_in > 0 ? Math.min(body.expires_in, 86400) : 3600;
  return reply({ ok: true }, 200, sessionCookies({ access_token: at, refresh_token: rt, expires_in: expires }));
}
