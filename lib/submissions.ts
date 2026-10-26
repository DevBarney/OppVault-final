// Validation for opportunities suggested by visitors (public form at /submit).
import { CATEGORIES, type CategorySlug } from './categories';
import { parseCategory } from './admin/kinds';
import { parseDate } from './admin/validate';

export type SubmissionInput = {
  category: CategorySlug;
  title: string;
  provider: string;
  link: string;
  summary: string;
  deadline: string | null;
  location: string;
  level: string;
  funding: string;
  submitter_name: string;
  submitter_email: string;
};

function text(v: unknown, max: number): string {
  // eslint-disable-next-line no-control-regex
  return typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max) : '';
}

export function validateSubmission(body: Record<string, unknown>): { ok: true; data: SubmissionInput } | { ok: false; error: string } {
  const category = parseCategory(text(body.category, 40));
  if (!category) return { ok: false, error: `Choose a type: ${CATEGORIES.map((c) => c.label).join(', ')}.` };
  const title = text(body.title, 200);
  if (title.length < 4) return { ok: false, error: 'Add the name of the opportunity.' };
  let link = '';
  try {
    const u = new URL(text(body.link, 600));
    if (u.protocol === 'https:' || u.protocol === 'http:') link = u.toString();
  } catch {
    /* handled below */
  }
  if (!link) return { ok: false, error: 'Add the official web address, starting with https://' };
  const email = text(body.email, 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: 'Add an email address so we can contact you if we have a question.' };
  if (body.consent !== true) return { ok: false, error: 'Please tick the box to confirm you are happy for us to review this.' };
  const deadlineRaw = text(body.deadline, 40);
  const deadline = deadlineRaw ? parseDate(deadlineRaw) : null;
  if (deadline === undefined) return { ok: false, error: 'The deadline should look like 31/12/2026, or leave it empty.' };
  return {
    ok: true,
    data: {
      category,
      title,
      provider: text(body.provider, 160),
      link,
      summary: text(body.summary, 1000),
      deadline,
      location: text(body.location, 120),
      level: text(body.level, 80),
      funding: text(body.funding, 120),
      submitter_name: text(body.name, 120),
      submitter_email: email,
    },
  };
}
