import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { PANHANDLE_HUB_COUNTIES } from '@/lib/mortgage/floridaLenders';
import { getLendersByCounty } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Florida Panhandle Mortgage Lenders — Bay County & Emerald Coast (2026)',
  description:
    'NMLS-verified mortgage lenders in the Florida Panhandle. Panama City brokers, Eglin VA specialists, Navy communities, credit unions, and Emerald Coast beach financing.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/florida/panhandle' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function PanhandleHubPage() {
  const bayLenders = getLendersByCounty('florida', 'bay');

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Mortgage Lenders', href: '/local-lenders' },
            { label: 'Florida', href: '/local-lenders/florida' },
            { label: 'Florida Panhandle Hub' },
          ]}
        />
      </div>

      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-teal-400/40 bg-teal-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Zero Paid Placements · Bay County Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">
            Trusted Mortgage Lenders in the Florida Panhandle
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Emerald Coast lenders with Eglin and NAS Pensacola VA expertise, Panama City Beach
            brokers, military credit unions, and retirement and second-home financing.
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
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Bay County — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {PANHANDLE_HUB_COUNTIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={
                      c.slug === 'bay'
                        ? '/local-lenders/florida/bay'
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
              <h2 className="text-xl font-bold text-[#0A2540]">Why the Panhandle Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>NAS Pensacola, Eglin AFB, and Hurlburt Field drive heavy VA and military lending volume</li>
                <li>Panama City Beach and 30A bring second-home, tourism, and investor financing needs</li>
                <li>Hurricane and wind coverage shape insurance math differently than inland Florida metros</li>
                <li>Retirement and relocation buyers value local credit unions and long-tenured brokers</li>
                <li>Escambia, Okaloosa, and Walton reach expanding beyond Bay County core</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">
                Top Verified Lenders in Bay County
              </h2>
              <div className="space-y-4">
                {bayLenders.slice(0, 6).map((lender, i) => (
                  <LenderCard
                    key={lender.id}
                    lender={lender}
                    rank={i + 1}
                    countyLabel="Bay County"
                  />
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/florida/bay" className="text-[#3B82F6] hover:underline">
                  View all {bayLenders.length} Bay County lenders →
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
              stateName="Florida Panhandle"
              categoryId="mortgage"
              variant="state-page-v2"
            />
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/local-lenders/florida/jacksonville" className="text-[#14B8A6] hover:underline">
                    Jacksonville Hub →
                  </Link>
                </li>
                <li>
                  <Link href="/local-lenders/florida/tampa-bay" className="text-[#14B8A6] hover:underline">
                    Tampa Bay Hub →
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
              stateName="Florida Panhandle"
              categoryId="mortgage"
              variant="sidebar-minimal"
            />
          </aside>
        </div>
      </div>
    </>
  );
}