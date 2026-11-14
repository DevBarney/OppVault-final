// Reading and writing the visitor session cookies. Server only.

import { AT_COOKIE, FLAG_COOKIE, REFRESH_DAYS, RT_COOKIE, SESSION_SECONDS, START_COOKIE } from './config';
import { getUser, refreshSession, type AuthUser, type Tokens } from './gotrue';

const secure = () => (process.env.NODE_ENV === 'production' ? '; Secure' : '');

function cookie(name: string, value: string, maxAge: number, httpOnly = true): string {
  return `${name}=${encodeURIComponent(value)}; Path=/;${httpOnly ? ' HttpOnly;' : ''} SameSite=Lax; Max-Age=${Math.max(0, Math.floor(maxAge))}${secure()}`;
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

/** True once a sign-in that began at `started` (seconds) has used up its allowed time. No start time means "just now". */
export function sessionExpired(started: number | null | undefined): boolean {
  return typeof started === 'number' && nowSeconds() - started >= SESSION_SECONDS;
}

export function readStarted(header: string | null | undefined): number | null {
  const n = Number(readCookie(header, START_COOKIE));
  return Number.isFinite(n) && n > 0 && n <= nowSeconds() + 60 ? Math.floor(n) : null;
}

/** Cookies for a session. `started` is when the sign-in began: a fresh sign-in omits it, a renewal passes it on unchanged. */
export function sessionCookies(t: Tokens, started: number = nowSeconds()): string[] {
  const left = Math.max(0, started + SESSION_SECONDS - nowSeconds());
  const keep = Math.min(REFRESH_DAYS * 86400, left);
  return [
    cookie(AT_COOKIE, t.access_token, Math.min(t.expires_in, 60 * 60 * 24, left)),
    cookie(RT_COOKIE, t.refresh_token, keep),
    // Tells the page "someone may be signed in", so anonymous visitors never need to ask the server.
    cookie(FLAG_COOKIE, '1', keep, false),
    cookie(START_COOKIE, String(started), keep),
  ];
}

export function clearCookies(): string[] {
  return [cookie(AT_COOKIE, '', 0), cookie(RT_COOKIE, '', 0), cookie(FLAG_COOKIE, '', 0, false), cookie(START_COOKIE, '', 0)];
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
export async function whoFromCookies(at: string | null, rt: string | null, started: number | null = null): Promise<Who> {
  if (sessionExpired(started)) return { user: null, accessToken: null, setCookies: clearCookies() };
  if (at) {
    const me = await getUser(at);
    if (me.ok) return { user: me.value, accessToken: at, setCookies: [] };
  }
  if (rt) {
    const next = await refreshSession(rt);
    if (next.ok) {
      const me = await getUser(next.value.access_token);
      if (me.ok) return { user: me.value, accessToken: next.value.access_token, setCookies: sessionCookies(next.value, started ?? undefined) };
    }
    return { user: null, accessToken: null, setCookies: clearCookies() };
  }
  return { user: null, accessToken: null, setCookies: [] };
}

export function whoFromRequest(request: Request): Promise<Who> {
  const header = request.headers.get('cookie');
  return whoFromCookies(readCookie(header, AT_COOKIE), readCookie(header, RT_COOKIE), readStarted(header));
}
