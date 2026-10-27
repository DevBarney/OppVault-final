import { MAX_PASSWORD_BYTES, MIN_PASSWORD } from '../../../../lib/account/config';
import { setPassword } from '../../../../lib/account/gotrue';
import { cleanPassword, fromThisSite, readJson, reply } from '../../../../lib/account/http';
import { whoFromRequest } from '../../../../lib/account/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  if (!fromThisSite(request)) return reply({ ok: false, error: 'Request not allowed.' }, 403);
  const who = await whoFromRequest(request);
  if (!who.user || !who.accessToken) return reply({ ok: false, error: 'Please sign in first.' }, 401, who.setCookies);
  const body = await readJson(request);
  const password = cleanPassword(body?.password, MIN_PASSWORD, MAX_PASSWORD_BYTES);
  if (!password) return reply({ ok: false, error: `Choose a password of at least ${MIN_PASSWORD} characters.` }, 400, who.setCookies);
  const result = await setPassword(who.accessToken, password);
  if (!result.ok) return reply({ ok: false, error: result.message }, 400, who.setCookies);
  return reply({ ok: true }, 200, who.setCookies);
}
