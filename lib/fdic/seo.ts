import type { FDICBank, StateFDICData, StateMeta } from './types';
import { computeExtendedStateStats } from './utils';
import { SITE_URL, FDIC_CATEGORY } from '@/lib/directory/categories';
import { generateStateInsights } from './insights';

const CURRENT_YEAR = FDIC_CATEGORY.year;

export function statePagePath(slug: string): string {
  return FDIC_CATEGORY.statePath(slug);
}

export function statePageUrl(slug: string): string {
  return `${SITE_URL}${statePagePath(slug)}`;
}

export function buildStateTitle(stateName: string, bankCount?: number): string {
  const countPart = bankCount ? ` — ${bankCount} Verified Institutions` : '';
  return `FDIC Insured Banks in ${stateName} ${CURRENT_YEAR} | Full List${countPart} | LenderTrustHub`;
}

export function buildStateDescription(
  stateName: string,
  bankCount: number,
  updated: string,
  hqCount?: number
): string {
  const hqPart = hqCount ? ` ${hqCount} headquartered locally.` : '';
  return `Complete ${CURRENT_YEAR} list of ${bankCount} FDIC-insured banks in ${stateName}.${hqPart} Compare institutions, filter by regulator, verify via FDIC BankFind. Updated ${updated}. Free — no paid placements.`;
}

export function buildHubTitle(): string {
  return `FDIC Insured Banks by State ${CURRENT_YEAR} | All 50 States + DC | LenderTrustHub`;
}

export function buildHubDescription(totalBanks: number): string {
  return `Explore ${totalBanks.toLocaleString()}+ FDIC-insured banks across all 50 states and DC. Interactive map, bank comparison, certificate lookup, and official FDIC data. Free directory — no paid placements.`;
}

function buildWebSiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'Lender Trust Hub',
    url: SITE_URL,
    description:
      'Independent financial directory — FDIC banks, mortgage lenders, calculators. Verified data. No paid placements.',
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/fdic-insured-banks?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

function buildOrganizationSchema() {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Lender Trust Hub',
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    description:
      'Independent financial directory with verified FDIC bank data. No paid placements.',
    sameAs: ['https://www.movetrusthub.com'],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '128',
      bestRating: '5',
      worstRating: '1',
    },
  };
}

function buildBreadcrumbSchema(stateMeta: StateMeta) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${statePageUrl(stateMeta.slug)}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'FDIC Insured Banks',
        item: `${SITE_URL}${FDIC_CATEGORY.hubPath}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: stateMeta.fullName,
        item: statePageUrl(stateMeta.slug),
      },
    ],
  };
}

function buildAggregateOfferSchema(stateName: string) {
  return {
    '@type': 'AggregateOffer',
    name: `Free FDIC Bank Directory — ${stateName}`,
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    description: 'Free access to verified FDIC-insured bank listings. No paid placements.',
  };
}

function bankToFinancialService(bank: FDICBank, stateMeta: StateMeta) {
  const hqInState = new RegExp(`, ${stateMeta.code}(?:\\s|$)`).test(bank.headquarters_address);
  return {
    '@type': ['FinancialService', ...(hqInState ? ['LocalBusiness'] : [])],
    name: bank.name,
    url: bank.website || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: bank.headquarters_address,
      addressRegion: stateMeta.code,
      addressCountry: 'US',
    },
    identifier: {
      '@type': 'PropertyValue',
      name: 'FDIC Certificate',
      value: bank.fdic_cert,
    },
    sameAs: `https://banks.data.fdic.gov/bankfind-suite/bankfind?cert=${bank.fdic_cert}`,
  };
}

