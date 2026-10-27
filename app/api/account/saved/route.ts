import { addSaved, listSaved, removeSaved, validRef } from '../../../../lib/account/saved';
import { fromThisSite, readJson, reply } from '../../../../lib/account/http';
import { whoFromRequest } from '../../../../lib/account/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Who is signed in, and what they have saved. Signed out is a normal answer, not an error. */
export async function GET(request: Request): Promise<Response> {
  const who = await whoFromRequest(request);
  if (!who.user || !who.accessToken) return reply({ signedIn: false, items: [] }, 200, who.setCookies);
  const items = (await listSaved(who.accessToken)).map((r) => `${r.category}/${r.slug}`);
  return reply({ signedIn: true, email: who.user.email, name: who.user.name, items }, 200, who.setCookies);
}

async function change(request: Request, action: 'add' | 'remove'): Promise<Response> {
  if (!fromThisSite(request)) return reply({ ok: false, error: 'Request not allowed.' }, 403);
  const who = await whoFromRequest(request);
  if (!who.user || !who.accessToken) return reply({ ok: false, error: 'Please sign in first.' }, 401, who.setCookies);
  const body = await readJson(request);
  const ref = validRef(body?.category, body?.slug);
  if (!ref) return reply({ ok: false, error: 'That opportunity could not be saved.' }, 400, who.setCookies);
  const done = action === 'add' ? await addSaved(who.accessToken, ref) : await removeSaved(who.accessToken, ref);
  return done ? reply({ ok: true }, 200, who.setCookies) : reply({ ok: false, error: 'That did not save. Please try again.' }, 502, who.setCookies);
}

export const POST = (request: Request) => change(request, 'add');
export const DELETE = (request: Request) => change(request, 'remove');
