import type { Metadata } from 'next';
import { FDICBanksExplorer } from '@/components/fdic/FDICBanksExplorer';
import { DATA_UPDATED, stateData } from '@/lib/fdic/stateData';

const TITLE = 'FDIC Insured Banks by State | LenderTrustHub';
const DESCRIPTION =
  'Explore FDIC-insured banks by state. Official FDIC data, certificate lookup, filters, and verified institution details. Florida live — more states added daily.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'FDIC insured banks',
    'FDIC banks by state',
    'list of FDIC banks in Florida',
    'trusted FDIC banks near me',
    'FDIC bank directory',
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: 'Lender Trust Hub',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.lendertrusthub.com/fdic-insured-banks',
  },
};

export default function FDICInsuredBanksPage() {
  const floridaBanks = stateData.FL?.banks ?? [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: TITLE,
        description: DESCRIPTION,
        url: 'https://www.lendertrusthub.com/fdic-insured-banks',
        isPartOf: { '@type': 'WebSite', name: 'Lender Trust Hub' },
      },
      {
        '@type': 'ItemList',
        name: 'FDIC Insured Banks in Florida',
        numberOfItems: floridaBanks.length,
        itemListElement: floridaBanks.slice(0, 20).map((bank, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'FinancialService',
            name: bank.name,
            url: bank.website,
            address: bank.headquarters_address,
            identifier: bank.fdic_cert,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* SSR-visible Florida summary for crawlers */}
      <noscript>
        <section className="container mx-auto px-4 py-8">
          <h1>FDIC Insured Banks by State</h1>
          <h2>FDIC Insured Banks in Florida ({floridaBanks.length} institutions)</h2>
          <ul>
            {floridaBanks.slice(0, 50).map((b) => (
              <li key={b.fdic_cert}>
                {b.name} — FDIC #{b.fdic_cert} — Since {b.fdic_insured_since}
              </li>
            ))}
          </ul>
        </section>
      </noscript>
      <FDICBanksExplorer defaultStateCode="FL" />
      <section className="border-t border-zinc-200 bg-[#0A2540] py-6 text-center text-xs text-zinc-400">
        Data last updated from FDIC {DATA_UPDATED}. This directory is for informational purposes only.
        Not financial advice. Verify all data at{' '}
        <a
          href="https://banks.data.fdic.gov/bankfind-suite/bankfind"
          className="text-[#00A3A1] underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          FDIC BankFind
        </a>
        .
      </section>
    </>
  );
}