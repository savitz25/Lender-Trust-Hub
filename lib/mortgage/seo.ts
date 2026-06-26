import type { Lender } from '@/lib/mockData';
import type { StateMeta } from '@/lib/fdic/types';
import { SITE_URL, MORTGAGE_CATEGORY } from '@/lib/directory/categories';
import { getStateMortgageStats } from './stateLenders';

const YEAR = MORTGAGE_CATEGORY.year;

export function mortgageStatePath(slug: string): string {
  return MORTGAGE_CATEGORY.statePath(slug);
}

export function mortgageStateUrl(slug: string): string {
  return `${SITE_URL}${mortgageStatePath(slug)}`;
}

export function buildMortgageStateTitle(stateName: string, count: number): string {
  return `Mortgage Lenders in ${stateName} ${YEAR} | ${count} NMLS Verified | LenderTrustHub`;
}

export function buildMortgageStateDescription(
  stateName: string,
  count: number,
  verified: number
): string {
  return `Compare ${count} mortgage lenders and brokers in ${stateName}. ${verified} NMLS verified. County experience scores, trust ratings, and free calculators. No paid placements.`;
}

export function buildMortgageHubTitle(): string {
  return `Mortgage Lenders by State ${YEAR} | NMLS Verified Directory | LenderTrustHub`;
}

export function buildMortgageHubDescription(total: number): string {
  return `Find ${total}+ NMLS-verified mortgage lenders and brokers nationwide. State and county directories, trust scores, and free mortgage calculators.`;
}

export function buildMortgageStateJsonLd(
  stateMeta: StateMeta,
  stateLenders: Lender[]
): Record<string, unknown> {
  const stats = getStateMortgageStats(stateMeta.slug);
  const pageUrl = mortgageStateUrl(stateMeta.slug);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Lender Trust Hub',
        url: SITE_URL,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'Lender Trust Hub',
        url: SITE_URL,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Mortgage Lenders',
            item: `${SITE_URL}${MORTGAGE_CATEGORY.hubPath}`,
          },
          { '@type': 'ListItem', position: 3, name: stateMeta.fullName, item: pageUrl },
        ],
      },
      {
        '@type': 'WebPage',
        '@id': pageUrl,
        name: buildMortgageStateTitle(stateMeta.fullName, stats.total),
        description: buildMortgageStateDescription(
          stateMeta.fullName,
          stats.total,
          stats.verified
        ),
        url: pageUrl,
        inLanguage: 'en-US',
      },
      {
        '@type': 'ItemList',
        name: `Mortgage Lenders in ${stateMeta.fullName}`,
        numberOfItems: stats.total,
        itemListElement: stateLenders.slice(0, 20).map((l, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'LocalBusiness',
            name: l.name,
            url: l.website || `${SITE_URL}/lenders/${l.slug}`,
            address: {
              '@type': 'PostalAddress',
              addressLocality: l.city,
              addressRegion: l.state,
              addressCountry: 'US',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: String(l.rating),
              reviewCount: String(l.reviewCount),
            },
          },
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `How many mortgage lenders are in ${stateMeta.fullName}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Our directory lists ${stats.total} mortgage lenders and brokers in ${stateMeta.fullName}, with ${stats.verified} NMLS verified.`,
            },
          },
          {
            '@type': 'Question',
            name: `Are these mortgage lenders in ${stateMeta.fullName} legitimate?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Every listing includes NMLS ID verification. We display trust scores from multiple data sources and do not accept paid placements.',
            },
          },
        ],
      },
      {
        '@type': 'AggregateOffer',
        name: `Free Mortgage Lender Directory — ${stateMeta.fullName}`,
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    ],
  };
}

export function buildMortgageHubJsonLd(totalLenders: number, stateCount: number) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: buildMortgageHubTitle(),
        description: buildMortgageHubDescription(totalLenders),
        url: `${SITE_URL}${MORTGAGE_CATEGORY.hubPath}`,
      },
      {
        '@type': 'ItemList',
        name: 'Mortgage Lenders by US State',
        numberOfItems: stateCount,
        description: `${totalLenders} NMLS-verified lenders across ${stateCount} states`,
      },
    ],
  };
}