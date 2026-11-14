import { setDisplayName } from '../../../../lib/account/gotrue';
import { fromThisSite, readJson, reply } from '../../../../lib/account/http';
import { whoFromRequest } from '../../../../lib/account/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NAME_MAX = 60;

/** Change the name shown on the account. Empty clears it. */
export async function POST(request: Request): Promise<Response> {
  if (!fromThisSite(request)) return reply({ ok: false, error: 'Request not allowed.' }, 403);
  const who = await whoFromRequest(request);
  if (!who.user || !who.accessToken) return reply({ ok: false, error: 'Please sign in first.' }, 401, who.setCookies);
  const body = await readJson(request);
  const raw = typeof body?.name === 'string' ? body.name : '';
  // eslint-disable-next-line no-control-regex
  const name = raw.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim();
  if (name.length > NAME_MAX) return reply({ ok: false, error: `Keep your name to ${NAME_MAX} characters or fewer.` }, 400, who.setCookies);
  const result = await setDisplayName(who.accessToken, name);
  if (!result.ok) return reply({ ok: false, error: result.message }, 400, who.setCookies);
  return reply({ ok: true, name }, 200, who.setCookies);
}
