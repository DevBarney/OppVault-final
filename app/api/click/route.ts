import { createHash, createHmac } from 'node:crypto';
import { sameOrigin } from '../../../lib/admin/auth';
import { call, dbConfigured, headers } from '../../../lib/admin/db';
import { addPending } from '../../../lib/account/applied';
import { reply } from '../../../lib/account/http';
import { whoFromRequest } from '../../../lib/account/session';
import { isCategorySlug } from '../../../lib/categories';
import { clientKey, tooMany } from '../../../lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * An anonymous key for "this person, today". It mixes a server secret, today's date, the address and the browser type,
 * so it is different every day and cannot be turned back into an address. It is stored only to count people once.
 */
function visitorKey(request: Request): string {
  const secret = createHash('sha256').update(`visitor-v1|${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`).digest();
  const day = new Date().toISOString().slice(0, 10);
  return createHmac('sha256', secret).update(`${day}|${clientKey(request.headers)}|${request.headers.get('user-agent') ?? ''}`).digest('hex').slice(0, 32);
}

const REF = /^([a-z-]{3,20})\/([a-z0-9][a-z0-9-]{0,199})$/i;

/**
 * Counts one click on a listing's "official site" button, anonymously. No account, cookie or address is stored.
 * It also counts how many different people clicked, using a key that changes every day.
 * To keep the numbers honest: the same visitor counts once per listing per day, and one visitor is capped per hour.
 * (The visitor's address is only used, hashed, as a short-lived key for those two limits.)
 */
export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return reply({ ok: false }, 403);
  if (!request.headers.get('content-type')?.includes('application/json')) return reply({ ok: false }, 415);
  let body: { ref?: unknown };
  try {
    body = (await request.json()) as { ref?: unknown };
  } catch {
    return reply({ ok: false }, 400);
  }
  const m = typeof body.ref === 'string' ? REF.exec(body.ref) : null;
  if (!m || !isCategorySlug(m[1]) || !dbConfigured()) return reply({ ok: true });
  const [, category, rawSlug] = m;
  const slug = rawSlug.toLowerCase();

  const who = createHash('sha256').update(`click|${clientKey(request.headers)}`).digest('hex').slice(0, 24);
  if (await tooMany(`click:hour:${who}`, 60, 3600)) return reply({ ok: true });

  // Only real, published listings count.
  const found = await call(`opportunities?select=id&category=eq.${encodeURIComponent(category)}&slug=eq.${encodeURIComponent(slug)}&published=eq.true&limit=1`, { headers: headers() });
  if (!found.ok || !Array.isArray(found.body) || found.body.length === 0) return reply({ ok: true });

  // Signed in? Then the listing is kept under Pending in their applications (an existing entry is never changed).
  const me = await whoFromRequest(request);
  if (me.user && me.accessToken) await addPending(me.accessToken, { category, slug });

  // The anonymous count: the same visitor counts once per listing per day.
  if (!(await tooMany(`click:${who}:${category}/${slug}`, 1, 86400))) {
    await call('rpc/click_hit', { method: 'POST', headers: headers(), body: JSON.stringify({ p_category: category, p_slug: slug }) });
  }
  // How many different people were sent on: one anonymous, daily-changing key each (see visitorKey).
  await call('rpc/click_visitor', { method: 'POST', headers: headers(), body: JSON.stringify({ p_h: visitorKey(request) }) });
  return reply({ ok: true }, 200, me.setCookies);
}
