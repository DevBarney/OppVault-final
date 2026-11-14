import Image from 'next/image';
import CookieSettingsLink from './CookieSettingsLink';
import Link from 'next/link';
import { ArrowIcon, ArrowUpIcon } from './Icons';
import { CATEGORIES } from '../lib/categories';
import { CONTACT, TAGLINE, WHATSAPP_URL } from '../lib/config';

const COMPANY = [
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/submit', label: 'Suggest an opportunity' },
];
const ACCOUNT = [
  { href: '/account/saved', label: 'My saved' },
  { href: '/account/applications', label: 'My applications' },
  { href: '/support', label: 'Help & contact' },
];
const LEGAL = [
  { href: '/privacy', label: 'Privacy notice' },
  { href: '/terms', label: 'Terms of use' },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <Image className="footer__logo" src="/logo-horizontal.png" alt="OppVault" width={1459} height={427} sizes="220px" />
            <p className="footer__tagline">{TAGLINE}</p>
            <p className="footer__about">
              Scholarships, fellowships, grants, courses, events and student offers in one place, each with a link to the official page. Free to use.
            </p>
            <a className="footer__join" href="#subscribe">
              <span>Get updates by email</span>
              <ArrowIcon className="footer__join-arrow" />
            </a>
            <p className="footer__contact">
              Questions? <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            </p>
          </div>

          <nav className="footer__cols" aria-label="Footer">
            <div className="footer__col">
              <h2 className="footer__heading">Explore</h2>
              <ul>
                {CATEGORIES.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/${c.slug}`}>{c.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer__col">
              <h2 className="footer__heading">OppVault</h2>
              <ul>
                {COMPANY.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer__col">
              <h2 className="footer__heading">Your account</h2>
              <ul>
                {ACCOUNT.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer__col">
              <h2 className="footer__heading">Connect</h2>
              <ul>
                <li>
                  <a href={CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer">
                    Instagram<span className="visually-hidden"> (opens in a new tab)</span>
                  </a>
                </li>
                <li>
                  <a href={CONTACT.xUrl} target="_blank" rel="noopener noreferrer">
                    X<span className="visually-hidden"> (opens in a new tab)</span>
                  </a>
                </li>
                {WHATSAPP_URL ? (
                  <li>
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                      WhatsApp community<span className="visually-hidden"> (opens in a new tab)</span>
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          </nav>
        </div>

        <div className="footer__bar">
          <p className="footer__note">
            &copy; {year} OppVault. We help you find opportunities. We cannot guarantee any outcome, so always check the official page before you apply.
          </p>
          <ul className="footer__legal" aria-label="Legal">
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
            <li>
              <CookieSettingsLink />
            </li>
          </ul>
          <a className="footer__top-link" href="#main" aria-label="Back to top">
            <span>Back to top</span>
            <ArrowUpIcon className="footer__top-icon" />
          </a>
        </div>
      </div>
    </footer>
  );
}
