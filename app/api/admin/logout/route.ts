import { clearCookie, sameOrigin } from '../../../../lib/admin/auth';
import { json } from '../../../../lib/admin/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false, error: 'Request not allowed.' }, 403);
  return json({ ok: true }, 200, { 'set-cookie': clearCookie() });
}
