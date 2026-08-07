import type { Lender } from '@/lib/mockData';
import type { StateMeta } from '@/lib/fdic/types';
import { SITE_URL, MORTGAGE_CATEGORY } from '@/lib/directory/categories';
import { getStateMortgageStats } from './stateLenders';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';

const YEAR = MORTGAGE_CATEGORY.year;

export function mortgageStatePath(slug: string): string {
  return MORTGAGE_CATEGORY.statePath(slug);
}

export function mortgageStateUrl(slug: string): string {
  return `${SITE_URL}${mortgageStatePath(slug)}`;
}

export function buildMortgageStateTitle(stateName: string, count: number): string {
  return `Mortgage Companies in ${stateName} ${YEAR} | ${count} in Research Directory | LenderTrustHub`;
}

export function buildMortgageStateDescription(
  stateName: string,
  count: number,
  verified: number
): string {
  return `Research ${count} distinct mortgage companies in ${stateName} (${verified} with NMLS ID verified). County locality honesty, trust signals, free calculators. Confirm licensing on NMLS Consumer Access.`;
}

export function buildMortgageHubTitle(): string {
  return `Mortgage Companies by State ${YEAR} | Research Directory | LenderTrustHub`;
}

export function buildMortgageHubDescription(total: number): string {
  return `Research ${total} distinct mortgage companies nationwide (by NMLS entity). State and county directories, trust scores, and free educational calculators. No paid placements.`;
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
      buildLenderOrganizationSchema(),
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
              text: `Our research directory lists ${stats.total} distinct mortgage companies in ${stateMeta.fullName}, including ${stats.verified} with NMLS ID verified. Counts use company identity (NMLS), not padded location rows.`,
            },
          },
          {
            '@type': 'Question',
            name: `How should I use mortgage company listings in ${stateMeta.fullName}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Treat listings as research aids. Re-check any company on NMLS Consumer Access. We display research scores from multiple sources and do not accept paid placements for ranking.',
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
      buildLenderOrganizationSchema(),
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