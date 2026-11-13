import Link from 'next/link';
import './account.css';

/** Switch between the two account pages. */
export default function AccountTabs({ current }: { current: 'saved' | 'applications' }) {
  return (
    <nav className="acct-tabs-nav" aria-label="Your account">
      <Link href="/account/saved" aria-current={current === 'saved' ? 'page' : undefined}>My saved</Link>
      <Link href="/account/applications" aria-current={current === 'applications' ? 'page' : undefined}>My applications</Link>
    </nav>
  );
}
