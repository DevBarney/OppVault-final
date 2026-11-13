import { AT_COOKIE } from '../../../../lib/account/config';
import { signOutEverywhere, signOutToken } from '../../../../lib/account/gotrue';
import { fromThisSite, readJson, reply } from '../../../../lib/account/http';
import { clearCookies, readCookie } from '../../../../lib/account/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  if (!fromThisSite(request)) return reply({ ok: false, error: 'Request not allowed.' }, 403);
  const at = readCookie(request.headers.get('cookie'), AT_COOKIE);
  const body = await readJson(request);
  if (at) {
    if (body?.all === true) await signOutEverywhere(at);
    else await signOutToken(at);
  }
  return reply({ ok: true }, 200, clearCookies());
}
