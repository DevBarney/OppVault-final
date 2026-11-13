import { addApplied, cleanPatch, removeApplied, updateTracked, validRef } from '../../../../lib/account/applied';
import { fromThisSite, readJson, reply } from '../../../../lib/account/http';
import { whoFromRequest } from '../../../../lib/account/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function change(request: Request, action: 'add' | 'remove'): Promise<Response> {
  if (!fromThisSite(request)) return reply({ ok: false, error: 'Request not allowed.' }, 403);
  const who = await whoFromRequest(request);
  if (!who.user || !who.accessToken) return reply({ ok: false, error: 'Please sign in first.' }, 401, who.setCookies);
  const body = await readJson(request);
  const ref = validRef(body?.category, body?.slug);
  if (!ref) return reply({ ok: false, error: 'That opportunity could not be updated.' }, 400, who.setCookies);
  const done = action === 'add' ? await addApplied(who.accessToken, ref) : await removeApplied(who.accessToken, ref);
  return done ? reply({ ok: true }, 200, who.setCookies) : reply({ ok: false, error: 'That did not save. Please try again.' }, 502, who.setCookies);
}

export const POST = (request: Request) => change(request, 'add');
export const DELETE = (request: Request) => change(request, 'remove');

/** Change where an application stands, the date it was sent, or the private note. */
export async function PATCH(request: Request): Promise<Response> {
  if (!fromThisSite(request)) return reply({ ok: false, error: 'Request not allowed.' }, 403);
  const who = await whoFromRequest(request);
  if (!who.user || !who.accessToken) return reply({ ok: false, error: 'Please sign in first.' }, 401, who.setCookies);
  const body = await readJson(request);
  const ref = validRef(body?.category, body?.slug);
  const patch = cleanPatch(body);
  if (!ref || !patch) return reply({ ok: false, error: 'That change could not be read. Check the date and try again.' }, 400, who.setCookies);
  const done = await updateTracked(who.accessToken, ref, patch);
  return done ? reply({ ok: true }, 200, who.setCookies) : reply({ ok: false, error: 'That did not save. Please try again.' }, 502, who.setCookies);
}
