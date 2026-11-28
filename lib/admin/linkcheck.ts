// Checks that the official link on each live listing still opens. Server only.
// Only https links are followed. Addresses that point inside a private network are refused, redirects are
// followed one hop at a time and checked again, and nothing from a page is ever read beyond its status.

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { call, dbConfigured, headers } from './db';

export type Verdict = 'ok' | 'broken' | 'unsure';
export type CheckResult = { verdict: Verdict; status: number | null; detail: string };

const UA = 'Mozilla/5.0 (compatible; OppVaultLinkCheck/1.0; +https://oppvault.app)';
const HOP_LIMIT = 4;
const TIMEOUT_MS = 8000;

function privateIPv4(ip: string): boolean {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n))) return true;
  const [a, b] = p;
  return (
    a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19)) || a >= 224
  );
}

function privateAddress(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return privateIPv4(ip);
  if (kind === 6) {
    const v = ip.toLowerCase();
    if (v === '::1' || v === '::') return true;
    if (v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe8') || v.startsWith('fe9') || v.startsWith('fea') || v.startsWith('feb')) return true;
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? privateIPv4(mapped[1]) : false;
  }
  return true;
}

/** Throws a short message when the address is not a public web address. */
async function assertPublic(url: URL): Promise<void> {
  if (url.protocol !== 'https:') throw new Error('Not an https link');
  if (url.port && url.port !== '443') throw new Error('Unusual port');
  if (url.username || url.password) throw new Error('Link contains a login');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (!host.includes('.') && !isIP(host)) throw new Error('Not a public address');
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (addrs.length === 0 || addrs.some((a) => privateAddress(a.address))) throw new Error('Not a public address');
}

async function hop(url: URL, method: 'HEAD' | 'GET'): Promise<Response> {
  await assertPublic(url);
  return fetch(url, {
    method,
    redirect: 'manual',
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'user-agent': UA, accept: 'text/html,*/*;q=0.8', ...(method === 'GET' ? { range: 'bytes=0-0' } : {}) },
  });
}

async function follow(start: string, method: 'HEAD' | 'GET'): Promise<{ status: number; final: URL; hops: number }> {
  let url = new URL(start);
  for (let hops = 0; hops <= HOP_LIMIT; hops++) {
    const res = await hop(url, method);
    void res.body?.cancel().catch(() => undefined);
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location') as string, url);
      continue;
    }
    return { status: res.status, final: url, hops };
  }
  return { status: 310, final: url, hops: HOP_LIMIT + 1 };
}

function classify(status: number, startUrl: string, final: URL, hops: number): CheckResult {
  if (hops > HOP_LIMIT) return { verdict: 'unsure', status, detail: 'Too many redirects' };
  if (status === 404 || status === 410) return { verdict: 'broken', status, detail: status === 410 ? 'Page removed (410)' : 'Page not found (404)' };
  if (status >= 200 && status < 300) {
    const start = new URL(startUrl);
    const deep = start.pathname.replace(/\/+$/, '').length > 1;
    if (hops > 0 && deep && final.pathname.replace(/\/+$/, '') === '' && final.hostname === start.hostname) {
      return { verdict: 'unsure', status, detail: 'Sends visitors to the home page' };
    }
    return { verdict: 'ok', status, detail: hops > 0 ? `Opens (after ${hops} redirect${hops === 1 ? '' : 's'})` : 'Opens' };
  }
  if (status === 401 || status === 403 || status === 429) return { verdict: 'unsure', status, detail: 'The site refuses automatic checks. Open it by hand.' };
  if (status >= 500) return { verdict: 'unsure', status, detail: `The site had an error (${status}). Try again later.` };
  return { verdict: 'unsure', status, detail: `Unexpected answer (${status})` };
}

function describeError(error: unknown): CheckResult {
  const e = error as { name?: string; message?: string; cause?: { code?: string } };
  const code = e.cause?.code ?? '';
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') return { verdict: 'broken', status: null, detail: 'The website address no longer exists' };
  if (e.name === 'TimeoutError' || e.name === 'AbortError') return { verdict: 'unsure', status: null, detail: 'The site took too long to answer' };
  if (e.message === 'Not an https link' || e.message === 'Not a public address' || e.message === 'Unusual port' || e.message === 'Link contains a login') {
    return { verdict: 'broken', status: null, detail: e.message };
  }
  if (code.startsWith('ERR_TLS') || code.includes('CERT') || code === 'DEPTH_ZERO_SELF_SIGNED_CERT') return { verdict: 'broken', status: null, detail: 'The site has a security certificate problem' };
  return { verdict: 'unsure', status: null, detail: 'Could not connect' };
}

