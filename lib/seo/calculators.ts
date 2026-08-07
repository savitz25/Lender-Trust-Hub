import { CALCULATORS } from '@/lib/calculators/registry';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';

const SITE = 'https://www.lendertrusthub.com';

export function calculatorsPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE}/calculators#webpage`,
        url: `${SITE}/calculators`,
        name: 'Mortgage Calculators Hub – Lender Trust Hub',
        description: 'Free interactive mortgage calculators with PMI, charts, amortization, and verified lender matching.',
        isPartOf: { '@id': `${SITE}/#website` },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        url: SITE,
        name: 'Lender Trust Hub',
        publisher: { '@id': `${SITE}/#organization` },
      },
      buildLenderOrganizationSchema({
        logo: `${SITE}/brand/lender-trust-hub-logo-stacked.png`,
        description:
          'Specialist NMLS-oriented mortgage research directory and educational calculators. Part of the Ask Trust Hub network under common ownership with separated research and listing order. No paid placements.',
      }),
      ...CALCULATORS.map((c) => ({
        '@type': 'SoftwareApplication',
        name: c.seoTitle,
        description: c.seoDescription,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        provider: { '@id': `${SITE}/#organization` },
      })),
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Are Lender Trust Hub calculators free?',
            acceptedAnswer: { '@type': 'Answer', text: 'Yes. All calculators are free, require no sign-up, and provide educational estimates only.' },
          },
          {
            '@type': 'Question',
            name: 'How does Match Me to Lenders work?',
            acceptedAnswer: { '@type': 'Answer', text: 'After calculating your payment or affordability, Match Me filters our NMLS-verified directory by loan type, credit tier, and your estimated loan profile. We never accept paid placements.' },
          },
          {
            '@type': 'Question',
            name: 'Do calculators include PMI and property taxes?',
            acceptedAnswer: { '@type': 'Answer', text: 'The Mortgage Payment calculator includes full PITI with state-average property tax presets, homeowners insurance, HOA, and auto-calculated PMI when LTV exceeds 80%.' },
          },
        ],
      },
    ],
  };
}