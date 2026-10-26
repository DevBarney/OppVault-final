import { dbConfigured, createSubmission, pendingLinkExists } from '../../../lib/admin/db';
import { json } from '../../../lib/admin/http';
import { sameOrigin } from '../../../lib/admin/auth';
import { clientKey, rateLimited } from '../../../lib/rateLimit';
import { validateSubmission } from '../../../lib/submissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false, error: 'Request not allowed.' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ ok: false, error: 'Send the request as JSON.' }, 415);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'That request could not be read.' }, 400);
  }

  // Hidden field: people leave it empty, bots fill it in. Pretend it worked.
  if (typeof body.company === 'string' && body.company.trim() !== '') return json({ ok: true });

  const checked = validateSubmission(body);
  if (!checked.ok) return json({ ok: false, error: checked.error }, 400);

  if (rateLimited(`submit:${clientKey(request.headers)}`)) {
    return json({ ok: false, error: 'Too many submissions. Please wait a few minutes and try again.' }, 429);
  }
  if (!dbConfigured()) return json({ ok: false, error: 'Submissions are not open yet. Please try again soon.' }, 503);

  // The same link already waiting for review: thank them, do not create a duplicate.
  if (await pendingLinkExists(checked.data.link)) return json({ ok: true });

  const saved = await createSubmission(checked.data);
  if (!saved) return json({ ok: false, error: 'We could not save that right now. Please try again in a moment.' }, 502);
  return json({ ok: true });
}
