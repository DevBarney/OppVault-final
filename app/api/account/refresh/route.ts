import { AT_COOKIE, RT_COOKIE, safeNext } from '../../../../lib/account/config';
import { clearCookies, readCookie, whoFromCookies } from '../../../../lib/account/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Pages send people here when their short-lived sign-in has run out. It renews it and sends them back. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get('next'));
  const header = request.headers.get('cookie');
  const who = await whoFromCookies(readCookie(header, AT_COOKIE), readCookie(header, RT_COOKIE));
  const headers = new Headers({ 'cache-control': 'no-store' });
  const target = who.user ? next : `/account/sign-in?next=${encodeURIComponent(next)}`;
  headers.set('location', target);
  for (const c of who.user ? who.setCookies : clearCookies()) headers.append('set-cookie', c);
  return new Response(null, { status: 303, headers });
}
