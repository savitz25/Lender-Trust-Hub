import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { TAMPA_BAY_HUB_COUNTIES } from '@/lib/mortgage/floridaLenders';
import { getLendersByCounty } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Tampa Bay Mortgage Lenders — Hillsborough County & MacDill VA (2026)',
  description:
    'NMLS-verified mortgage lenders in Tampa Bay. Independent brokers, VA specialists near MacDill, fast-closing teams, and national lenders with local Tampa branches.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/florida/tampa-bay' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function TampaBayHubPage() {
  const hillsboroughLenders = getLendersByCounty('florida', 'hillsborough');

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Mortgage Lenders', href: '/local-lenders' },
            { label: 'Florida', href: '/local-lenders/florida' },
            { label: 'Tampa Bay Hub' },
          ]}
        />
      </div>

      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-teal-400/40 bg-teal-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Zero Paid Placements · Hillsborough County Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">
            Trusted Mortgage Lenders in Tampa Bay
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Hillsborough County lenders with MacDill VA expertise, Wesley Chapel suburban growth
            knowledge, first-responder programs, and fast-closing local brokers.
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
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Hillsborough County — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {TAMPA_BAY_HUB_COUNTIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={
                      c.slug === 'hillsborough'
                        ? '/local-lenders/florida/hillsborough'
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
              <h2 className="text-xl font-bold text-[#0A2540]">Why Tampa Bay Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>MacDill AFB drives strong VA purchase and refinance volume across South Tampa</li>
                <li>Wesley Chapel, Land O Lakes, and New Tampa suburban growth needs local branch access</li>
                <li>First responders, educators, and nurses benefit from niche broker programs</li>
                <li>Refinance volume runs high — competitive rate shopping matters more than in Orlando</li>
                <li>Pinellas and Pasco reach expanding; Hillsborough remains the metro lending core</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">
                Top Verified Lenders in Hillsborough County
              </h2>
              <div className="space-y-4">
                {hillsboroughLenders.slice(0, 6).map((lender, i) => (
                  <LenderCard
                    key={lender.id}
                    lender={lender}
                    rank={i + 1}
                    countyLabel="Hillsborough County"
                  />
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/florida/hillsborough" className="text-[#3B82F6] hover:underline">
                  View all {hillsboroughLenders.length} Hillsborough County lenders →
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
              stateName="Tampa Bay"
              categoryId="mortgage"
              variant="state-page-v2"
            />
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/local-lenders/florida/south-florida" className="text-[#14B8A6] hover:underline">
                    South Florida Hub →
                  </Link>
                </li>
                <li>
                  <Link href="/local-lenders/florida/central-florida" className="text-[#14B8A6] hover:underline">
                    Central Florida / Orlando →
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
              stateName="Tampa Bay"
              categoryId="mortgage"
              variant="sidebar-minimal"
            />
          </aside>
        </div>
      </div>
    </>
  );
}