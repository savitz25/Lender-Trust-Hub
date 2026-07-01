import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { JACKSONVILLE_HUB_COUNTIES } from '@/lib/mortgage/floridaLenders';
import { getLendersByCounty } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Jacksonville Mortgage Lenders — Duval County & Northeast FL (2026)',
  description:
    'NMLS-verified mortgage lenders in Jacksonville. Award-winning local brokers, VA specialists near NAS Jax and Mayport, Navy Federal, and national lenders with local branches.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/florida/jacksonville' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function JacksonvilleHubPage() {
  const duvalLenders = getLendersByCounty('florida', 'duval');

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Mortgage Lenders', href: '/local-lenders' },
            { label: 'Florida', href: '/local-lenders/florida' },
            { label: 'Jacksonville Hub' },
          ]}
        />
      </div>

      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-teal-400/40 bg-teal-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Zero Paid Placements · Duval County Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">
            Trusted Mortgage Lenders in Jacksonville
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Northeast Florida lenders with NAS Jacksonville and Mayport VA expertise, award-winning
            local brokers, and affordable First Coast purchase and refinance options.
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
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Duval County — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {JACKSONVILLE_HUB_COUNTIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={
                      c.slug === 'duval'
                        ? '/local-lenders/florida/duval'
                        : `/local-lenders/florida/${c.slug}`
                    }
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-[#14B8A6]"
                  >
                    <span className="font-semibold text-[#0A2540]">{c.name} County</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Jacksonville Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>NAS Jacksonville and Naval Station Mayport drive strong military and VA lending volume</li>
                <li>Relative affordability vs. South Florida — different insurance and flood profiles</li>
                <li>St. Johns, Clay, and Nassau suburban growth needs Northeast FL branch access</li>
                <li>Physician and professional programs matter for local hospital and logistics workforce</li>
                <li>Navy Federal membership is a common path for active-duty and veteran families</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">
                Top Verified Lenders in Duval County
              </h2>
              <div className="space-y-4">
                {duvalLenders.slice(0, 6).map((lender, i) => (
                  <LenderCard
                    key={lender.id}
                    lender={lender}
                    rank={i + 1}
                    countyLabel="Duval County"
                  />
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/florida/duval" className="text-[#3B82F6] hover:underline">
                  View all {duvalLenders.length} Duval County lenders →
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
                    className="rounded-xl border border-zinc-200 bg-white p-4 text-sm font-medium hover:border-[#3B82F6]"
                  >
                    {c.label} →
                  </Link>
                ))}
              </div>
            </section>

            <LeadCaptureForm
              stateName="Jacksonville"
              categoryId="mortgage"
              variant="state-page-v2"
            />
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/local-lenders/florida/tampa-bay" className="text-[#14B8A6] hover:underline">
                    Tampa Bay Hub →
                  </Link>
                </li>
                <li>
                  <Link href="/local-lenders/florida/south-florida" className="text-[#14B8A6] hover:underline">
                    South Florida Hub →
                  </Link>
                </li>
                <li>
                  <Link href="/calculators" className="text-[#14B8A6] hover:underline">
                    Mortgage Calculators →
                  </Link>
                </li>
              </ul>
            </div>
            <LeadCaptureForm
              stateName="Jacksonville"
              categoryId="mortgage"
              variant="sidebar-minimal"
            />
          </aside>
        </div>
      </div>
    </>
  );
}