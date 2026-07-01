import { CALCULATORS } from '@/lib/calculators/registry';

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
      {
        '@type': 'Organization',
        '@id': `${SITE}/#organization`,
        name: 'Lender Trust Hub',
        url: SITE,
        logo: `${SITE}/brand/lender-trust-hub-logo-stacked.png`,
        description: 'Independent NMLS-verified mortgage lender directory. Zero paid placements.',
        sameAs: ['https://www.movetrusthub.com'],
      },
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