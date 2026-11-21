import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { call, dbConfigured, headers } from '../../lib/admin/db';
import { WHATSAPP_URL } from '../../lib/config';
import { joinSource } from '../../lib/join';
import { clientKey, tooMany } from '../../lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * oppvault.app/join: sends the visitor to the WhatsApp community and counts the open, anonymously, by source.
 * The destination can change later (NEXT_PUBLIC_WHATSAPP_URL) without reprinting a flyer. The same visitor counts once
 * per source per hour, and one visitor is capped per hour. The address is only used, hashed, as a short-lived key.
 * The redirect never waits on a failure: if counting breaks, the visitor still lands in the group.
 */
export async function GET(request: Request): Promise<Response> {
  const src = joinSource(new URL(request.url).searchParams.get('src'));
  try {
    if (dbConfigured()) {
      const who = createHash('sha256').update(`join|${clientKey(request.headers)}`).digest('hex').slice(0, 24);
      if (!(await tooMany(`join:hour:${who}`, 30, 3600)) && !(await tooMany(`join:${who}:${src}`, 1, 3600))) {
        await call('rpc/join_hit', { method: 'POST', headers: headers(), body: JSON.stringify({ p_src: src }) });
      }
    }
  } catch {
    /* counting is best effort */
  }
  const res = NextResponse.redirect(WHATSAPP_URL, 307);
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}
