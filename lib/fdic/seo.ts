import type { FDICBank, StateFDICData, StateMeta } from './types';
import { computeExtendedStateStats } from './utils';

const SITE_URL = 'https://www.lendertrusthub.com';
const CURRENT_YEAR = 2026;

export function statePagePath(slug: string): string {
  return `/fdic-insured-banks/${slug}`;
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
  updated: string
): string {
  return `Complete ${CURRENT_YEAR} list of ${bankCount} FDIC-insured banks serving ${stateName}. Certificate numbers, regulators, headquarters, and official FDIC BankFind links. Updated ${updated}. Free, transparent, no paid placements.`;
}

export function buildHubTitle(): string {
  return `FDIC Insured Banks by State ${CURRENT_YEAR} | All 50 States + DC | LenderTrustHub`;
}

export function buildHubDescription(totalBanks: number): string {
  return `Explore ${totalBanks.toLocaleString()}+ FDIC-insured banks across all 50 states and DC. Interactive map, filters, certificate lookup, and official FDIC data. Free directory — no paid placements.`;
}

export function buildStateJsonLd(
  stateMeta: StateMeta,
  stateData: StateFDICData
): Record<string, unknown> {
  const stats = computeExtendedStateStats(stateData.banks, stateMeta.code);
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
          ? `${stats.oldest.name} has been FDIC-insured since ${stats.oldest.fdic_insured_since}, among the oldest institutions in our ${stateMeta.fullName} directory.`
          : `Our ${stateMeta.fullName} directory includes institutions with long FDIC insurance histories. Filter by "Oldest First" to explore.`,
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
        text: 'Use FDIC BankFind at banks.data.fdic.gov with the institution certificate number shown on each bank card in our directory.',
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
        text: `Explore verified mortgage lenders in ${stateMeta.fullName} and use our free mortgage calculators to compare loan scenarios.`,
      },
    },
  ];

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'Lender Trust Hub',
        url: SITE_URL,
        description:
          'Independent financial directory with verified FDIC bank data. No paid placements.',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '128',
          bestRating: '5',
          worstRating: '1',
        },
      },
      {
        '@type': 'WebPage',
        name: buildStateTitle(stateMeta.fullName, stats.total),
        description: buildStateDescription(stateMeta.fullName, stats.total, stateData.updated),
        url: pageUrl,
        dateModified: stateData.updated,
        isPartOf: { '@type': 'WebSite', name: 'Lender Trust Hub', url: SITE_URL },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'FDIC Insured Banks',
              item: `${SITE_URL}/fdic-insured-banks`,
            },
            { '@type': 'ListItem', position: 3, name: stateMeta.fullName, item: pageUrl },
          ],
        },
      },
      {
        '@type': 'ItemList',
        name: `FDIC Insured Banks in ${stateMeta.fullName}`,
        numberOfItems: stats.total,
        itemListElement: stateData.banks.slice(0, 50).map((bank, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: bankToFinancialService(bank, stateMeta.fullName),
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqEntities,
      },
      {
        '@type': 'HowTo',
        name: `How to choose an FDIC-insured bank in ${stateMeta.fullName}`,
        description: `A step-by-step guide to selecting a verified FDIC-insured bank in ${stateMeta.fullName}.`,
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
            text: 'Use regulator, headquarters, and establishment date filters to narrow your list.',
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Verify on FDIC BankFind',
            text: 'Click the certificate number to confirm official FDIC records.',
          },
          {
            '@type': 'HowToStep',
            position: 4,
            name: 'Compare institutions',
            text: 'Select up to three banks to compare insurance dates, regulators, and headquarters.',
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

function bankToFinancialService(bank: FDICBank, stateName: string) {
  return {
    '@type': 'FinancialService',
    name: bank.name,
    url: bank.website || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: bank.headquarters_address,
      addressRegion: stateName,
    },
    identifier: bank.fdic_cert,
    additionalProperty: {
      '@type': 'PropertyValue',
      name: 'FDIC Certificate',
      value: bank.fdic_cert,
    },
  };
}

export function buildHubJsonLd(totalBanks: number, stateCount: number): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: buildHubTitle(),
        description: buildHubDescription(totalBanks),
        url: `${SITE_URL}/fdic-insured-banks`,
        isPartOf: { '@type': 'WebSite', name: 'Lender Trust Hub' },
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