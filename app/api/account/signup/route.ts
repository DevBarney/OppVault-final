import { MAX_PASSWORD_BYTES, MIN_PASSWORD, accountsConfigured } from '../../../../lib/account/config';
import { signUp } from '../../../../lib/account/gotrue';
import { cleanEmail, cleanPassword, fromThisSite, readJson, reply, siteOrigin } from '../../../../lib/account/http';
import { sessionCookies } from '../../../../lib/account/session';
import { limitedBy } from '../../../../lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  if (!fromThisSite(request)) return reply({ ok: false, error: 'Request not allowed.' }, 403);
  if (!accountsConfigured) return reply({ ok: false, error: 'Accounts are not switched on yet.' }, 503);

  const body = await readJson(request);
  if (!body) return reply({ ok: false, error: 'That request could not be read.' }, 400);
  if (typeof body.company === 'string' && body.company.trim() !== '') return reply({ ok: true, confirm: true });

  const email = cleanEmail(body.email);
  if (!email) return reply({ ok: false, error: 'Enter a valid email address.' }, 400);
  if (await limitedBy(request.headers, 'signup', email)) return reply({ ok: false, error: 'Too many attempts. Please wait a while and try again.' }, 429);
  const password = cleanPassword(body.password, MIN_PASSWORD, MAX_PASSWORD_BYTES);
  if (!password) return reply({ ok: false, error: `Choose a password of at least ${MIN_PASSWORD} characters.` }, 400);
  const name = typeof body.name === 'string' ? body.name.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 80) : '';

  const result = await signUp(email, password, name, `${siteOrigin(request)}/account/callback?next=%2Faccount%2Fsaved`);
  if (!result.ok) return reply({ ok: false, error: result.message }, result.status >= 500 ? 502 : 400);
  const tokens = result.value.tokens;
  // With email confirmation on (the default), there is no session yet: ask them to check their inbox.
  return tokens ? reply({ ok: true, confirm: false }, 200, sessionCookies(tokens)) : reply({ ok: true, confirm: true });
}
