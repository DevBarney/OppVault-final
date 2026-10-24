import { cleanSource, normaliseEmail, subscribe } from '../../../lib/subscribe';
import { clientKey, rateLimited } from '../../../lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body: Record<string, unknown>, status = 200): Response {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

export async function POST(request: Request): Promise<Response> {
  // Only accept submissions that come from this site.
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return json({ ok: false, error: 'Request not allowed.' }, 403);
    } catch {
      return json({ ok: false, error: 'Request not allowed.' }, 403);
    }
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json({ ok: false, error: 'Send the request as JSON.' }, 415);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'That request could not be read.' }, 400);
  }

  // Hidden "company" field: people leave it empty, bots fill it in. Pretend it worked.
  if (typeof body.company === 'string' && body.company.trim() !== '') {
    return json({ ok: true, confirmation: false });
  }

  const email = normaliseEmail(body.email);
  if (!email) {
    return json({ ok: false, error: 'Enter a valid email address, like name@example.com.' }, 400);
  }

  if (rateLimited(clientKey(request.headers))) {
    return json({ ok: false, error: 'Too many attempts. Please wait a few minutes and try again.' }, 429);
  }

  const result = await subscribe({ email, source: cleanSource(body.source) });

  if (result.ok) return json({ ok: true, confirmation: result.confirmation });
  if (result.reason === 'not_configured') {
    console.error('[subscribe] No email provider configured. See .env.example.');
    return json({ ok: false, error: 'Sign-ups are not open yet. Please try again soon.' }, 503);
  }
  return json({ ok: false, error: 'We could not add you right now. Please try again in a moment.' }, 502);
}
