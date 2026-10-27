import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpIcon } from './Icons';
import { CATEGORIES } from '../lib/categories';
import { CONTACT, TAGLINE, WHATSAPP_URL } from '../lib/config';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <Image className="footer__logo" src="/logo-horizontal.png" alt="OppVault" width={1459} height={427} sizes="220px" />
            <p className="footer__tagline">{TAGLINE}</p>
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
                <li>
                  <Link href="/about">About</Link>
                </li>
                <li>
                  <Link href="/blog">Blog</Link>
                </li>
                <li>
                  <Link href="/submit">Suggest an opportunity</Link>
                </li>
                <li>
                  <Link href="/account/saved">My saved</Link>
                </li>
                <li>
                  <Link href="/privacy">Privacy notice</Link>
                </li>
              </ul>
            </div>
            <div className="footer__col">
              <h2 className="footer__heading">Connect</h2>
              <ul>
                <li>
                  <a href={`mailto:${CONTACT.email}`}>Email us</a>
                </li>
                <li>
                  <a href={CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href={CONTACT.xUrl} target="_blank" rel="noopener noreferrer">
                    X
                  </a>
                </li>
                {WHATSAPP_URL ? (
                  <li>
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                      WhatsApp community
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          </nav>
        </div>

        <div className="footer__bar">
          <p>&copy; {year} OppVault. We help you discover opportunities; we cannot guarantee any outcome.</p>
          <a className="footer__top-link" href="#main" aria-label="Back to top">
            <span>Back to top</span>
            <ArrowUpIcon className="footer__top-icon" />
          </a>
        </div>
      </div>
    </footer>
  );
}
