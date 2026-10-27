import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import NewsletterBand from '../components/NewsletterBand';
import Interactions from '../components/Interactions';
import { SITE_URL, TAGLINE } from '../lib/config';

/**
 * Fonts come from the Google Fonts CDN. Poppins is the main font everywhere.
 * Fraunces is a warm serif used sparingly for big, expressive moments (see --font-display).
 */
const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Fraunces:ital,wght@0,600;0,700;1,600&display=swap';

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
    url: '/',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: `OppVault. ${TAGLINE}` }],
  },
  twitter: { card: 'summary_large_image', site: '@oppvault', images: ['/og.png'] },
};

export const viewport: Viewport = { themeColor: '#04106B' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={FONTS_URL} />
      </head>
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
