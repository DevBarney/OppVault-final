import { revalidatePath } from 'next/cache';
import { isAdminRequest, sameOrigin } from '../../../../lib/admin/auth';
import { dbConfigured, getSubmission, importRows, setSubmissionStatus } from '../../../../lib/admin/db';
import { json } from '../../../../lib/admin/http';
import { checkListing, findClash, type ListingInput } from '../../../../lib/admin/listing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Saves one listing typed in by hand, or a visitor suggestion after the admin has edited it.
 * Body: the listing fields, plus optional submission_id (marks that suggestion approved) and
 * confirm: true (the admin has seen the warning about a repeated link or a listing that will be replaced).
 */
export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false, error: 'Request not allowed.' }, 403);
  if (!isAdminRequest(request)) return json({ ok: false, error: 'Please sign in again.' }, 401);
  if (!dbConfigured()) return json({ ok: false, error: 'The database connection is not set up yet (SUPABASE_SERVICE_ROLE_KEY).' }, 503);

  let body: ListingInput & { submission_id?: unknown; confirm?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, error: 'That request could not be read.' }, 400);
  }

  const submissionId = typeof body.submission_id === 'string' ? body.submission_id : '';
  let externalId: string | undefined;
  if (submissionId) {
    const sub = await getSubmission(submissionId);
    if (!sub) return json({ ok: false, error: 'That suggestion was not found.' }, 404);
    if (sub.status === 'approved') return json({ ok: false, error: 'That suggestion is already approved.' }, 409);
    externalId = `sub-${sub.id.slice(0, 8)}`; // same ID the Approve button uses
  }

  const checked = checkListing(body, externalId);
  if (!checked.ok) return json({ ok: false, error: checked.error }, 400);
  const row = checked.row;

  const clash = await findClash(row);
  if (clash.kind === 'address') {
    return json({ ok: false, error: `Another listing already uses this web address (${clash.ref}). Change the title a little so the address is different.` }, 409);
  }
  if (clash.kind !== 'none' && body.confirm !== true) {
    const why =
      clash.kind === 'replace'
        ? `A listing with this title already exists (${clash.ref}). Saving will replace it.`
        : `A listing with this official link already exists: "${clash.title}". Saving will add a second one.`;
    return json({ ok: false, needsConfirm: true, error: why }, 409);
  }

  const result = await importRows(row.category, [{ line: 1, data: row }]);
  if (result.saved !== 1) return json({ ok: false, error: result.failed[0]?.message ?? 'The listing could not be saved.' }, 502);

  if (submissionId) await setSubmissionStatus(submissionId, 'approved', 'Edited and approved by the admin');
  revalidatePath('/', 'layout');
  return json({ ok: true, published: row.published, category: row.category, slug: row.slug, replaced: clash.kind === 'replace' });
}
