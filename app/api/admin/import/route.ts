import { revalidatePath } from 'next/cache';
import { isAdminRequest, sameOrigin } from '../../../../lib/admin/auth';
import { dbConfigured, existingFor, existingPostSlugs, importRows } from '../../../../lib/admin/db';
import { json } from '../../../../lib/admin/http';
import { isKind } from '../../../../lib/admin/kinds';
import { checkOpportunities, checkPosts, MAX_BYTES, type OpportunityRow, type PostRow } from '../../../../lib/admin/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false, error: 'Request not allowed.' }, 403);
  if (!isAdminRequest(request)) return json({ ok: false, error: 'Please sign in again.' }, 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'That upload could not be read.' }, 400);
  }
  const kind = form.get('kind');
  const mode = form.get('mode') === 'import' ? 'import' : 'check';
  const file = form.get('file');
  if (!isKind(kind)) return json({ ok: false, error: 'Choose what you are uploading.' }, 400);
  if (!(file instanceof File) || file.size === 0) return json({ ok: false, error: 'Choose a CSV file first.' }, 400);
  if (file.size > MAX_BYTES) return json({ ok: false, error: 'That file is larger than 1 MB. Split it into smaller files.' }, 413);

  const text = await file.text();
  const connected = dbConfigured();

  const checked = kind === 'blog' ? checkPosts(text) : checkOpportunities(text, kind);
  if (checked.fileError) return json({ ok: false, error: checked.fileError });

  // Compare with what is already stored: label rows new/update and catch web address clashes.
  const labels = new Map<number, 'new' | 'update'>();
  let rows = checked.rows as { line: number; data: OpportunityRow | PostRow }[];
  const issues = [...checked.issues];
  if (connected) {
    if (kind === 'blog') {
      const existing = new Set(await existingPostSlugs());
      for (const r of rows) labels.set(r.line, existing.has((r.data as PostRow).slug) ? 'update' : 'new');
    } else {
      const cats = [...new Set(rows.map((r) => (r.data as OpportunityRow).category))];
      const byCat = new Map<string, { ids: Set<string>; slugs: Map<string, string> }>();
      for (const c of cats) {
        const ex = await existingFor(c);
        byCat.set(c, { ids: new Set(ex.map((e) => e.external_id)), slugs: new Map(ex.map((e) => [e.slug, e.external_id])) });
      }
      const ok: typeof rows = [];
      for (const r of rows) {
        const d = r.data as OpportunityRow;
        const ex = byCat.get(d.category);
        const owner = ex?.slugs.get(d.slug);
        if (owner !== undefined && owner !== d.external_id) {
          issues.push({ line: r.line, message: `the web address "${d.slug}" is already used by another listing (ID ${owner}). Change the title or add a different slug` });
          continue;
        }
        labels.set(r.line, ex?.ids.has(d.external_id) ? 'update' : 'new');
        ok.push(r);
      }
      rows = ok;
    }
  }
  issues.sort((a, b) => a.line - b.line);

  const summary = {
    total: checked.total,
    valid: rows.length,
    invalid: issues.length,
    created: [...labels.values()].filter((v) => v === 'new').length,
    updated: [...labels.values()].filter((v) => v === 'update').length,
    unknownColumns: checked.unknownColumns,
    issues: issues.slice(0, 50),
    moreIssues: Math.max(0, issues.length - 50),
    preview: rows.slice(0, 5).map((r) => ({
      line: r.line,
      title: r.data.title,
      status: labels.get(r.line) ?? null,
      published: r.data.published,
    })),
    databaseConnected: connected,
  };

  if (mode === 'check') return json({ ok: true, mode, ...summary });

  if (!connected) {
    return json({ ok: false, error: 'The database connection is not set up yet. Add SUPABASE_SERVICE_ROLE_KEY in Vercel, then redeploy.' }, 503);
  }
  if (rows.length === 0) return json({ ok: false, error: 'There are no valid rows to import. Fix the problems listed and try again.' });

  const result = await importRows(kind, rows);
  if (result.saved > 0) revalidatePath('/', 'layout');
  return json({ ok: true, mode, ...summary, saved: result.saved, failed: result.failed.slice(0, 50) });
}
