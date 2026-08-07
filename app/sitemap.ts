import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/directory/categories';
import { lenders } from '@/lib/mockData';
import { stateData } from '@/lib/fdic/stateData';
import { getStateSlugsWithLenders } from '@/lib/mortgage/stateLenders';
import { getSitemapCounties } from '@/lib/mortgage/county-quality-tiers';
import { cleanNmlsId } from '@/lib/verification/nmls';
import { catalogDistinctEntities } from '@/lib/verification';

/** Meaningful lastmod for sitemap — day of generation (catalog is static build data). */
function catalogLastMod(): Date {
  return new Date();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = catalogLastMod();

  const staticPaths = [
    '/',
    '/about',
    '/methodology',
    '/contact',
    '/privacy',
    '/terms',
    '/calculators',
    '/compare',
    '/local-lenders',
    '/fdic-insured-banks',
    '/auto-loan-companies',
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : path === '/local-lenders' ? 0.9 : 0.8,
  }));

  let fdicStates: MetadataRoute.Sitemap = [];
  try {
    fdicStates = Object.keys(stateData ?? {}).map((state) => ({
      url: `${SITE_URL}/fdic-insured-banks/${state}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }));
  } catch {
    fdicStates = [];
  }

  let mortgageStates: MetadataRoute.Sitemap = [];
  try {
    mortgageStates = getStateSlugsWithLenders().map((state) => ({
      url: `${SITE_URL}/local-lenders/${state}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }));
  } catch {
    mortgageStates = [];
  }

  // Phase 4: only Tier 1 / Tier 2 counties (Tier 3 noindex — omit from premium sitemap)
  let mortgageCounties: MetadataRoute.Sitemap = [];
  try {
    mortgageCounties = getSitemapCounties().map((c) => ({
      url: `${SITE_URL}/local-lenders/${c.stateSlug}/${c.countySlug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: c.tier === 1 ? 0.8 : 0.65,
    }));
  } catch {
    mortgageCounties = [];
  }

  // Strong profiles only: NMLS ID verified (Phase 0) + distinct entities
  const profiles: MetadataRoute.Sitemap = catalogDistinctEntities(lenders ?? [])
    .filter((l) => l.nmlsVerified && cleanNmlsId(l.nmlsId))
    .map((l) => ({
      url: `${SITE_URL}/lenders/${l.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

  return [
    ...staticRoutes,
    ...fdicStates,
    ...mortgageStates,
    ...mortgageCounties,
    ...profiles,
  ];
}
