import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import './globals.css';
import Nav from '../components/Nav';
import Interactions from '../components/Interactions';
import { SITE_URL, TAGLINE } from '../lib/config';

// Poppins is bundled locally (app/fonts), so the site makes no calls to Google Fonts.
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

const TITLE = `OppVault | ${TAGLINE}`;
const DESCRIPTION =
  'OppVault is being built to bring scholarships, internships, fellowships, grants and more into one organised place. Subscribe for updates and join the WhatsApp community.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: 'OppVault',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'OppVault',
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: `OppVault. ${TAGLINE}` }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@oppvault',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#04106B',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB" className={poppins.variable}>
      <body>
        <Nav />
        <Interactions />
        {children}
      </body>
    </html>
  );
}
