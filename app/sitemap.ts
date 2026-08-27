import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/directory/categories';
import { lenders } from '@/lib/mockData';
import { stateData } from '@/lib/fdic/stateData';
import { getStateSlugsWithLenders } from '@/lib/mortgage/stateLenders';
import { getSitemapCounties } from '@/lib/mortgage/county-quality-tiers';
import { HIGH_VOLUME_STATE_SLUGS } from '@/lib/mortgage/seo';
import { cleanNmlsId } from '@/lib/verification/nmls';
import { catalogDistinctEntities } from '@/lib/verification';

/** Meaningful lastmod for sitemap — day of generation (catalog is static build data). */
function catalogLastMod(): Date {
  return new Date();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = catalogLastMod();

  /** Indexable public research surfaces only — workspace routes excluded */
  const staticPaths: Array<{ path: string; priority: number; changeFrequency: 'weekly' | 'monthly' }> = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/lender', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/local-lenders', priority: 0.95, changeFrequency: 'weekly' },
    { path: '/tools/loan-estimate-analyzer', priority: 0.92, changeFrequency: 'weekly' },
    { path: '/tools/compare-loan-estimates', priority: 0.92, changeFrequency: 'weekly' },
    { path: '/tools/program-finder', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/programs', priority: 0.88, changeFrequency: 'weekly' },
    { path: '/programs/fha', priority: 0.85, changeFrequency: 'monthly' },
    { path: '/programs/va', priority: 0.85, changeFrequency: 'monthly' },
    { path: '/programs/conventional', priority: 0.85, changeFrequency: 'monthly' },
    { path: '/programs/usda', priority: 0.82, changeFrequency: 'monthly' },
    { path: '/programs/down-payment-assistance', priority: 0.88, changeFrequency: 'weekly' },
    { path: '/calculators', priority: 0.85, changeFrequency: 'weekly' },
    { path: '/compare', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/methodology', priority: 0.75, changeFrequency: 'monthly' },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'monthly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'monthly' },
    { path: '/fdic-insured-banks', priority: 0.75, changeFrequency: 'weekly' },
    { path: '/auto-loan-companies', priority: 0.7, changeFrequency: 'weekly' },
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  let fdicStates: MetadataRoute.Sitemap = [];
  try {
    fdicStates = Object.keys(stateData ?? {}).map((state) => ({
      url: `${SITE_URL}/fdic-insured-banks/${state}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
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
      priority: HIGH_VOLUME_STATE_SLUGS.has(state) ? 0.92 : 0.84,
    }));
  } catch {
    mortgageStates = [];
  }

  // Tier 1 / Tier 2 counties only (Tier 3 noindex — omit)
  let mortgageCounties: MetadataRoute.Sitemap = [];
  try {
    mortgageCounties = getSitemapCounties().map((c) => {
      const highVolume = HIGH_VOLUME_STATE_SLUGS.has(c.stateSlug);
      const priority =
        c.tier === 1
          ? highVolume
            ? 0.88
            : 0.8
          : highVolume
            ? 0.72
            : 0.65;
      return {
        url: `${SITE_URL}/local-lenders/${c.stateSlug}/${c.countySlug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority,
      };
    });
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
      priority: HIGH_VOLUME_STATE_SLUGS.has(l.stateSlug) ? 0.74 : 0.68,
    }));

  return [
    ...staticRoutes,
    ...fdicStates,
    ...mortgageStates,
    ...mortgageCounties,
    ...profiles,
  ];
}
