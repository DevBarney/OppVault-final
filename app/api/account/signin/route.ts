import { accountsConfigured } from '../../../../lib/account/config';
import { signInWithPassword } from '../../../../lib/account/gotrue';
import { cleanEmail, fromThisSite, readJson, reply } from '../../../../lib/account/http';
import { sessionCookies } from '../../../../lib/account/session';
import { clientKey, rateLimited } from '../../../../lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  if (!fromThisSite(request)) return reply({ ok: false, error: 'Request not allowed.' }, 403);
  if (!accountsConfigured) return reply({ ok: false, error: 'Accounts are not switched on yet.' }, 503);
  if (rateLimited(`signin:${clientKey(request.headers)}`)) return reply({ ok: false, error: 'Too many attempts. Please wait a few minutes.' }, 429);

  const body = await readJson(request);
  const email = cleanEmail(body?.email);
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || !password || password.length > 200) return reply({ ok: false, error: 'Enter your email and password.' }, 400);

  const result = await signInWithPassword(email, password);
  if (!result.ok) return reply({ ok: false, error: result.message }, result.status >= 500 ? 502 : 401);
  return reply({ ok: true }, 200, sessionCookies(result.value));
}
