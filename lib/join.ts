/** Where a visitor came from when they opened /join. Only these are counted, so a made-up link cannot fill the table. */
export const JOIN_SOURCES = ['site', 'save', 'applied', 'closing', 'email', 'newsletter', 'flyer', 'video', 'footer', 'about'] as const;
export type JoinSource = (typeof JOIN_SOURCES)[number];

export function joinSource(value: string | null): JoinSource {
  const v = (value ?? '').toLowerCase();
  return (JOIN_SOURCES as readonly string[]).includes(v) ? (v as JoinSource) : 'site';
}

/** The short link to share and print. It redirects to the WhatsApp community and counts the open. */
export function joinPath(src: JoinSource): string {
  return `/join?src=${src}`;
}
