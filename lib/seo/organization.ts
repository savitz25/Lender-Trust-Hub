/**
 * Lender Trust Hub Organization JSON-LD — reciprocal parentOrganization to Ask.
 * Prefer this builder wherever Organization schema is emitted sitewide.
 */

const SITE_URL = 'https://www.lendertrusthub.com';

/** Parent knowledge layer — reciprocal with Ask Trust Hub Organization graph. */
export const ASK_PARENT_ORGANIZATION = {
  '@type': 'Organization' as const,
  '@id': 'https://www.asktrusthub.com/#organization',
  name: 'Ask Trust Hub',
  url: 'https://www.asktrusthub.com',
};

export function buildLenderOrganizationSchema(opts?: {
  logo?: string;
  description?: string;
  sameAs?: string[];
}) {
  return {
    '@type': 'Organization' as const,
    '@id': `${SITE_URL}/#organization`,
    name: 'Lender Trust Hub',
    url: SITE_URL,
    logo: opts?.logo ?? `${SITE_URL}/brand/lender-trust-hub-icon.png`,
    description:
      opts?.description ??
      'Specialist research directory for NMLS-oriented lenders and educational financing tools. Part of the Ask Trust Hub network under common ownership with separated research and listing order. No paid placements.',
    parentOrganization: ASK_PARENT_ORGANIZATION,
    sameAs: opts?.sameAs ?? [
      'https://www.asktrusthub.com',
      'https://www.movetrusthub.com',
      'https://www.insurancetrusthub.com',
      'https://www.contractortrusthub.com',
      'https://www.seniortrusthub.com',
      'https://www.investortrusthub.com',
    ],
  };
}

export function buildLenderHomepageGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'Lender Trust Hub',
        url: SITE_URL,
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: 'en-US',
      },
    ],
  };
}

export { SITE_URL as LENDER_ORG_SITE_URL };
