import type { Metadata } from 'next';
import Link from 'next/link';
import { FDICBanksExplorer } from '@/components/fdic/FDICBanksExplorer';
import { DATA_UPDATED, stateData } from '@/lib/fdic/stateData';
import { US_STATES } from '@/lib/fdic/states';
import { buildHubDescription, buildHubJsonLd, buildHubTitle } from '@/lib/fdic/seo';
import { statePagePath } from '@/lib/fdic/seo';

const totalBanks = Object.values(stateData).reduce((sum, s) => sum + s.banks.length, 0);
const stateCount = US_STATES.filter((s) => s.hasData).length;

export const metadata: Metadata = {
  title: buildHubTitle(),
  description: buildHubDescription(totalBanks),
  keywords: [
    'FDIC insured banks',
    'FDIC banks by state',
    'list of FDIC banks',
    'FDIC bank directory 2026',
    'trusted FDIC banks',
  ],
  openGraph: {
    title: buildHubTitle(),
    description: buildHubDescription(totalBanks),
    siteName: 'Lender Trust Hub',
    type: 'website',
    url: 'https://www.lendertrusthub.com/fdic-insured-banks',
  },
  alternates: {
    canonical: 'https://www.lendertrusthub.com/fdic-insured-banks',
  },
};

export default function FDICInsuredBanksPage() {
  const jsonLd = buildHubJsonLd(totalBanks, stateCount);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FDICBanksExplorer defaultStateCode="FL" />
      <section className="border-t border-zinc-200 bg-white py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-6 text-2xl font-bold text-[#0A2540]">Browse FDIC Banks by State</h2>
          <p className="mb-8 max-w-3xl text-zinc-600">
            All {stateCount} U.S. jurisdictions now have verified FDIC institution lists. Select any
            state for a dedicated SEO-optimized page with filters, stats, and official certificate
            links.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {US_STATES.filter((s) => s.hasData).map((s) => {
              const count = stateData[s.code]?.banks.length ?? 0;
              return (
                <Link
                  key={s.code}
                  href={statePagePath(s.slug)}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 transition hover:border-[#00A3A1] hover:bg-[#00A3A1]/5"
                >
                  <span className="font-semibold text-[#0A2540]">{s.fullName}</span>
                  <span className="mt-1 block text-xs text-zinc-500">{count} institutions</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <section className="border-t border-zinc-200 bg-[#0A2540] py-6 text-center text-xs text-zinc-400">
        Data last updated from FDIC {DATA_UPDATED}. This directory is for informational purposes
        only. Not financial advice. Verify all data at{' '}
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