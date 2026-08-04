import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/directory/categories';
import { lenders } from '@/lib/mockData';
import { stateData } from '@/lib/fdic/stateData';
import { getStateSlugsWithLenders } from '@/lib/mortgage/stateLenders';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

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
    '/my-lending',
    '/fdic-insured-banks',
    '/auto-loan-companies',
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: 'weekly',
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

  const profiles: MetadataRoute.Sitemap = (lenders ?? []).map((l) => ({
    url: `${SITE_URL}/lenders/${l.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...fdicStates, ...mortgageStates, ...profiles];
}
