import { timingSafeEqual } from 'node:crypto';
import { claimBatch, dbConfigured, finishBatch, releaseBatch } from '../../../../lib/admin/db';
import { renderEmail } from '../../../../lib/admin/emailTemplate';
import { BATCH_SIZE, listContacts, mailConfigured, mainSegment, notifyAddress, sendBroadcast, sendNotification, sendTest } from '../../../../lib/admin/mail';
import { buildDigest, weekId } from '../../../../lib/digest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const reply = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const given = Buffer.from(request.headers.get('authorization') ?? '');
  const want = Buffer.from(`Bearer ${secret}`);
  return given.length === want.length && timingSafeEqual(given, want);
}

/**
 * Weekly "closing soon" email, run by a Vercel cron job (Mondays, 07:00 in Nigeria).
 * Until DIGEST_SEND is set to "on" in Vercel, each run only sends a "[Test]" copy to the admin inbox,
 * so the email can be checked before any subscriber receives it. Once on, each week is sent at most once.
 */
export async function GET(request: Request): Promise<Response> {
  if (!process.env.CRON_SECRET?.trim()) return reply({ ok: false, error: 'CRON_SECRET is not set.' }, 503);
  if (!authorised(request)) return reply({ ok: false, error: 'Not allowed.' }, 401);
  const cfg = mailConfigured();
  if (!cfg.ok) return reply({ ok: false, error: `Email is not connected. Missing: ${cfg.missing.join(', ')}.` }, 503);

  const digest = await buildDigest();
  if (!digest) return reply({ ok: true, sent: false, reason: 'Fewer than three listings are closing soon, so nothing was sent.' });
  const email = renderEmail(digest.body, digest.previewText);

  if (process.env.DIGEST_SEND?.trim().toLowerCase() !== 'on') {
    await sendTest(notifyAddress(), digest.subject, email.html, email.text);
    return reply({ ok: true, sent: false, mode: 'preview', listings: digest.count, previewSentTo: 'the admin inbox' });
  }

  if (!dbConfigured()) return reply({ ok: false, error: 'The database is not connected, so duplicate sends cannot be prevented.' }, 503);
  const contacts = await listContacts(mainSegment() as string);
  const active = contacts.filter((c) => !c.unsubscribed).length;
  if (active === 0) return reply({ ok: true, sent: false, reason: 'No active subscribers.' });
  if (contacts.length > BATCH_SIZE) {
    await sendNotification({
      to: notifyAddress(),
      subject: 'Weekly closing soon email was not sent',
      lines: ['The subscriber list is larger than one batch, so the weekly email needs to be sent by hand from the admin Email page.'],
    });
    return reply({ ok: true, sent: false, reason: 'List is larger than one batch.' });
  }

  const campaign = `digest-${weekId()}`;
  if (!(await claimBatch(campaign, digest.subject, 1, active))) return reply({ ok: true, sent: false, reason: 'This week was already sent.' });
  try {
    const id = await sendBroadcast({ segmentId: mainSegment() as string, name: `Closing soon ${weekId()}`, subject: digest.subject, previewText: digest.previewText, html: email.html, text: email.text });
    await finishBatch(campaign, 1, id);
    return reply({ ok: true, sent: true, recipients: active, listings: digest.count });
  } catch (err) {
    await releaseBatch(campaign, 1);
    const message = err instanceof Error ? err.message : 'Could not send.';
    await sendNotification({ to: notifyAddress(), subject: 'Weekly closing soon email failed', lines: [message] });
    return reply({ ok: false, error: message }, 502);
  }
}
