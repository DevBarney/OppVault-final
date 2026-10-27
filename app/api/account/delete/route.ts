import { deleteUser } from '../../../../lib/account/gotrue';
import { fromThisSite, readJson, reply } from '../../../../lib/account/http';
import { clearCookies, whoFromRequest } from '../../../../lib/account/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Deletes the visitor's account and their saved list for good. They must type DELETE to confirm. */
export async function POST(request: Request): Promise<Response> {
  if (!fromThisSite(request)) return reply({ ok: false, error: 'Request not allowed.' }, 403);
  const who = await whoFromRequest(request);
  if (!who.user) return reply({ ok: false, error: 'Please sign in first.' }, 401, who.setCookies);
  const body = await readJson(request);
  if (body?.confirm !== 'DELETE') return reply({ ok: false, error: 'Type DELETE to confirm.' }, 400, who.setCookies);
  if (!(await deleteUser(who.user.id))) return reply({ ok: false, error: 'We could not delete the account just now. Please email hello@oppvault.app.' }, 502, who.setCookies);
  return reply({ ok: true }, 200, clearCookies());
}
