// Which social sign-in buttons to show. Safe to import from browser code.
// Set NEXT_PUBLIC_AUTH_PROVIDERS (comma separated) to show only the ones you have switched on in Supabase,
// for example "google" until LinkedIn and X are ready. The default shows all three.

export type ProviderId = 'google' | 'linkedin_oidc' | 'x';

export const ALL_PROVIDERS: { id: ProviderId; label: string }[] = [
  { id: 'google', label: 'Google' },
  { id: 'linkedin_oidc', label: 'LinkedIn' },
  { id: 'x', label: 'X' },
];

export function enabledProviders(): { id: ProviderId; label: string }[] {
  const raw = process.env.NEXT_PUBLIC_AUTH_PROVIDERS;
  if (raw === undefined) return ALL_PROVIDERS;
  const wanted = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return ALL_PROVIDERS.filter((p) => wanted.includes(p.id) || (p.id === 'linkedin_oidc' && wanted.includes('linkedin')));
}
