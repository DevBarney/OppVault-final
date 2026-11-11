import Link from 'next/link';

/** A grid of topics for a category. Each tile filters the list by that topic. Plain links, so no JavaScript is needed. */
export default function TopicTiles({ basePath, topics, counts, active, label }: { basePath: string; topics: string[]; counts: Record<string, number>; active?: string; label: string }) {
  if (topics.length === 0) return null;
  const ordered = [...topics].sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0) || a.localeCompare(b));
  return (
    <nav className="tt" aria-label={label}>
      <h2 className="tt__title">{label}</h2>
      <ul className="tt__grid">
        {ordered.map((t) => {
          const on = t === active;
          return (
            <li key={t}>
              <Link className={`tt__tile${on ? ' is-active' : ''}`} href={on ? `${basePath}#listings` : `${basePath}?topic=${encodeURIComponent(t)}#listings`} aria-current={on ? 'true' : undefined}>
                <span className="tt__name">{t}</span>
                <span className="tt__count">{counts[t] ?? 0}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
