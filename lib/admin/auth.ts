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

function sign(pw: string, expires: string): string {
  return createHmac('sha256', key(pw)).update(`admin|${expires}`).digest('hex');
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

export function createToken(now = Date.now()): string | null {
  const pw = password();
  if (!pw) return null;
  const expires = String(Math.floor(now / 1000) + SESSION_SECONDS);
  return `${expires}.${sign(pw, expires)}`;
}

export function verifyToken(token: string | undefined | null, now = Date.now()): boolean {
  const pw = password();
  if (!pw || !token) return false;
  const [expires, mac] = token.split('.');
  if (!expires || !mac || !/^\d+$/.test(expires)) return false;
  if (Number(expires) * 1000 < now) return false;
  return safeEqual(mac, sign(pw, expires));
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

export function isAdminRequest(request: Request): boolean {
  return verifyToken(tokenFromRequest(request));
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
