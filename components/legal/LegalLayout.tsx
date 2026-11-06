import type { ReactNode } from 'react';
import Link from 'next/link';
import VaultDoor from '../VaultDoor';
import Reveal from '../Reveal';
import './legal.css';

export type LegalIconName = 'shield' | 'user' | 'link' | 'doc' | 'mail' | 'cookie' | 'warn' | 'check' | 'chat' | 'pen' | 'refresh';

const PATHS: Record<LegalIconName, string> = {
  shield: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9c0-3.5 3-6 7-6s7 2.5 7 6',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1',
  doc: 'M7 3h7l5 5v13H7V3Zm7 0v5h5M10 13h6M10 17h6',
  mail: 'M4 6h16v12H4V6Zm0 1 8 6 8-6',
  cookie: 'M12 3a9 9 0 1 0 9 9 4 4 0 0 1-4-4 4 4 0 0 1-5-5ZM9 10h.01M13 15h.01M8.500 14.500h.01',
  warn: 'M12 4 3 20h18L12 4Zm0 6v5m0 3v.01',
  check: 'M20 6 9 17l-5-5',
  chat: 'M4 5h16v11H9l-5 4V5Z',
  pen: 'M4 20l1-4L16.500 4.500a2 2 0 0 1 3 3L8 19l-4 1Z',
  refresh: 'M20 11a8 8 0 0 0-14.500-3.500L4 9M4 5v4h4M4 13a8 8 0 0 0 14.500 3.500L20 15M20 19v-4h-4',
};

export function LegalIcon({ name, className }: { name: LegalIconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}

export type LegalSection = { id: string; title: string; icon: LegalIconName; body: ReactNode };
export type LegalHighlight = { icon: LegalIconName; title: string; text: string };

/**
 * One layout for the Terms and the Privacy notice: a hero with the vault door, "the short version" tiles,
 * jump links, then each part as its own card.
 */
export default function LegalLayout({
  kind,
  title,
  updated,
  lead,
  highlights,
  sections,
  other,
}: {
  kind: string;
  title: string;
  updated: string;
  lead: string;
  highlights: LegalHighlight[];
  sections: LegalSection[];
  other: { href: string; label: string };
}) {
  return (
    <>
      <section className="phead legal-hero">
        <div className="hero__aurora" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="legal-hero__art" aria-hidden="true">
          <VaultDoor />
        </div>
        <div className="container phead__inner">
          <p className="phead__eyebrow">{kind}</p>
          <h1 className="phead__title">{title}</h1>
          <div className="phead__text">
            <p>{lead}</p>
          </div>
          <p className="legal-hero__date">Last updated {updated}</p>
        </div>
      </section>

      <div className="legal">
        <div className="container legal__in">
          <Reveal>
            <h2 className="legal__short">The short version</h2>
            <ul className="legal-hl">
              {highlights.map((h) => (
                <li key={h.title} className="legal-hl__item">
                  <span className="legal-hl__tile" aria-hidden="true">
                    <LegalIcon name={h.icon} className="legal-hl__icon" />
                  </span>
                  <span className="legal-hl__title">{h.title}</span>
                  <span className="legal-hl__text">{h.text}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <div className="legal__cols">
            <nav className="legal-jump" aria-label="On this page">
              <p className="legal-jump__label">On this page</p>
              <ul>
                {sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`}>{s.title}</a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="legal__main">
              {sections.map((s) => (
                <section key={s.id} id={s.id} className="legal-card" aria-labelledby={`${s.id}-h`}>
                  <h2 id={`${s.id}-h`} className="legal-card__title">
                    <span className="legal-card__tile" aria-hidden="true">
                      <LegalIcon name={s.icon} className="legal-card__icon" />
                    </span>
                    {s.title}
                  </h2>
                  <div className="legal-card__body">{s.body}</div>
                </section>
              ))}
              <p className="legal__other">
                Also read: <Link href={other.href}>{other.label}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
