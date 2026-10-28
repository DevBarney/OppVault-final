import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Poppins } from 'next/font/google';
import './globals.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import NewsletterBand from '../components/NewsletterBand';
import Interactions from '../components/Interactions';
import { SITE_URL, TAGLINE } from '../lib/config';

/**
 * Poppins is the main font everywhere. next/font/google downloads it from Google Fonts at build time and
 * serves it from our own domain: no extra connection to Google, preloaded, with a matched fallback so the
 * text does not jump when the font arrives. Only the weights the site actually uses are loaded.
 */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const DESCRIPTION =
  'OppVault brings scholarships, fellowships, grants, free courses, events and student offers into one organised place, each linked to its official source.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `OppVault | ${TAGLINE}`, template: '%s | OppVault' },
  description: DESCRIPTION,
  applicationName: 'OppVault',
  openGraph: {
    type: 'website',
    siteName: 'OppVault',
    title: `OppVault | ${TAGLINE}`,
    description: DESCRIPTION,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: `OppVault. ${TAGLINE}` }],
  },
  twitter: { card: 'summary_large_image', site: '@oppvault', images: ['/og.png'] },
};

export const viewport: Viewport = { themeColor: '#04106B' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB" className={poppins.variable}>
      <body>
        <Nav />
        <Interactions />
        <main id="main">{children}</main>
        <NewsletterBand />
        <Footer />
      </body>
    </html>
  );
}
