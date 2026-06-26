import type { MetadataRoute } from 'next';
import { SITE_URL, FDIC_CATEGORY } from '@/lib/directory/categories';
import { US_STATES } from '@/lib/fdic/states';
import { statePagePath } from '@/lib/fdic/seo';

/**
 * Dynamic sitemap — auto-includes all FDIC state pages.
 * Add new verticals by pushing additional URL entries below.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base = SITE_URL;

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/calculators`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/local-lenders`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    {
      url: `${base}${FDIC_CATEGORY.hubPath}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
  ];

  const fdicStatePages: MetadataRoute.Sitemap = US_STATES.filter((s) => s.hasData).map((s) => ({
    url: `${base}${statePagePath(s.slug)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  return [...staticPages, ...fdicStatePages];
}