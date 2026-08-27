import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/directory/categories';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          // Guest research workspace — not public index surfaces
          '/my-lending',
          '/my-lending/',
          '/auth/',
          // National profile intelligence Preview QA — noindex until indexing gate
          '/lender',
          '/lender/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
