import { sameOrigin } from '../../../lib/admin/auth';
import { sniffImage, uploadReviewPhoto } from '../../../lib/admin/avatar';
import { createReview, dbConfigured } from '../../../lib/admin/db';
import { json } from '../../../lib/admin/http';
import { notifyAddress, originOf, sendNotification } from '../../../lib/admin/mail';
import { clientKey, rateLimited } from '../../../lib/rateLimit';
import { MAX_REVIEW_PHOTO_BYTES, validateReview } from '../../../lib/reviews';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Anyone can leave a review. It is stored as "pending" and only appears once it is approved in /admin. */
export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false, error: 'Request not allowed.' }, 403);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'That request could not be read.' }, 400);
  }

  // Hidden field: people leave it empty, bots fill it in. Pretend it worked.
  const trap = form.get('company');
  if (typeof trap === 'string' && trap.trim() !== '') return json({ ok: true });

  const checked = validateReview({ name: form.get('name'), body: form.get('body'), consent: form.get('consent') === 'yes' });
  if (!checked.ok) return json({ ok: false, error: checked.error }, 400);

  const photo = form.get('photo');
  let kind: ReturnType<typeof sniffImage> = null;
  let bytes: Uint8Array | null = null;
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_REVIEW_PHOTO_BYTES) return json({ ok: false, error: 'That photo is too large. Pick a smaller one.' }, 413);
    bytes = new Uint8Array(await photo.arrayBuffer());
    kind = sniffImage(bytes);
    if (!kind) return json({ ok: false, error: 'Use a JPG, PNG or WebP photo.' }, 400);
  }

  if (rateLimited(`review:${clientKey(request.headers)}`)) {
    return json({ ok: false, error: 'Too many submissions. Please wait a few minutes and try again.' }, 429);
  }
  if (!dbConfigured()) return json({ ok: false, error: 'Reviews are not open yet. Please try again soon.' }, 503);

  let avatar: string | null = null;
  if (bytes && kind) {
    try {
      avatar = await uploadReviewPhoto(bytes, kind.ext, kind.mime);
    } catch {
      return json({ ok: false, error: 'We could not store your photo. Try again, or send the review without one.' }, 502);
    }
  }

  const saved = await createReview({ name: checked.data.name, body: checked.data.body, avatar_url: avatar });
  if (!saved) return json({ ok: false, error: 'We could not save that right now. Please try again in a moment.' }, 502);

  await sendNotification({
    to: notifyAddress(),
    subject: `New review from ${checked.data.name}`.slice(0, 150),
    lines: [`${checked.data.name} left a review:`, checked.data.body.slice(0, 300), 'It is not public yet. Open the admin page and go to "Reviews from visitors" to approve or reject it.'],
    link: { url: `${originOf(request)}/admin#reviews`, label: 'Review it' },
  });
  return json({ ok: true });
}
