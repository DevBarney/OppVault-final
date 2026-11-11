import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * A gentle brake on automated collection of listings. A person reading pages never gets near the limit
 * (120 page requests a minute from one address). Anything faster is answered with "slow down".
 * Each server instance keeps its own counter, so this is a basic brake, not a hard guarantee.
 */
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 120;
const hits = new Map<string, { start: number; count: number }>();

export function proxy(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.start >= WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 });
  } else {
    entry.count += 1;
    if (entry.count > MAX_REQUESTS) {
      return new NextResponse('Too many requests. Please slow down and try again in a minute.', {
        status: 429,
        headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' },
      });
    }
  }
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (now - v.start >= WINDOW_MS) hits.delete(k);
  }
  return NextResponse.next();
}

export const config = {
  // Only the pages worth collecting: listing detail pages and search. The home page, list pages,
  // static files and API routes are untouched, so they stay as fast as before.
  matcher: ['/(scholarships|fellowships|grants|courses|events|student-offers)/:slug', '/search'],
};
