// Reading and writing the visitor session cookies. Server only.

import { AT_COOKIE, REFRESH_DAYS, RT_COOKIE } from './config';
import { getUser, refreshSession, type AuthUser, type Tokens } from './gotrue';

const secure = () => (process.env.NODE_ENV === 'production' ? '; Secure' : '');

function cookie(name: string, value: string, maxAge: number): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0, Math.floor(maxAge))}${secure()}`;
}

export function sessionCookies(t: Tokens): string[] {
  return [cookie(AT_COOKIE, t.access_token, Math.min(t.expires_in, 60 * 60 * 24)), cookie(RT_COOKIE, t.refresh_token, REFRESH_DAYS * 86400)];
}

export function clearCookies(): string[] {
  return [cookie(AT_COOKIE, '', 0), cookie(RT_COOKIE, '', 0)];
}

export function readCookie(header: string | null | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim()) || null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

export type Who = { user: AuthUser | null; accessToken: string | null; setCookies: string[] };

/** Work out who is signed in. If the short-lived token has run out, quietly use the refresh token. */
export async function whoFromCookies(at: string | null, rt: string | null): Promise<Who> {
  if (at) {
    const me = await getUser(at);
    if (me.ok) return { user: me.value, accessToken: at, setCookies: [] };
  }
  if (rt) {
    const next = await refreshSession(rt);
    if (next.ok) {
      const me = await getUser(next.value.access_token);
      if (me.ok) return { user: me.value, accessToken: next.value.access_token, setCookies: sessionCookies(next.value) };
    }
    return { user: null, accessToken: null, setCookies: clearCookies() };
  }
  return { user: null, accessToken: null, setCookies: [] };
}

export function whoFromRequest(request: Request): Promise<Who> {
  const header = request.headers.get('cookie');
  return whoFromCookies(readCookie(header, AT_COOKIE), readCookie(header, RT_COOKIE));
}
