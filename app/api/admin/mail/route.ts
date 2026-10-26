import { isAdminRequest, sameOrigin } from '../../../../lib/admin/auth';
import { claimBatch, dbConfigured, finishBatch, listMailSends, releaseBatch } from '../../../../lib/admin/db';
import { renderEmail } from '../../../../lib/admin/emailTemplate';
import { json } from '../../../../lib/admin/http';
import { BATCH_SIZE, fromAddress, listContacts, mailConfigured, mainSegment, segmentForBatch, sendBroadcast, sendTest, splitBatches, syncBatch } from '../../../../lib/admin/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CAMPAIGN = /^[A-Za-z0-9-]{8,64}$/;

export async function GET(request: Request): Promise<Response> {
  if (!isAdminRequest(request)) return json({ ok: false, error: 'Please sign in again.' }, 401);
  const cfg = mailConfigured();
  if (!cfg.ok) return json({ ok: false, error: `Email is not connected yet. Missing in Vercel: ${cfg.missing.join(', ')}.` }, 503);
  try {
    const contacts = await listContacts(mainSegment() as string);
    const { info } = splitBatches(contacts);
    const sends = dbConfigured() ? await listMailSends() : [];
    return json({
      ok: true,
      batchSize: BATCH_SIZE,
      total: contacts.length,
      active: contacts.filter((c) => !c.unsubscribed).length,
      unsubscribed: contacts.filter((c) => c.unsubscribed).length,
      batches: info,
      sends,
      fromSet: Boolean(fromAddress()),
      historyAvailable: dbConfigured(),
    });
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : 'Could not read the subscriber list.' }, 502);
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false, error: 'Request not allowed.' }, 403);
  if (!isAdminRequest(request)) return json({ ok: false, error: 'Please sign in again.' }, 401);

  let b: Record<string, unknown>;
  try {
    b = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'That request could not be read.' }, 400);
  }
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max).trim() : '');
  const subject = str(b.subject, 150);
  const previewText = str(b.previewText, 150);
  const body = typeof b.body === 'string' ? b.body.slice(0, 20000) : '';
  const action = b.action;

  if (action === 'preview' || action === 'test' || action === 'send') {
    if (!subject) return json({ ok: false, error: 'Add a subject line.' }, 400);
    if (body.trim().length < 10) return json({ ok: false, error: 'The email is empty. Write the message first.' }, 400);
  }
  const email = renderEmail(body, previewText);

  if (action === 'preview') return json({ ok: true, html: email.html });

  const cfg = mailConfigured();
  if (!cfg.ok) return json({ ok: false, error: `Email is not connected yet. Missing in Vercel: ${cfg.missing.join(', ')}.` }, 503);

  try {
    if (action === 'test') {
      const to = str(b.to, 200).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) return json({ ok: false, error: 'Enter your own email address for the test.' }, 400);
      await sendTest(to, subject, email.html, email.text);
      return json({ ok: true, message: `Test sent to ${to}.` });
    }

    const n = Number(b.batch);
    if (!Number.isInteger(n) || n < 1 || n > 50) return json({ ok: false, error: 'Choose a batch.' }, 400);
    const contacts = await listContacts(mainSegment() as string);
    const { info, slices } = splitBatches(contacts);
    const slice = slices[n - 1];
    if (!slice) return json({ ok: false, error: 'That batch does not exist.' }, 404);

    if (action === 'sync') {
      if (contacts.length <= BATCH_SIZE) return json({ ok: true, remaining: 0, message: 'Everyone fits in one batch, nothing to prepare.' });
      const r = await syncBatch(n, slice);
      return json({ ok: true, remaining: r.remaining, added: r.added });
    }

    if (action === 'send') {
      const campaign = str(b.campaign, 64);
      if (!CAMPAIGN.test(campaign)) return json({ ok: false, error: 'Start a new email and try again.' }, 400);
      if (!dbConfigured()) return json({ ok: false, error: 'The database connection (SUPABASE_SERVICE_ROLE_KEY) is needed to record sends safely.' }, 503);
      if (!fromAddress()) {
        return json({ ok: false, error: 'RESEND_FROM is not set. Verify your domain in Resend, then set RESEND_FROM to: OppVault <hello@oppvault.app>' }, 400);
      }
      if (info[n - 1].active === 0) return json({ ok: false, error: 'Nobody in this batch is subscribed.' }, 400);

      // Larger lists: the batch's own segment must be complete before sending.
      if (contacts.length > BATCH_SIZE) {
        const s = await syncBatch(n, slice, 0);
        if (s.remaining > 0) return json({ ok: false, error: 'This batch is not prepared yet. Press "Prepare" first.' }, 409);
      }
      const claimed = await claimBatch(campaign, subject, n, info[n - 1].active);
      if (!claimed) return json({ ok: false, error: 'This batch has already been sent for this email.' }, 409);
      try {
        const segmentId = await segmentForBatch(n, contacts.length);
        const id = await sendBroadcast({ segmentId, name: `${subject} (batch ${n})`.slice(0, 120), subject, previewText, html: email.html, text: email.text });
        await finishBatch(campaign, n, id);
        return json({ ok: true, message: `Batch ${n} is on its way to ${info[n - 1].active} subscribers.` });
      } catch (err) {
        await releaseBatch(campaign, n);
        throw err;
      }
    }
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : 'Something went wrong.' }, 502);
  }
  return json({ ok: false, error: 'That request was not valid.' }, 400);
}
