import { FDIC_CATEGORY, MORTGAGE_CATEGORY, SITE_URL } from './categories';

/**
 * CONTENT CLUSTER STRATEGY — topical authority mesh for lending directory SEO.
 *
 * Hub pages link to pillar content; state pages link to sibling verticals.
 * Each cluster targets a featured-snippet-friendly query family.
 */

export interface ContentCluster {
  id: string;
  pillarTitle: string;
  targetQuery: string;
  hubHref: string;
  stateHref: (slug: string) => string;
  relatedCalculator?: string;
}

export const DIRECTORY_CLUSTERS: ContentCluster[] = [
  {
    id: 'fdic-banks',
    pillarTitle: 'FDIC Insured Banks by State',
    targetQuery: 'FDIC insured banks near me',
    hubHref: FDIC_CATEGORY.hubPath,
    stateHref: FDIC_CATEGORY.statePath,
    relatedCalculator: '/calculators',
  },
  {
    id: 'mortgage-lenders',
    pillarTitle: 'Verified Mortgage Lenders',
    targetQuery: 'best mortgage lenders by state',
    hubHref: MORTGAGE_CATEGORY.hubPath,
    stateHref: MORTGAGE_CATEGORY.statePath,
    relatedCalculator: '/calculators',
  },
  {
    id: 'deposit-safety',
    pillarTitle: 'FDIC Insurance Explained',
    targetQuery: 'what does FDIC insurance cover',
    hubHref: '/fdic-insured-banks',
    stateHref: (slug) => `/fdic-insured-banks/${slug}#fdic-faq-heading`,
  },
  {
    id: 'mortgage-tools',
    pillarTitle: 'Free Mortgage Calculators',
    targetQuery: 'mortgage payment calculator',
    hubHref: '/calculators',
    stateHref: () => '/calculators',
  },
  {
    id: 'trust-transparency',
    pillarTitle: 'How We Verify Listings',
    targetQuery: 'is LenderTrustHub legit',
    hubHref: '/about',
    stateHref: () => '/about',
  },
];

/** Internal linking rules — apply when rendering any directory page */
export const INTERNAL_LINK_RULES = {
  statePageMustLinkTo: [
    (slug: string) => FDIC_CATEGORY.statePath(slug),
    (slug: string) => MORTGAGE_CATEGORY.statePath(slug),
    () => '/calculators',
    () => FDIC_CATEGORY.hubPath,
  ],
  hubPageMustLinkTo: DIRECTORY_CLUSTERS.map((c) => c.hubHref),
  profilePageMustLinkTo: (stateSlug: string) => [
    FDIC_CATEGORY.statePath(stateSlug),
    MORTGAGE_CATEGORY.statePath(stateSlug),
  ],
  canonicalBase: SITE_URL,
} as const;