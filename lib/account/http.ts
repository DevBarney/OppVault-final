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

export function siteOrigin(request: Request): string {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
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
