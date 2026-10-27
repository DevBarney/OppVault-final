// Visitor accounts: shared settings. Accounts use Supabase Auth over its REST API (no extra package).
// Visitors sign in with email and password, or with Google, LinkedIn or X. Their session lives in
// HttpOnly cookies, so page scripts never see the tokens.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
export const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const accountsConfigured = Boolean(SUPABASE_URL && PUBLIC_KEY);

export const AT_COOKIE = 'ov_at'; // short-lived access token
export const RT_COOKIE = 'ov_rt'; // longer-lived refresh token
export const REFRESH_DAYS = 30;

export const MIN_PASSWORD = 10;
export const MAX_PASSWORD_BYTES = 72; // the limit of the password hashing used by Supabase Auth

/** Only allow a same-site path as the place to go next. Anything else becomes the fallback. */
export function safeNext(value: unknown, fallback = '/account/saved'): string {
  if (typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  if (value.length > 300) return fallback;
  return value;
}
