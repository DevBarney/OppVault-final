import type { ReactNode } from 'react';
import { CategoryIcon, CheckIcon, ClockIcon } from './Icons';

type IconName = 'keyhole' | 'tag' | 'calendar' | 'clock' | 'check';

function CalloutIcon({ name }: { name: IconName }) {
  if (name === 'keyhole') {
    return (
      <svg viewBox="0 0 40 52" className="callout__icon callout__icon--key" aria-hidden="true" focusable="false">
        <circle cx="20" cy="17" r="8" />
        <path d="M16 22h8l3 20H13l3-20Z" />
      </svg>
    );
  }
  if (name === 'tag') return <CategoryIcon name="tag" className="callout__icon" />;
  if (name === 'calendar') return <CategoryIcon name="calendar" className="callout__icon" />;
  if (name === 'clock') return <ClockIcon className="callout__icon" />;
  return <CheckIcon className="callout__icon" />;
}

/**
 * A short note with a round icon badge and a plain title. Used for the small "good to know" boxes on
 * listing pages. `quiet` is for things that have already ended.
 */
export default function Callout({
  icon,
  title,
  tone = 'light',
  children,
}: {
  icon: IconName;
  title: string;
  tone?: 'light' | 'quiet';
  children: ReactNode;
}) {
  return (
    <aside className={`callout callout--${tone}`} role="note">
      <span className="callout__badge" aria-hidden="true">
        <CalloutIcon name={icon} />
      </span>
      <div className="callout__body">
        <p className="callout__title">{title}</p>
        <p className="callout__text">{children}</p>
      </div>
    </aside>
  );
}
