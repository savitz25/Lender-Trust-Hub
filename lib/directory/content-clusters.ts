import {
  FDIC_CATEGORY,
  MORTGAGE_CATEGORY,
  AUTO_CATEGORY,
  SITE_URL,
} from './categories';

/**
 * Public resource clusters — consumer-facing guides and directories.
 * No SEO strategy notes, target queries, or planning language in UI.
 */

export interface ContentCluster {
  id: string;
  pillarTitle: string;
  /** Short plain-language description for cards */
  description: string;
  hubHref: string;
  stateHref: (slug: string) => string;
  relatedCalculator?: string;
  hubHeading?: string;
}

export const DIRECTORY_CLUSTERS: ContentCluster[] = [
  {
    id: 'fdic-banks',
    pillarTitle: 'FDIC Insured Banks by State',
    description: 'Browse FDIC-insured institutions with links to official BankFind records.',
    hubHref: FDIC_CATEGORY.hubPath,
    stateHref: FDIC_CATEGORY.statePath,
    relatedCalculator: '/calculators',
    hubHeading: 'Find FDIC-insured banks by state',
  },
  {
    id: 'mortgage-lenders',
    pillarTitle: 'Mortgage Lender Research Directory',
    description: 'Research mortgage companies by state and county with NMLS-oriented verification signals.',
    hubHref: MORTGAGE_CATEGORY.hubPath,
    stateHref: MORTGAGE_CATEGORY.statePath,
    relatedCalculator: '/calculators',
    hubHeading: 'Research mortgage lenders nationwide',
  },
  {
    id: 'auto-loans',
    pillarTitle: 'Auto Loan Companies by State',
    description: 'Compare auto financing companies, APR ranges, and trust signals by state.',
    hubHref: AUTO_CATEGORY.hubPath,
    stateHref: AUTO_CATEGORY.statePath,
    hubHeading: 'Compare auto loan companies',
  },
  {
    id: 'deposit-safety',
    pillarTitle: 'FDIC Insurance Explained',
    description: 'How deposit insurance works and how to confirm coverage on BankFind.',
    hubHref: '/fdic-insured-banks',
    stateHref: (slug) => `/fdic-insured-banks/${slug}#fdic-faq-heading`,
    hubHeading: 'Understanding FDIC deposit insurance',
  },
  {
    id: 'mortgage-tools',
    pillarTitle: 'Free Mortgage Calculators',
    description: 'Educational payment, affordability, refinance, and related tools — not rate quotes.',
    hubHref: '/calculators',
    stateHref: () => '/calculators',
    hubHeading: 'Mortgage payment and affordability tools',
  },
  {
    id: 'trust-transparency',
    pillarTitle: 'How We Research Listings',
    description: 'Methodology, independence, and limits of directory data — no paid placements.',
    hubHref: '/about',
    stateHref: () => '/about',
    hubHeading: 'Our research methodology',
  },
];

/** Consumer help sections for national hubs (no SERP/keyword framing). */
export const HUB_TOPIC_SECTIONS = {
  fdic: {
    title: 'Why use an FDIC bank directory?',
    paragraphs: [
      'This directory surfaces FDIC-insured institutions from public BankFind-oriented records so you can research deposit options without paid placement rankings.',
      'Each state page includes filters and links to mortgage and auto research in the same state. Always confirm certificate status on official FDIC tools before you bank.',
    ],
    internalLinks: [
      { label: 'Mortgage lenders by state', href: MORTGAGE_CATEGORY.hubPath },
      { label: 'Auto loan companies', href: AUTO_CATEGORY.hubPath },
      { label: 'Free calculators', href: '/calculators' },
    ],
  },
  mortgage: {
    title: 'How to research mortgage lenders in your state',
    paragraphs: [
      'Use this research directory to compare companies with NMLS-oriented identifiers, county locality honesty, and transparent trust signals — not pay-to-play rankings.',
      'Browse by state and county, then re-check any company on NMLS Consumer Access. Pair with the FDIC bank directory when you need deposit insurance context for closing funds.',
    ],
    internalLinks: [
      { label: 'FDIC insured banks', href: FDIC_CATEGORY.hubPath },
      { label: 'Auto loan companies', href: AUTO_CATEGORY.hubPath },
      { label: 'Mortgage calculators', href: '/calculators' },
    ],
  },
  auto: {
    title: 'Compare auto loan companies before you buy',
    paragraphs: [
      'Review auto financing companies by state with published APR ranges and research signals for new, used, refinance, and rebuilding-credit scenarios.',
      'Cross-link to FDIC banks and mortgage research when you need a full financing picture. Confirm rates and terms directly with any lender before you apply.',
    ],
    internalLinks: [
      { label: 'FDIC insured banks', href: FDIC_CATEGORY.hubPath },
      { label: 'Mortgage lenders', href: MORTGAGE_CATEGORY.hubPath },
      { label: 'About our methodology', href: '/about' },
    ],
  },
} as const;

/** @deprecated use HUB_TOPIC_SECTIONS — kept as alias for imports during cleanup */
export const HUB_KEYWORD_SECTIONS = HUB_TOPIC_SECTIONS;

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
