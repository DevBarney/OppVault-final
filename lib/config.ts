// Central place for values you are likely to change.
// Public values are read from environment variables so you never edit code to go live.

/** WhatsApp community invite link, e.g. https://chat.whatsapp.com/XXXXXXXX */
function cleanUrl(value: string | undefined): string | undefined {
  const v = value?.trim();
  if (!v) return undefined;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** The OppVault WhatsApp community. Set NEXT_PUBLIC_WHATSAPP_URL to override it without editing code. */
export const DEFAULT_WHATSAPP_URL = 'https://chat.whatsapp.com/EvaSDdZLs1VEK7fSP7zzr1';

export const WHATSAPP_URL = cleanUrl(process.env.NEXT_PUBLIC_WHATSAPP_URL) ?? DEFAULT_WHATSAPP_URL;

export const SITE_URL = cleanUrl(process.env.NEXT_PUBLIC_SITE_URL) ?? 'https://oppvault.app';

export const CONTACT = {
  email: 'hello@oppvault.app',
  instagramHandle: 'oppvault_official',
  instagramUrl: 'https://instagram.com/oppvault_official',
  xHandle: 'oppvault',
  xUrl: 'https://x.com/oppvault',
} as const;

export const TAGLINE = 'Unlocking Opportunities, Empowering Potential.';
