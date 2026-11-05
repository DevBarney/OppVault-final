// The visitor's cookie choice. Stored in one small first-party cookie so it survives between visits.
// Essential cookies (sign-in, admin) never need consent and are not listed here.
// To add analytics later: load the script only when `hasConsent('analytics')` is true, and again when
// the `oppvault:consent` event fires.

export const CONSENT_COOKIE = 'ov_consent';
export const CONSENT_VERSION = 1;
export const OPEN_COOKIES_EVENT = 'oppvault:open-cookies';
export const CONSENT_CHANGED_EVENT = 'oppvault:consent';

export type Consent = { analytics: boolean };

export function readConsent(): Consent | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return null;
  try {
    const raw = decodeURIComponent(match.slice(CONSENT_COOKIE.length + 1));
    const [version, flags] = raw.split(':');
    if (Number(version) !== CONSENT_VERSION) return null;
    return { analytics: (flags ?? '').split(',').includes('analytics') };
  } catch {
    return null;
  }
}

export function saveConsent(consent: Consent): void {
  const flags = consent.analytics ? 'analytics' : 'essential';
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(`${CONSENT_VERSION}:${flags}`)}; Path=/; Max-Age=${180 * 86400}; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: consent }));
}

export function hasConsent(kind: keyof Consent): boolean {
  return readConsent()?.[kind] === true;
}
