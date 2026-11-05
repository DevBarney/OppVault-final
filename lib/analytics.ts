// Google Analytics 4, loaded only when (a) NEXT_PUBLIC_GA_ID is set and (b) the visitor has said yes.
// Nothing is downloaded and no cookie is set before that.

const RAW = process.env.NEXT_PUBLIC_GA_ID ?? '';
export const GA_ID = /^G-[A-Z0-9]{6,14}$/.test(RAW.trim()) ? RAW.trim() : '';
export const ANALYTICS_AVAILABLE = GA_ID !== '';

/** Pages we never measure: the admin area and account pages. */
export function isMeasurable(path: string): boolean {
  return !(path.startsWith('/admin') || path.startsWith('/account') || path.startsWith('/api'));
}

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

let loaded = false;

export function loadAnalytics(): void {
  if (!ANALYTICS_AVAILABLE || typeof window === 'undefined') return;
  window[`ga-disable-${GA_ID}`] = false;
  if (loaded) return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js expects the real `arguments` object, not an array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false, anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
}

export function stopAnalytics(): void {
  if (!ANALYTICS_AVAILABLE || typeof window === 'undefined') return;
  window[`ga-disable-${GA_ID}`] = true;
  const host = location.hostname;
  const parts = host.split('.');
  const domains = [host, `.${host}`, parts.length > 2 ? `.${parts.slice(-2).join('.')}` : ''].filter(Boolean);
  const names = document.cookie
    .split('; ')
    .map((c) => c.split('=')[0])
    .filter((n) => n === '_ga' || n.startsWith('_ga_') || n === '_gid' || n.startsWith('_gat'));
  for (const name of names) {
    for (const d of domains) document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${d}`;
    document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}

export function trackPageView(path: string): void {
  if (!ANALYTICS_AVAILABLE || !window.gtag || window[`ga-disable-${GA_ID}`]) return;
  if (!isMeasurable(path)) return;
  window.gtag('event', 'page_view', { page_path: path, page_location: location.origin + path, page_title: document.title });
}
