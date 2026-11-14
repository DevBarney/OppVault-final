import { accountsConfigured } from '../../../../lib/account/config';
import { resendSignup } from '../../../../lib/account/gotrue';
import { cleanEmail, fromThisSite, readJson, reply, siteOrigin } from '../../../../lib/account/http';
import { limitedBy } from '../../../../lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** "Send the confirmation email again". Always answers the same way, so it cannot be used to find out who has an account. */
export async function POST(request: Request): Promise<Response> {
  if (!fromThisSite(request)) return reply({ ok: false, error: 'Request not allowed.' }, 403);
  if (!accountsConfigured) return reply({ ok: false, error: 'Accounts are not switched on yet.' }, 503);
  const body = await readJson(request);
  const email = cleanEmail(body?.email);
  if (!email) return reply({ ok: false, error: 'Enter a valid email address.' }, 400);
  if (await limitedBy(request.headers, 'resend', email)) return reply({ ok: false, error: 'Too many attempts. Please wait a while and try again.' }, 429);
  await resendSignup(email, `${siteOrigin(request)}/account/callback?next=%2Faccount%2Fsaved`);
  return reply({ ok: true });
}
