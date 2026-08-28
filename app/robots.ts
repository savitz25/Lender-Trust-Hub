import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/directory/categories';
import { NATIONAL_PROFILE_GATE } from '@/lib/national-profile/cohort';

export default function robots(): MetadataRoute.Robots {
  const sitemaps = [`${SITE_URL}/sitemap.xml`];
  if (NATIONAL_PROFILE_GATE.sitemap && NATIONAL_PROFILE_GATE.productionLaunchEnabled) {
    sitemaps.push(`${SITE_URL}/sitemap-lenders-national.xml`);
  }

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
          '/internal/',
          '/internal',
          // Do not blanket-disallow /lender/{slug}. Per-profile robots + sitemap decide indexation.
        ],
      },
    ],
    sitemap: sitemaps,
    host: SITE_URL,
  };
}
