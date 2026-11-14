// Who is visiting, for server-rendered pages. Server only.
// Pages cannot set cookies, so they never use the refresh token themselves: if the short-lived token has
// run out they answer 'refresh' and the page sends the visitor through /api/account/refresh first.

import { cookies } from 'next/headers';
import { AT_COOKIE, RT_COOKIE, START_COOKIE } from './config';
import { sessionExpired } from './session';
import { getUser, type AuthUser } from './gotrue';

export type Visitor = { user: AuthUser; accessToken: string };

export async function currentVisitor(): Promise<Visitor | 'refresh' | null> {
  const jar = await cookies();
  const at = jar.get(AT_COOKIE)?.value;
  const rt = jar.get(RT_COOKIE)?.value;
  const started = Number(jar.get(START_COOKIE)?.value);
  // A sign-in that has used up its time counts as signed out; the refresh route then clears it.
  if ((at || rt) && sessionExpired(Number.isFinite(started) && started > 0 ? started : null)) return rt ? 'refresh' : null;
  if (at) {
    const me = await getUser(at);
    if (me.ok) return { user: me.value, accessToken: at };
  }
  return rt ? 'refresh' : null;
}
