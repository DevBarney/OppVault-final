// Newsletter provider adapters.
//
// The landing page only needs to hand an email address to *something*. Pick one with
// EMAIL_PROVIDER (webhook | resend | buttondown | mailchimp), or leave it unset and the first
// provider whose variables are present is used. See .env.example and README.md.

export type SubscribeInput = { email: string; source?: string };

export type SubscribeResult =
  | { ok: true; confirmation: boolean }
  | { ok: false; reason: 'not_configured' | 'provider_error' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normaliseEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (email.length < 6 || email.length > 254) return null;
  return EMAIL_RE.test(email) ? email : null;
}

/** Keep campaign tags tidy: letters, numbers, dash, underscore, dot; max 40 chars. */
export function cleanSource(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const s = raw.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 40);
  return s || undefined;
}

type ProviderName = 'webhook' | 'resend' | 'buttondown' | 'mailchimp';

function env(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v ? v : undefined;
}

function pickProvider(): ProviderName | null {
  const chosen = env('EMAIL_PROVIDER')?.toLowerCase();
  if (chosen === 'webhook' || chosen === 'resend' || chosen === 'buttondown' || chosen === 'mailchimp') return chosen;
  if (env('NEWSLETTER_WEBHOOK_URL')) return 'webhook';
  if (env('RESEND_API_KEY')) return 'resend';
  if (env('BUTTONDOWN_API_KEY')) return 'buttondown';
  if (env('MAILCHIMP_API_KEY') && env('MAILCHIMP_LIST_ID')) return 'mailchimp';
  return null;
}

/** true unless you set NEWSLETTER_DOUBLE_OPT_IN=false. Only affects what the page tells people. */
function doubleOptIn(): boolean {
  return env('NEWSLETTER_DOUBLE_OPT_IN')?.toLowerCase() !== 'false';
}

async function send(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(8000) });
}

async function viaWebhook(input: SubscribeInput): Promise<boolean> {
  const url = env('NEWSLETTER_WEBHOOK_URL');
  if (!url) return false;
  const secret = env('NEWSLETTER_WEBHOOK_SECRET');
  const res = await send(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(secret ? { 'x-webhook-secret': secret } : {}),
    },
    body: JSON.stringify({
      email: input.email,
      source: input.source ?? '',
      site: 'oppvault.app',
      subscribedAt: new Date().toISOString(),
      ...(secret ? { secret } : {}),
    }),
  });
  return res.ok;
}

// ---- Resend ---------------------------------------------------------------------------
// Adds the address to your Resend contacts (and to a segment, so you can send broadcasts to it).
// If RESEND_FROM is set to an address on a domain you have verified in Resend, a short welcome
// email is sent too. The welcome email never decides whether the sign-up counts as a success.

