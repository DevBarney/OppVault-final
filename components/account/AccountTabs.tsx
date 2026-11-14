import Link from 'next/link';
import './account.css';

/** Switch between the account pages. */
export default function AccountTabs({ current }: { current: 'saved' | 'applications' | 'settings' }) {
  return (
    <nav className="acct-tabs-nav" aria-label="Your account">
      <Link href="/account/saved" aria-current={current === 'saved' ? 'page' : undefined}>My saved</Link>
      <Link href="/account/applications" aria-current={current === 'applications' ? 'page' : undefined}>My applications</Link>
      <Link href="/account/settings" aria-current={current === 'settings' ? 'page' : undefined}>Settings</Link>
    </nav>
  );
}
