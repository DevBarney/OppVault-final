/** "scholarships/some-slug" -> { category, slug }, or null if it does not look right. */
export function validRefClient(value: string | null | undefined): { category: string; slug: string } | null {
  if (!value) return null;
  const m = /^([a-z-]{3,20})\/([a-z0-9][a-z0-9-]{0,199})$/i.exec(value);
  return m ? { category: m[1], slug: m[2] } : null;
}

/** Same rule as the server: only same-site paths. */
export function safePath(value: string | null | undefined, fallback = '/account/saved'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.length > 300) return fallback;
  return value;
}
