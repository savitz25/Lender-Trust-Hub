import type { Lender } from '@/lib/mockData';
import type { StateMeta } from '@/lib/fdic/types';
import { SITE_URL, MORTGAGE_CATEGORY } from '@/lib/directory/categories';
import { getStateMortgageStats } from './stateLenders';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';

const BRAND = 'Lender Trust Hub';

export function mortgageStatePath(slug: string): string {
  return MORTGAGE_CATEGORY.statePath(slug);
}

export function mortgageStateUrl(slug: string): string {
  return `${SITE_URL}${mortgageStatePath(slug)}`;
}

export function mortgageCountyPath(stateSlug: string, countySlug: string): string {
  return `${MORTGAGE_CATEGORY.hubPath}/${stateSlug}/${countySlug}`;
}

export function mortgageCountyUrl(stateSlug: string, countySlug: string): string {
  return `${SITE_URL}${mortgageCountyPath(stateSlug, countySlug)}`;
}

export function mortgageLenderUrl(slug: string): string {
  return `${SITE_URL}/lenders/${slug}`;
}

/** High-volume / deepened markets — slight sitemap priority boost when present */
export const HIGH_VOLUME_STATE_SLUGS = new Set([
  'florida',
  'texas',
  'california',
  'north-carolina',
  'georgia',
  'arizona',
  'washington',
  'colorado',
  'tennessee',
  'virginia',
  'maryland',
  'new-york',
  'pennsylvania',
  'illinois',
  'ohio',
  'nevada',
  'utah',
  'oregon',
  'new-jersey',
  'massachusetts',
  'michigan',
  'south-carolina',
]);

// ── Titles & descriptions (research-oriented, no “best of” listicles) ──

export function buildMortgageStateTitle(stateName: string, count?: number): string {
  void count;
  return `Mortgage Lenders in ${stateName} — HMDA Evidence & Local Directory | ${BRAND}`;
}

export function buildMortgageStateH1(stateName: string): string {
  return `Mortgage lenders in ${stateName}`;
}

export function buildMortgageStateDescription(
  stateName: string,
  count: number,
  verified: number
): string {
  return `Research mortgage lenders in ${stateName}: ${count} distinct companies (${verified} with NMLS ID verified), county market pages, HMDA evidence where available, and free Loan Estimate tools. Confirm licensing on NMLS Consumer Access.`;
}

export function buildMortgageHubTitle(): string {
  return `Mortgage Lenders by State — National Research Directory | ${BRAND}`;
}

export function buildMortgageHubDescription(total: number): string {
  return `National mortgage research directory: ${total} distinct companies by NMLS entity across the U.S. State hubs, county markets, HMDA evidence, and educational Loan Estimate tools. No paid placements.`;
}

export function buildMortgageCountyTitle(countyName: string): string {
  return `${countyName} County Mortgage Market — Lenders, Volume & Research Tools | ${BRAND}`;
}

export function buildMortgageCountyH1(countyName: string, stateName: string): string {
  return `${countyName} County, ${stateName} mortgage market`;
}

export function buildMortgageCountyDescription(
  countyName: string,
  stateName: string,
  inCountyCount: number
): string {
  return `Research the ${countyName} County, ${stateName} mortgage market: ${inCountyCount} in-county HQ compan${inCountyCount === 1 ? 'y' : 'ies'}, locality-honest listings, HMDA context where available, and free tools to understand and compare Loan Estimates.`;
}

export function buildLenderProfileTitle(lenderName: string, nmlsId?: string): string {
  const nmls = nmlsId ? ` · NMLS #${nmlsId}` : '';
  return `${lenderName} — NMLS, HMDA Activity & Loan Estimate Research${nmls} | ${BRAND}`;
}

export function buildLenderProfileDescription(
  lenderName: string,
  locality: string,
  shortDescription?: string
): string {
  const base =
    shortDescription?.trim() ||
    `Research ${lenderName} in ${locality}: NMLS verification path, public HMDA activity when matched, and free Loan Estimate research tools.`;
  return `${base.slice(0, 140)}${base.length > 140 ? '…' : ''} Not an endorsement. Confirm on NMLS Consumer Access.`;
}

