import Link from 'next/link';
import VaultDoor from '../VaultDoor';
import { CategoryIcon } from '../Icons';
import { CATEGORIES } from '../../lib/categories';
import type { Opportunity } from '../../lib/types';
import './account.css';

export function SavedHero({ items }: { items: Opportunity[] }) {
  return (
    <section className="phead acct-shero">
      <div className="hero__aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="acct-shero__art" aria-hidden="true">
        <VaultDoor />
      </div>
      <div className="container phead__inner">
        <p className="phead__eyebrow">Your account</p>
        <h1 className="phead__title">My saved</h1>
        <div className="phead__text">
          <p>The opportunities you have kept, newest first. Always check the official page for the latest deadline before you apply.</p>
        </div>
        {items.length > 0 ? (
          <ul className="acct-shero__stats" aria-label="What you have saved">
            <li className="acct-shero__total">
              <strong>{items.length}</strong> saved
            </li>
            {CATEGORIES.map((c) => {
              const n = items.filter((o) => o.category === c.slug).length;
              return n > 0 ? (
                <li key={c.slug}>
                  <CategoryIcon name={c.icon} className="acct-shero__icon" />
                  {n} {n === 1 ? c.singular : c.label.toLowerCase()}
                </li>
              ) : null;
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

export function SavedEmpty() {
  return (
    <div className="acct-empty">
      <span className="acct-empty__tile" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="acct-empty__heart" focusable="false">
          <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.2 3.3 5 6.5 5c2 0 3.5 1.1 5.5 3.2C14 6.1 15.5 5 17.5 5c3.2 0 5 3.2 3.8 6.3-1.8 4.6-9.3 9.2-9.3 9.2Z" />
        </svg>
      </span>
      <h2 className="acct-empty__title">Your vault is empty for now</h2>
      <p>Tap the heart on any opportunity and it will be waiting for you here.</p>
      <ul className="acct-empty__kinds" aria-label="Start browsing">
        {CATEGORIES.map((c) => (
          <li key={c.slug}>
            <Link className="chip" href={`/${c.slug}`}>
              <CategoryIcon name={c.icon} className="chip__icon" />
              {c.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
