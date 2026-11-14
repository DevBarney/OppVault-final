// Content-Security-Policy. Scripts and styles still allow 'unsafe-inline' because Next.js writes small inline
// scripts for hydration; everything else is locked to this site, our database host and (only if analytics is on)
// Google Analytics. Pictures may come from any https address because listings link to the organisers' images.
const SUPABASE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').origin;
  } catch {
    return '';
  }
})();
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE_HOST} https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com`.replace(/\s+/g, ' ').trim(),
  "frame-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Smaller pictures for browsers that support AVIF, WebP for the rest.
  images: { formats: ['image/avif', 'image/webp'] },
  async headers() {
    return [
      // Brand images in /public never change name, so let browsers and the CDN keep them for a day
      // (and serve a stale copy for a week while checking for a new one). email-logo.png is fetched by
      // mail apps every time someone opens one of our emails, so it matters most here.
      {
        source: '/(og-oppvault\\.png|logo-horizontal\\.png|email-logo\\.png)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Content-Security-Policy', value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