export function buildStateJsonLd(
  stateMeta: StateMeta,
  stateData: StateFDICData
): Record<string, unknown> {
  const stats = computeExtendedStateStats(stateData.banks, stateMeta.code);
  const insights = generateStateInsights(stateData.banks, stateMeta);
  const pageUrl = statePageUrl(stateMeta.slug);

  const faqEntities = [
    {
      '@type': 'Question',
      name: `How many FDIC-insured banks are in ${stateMeta.fullName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Our directory lists ${stats.total} FDIC-insured institutions serving ${stateMeta.fullName}, including ${stats.headquartered} with headquarters in the state.`,
      },
    },
    {
      '@type': 'Question',
      name: `What is the oldest FDIC-insured bank in ${stateMeta.fullName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: stats.oldest
          ? `${stats.oldest.name} has been FDIC-insured since ${stats.oldest.fdic_insured_since}.`
          : `Filter by "Oldest First" to explore long-established institutions in ${stateMeta.fullName}.`,
      },
    },
    {
      '@type': 'Question',
      name: `Which regulator oversees most banks in ${stateMeta.fullName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: insights.regulatorBreakdown[0]
          ? `${insights.regulatorBreakdown[0].regulator} regulates ${insights.regulatorBreakdown[0].count} institutions (${insights.regulatorBreakdown[0].percentage}%) in our ${stateMeta.fullName} directory.`
          : `Use regulator filters to explore OCC, Federal Reserve, and FDIC-chartered banks.`,
      },
    },
    {
      '@type': 'Question',
      name: 'What does FDIC insurance cover?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'FDIC insurance protects depositors up to $250,000 per depositor, per insured bank, for each account ownership category if a bank fails.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I verify a bank on the FDIC website?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use FDIC BankFind at banks.data.fdic.gov with the institution certificate number shown on each bank card.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does LenderTrustHub accept paid bank placements?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. This directory is free and transparent. Institutions are listed based on official FDIC data, not advertising fees.',
      },
    },
    {
      '@type': 'Question',
      name: `Where can I find mortgage lenders in ${stateMeta.fullName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Explore verified mortgage lenders in ${stateMeta.fullName} and use our free mortgage calculators.`,
      },
    },
    {
      '@type': 'Question',
      name: `What banks are best for ${stateMeta.fullName} homeowners?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: insights.bestFor[0]?.description ?? `Compare banks headquartered in ${stateMeta.fullName} for local branch access.`,
      },
    },
  ];

  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildOrganizationSchema(),
      buildWebSiteSchema(),
      buildBreadcrumbSchema(stateMeta),
      {
        '@type': 'WebPage',
        '@id': pageUrl,
        name: buildStateTitle(stateMeta.fullName, stats.total),
        description: buildStateDescription(
          stateMeta.fullName,
          stats.total,
          stateData.updated,
          stats.headquartered
        ),
        url: pageUrl,
        dateModified: stateData.updated,
        inLanguage: 'en-US',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@type': 'Thing', name: `FDIC Insured Banks in ${stateMeta.fullName}` },
        offers: buildAggregateOfferSchema(stateMeta.fullName),
      },
      {
        '@type': 'ItemList',
        name: `FDIC Insured Banks in ${stateMeta.fullName}`,
        numberOfItems: stats.total,
        itemListElement: stateData.banks.slice(0, 100).map((bank, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: bankToFinancialService(bank, stateMeta),
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        mainEntity: faqEntities,
      },
      {
        '@type': 'HowTo',
        name: `How to choose an FDIC-insured bank in ${stateMeta.fullName}`,
        description: `Step-by-step guide for selecting a verified bank in ${stateMeta.fullName}.`,
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Browse the verified directory',
            text: `Review ${stats.total} FDIC-insured institutions serving ${stateMeta.fullName}.`,
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Filter by your preferences',
            text: 'Use regulator, headquarters, and establishment date filters.',
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Compare up to three banks',
            text: 'Use the comparison tool to evaluate insurance dates and regulators side by side.',
          },
          {
            '@type': 'HowToStep',
            position: 4,
            name: 'Verify on FDIC BankFind',
            text: 'Click the certificate number to confirm official FDIC records.',
          },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to verify an FDIC-insured bank',
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Find the certificate number',
            text: 'Locate the FDIC certificate number on the bank listing.',
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Open FDIC BankFind',
            text: 'Visit banks.data.fdic.gov/bankfind-suite/bankfind.',
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Search by certificate',
            text: 'Enter the certificate number to view official FDIC records.',
          },
        ],
      },
    ],
  };
}

export function buildHubJsonLd(totalBanks: number, stateCount: number): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildOrganizationSchema(),
      buildWebSiteSchema(),
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}${FDIC_CATEGORY.hubPath}`,
        name: buildHubTitle(),
        description: buildHubDescription(totalBanks),
        url: `${SITE_URL}${FDIC_CATEGORY.hubPath}`,
        inLanguage: 'en-US',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        offers: buildAggregateOfferSchema('United States'),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'FDIC Insured Banks',
            item: `${SITE_URL}${FDIC_CATEGORY.hubPath}`,
          },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'FDIC Insured Banks by US State',
        numberOfItems: stateCount,
        description: `${totalBanks} FDIC-insured institutions across ${stateCount} jurisdictions`,
      },
    ],
  };
}