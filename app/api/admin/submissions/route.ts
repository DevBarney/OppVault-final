import { revalidatePath } from 'next/cache';
import { isAdminRequest, sameOrigin } from '../../../../lib/admin/auth';
import { dbConfigured, deleteSubmission, existingFor, getSubmission, importRows, listSubmissions, setSubmissionStatus } from '../../../../lib/admin/db';
import { json } from '../../../../lib/admin/http';
import { slugify, type OpportunityRow } from '../../../../lib/admin/validate';
import type { CategorySlug } from '../../../../lib/categories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  if (!isAdminRequest(request)) return json({ ok: false, error: 'Please sign in again.' }, 401);
  if (!dbConfigured()) return json({ ok: false, error: 'The database connection is not set up yet (SUPABASE_SERVICE_ROLE_KEY).' }, 503);
  const s = new URL(request.url).searchParams.get('status');
  const status = s === 'approved' || s === 'rejected' ? s : 'pending';
  return json({ ok: true, items: await listSubmissions(status) });
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false, error: 'Request not allowed.' }, 403);
  if (!isAdminRequest(request)) return json({ ok: false, error: 'Please sign in again.' }, 401);
  if (!dbConfigured()) return json({ ok: false, error: 'The database connection is not set up yet.' }, 503);

  let body: { id?: unknown; action?: unknown; note?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, error: 'That request could not be read.' }, 400);
  }
  const id = typeof body.id === 'string' ? body.id : '';
  const action = body.action;
  const note = typeof body.note === 'string' ? body.note : '';
  if (action !== 'approve' && action !== 'approve_draft' && action !== 'reject' && action !== 'delete') {
    return json({ ok: false, error: 'That request was not valid.' }, 400);
  }

  if (action === 'delete') {
    return (await deleteSubmission(id)) ? json({ ok: true }) : json({ ok: false, error: 'Nothing was deleted.' }, 400);
  }
  if (action === 'reject') {
    return (await setSubmissionStatus(id, 'rejected', note)) ? json({ ok: true }) : json({ ok: false, error: 'Nothing was changed.' }, 400);
  }

  const sub = await getSubmission(id);
  if (!sub) return json({ ok: false, error: 'That submission was not found.' }, 404);
  if (sub.status === 'approved') return json({ ok: false, error: 'That submission is already approved.' }, 409);

  const category = sub.category as CategorySlug;
  const externalId = `sub-${sub.id.slice(0, 8)}`;
  let slug = slugify(sub.title) || externalId;
  const existing = await existingFor(category);
  const owner = existing.find((e) => e.slug === slug);
  if (owner && owner.external_id !== externalId) slug = `${slug.slice(0, 70)}-${sub.id.slice(0, 4)}`;

  let provider = sub.provider;
  if (!provider) {
    try {
      provider = new URL(sub.link).hostname.replace(/^www\./, '');
    } catch {
      provider = 'See official source';
    }
  }
  const row: OpportunityRow = {
    category,
    external_id: externalId,
    slug,
    title: sub.title,
    provider,
    summary: sub.summary || `Suggested by a visitor. See the official page for full details.`,
    description: '',
    eligibility: [],
    benefits: [],
    how_to_apply: '',
    location: sub.location || 'Global',
    level: sub.level || 'All levels',
    funding: sub.funding,
    deadline: sub.deadline,
    source_url: sub.link,
    image_url: null,
    coupon_code: null,
    featured: false,
    published: action === 'approve',
  };
  const result = await importRows(category, [{ line: 1, data: row }]);
  if (result.saved !== 1) return json({ ok: false, error: result.failed[0]?.message ?? 'The listing could not be created.' }, 502);
  await setSubmissionStatus(id, 'approved', note);
  revalidatePath('/', 'layout');
  return json({ ok: true, published: action === 'approve' });
}