export async function checkUrl(raw: string): Promise<CheckResult> {
  try {
    let r = await follow(raw, 'HEAD');
    if ([400, 403, 405, 406, 501].includes(r.status)) r = await follow(raw, 'GET');
    return classify(r.status, raw, r.final, r.hops);
  } catch (error) {
    try {
      // Some servers drop HEAD requests; one GET settles it.
      const r = await follow(raw, 'GET');
      return classify(r.status, raw, r.final, r.hops);
    } catch {
      return describeError(error);
    }
  }
}

type QueueRow = { id: string; source_url: string };

/** Checks the listings that were checked longest ago (or never), until the count or the time budget runs out. */
export async function runBatch(limit: number, budgetMs: number): Promise<{ checked: number; ok: number; broken: number; unsure: number; remaining: boolean }> {
  const out = { checked: 0, ok: 0, broken: 0, unsure: 0, remaining: false };
  if (!dbConfigured()) return out;
  const q = await call('rpc/link_check_queue', { method: 'POST', headers: headers(), body: JSON.stringify({ p_limit: limit }) });
  if (!q.ok || !Array.isArray(q.body)) return out;
  const queue = (q.body as QueueRow[]).slice();
  const started = Date.now();
  const perHost = new Map<string, number>();
  const rows: { opportunity_id: string; url: string; status: number | null; verdict: Verdict; detail: string; checked_at: string }[] = [];

  const hostOf = (u: string): string => {
    try {
      return new URL(u).hostname;
    } catch {
      return '';
    }
  };

  async function worker(): Promise<void> {
    while (queue.length > 0 && Date.now() - started < budgetMs) {
      const i = queue.findIndex((x) => (perHost.get(hostOf(x.source_url)) ?? 0) < 2);
      if (i === -1) {
        await new Promise((r) => setTimeout(r, 60));
        continue;
      }
      const [item] = queue.splice(i, 1);
      const host = hostOf(item.source_url);
      perHost.set(host, (perHost.get(host) ?? 0) + 1);
      try {
        const res = await checkUrl(item.source_url);
        rows.push({ opportunity_id: item.id, url: item.source_url, status: res.status, verdict: res.verdict, detail: res.detail, checked_at: new Date().toISOString() });
        out.checked++;
        out[res.verdict]++;
      } finally {
        perHost.set(host, Math.max(0, (perHost.get(host) ?? 1) - 1));
      }
    }
  }

  await Promise.all(Array.from({ length: 8 }, worker));
  out.remaining = queue.length > 0;

  for (let i = 0; i < rows.length; i += 200) {
    await call('link_checks?on_conflict=opportunity_id', {
      method: 'POST',
      headers: headers({ prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify(rows.slice(i, i + 200)),
    });
  }
  return out;
}

export type BrokenLink = { opportunity_id: string; url: string; status: number | null; verdict: Verdict; detail: string; checked_at: string; opportunities: { id: string; category: string; slug: string; title: string; provider: string; published: boolean } };

/** Links that failed, worst first. "unsure" ones need a human look because the site may simply refuse robots. */
export async function listProblemLinks(verdict: 'broken' | 'unsure', limit = 100): Promise<BrokenLink[]> {
  if (!dbConfigured()) return [];
  const sel = 'opportunity_id,url,status,verdict,detail,checked_at,opportunities!inner(id,category,slug,title,provider,published,source_url)';
  const r = await call(`link_checks?select=${encodeURIComponent(sel)}&verdict=eq.${verdict}&opportunities.published=eq.true&order=checked_at.desc&limit=${limit}`, { headers: headers() });
  if (!r.ok || !Array.isArray(r.body)) return [];
  return (r.body as (BrokenLink & { opportunities: BrokenLink['opportunities'] & { source_url: string | null } })[]).filter((x) => x.opportunities.source_url === x.url);
}
