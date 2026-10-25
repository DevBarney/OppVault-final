import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import './globals.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import NewsletterBand from '../components/NewsletterBand';
import Interactions from '../components/Interactions';
import { SITE_URL, TAGLINE } from '../lib/config';

const poppins = localFont({
  src: [
    { path: './fonts/Poppins-Light.ttf', weight: '300', style: 'normal' },
    { path: './fonts/Poppins-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/Poppins-Medium.ttf', weight: '500', style: 'normal' },
    { path: './fonts/Poppins-Bold.ttf', weight: '700', style: 'normal' },
  ],
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
    url: '/',
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
