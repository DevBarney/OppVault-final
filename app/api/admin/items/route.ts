import { revalidatePath } from 'next/cache';
import { isAdminRequest, sameOrigin } from '../../../../lib/admin/auth';
import { changeItems, dbConfigured, listItems } from '../../../../lib/admin/db';
import { json } from '../../../../lib/admin/http';
import { isKind } from '../../../../lib/admin/kinds';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  if (!isAdminRequest(request)) return json({ ok: false, error: 'Please sign in again.' }, 401);
  if (!dbConfigured()) return json({ ok: false, error: 'The database connection is not set up yet (SUPABASE_SERVICE_ROLE_KEY).' }, 503);
  const kind = new URL(request.url).searchParams.get('kind');
  if (!isKind(kind)) return json({ ok: false, error: 'Unknown type.' }, 400);
  return json({ ok: true, items: await listItems(kind) });
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false, error: 'Request not allowed.' }, 403);
  if (!isAdminRequest(request)) return json({ ok: false, error: 'Please sign in again.' }, 401);
  if (!dbConfigured()) return json({ ok: false, error: 'The database connection is not set up yet.' }, 503);
  let body: { kind?: unknown; ids?: unknown; action?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, error: 'That request could not be read.' }, 400);
  }
  const { kind, ids, action } = body;
  if (!isKind(kind) || !Array.isArray(ids) || (action !== 'publish' && action !== 'unpublish' && action !== 'delete')) {
    return json({ ok: false, error: 'That request was not valid.' }, 400);
  }
  const r = await changeItems(kind, ids.filter((x): x is string => typeof x === 'string'), action);
  if (!r.ok) return json({ ok: false, error: 'Nothing was changed.' }, 400);
  revalidatePath('/', 'layout');
  return json({ ok: true, count: r.count });
}
