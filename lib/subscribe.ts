// Newsletter provider adapters.
//
// The landing page only needs to hand an email address to *something*. Pick one with
// EMAIL_PROVIDER (webhook | buttondown | mailchimp), or leave it unset and the first
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

type ProviderName = 'webhook' | 'buttondown' | 'mailchimp';

function env(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v ? v : undefined;
}

function pickProvider(): ProviderName | null {
  const chosen = env('EMAIL_PROVIDER')?.toLowerCase();
  if (chosen === 'webhook' || chosen === 'buttondown' || chosen === 'mailchimp') return chosen;
  if (env('NEWSLETTER_WEBHOOK_URL')) return 'webhook';
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
        : provider === 'buttondown'
          ? await viaButtondown(input)
          : await viaMailchimp(input);
    if (!ok) return { ok: false, reason: 'provider_error' };
    return { ok: true, confirmation: provider !== 'webhook' && doubleOptIn() };
  } catch (err) {
    console.error(`[subscribe] ${provider} request failed:`, err instanceof Error ? err.message : err);
    return { ok: false, reason: 'provider_error' };
  }
}