export function buildAnalyzerTitle(): string {
  return `Understand Your Loan Estimate — Fee Bands & Market Context | ${BRAND}`;
}

export function buildCompareTitle(): string {
  return `Compare Loan Estimates Side by Side — Educational Research | ${BRAND}`;
}

export function buildProgramFinderTitle(): string {
  return `Mortgage Program Finder — FHA, VA, DPA Education | ${BRAND}`;
}

// ── JSON-LD ────────────────────────────────────────────────────────────

export function buildMortgageStateJsonLd(
  stateMeta: StateMeta,
  stateLenders: Lender[]
): Record<string, unknown> {
  const stats = getStateMortgageStats(stateMeta.slug);
  const pageUrl = mortgageStateUrl(stateMeta.slug);
  const title = buildMortgageStateTitle(stateMeta.fullName, stats.total);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: BRAND,
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
        name: title,
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
            '@type': 'FinancialService',
            name: l.name,
            url: `${SITE_URL}/lenders/${l.slug}`,
            address: {
              '@type': 'PostalAddress',
              addressLocality: l.city,
              addressRegion: l.state,
              addressCountry: 'US',
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
          {
            '@type': 'Question',
            name: `What research tools are available for ${stateMeta.fullName} mortgages?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Use county market pages for locality-honest inventory, the Loan Estimate Analyzer and Compare tools for offer research, and the Program Finder for educational FHA, VA, conventional, USDA, and down-payment assistance pathways.',
            },
          },
        ],
      },
    ],
  };
}

export function buildMortgageCountyJsonLd(input: {
  stateSlug: string;
  stateName: string;
  countySlug: string;
  countyName: string;
  inCountyCount: number;
  description: string;
}): Record<string, unknown> {
  const pageUrl = mortgageCountyUrl(input.stateSlug, input.countySlug);
  const title = buildMortgageCountyTitle(input.countyName);

  return {
    '@context': 'https://schema.org',
    '@graph': [
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
          {
            '@type': 'ListItem',
            position: 3,
            name: input.stateName,
            item: mortgageStateUrl(input.stateSlug),
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: `${input.countyName} County`,
            item: pageUrl,
          },
        ],
      },
      {
        '@type': 'WebPage',
        '@id': pageUrl,
        name: title,
        description: input.description,
        url: pageUrl,
        inLanguage: 'en-US',
      },
    ],
  };
}

export function buildLenderProfileJsonLd(input: {
  name: string;
  slug: string;
  nmlsId?: string;
  description: string;
  city?: string;
  state?: string;
  stateSlug: string;
  countySlug?: string;
  countyName?: string;
}): Record<string, unknown> {
  const pageUrl = mortgageLenderUrl(input.slug);
  const crumbs: Array<Record<string, unknown>> = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Mortgage Lenders',
      item: `${SITE_URL}${MORTGAGE_CATEGORY.hubPath}`,
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: input.state || input.stateSlug,
      item: mortgageStateUrl(input.stateSlug),
    },
  ];
  if (input.countySlug && input.countyName) {
    crumbs.push({
      '@type': 'ListItem',
      position: 4,
      name: `${input.countyName} County`,
      item: mortgageCountyUrl(input.stateSlug, input.countySlug),
    });
    crumbs.push({
      '@type': 'ListItem',
      position: 5,
      name: input.name,
      item: pageUrl,
    });
  } else {
    crumbs.push({
      '@type': 'ListItem',
      position: 4,
      name: input.name,
      item: pageUrl,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: crumbs,
      },
      {
        '@type': 'FinancialService',
        '@id': pageUrl,
        name: input.name,
        url: pageUrl,
        description: input.description,
        ...(input.nmlsId
          ? {
              identifier: {
                '@type': 'PropertyValue',
                name: 'NMLS ID',
                value: input.nmlsId,
              },
            }
          : {}),
        address: {
          '@type': 'PostalAddress',
          addressLocality: input.city,
          addressRegion: input.state,
          addressCountry: 'US',
        },
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
        description: `${totalLenders} distinct mortgage companies across ${stateCount} states and DC — national research directory`,
      },
    ],
  };
}
