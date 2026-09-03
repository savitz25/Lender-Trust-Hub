import type { NjCountySlug } from './types';

export type NjCountyPublicationGate = {
  slug: NjCountySlug;
  path: `/${string}`;
  robotsIndex: boolean;
  sitemap: boolean;
  title: string;
  description: string;
};

export const NJ_COUNTY_INTELLIGENCE_GATES: Record<NjCountySlug, NjCountyPublicationGate> = {
  'monmouth-county': {
    slug: 'monmouth-county',
    path: '/new-jersey/monmouth-county',
    robotsIndex: true,
    sitemap: true,
    title: 'Monmouth County Mortgage & Property-Market Research | LenderTrustHub',
    description:
      'Research Monmouth County mortgage activity using 2025 HMDA, NJHMFA down-payment geography, OPRS land-record access, and a sheriff-sale status snapshot. Independent research. Not a ranking or recommendation.',
  },
  'middlesex-county': {
    slug: 'middlesex-county',
    path: '/new-jersey/middlesex-county',
    robotsIndex: true,
    sitemap: true,
    title: 'Middlesex County Mortgage & Property-Market Research | LenderTrustHub',
    description:
      'Research Middlesex County mortgage activity using 2025 HMDA, NJHMFA down-payment geography, SearchNG land-record access, and a sheriff-sale status snapshot. Independent research. Not a ranking or recommendation.',
  },
  'somerset-county': {
    slug: 'somerset-county',
    path: '/new-jersey/somerset-county',
    robotsIndex: true,
    sitemap: true,
    title: 'Somerset County Mortgage & Property-Market Research | LenderTrustHub',
    description:
      'Research Somerset County mortgage activity using 2025 HMDA, NJHMFA down-payment geography, Acclaim land-record access, and parcel/property context. Independent research. Not a ranking or recommendation.',
  },
  'union-county': {
    slug: 'union-county',
    path: '/new-jersey/union-county',
    robotsIndex: true,
    sitemap: true,
    title: 'Union County Mortgage & Property-Market Research | LenderTrustHub',
    description:
      'Research Union County mortgage activity using 2025 HMDA, NJHMFA down-payment geography, Clerk land-record access, and local housing/repair resources. Independent research. Not a ranking or recommendation.',
  },
};

export function indexedNjCountyGates(): NjCountyPublicationGate[] {
  return Object.values(NJ_COUNTY_INTELLIGENCE_GATES).filter((g) => g.robotsIndex && g.sitemap);
}
