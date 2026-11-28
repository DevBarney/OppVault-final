import { revalidatePath } from 'next/cache';
import { sameOrigin, sessionFromRequest } from '../../../../lib/admin/auth';
import { dbConfigured } from '../../../../lib/admin/db';
import { json } from '../../../../lib/admin/http';
import { runBatch } from '../../../../lib/admin/linkcheck';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** "Check now": checks the next batch of links straight away. Owner only. */
export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false, error: 'Request not allowed.' }, 403);
  const session = sessionFromRequest(request);
  if (!session || session.role !== 'owner') return json({ ok: false, error: 'Please sign in again.' }, 401);
  if (!dbConfigured()) return json({ ok: false, error: 'The database connection is not set up yet.' }, 503);
  const result = await runBatch(150, 40000);
  revalidatePath('/admin');
  return json({ ok: true, ...result });
}
