/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Smaller pictures for browsers that support AVIF, WebP for the rest.
  images: { formats: ['image/avif', 'image/webp'] },
  async headers() {
    return [
      // Brand images in /public never change name, so let browsers and the CDN keep them for a day
      // (and serve a stale copy for a week while checking for a new one).
      {
        source: '/(og\\.png|logo-horizontal\\.png)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
