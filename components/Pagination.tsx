import Link from 'next/link';

export default function Pagination({
  basePath,
  params,
  page,
  pages,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  pages: number;
}) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <nav className="pager" aria-label="Pagination">
      {page > 1 ? (
        <Link className="pager__btn" href={href(page - 1)} rel="prev">
          Previous
        </Link>
      ) : (
        <span className="pager__btn is-off">Previous</span>
      )}
      <span className="pager__info">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link className="pager__btn" href={href(page + 1)} rel="next">
          Next
        </Link>
      ) : (
        <span className="pager__btn is-off">Next</span>
      )}
    </nav>
  );
}
