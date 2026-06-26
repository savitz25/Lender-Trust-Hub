import {
  FDIC_CATEGORY,
  MORTGAGE_CATEGORY,
  AUTO_CATEGORY,
  SITE_URL,
} from './categories';

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
  /** Keyword-optimized H2 recommendation for hub copy */
  hubHeading?: string;
  /** Long-tail variants to weave into body copy */
  keywordVariants?: string[];
}

export const DIRECTORY_CLUSTERS: ContentCluster[] = [
  {
    id: 'fdic-banks',
    pillarTitle: 'FDIC Insured Banks by State',
    targetQuery: 'FDIC insured banks near me',
    hubHref: FDIC_CATEGORY.hubPath,
    stateHref: FDIC_CATEGORY.statePath,
    relatedCalculator: '/calculators',
    hubHeading: 'Find FDIC Insured Banks in Every State',
    keywordVariants: [
      'list of FDIC banks',
      'FDIC bank directory 2026',
      'trusted FDIC insured institutions',
    ],
  },
  {
    id: 'mortgage-lenders',
    pillarTitle: 'Verified Mortgage Lenders',
    targetQuery: 'best mortgage lenders by state',
    hubHref: MORTGAGE_CATEGORY.hubPath,
    stateHref: MORTGAGE_CATEGORY.statePath,
    relatedCalculator: '/calculators',
    hubHeading: 'NMLS Verified Mortgage Lenders Nationwide',
    keywordVariants: [
      'mortgage brokers near me',
      'local mortgage lenders',
      'NMLS verified mortgage directory',
    ],
  },
  {
    id: 'auto-loans',
    pillarTitle: 'Auto Loan Companies by State',
    targetQuery: 'best auto loan companies near me',
    hubHref: AUTO_CATEGORY.hubPath,
    stateHref: AUTO_CATEGORY.statePath,
    hubHeading: 'Compare Auto Loan Companies & APR Ranges',
    keywordVariants: [
      'car loan rates by state',
      'auto finance companies',
      'used car loan lenders',
      'bad credit auto loans',
    ],
  },
  {
    id: 'deposit-safety',
    pillarTitle: 'FDIC Insurance Explained',
    targetQuery: 'what does FDIC insurance cover',
    hubHref: '/fdic-insured-banks',
    stateHref: (slug) => `/fdic-insured-banks/${slug}#fdic-faq-heading`,
    hubHeading: 'Understanding FDIC Deposit Insurance Limits',
    keywordVariants: ['FDIC insurance limit 2026', 'is my bank FDIC insured', 'deposit safety'],
  },
  {
    id: 'mortgage-tools',
    pillarTitle: 'Free Mortgage Calculators',
    targetQuery: 'mortgage payment calculator',
    hubHref: '/calculators',
    stateHref: () => '/calculators',
    hubHeading: 'Mortgage Payment & Affordability Tools',
    keywordVariants: ['refinance calculator', 'DTI calculator', 'closing cost estimator'],
  },
  {
    id: 'trust-transparency',
    pillarTitle: 'How We Verify Listings',
    targetQuery: 'is LenderTrustHub legit',
    hubHref: '/about',
    stateHref: () => '/about',
    hubHeading: 'Our Verification Methodology',
    keywordVariants: ['no paid placements', 'independent lender directory', 'trust scores'],
  },
];

/** Keyword-optimized topical sections for national hubs */
export const HUB_KEYWORD_SECTIONS = {
  fdic: {
    title: 'Why Use an FDIC Bank Directory?',
    paragraphs: [
      'Searching "FDIC insured banks near me" should return verified, up-to-date institutions — not sponsored ads. Our directory pulls from official FDIC BankFind records across all 50 states and D.C.',
      'Each state page includes filters for headquarters location, asset size, and regulator — plus cross-links to mortgage lenders and auto loan companies in the same state.',
    ],
    internalLinks: [
      { label: 'Mortgage Lenders by State', href: MORTGAGE_CATEGORY.hubPath },
      { label: 'Auto Loan Companies', href: AUTO_CATEGORY.hubPath },
      { label: 'Free Calculators', href: '/calculators' },
    ],
  },
  mortgage: {
    title: 'How to Find the Best Mortgage Lenders in Your State',
    paragraphs: [
      'The query "best mortgage lenders by state" demands NMLS verification, county-level experience, and transparent trust scores — not pay-to-play rankings.',
      'Browse by state for broker and lender listings, then pair with our FDIC bank directory to verify where you\'ll hold earnest money and closing funds.',
    ],
    internalLinks: [
      { label: 'FDIC Insured Banks', href: FDIC_CATEGORY.hubPath },
      { label: 'Auto Loan Companies', href: AUTO_CATEGORY.hubPath },
      { label: 'Mortgage Calculators', href: '/calculators' },
    ],
  },
  auto: {
    title: 'Compare Auto Loan Companies Before You Buy',
    paragraphs: [
      'Whether you need a new car loan, used vehicle financing, or bad credit auto loans, comparing APR ranges and trust scores by state saves thousands over the loan term.',
      'Our auto loan directory links to FDIC banks and mortgage lenders in the same state — one platform for every borrowing decision.',
    ],
    internalLinks: [
      { label: 'FDIC Insured Banks', href: FDIC_CATEGORY.hubPath },
      { label: 'Mortgage Lenders', href: MORTGAGE_CATEGORY.hubPath },
      { label: 'About Our Methodology', href: '/about' },
    ],
  },
} as const;

/** Internal linking rules — apply when rendering any directory page */
export const INTERNAL_LINK_RULES = {
  statePageMustLinkTo: [
    (slug: string) => FDIC_CATEGORY.statePath(slug),
    (slug: string) => MORTGAGE_CATEGORY.statePath(slug),
    (slug: string) => AUTO_CATEGORY.statePath(slug),
    () => '/calculators',
    () => FDIC_CATEGORY.hubPath,
  ],
  hubPageMustLinkTo: DIRECTORY_CLUSTERS.map((c) => c.hubHref),
  profilePageMustLinkTo: (stateSlug: string) => [
    FDIC_CATEGORY.statePath(stateSlug),
    MORTGAGE_CATEGORY.statePath(stateSlug),
    AUTO_CATEGORY.statePath(stateSlug),
  ],
  canonicalBase: SITE_URL,
} as const;