function welcomeEmail(email: string): { subject: string; html: string; text: string } {
  const subject = 'Welcome to OppVault';
  const text = [
    'Thank you for joining the OppVault list.',
    '',
    'OppVault is being built to bring scholarships, internships, fellowships, grants and more into one organised place. We will email you as it takes shape, and you will hear first when it opens.',
    'OppVault helps you discover opportunities. It cannot guarantee that you will be selected for any of them, so always confirm the details with the official source.',
    '',
    'Join our WhatsApp community: https://chat.whatsapp.com/EvaSDdZLs1VEK7fSP7zzr1',
    '',
    'Unlocking Opportunities, Empowering Potential.',
    'OppVault | hello@oppvault.app | oppvault.app',
    '',
    `You are receiving this because ${email} was entered on oppvault.app. If that was not you, simply ignore this email.`,
  ].join('\n');
  const html = `<!DOCTYPE html><html lang="en-GB"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f9ff;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f9ff"><tr><td align="center" style="padding:32px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;">
<tr><td bgcolor="#04106b" style="background-color:#04106b;border-radius:16px 16px 0 0;padding:28px 32px;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:22px;line-height:28px;font-weight:700;color:#ffffff;">OppVault</td></tr>
<tr><td style="padding:32px;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;color:#1e2350;">
<p style="margin:0 0 16px 0;font-size:20px;line-height:28px;font-weight:700;color:#04106b;">You are on the list.</p>
<p style="margin:0 0 16px 0;">Thank you for joining. OppVault is being built to bring scholarships, internships, fellowships, grants and more into one organised place. We will email you as it takes shape, and you will hear first when it opens.</p>
<p style="margin:0 0 24px 0;">OppVault helps you discover opportunities. It cannot guarantee that you will be selected for any of them, so always confirm the details with the official source.</p>
<table cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#0332b3" style="background-color:#0332b3;border-radius:12px;"><a href="https://chat.whatsapp.com/EvaSDdZLs1VEK7fSP7zzr1" style="display:inline-block;padding:14px 24px;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;">Join the WhatsApp community</a></td></tr></table>
</td></tr>
<tr><td style="padding:0 32px 28px 32px;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#4f577f;border-top:1px solid #dce6f7;">
<p style="margin:20px 0 6px 0;color:#04106b;font-weight:600;">Unlocking Opportunities, Empowering Potential.</p>
<p style="margin:0;">hello@oppvault.app &middot; oppvault.app</p>
<p style="margin:12px 0 0 0;">You are receiving this because ${email.replace(/[<>&"]/g, '')} was entered on oppvault.app. If that was not you, simply ignore this email.</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, html, text };
}

async function viaResend(input: SubscribeInput): Promise<boolean> {
  const key = env('RESEND_API_KEY');
  if (!key) return false;
  const headers = { 'content-type': 'application/json', authorization: `Bearer ${key}` };
  const segment = env('RESEND_SEGMENT_ID');

  const res = await send('https://api.resend.com/contacts', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: input.email,
      unsubscribed: false,
      ...(segment ? { segments: [{ id: segment }] } : {}),
    }),
  });

  let isNew = res.ok;
  if (!res.ok) {
    // An address that is already a contact should see the same success message.
    const body = (await res.json().catch(() => ({}))) as { message?: string; name?: string };
    const exists = res.status === 409 || /already|exist|duplicate/i.test(`${body.message ?? ''} ${body.name ?? ''}`);
    if (!exists) {
      console.error(`[subscribe] resend contact create failed (${res.status}): ${body.message ?? body.name ?? ''}`);
      return false;
    }
    // Make sure an existing contact is still in the segment (and not marked unsubscribed by an old form).
    if (segment) {
      await send(
        `https://api.resend.com/contacts/${encodeURIComponent(input.email)}/segments/${encodeURIComponent(segment)}`,
        { method: 'POST', headers },
      ).catch(() => undefined);
    }
  }

  // Welcome email: only for brand-new contacts, only if a verified sender is configured.
  const from = env('RESEND_FROM');
  if (isNew && from) {
    const mail = welcomeEmail(input.email);
    try {
      const r = await send('https://api.resend.com/emails', {
        method: 'POST',
        headers: { ...headers, 'idempotency-key': `welcome-${input.email}` },
        body: JSON.stringify({
          from,
          to: [input.email],
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          reply_to: env('RESEND_REPLY_TO') ?? 'hello@oppvault.app',
          tags: [{ name: 'type', value: 'welcome' }],
        }),
      });
      if (!r.ok) console.error(`[subscribe] resend welcome email failed (${r.status})`);
    } catch (err) {
      console.error('[subscribe] resend welcome email error:', err instanceof Error ? err.message : err);
    }
  }
  return true;
}

async function viaButtondown(input: SubscribeInput): Promise<boolean> {
  const key = env('BUTTONDOWN_API_KEY');
  if (!key) return false;
  const res = await send('https://api.buttondown.com/v1/subscribers', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Token ${key}` },
    body: JSON.stringify({
      email_address: input.email,
      metadata: { source: input.source ?? '', page: 'preview-landing' },
    }),
  });
  if (res.ok) return true;
  // Someone who is already subscribed should see the same success message.
  if (res.status === 400 || res.status === 409) {
    const body = await res.json().catch(() => ({}) as Record<string, unknown>);
    if (JSON.stringify(body).includes('already')) return true;
  }
  return false;
}

async function viaMailchimp(input: SubscribeInput): Promise<boolean> {
  const key = env('MAILCHIMP_API_KEY');
  const list = env('MAILCHIMP_LIST_ID');
  if (!key || !list) return false;
  const dc = key.split('-').pop();
  if (!dc) return false;
  const tags = ['preview-landing', ...(input.source ? [`src-${input.source}`] : [])];
  const res = await send(`https://${dc}.api.mailchimp.com/3.0/lists/${encodeURIComponent(list)}/members`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Basic ${Buffer.from(`oppvault:${key}`).toString('base64')}`,
    },
    body: JSON.stringify({
      email_address: input.email,
      status: doubleOptIn() ? 'pending' : 'subscribed',
      tags,
    }),
  });
  if (res.ok) return true;
  if (res.status === 400) {
    const body = (await res.json().catch(() => ({}))) as { title?: string };
    if (body.title === 'Member Exists') return true;
  }
  return false;
}

export async function subscribe(input: SubscribeInput): Promise<SubscribeResult> {
  const provider = pickProvider();

  if (!provider) {
    // Local development convenience: no provider configured yet, so just log it.
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[subscribe:dev] no email provider configured; would subscribe ${input.email}`);
      return { ok: true, confirmation: false };
    }
    return { ok: false, reason: 'not_configured' };
  }

  try {
    const ok =
      provider === 'webhook'
        ? await viaWebhook(input)
        : provider === 'resend'
          ? await viaResend(input)
          : provider === 'buttondown'
          ? await viaButtondown(input)
          : await viaMailchimp(input);
    if (!ok) return { ok: false, reason: 'provider_error' };
    return { ok: true, confirmation: (provider === 'buttondown' || provider === 'mailchimp') && doubleOptIn() };
  } catch (err) {
    console.error(`[subscribe] ${provider} request failed:`, err instanceof Error ? err.message : err);
    return { ok: false, reason: 'provider_error' };
  }
}
