// Small helpers for the account API routes. Server only.

export function reply(body: Record<string, unknown>, status = 200, cookies: string[] = []): Response {
  const headers = new Headers({ 'cache-control': 'no-store' });
  for (const c of cookies) headers.append('set-cookie', c);
  return Response.json(body, { status, headers });
}

/** Accept posts only from this site. */
export function fromThisSite(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  if (!request.headers.get('content-type')?.includes('application/json')) return null;
  try {
    const body = (await request.json()) as unknown;
    return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * The address used in links we put in emails. It never comes straight from the request: a made-up Host header
 * could otherwise point a reset link at someone else's site. Only our own domains (and local testing) are used.
 * Set SITE_URL to change the default.
 */
const CANONICAL = (process.env.SITE_URL?.trim().replace(/\/+$/, '') || 'https://www.oppvault.app');
const KNOWN_HOSTS = new Set(['oppvault.app', 'www.oppvault.app', new URL(CANONICAL).host]);

export function siteOrigin(request: Request): string {
  const host = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '').toLowerCase();
  if (KNOWN_HOSTS.has(host)) return `https://${host}`;
  if (process.env.NODE_ENV !== 'production' && /^localhost(:\d+)?$/.test(host)) return `http://${host}`;
  return CANONICAL;
}

export function cleanEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  return v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? v : null;
}

export function cleanPassword(value: unknown, min: number, maxBytes: number): string | null {
  if (typeof value !== 'string') return null;
  if (value.length < min || Buffer.byteLength(value, 'utf8') > maxBytes) return null;
  return value;
}
