import { AT_COOKIE } from '../../../../lib/account/config';
import { signOutToken } from '../../../../lib/account/gotrue';
import { fromThisSite, reply } from '../../../../lib/account/http';
import { clearCookies, readCookie } from '../../../../lib/account/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  if (!fromThisSite(request)) return reply({ ok: false, error: 'Request not allowed.' }, 403);
  const at = readCookie(request.headers.get('cookie'), AT_COOKIE);
  if (at) await signOutToken(at);
  return reply({ ok: true }, 200, clearCookies());
}
