import { timingSafeEqual } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { dbConfigured } from '../../../../lib/admin/db';
import { runBatch } from '../../../../lib/admin/linkcheck';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const reply = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const given = Buffer.from(request.headers.get('authorization') ?? '');
  const want = Buffer.from(`Bearer ${secret}`);
  return given.length === want.length && timingSafeEqual(given, want);
}

/** Nightly: checks the official links of the listings that were checked longest ago. Changes nothing on the website. */
export async function GET(request: Request): Promise<Response> {
  if (!process.env.CRON_SECRET?.trim()) return reply({ ok: false, error: 'CRON_SECRET is not set.' }, 503);
  if (!authorised(request)) return reply({ ok: false, error: 'Not allowed.' }, 401);
  if (!dbConfigured()) return reply({ ok: false, error: 'The database is not connected.' }, 503);
  const result = await runBatch(400, 48000);
  revalidatePath('/admin');
  return reply({ ok: true, ...result });
}
