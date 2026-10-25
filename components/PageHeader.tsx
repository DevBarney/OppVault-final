import type { ReactNode } from 'react';

/** The dark band at the top of every inner page. */
export default function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <section className="phead">
      <div className="hero__aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="container phead__inner">
        {eyebrow ? <p className="phead__eyebrow">{eyebrow}</p> : null}
        <h1 className="phead__title">{title}</h1>
        {children ? <div className="phead__text">{children}</div> : null}
      </div>
    </section>
  );
}
