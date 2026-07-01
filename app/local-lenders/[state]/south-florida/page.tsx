import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { SOUTH_FLORIDA_HUB_COUNTIES } from '@/lib/mortgage/floridaLenders';
import { getLendersByStateSlug } from '@/lib/mortgage/stateLenders';

export const metadata: Metadata = {
  title: 'South Florida Mortgage Lenders — Miami, Broward, Palm Beach (2026)',
  description:
    'NMLS-verified mortgage brokers in South Florida. Compare local experts for coastal condos, VA loans, foreign national financing, and first-time buyer programs.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/florida/south-florida' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function SouthFloridaHubPage() {
  const flLenders = getLendersByStateSlug('florida').slice(0, 8);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Mortgage Lenders', href: '/local-lenders' },
            { label: 'Florida', href: '/local-lenders/florida' },
            { label: 'South Florida Hub' },
          ]}
        />
      </div>

      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-teal-400/40 bg-teal-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Zero Paid Placements · Updated June 2026
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">
            Discover Trusted Local Lenders in South Florida
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Miami-Dade, Broward, Palm Beach &amp; beyond — verified brokers who understand coastal
            insurance, condo approvals, international buyers, and competitive contract timelines.
          </p>
          <div className="mt-6">
            <SearchBar className="mx-auto max-w-md" />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Featured Counties</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {SOUTH_FLORIDA_HUB_COUNTIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/local-lenders/florida/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-[#14B8A6]"
                  >
                    <span className="font-semibold text-[#0A2540]">{c.name} County</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why South Florida Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Wind mitigation and HO-6 insurance change real affordability math</li>
                <li>High-rise condo approval lists vary by building and lender</li>
                <li>Foreign national and ITIN programs are mainstream in Miami-Dade and Broward</li>
                <li>FAR/BAR contract clocks favor lenders who close on time</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders</h2>
              <div className="space-y-4">
                {flLenders.map((lender, i) => (
                  <LenderCard
                    key={lender.id}
                    lender={lender}
                    rank={i + 1}
                    countyLabel={`${lender.county} County`}
                  />
                ))}
              </div>
              <p className="mt-4 text-sm text-zinc-500">
                <Link href="/local-lenders/florida" className="text-[#3B82F6] hover:underline">
                  View all Florida lenders →
                </Link>
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-bold text-[#0A2540]">Free Calculators</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {CALCULATORS.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    className="rounded-xl border border-zinc-200 bg-white p-4 text-sm font-medium text-[#0A2540] hover:border-[#3B82F6]"
                  >
                    {c.label} →
                  </Link>
                ))}
              </div>
            </section>

            <LeadCaptureForm stateName="South Florida" categoryId="mortgage" variant="state-page-v2" />
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">How We Verify</h2>
              <p className="mt-2 text-zinc-600">
                Tier 1: NMLS + CFPB + Florida OFR. Tier 2: Local operations. Tier 3: Google/Zillow/BBB
                ratings. No paid placement.
              </p>
              <p className="mt-3 text-xs text-zinc-500">
                Verify at{' '}
                <a
                  href="https://www.nmlsconsumeraccess.org"
                  className="text-[#3B82F6] hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  nmlsconsumeraccess.org
                </a>{' '}
                before signing disclosures.
              </p>
            </div>
            <LeadCaptureForm stateName="South Florida" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}