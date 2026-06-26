import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * PERFORMANCE: Long-cache static FDIC pages (SSG) at the CDN edge.
   * HTML revalidates via ISR (revalidate export on state pages).
   */
  async headers() {
    return [
      {
        source: '/fdic-insured-banks/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/geo/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  /**
   * Prefetch state page links on hover (Next.js Link default) for instant navigation.
   * Code splitting: heavy client components use next/dynamic in page files.
   */
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;