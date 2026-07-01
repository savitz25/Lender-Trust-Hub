import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/calculators-hub', destination: '/calculators', permanent: true },
      { source: '/calculators-hub/:path*', destination: '/calculators', permanent: true },
    ];
  },
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
        source: '/local-lenders/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/auto-loan-companies/:path*',
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
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },
};

export default nextConfig;