// Thin wrapper over Supabase Auth (GoTrue) REST endpoints. Server only.

import { PUBLIC_KEY, SUPABASE_URL } from './config';

export type Tokens = { access_token: string; refresh_token: string; expires_in: number };
export type AuthUser = { id: string; email: string; name: string };
export type Failure = { ok: false; status: number; code: string; message: string };
export type Result<T> = { ok: true; value: T } | Failure;

type Raw = { status: number; data: Record<string, unknown> };

async function call(
  path: string,
  init: { method: string; body?: unknown; token?: string; query?: Record<string, string>; key?: string },
): Promise<Raw> {
  const key = init.key ?? PUBLIC_KEY;
  if (!SUPABASE_URL || !key) return { status: 503, data: { error_code: 'not_configured' } };
  const qs = init.query ? `?${new URLSearchParams(init.query).toString()}` : '';
  const bearer = init.token ?? (key.startsWith('eyJ') ? key : undefined);
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}${qs}`, {
      method: init.method,
      headers: {
        apikey: key,
        'content-type': 'application/json',
        ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      data = {};
    }
    return { status: res.status, data };
  } catch {
    return { status: 502, data: { error_code: 'network' } };
  }
}

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'That email or password is not right.',
  email_not_confirmed: 'Please confirm your email first. Check your inbox for the link we sent.',
  user_already_exists: 'That email already has an account. Try signing in instead.',
  email_exists: 'That email already has an account. Try signing in instead.',
  weak_password: 'That password is too easy to guess. Try a longer one with a mix of characters.',
  over_email_send_rate_limit: 'We have sent a lot of emails just now. Please try again in a little while.',
  over_request_rate_limit: 'Too many attempts. Please wait a few minutes and try again.',
  signup_disabled: 'New sign-ups are switched off right now.',
  not_configured: 'Accounts are not switched on yet.',
  network: 'We could not reach the sign-in service. Please try again.',
  same_password: 'Choose a password you have not used before.',
};

function failure(raw: Raw): Failure {
  const code = String(raw.data.error_code ?? raw.data.code ?? raw.data.error ?? 'error');
  const known = MESSAGES[code];
  const message = known ?? (raw.status >= 500 ? 'Something went wrong on our side. Please try again.' : 'That did not work. Please check your details and try again.');
  return { ok: false, status: raw.status, code, message };
}

function asTokens(data: Record<string, unknown>): Tokens | null {
  const { access_token, refresh_token, expires_in } = data;
  if (typeof access_token === 'string' && typeof refresh_token === 'string') {
    return { access_token, refresh_token, expires_in: typeof expires_in === 'number' ? expires_in : 3600 };
  }
  return null;
}

function asUser(data: Record<string, unknown>): AuthUser | null {
  const id = data.id;
  if (typeof id !== 'string') return null;
  const meta = (data.user_metadata ?? {}) as Record<string, unknown>;
  const pick = [meta.full_name, meta.name, meta.user_name].find((v) => typeof v === 'string' && v.trim()) as string | undefined;
  return { id, email: typeof data.email === 'string' ? data.email : '', name: (pick ?? '').trim().slice(0, 80) };
}

export async function signUp(email: string, password: string, name: string, redirectTo: string): Promise<Result<{ tokens: Tokens | null }>> {
  const raw = await call('signup', {
    method: 'POST',
    query: { redirect_to: redirectTo },
    body: { email, password, data: name ? { full_name: name } : {} },
  });
  if (raw.status >= 400) return failure(raw);
  return { ok: true, value: { tokens: asTokens(raw.data) } };
}

export async function signInWithPassword(email: string, password: string): Promise<Result<Tokens>> {
  const raw = await call('token', { method: 'POST', query: { grant_type: 'password' }, body: { email, password } });
  const tokens = raw.status < 400 ? asTokens(raw.data) : null;
  return tokens ? { ok: true, value: tokens } : failure(raw);
}

export async function refreshSession(refreshToken: string): Promise<Result<Tokens>> {
  const raw = await call('token', { method: 'POST', query: { grant_type: 'refresh_token' }, body: { refresh_token: refreshToken } });
  const tokens = raw.status < 400 ? asTokens(raw.data) : null;
  return tokens ? { ok: true, value: tokens } : failure(raw);
}

export async function getUser(accessToken: string): Promise<Result<AuthUser>> {
  const raw = await call('user', { method: 'GET', token: accessToken });
  const user = raw.status < 400 ? asUser(raw.data) : null;
  return user ? { ok: true, value: user } : failure(raw);
}

export async function signOutToken(accessToken: string): Promise<void> {
  await call('logout', { method: 'POST', token: accessToken, query: { scope: 'local' } });
}

export async function sendRecovery(email: string, redirectTo: string): Promise<Result<true>> {
  const raw = await call('recover', { method: 'POST', query: { redirect_to: redirectTo }, body: { email } });
  return raw.status < 400 ? { ok: true, value: true } : failure(raw);
}

export async function setPassword(accessToken: string, password: string): Promise<Result<true>> {
  const raw = await call('user', { method: 'PUT', token: accessToken, body: { password } });
  return raw.status < 400 ? { ok: true, value: true } : failure(raw);
}

/** Remove a user for good. Needs the server-only service key. */
export async function deleteUser(userId: string): Promise<boolean> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key || !/^[0-9a-f-]{36}$/i.test(userId)) return false;
  const raw = await call(`admin/users/${userId}`, { method: 'DELETE', key, token: key });
  return raw.status < 400;
}
