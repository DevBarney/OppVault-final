// Validation for reviews left by visitors (public form at /reviews).

export type ReviewInput = { name: string; body: string };

function text(v: unknown, max: number): string {
  // eslint-disable-next-line no-control-regex
  return typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, max) : '';
}

export const REVIEW_MIN = 20;
export const REVIEW_MAX = 800;
export const MAX_REVIEW_PHOTO_BYTES = 60_000;

export function validateReview(input: { name?: unknown; body?: unknown; consent?: unknown }): { ok: true; data: ReviewInput } | { ok: false; error: string } {
  const name = text(input.name, 80);
  if (name.length < 2) return { ok: false, error: 'Add your name, or the name you would like shown.' };
  const body = text(input.body, REVIEW_MAX);
  if (body.length < REVIEW_MIN) return { ok: false, error: `Write at least ${REVIEW_MIN} characters so your review says something useful.` };
  if (/https?:\/\/|www\./i.test(body) || /https?:\/\/|www\./i.test(name)) return { ok: false, error: 'Please leave web addresses out of your review.' };
  if (input.consent !== true) return { ok: false, error: 'Please tick the box to confirm you are happy for your review to be shown.' };
  return { ok: true, data: { name, body } };
}

/** Initials for the picture placeholder, e.g. "Ada Obi" -> "AO". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
}
