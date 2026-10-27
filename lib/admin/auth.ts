// Admin sign-in without any extra service: one password kept in the ADMIN_PASSWORD environment
// variable, and a signed, HTTP-only cookie that expires after 8 hours. Changing the password
// signs everyone out. Never log or print the password.

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE_NAME = 'oppvault_admin';
const SESSION_SECONDS = 8 * 60 * 60;

function password(): string | null {
  const p = process.env.ADMIN_PASSWORD;
  return p && p.length >= 12 ? p : null;
}

export function adminConfigured(): boolean {
  return password() !== null;
}

function key(pw: string): Buffer {
  return createHash('sha256').update(`oppvault-admin-v1|${pw}`).digest();
}

function sign(pw: string, payload: string): string {
  return createHmac('sha256', key(pw)).update(`admin|${payload}`).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(input: unknown): boolean {
  const pw = password();
  return pw !== null && typeof input === 'string' && safeEqual(input, pw);
}

export type Role = 'owner' | 'writer';
export type Session = { uid: string; role: Role };

/** Cookie value: uid.role.expires.signature. The owner uses uid "owner"; writers use their account id. */
export function createToken(now = Date.now(), uid = 'owner', role: Role = 'owner'): string | null {
  const pw = password();
  if (!pw) return null;
  const expires = String(Math.floor(now / 1000) + SESSION_SECONDS);
  const payload = `${uid}.${role}.${expires}`;
  return `${payload}.${sign(pw, payload)}`;
}

export function readSession(token: string | undefined | null, now = Date.now()): Session | null {
  const pw = password();
  if (!pw || !token) return null;
  const parts = token.split('.');
  if (parts.length !== 4) return null;
  const [uid, role, expires, mac] = parts;
  if (role !== 'owner' && role !== 'writer') return null;
  if (!/^\d+$/.test(expires) || Number(expires) * 1000 < now) return null;
  if (role === 'owner' && uid !== 'owner') return null;
  if (!safeEqual(mac, sign(pw, `${uid}.${role}.${expires}`))) return null;
  return { uid, role };
}

/** True only for the owner session. Every owner-only route and page uses this. */
export function verifyToken(token: string | undefined | null, now = Date.now()): boolean {
  return readSession(token, now)?.role === 'owner';
}

export function sessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure}`;
}

export function clearCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

export function tokenFromRequest(request: Request): string | null {
  const header = request.headers.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE_NAME) return rest.join('=');
  }
  return null;
}

/** Owner only. */
export function isAdminRequest(request: Request): boolean {
  return verifyToken(tokenFromRequest(request));
}

/** Owner or writer (a writer still has to be checked against the database for being active). */
export function sessionFromRequest(request: Request): Session | null {
  return readSession(tokenFromRequest(request));
}

/** State-changing requests must come from this site (the cookie is also SameSite=Strict). */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
