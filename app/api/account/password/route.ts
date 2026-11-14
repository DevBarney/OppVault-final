import { MAX_PASSWORD_BYTES, MIN_PASSWORD } from '../../../../lib/account/config';
import { setPassword, signInWithPassword, signOutOtherDevices } from '../../../../lib/account/gotrue';
import { cleanPassword, fromThisSite, readJson, reply } from '../../../../lib/account/http';
import { whoFromRequest } from '../../../../lib/account/session';
import { tooMany } from '../../../../lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  if (!fromThisSite(request)) return reply({ ok: false, error: 'Request not allowed.' }, 403);
  const who = await whoFromRequest(request);
  if (!who.user || !who.accessToken) return reply({ ok: false, error: 'Please sign in first.' }, 401, who.setCookies);
  const body = await readJson(request);
  const password = cleanPassword(body?.password, MIN_PASSWORD, MAX_PASSWORD_BYTES);
  if (!password) return reply({ ok: false, error: `Choose a password of at least ${MIN_PASSWORD} characters.` }, 400, who.setCookies);
  // Changing the password needs the current one, so a stolen session alone cannot take the account over.
  if (await tooMany(`pwchange:${who.user.id}`, 6, 3600)) return reply({ ok: false, error: 'Too many attempts. Please wait a while and try again.' }, 429, who.setCookies);
  const current = typeof body?.current === 'string' ? body.current : '';
  if (!current || current.length > 200 || !who.user.email) return reply({ ok: false, error: 'Enter your current password.' }, 400, who.setCookies);
  const proof = await signInWithPassword(who.user.email, current);
  if (!proof.ok) return reply({ ok: false, error: 'Your current password is not right.' }, 400, who.setCookies);
  const result = await setPassword(who.accessToken, password);
  if (!result.ok) return reply({ ok: false, error: result.message }, 400, who.setCookies);
  // A new password ends every other session, so a stolen or forgotten sign-in dies with the old password.
  await signOutOtherDevices(who.accessToken);
  return reply({ ok: true }, 200, who.setCookies);
}
