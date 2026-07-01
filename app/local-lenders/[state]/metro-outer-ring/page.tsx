import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { METRO_OUTER_RING_HUB_COUNTIES } from '@/lib/mortgage/georgiaLenders';
import { getLendersByCounty } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Metro Atlanta Outer Ring Mortgage Lenders — Henry County & Affordability Belt (2026)',
  description:
    'NMLS-verified mortgage lenders on Atlanta\'s southern outer ring. McDonough first-time buyer teams, DPA programs, USDA outer-ring financing, and independent brokers for $340K–$390K starter homes.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/georgia/metro-outer-ring' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function MetroOuterRingHubPage() {
  const henryLenders = getLendersByCounty('georgia', 'henry');

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Mortgage Lenders', href: '/local-lenders' },
            { label: 'Georgia', href: '/local-lenders/georgia' },
            { label: 'Metro Outer Ring Hub' },
          ]}
        />
      </div>

      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Zero Paid Placements · Henry County Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">
            Trusted Mortgage Lenders — Metro Atlanta Outer Ring
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            McDonough, Henry County, and Atlanta&apos;s Affordability Belt — first-time buyers,
            down payment assistance, new-construction subdivisions, and USDA outer-ring programs.
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
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Henry County — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {METRO_OUTER_RING_HUB_COUNTIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={
                      c.slug === 'henry'
                        ? '/local-lenders/georgia/henry'
                        : `/local-lenders/georgia/${c.slug}`
                    }
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-[#F59E0B]"
                  >
                    <span className="font-semibold text-[#0A2540]">{c.name} County</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why the Outer Ring Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Starter-home sweet spot at $340K–$390K in high-growth McDonough subdivisions</li>
                <li>Georgia down payment assistance (DPA) programs are critical for first-time buyers</li>
                <li>Master-planned new construction needs early rate locks during builder contracts</li>
                <li>USDA-eligible terrain extends into Paulding and further-out affordability rings</li>
                <li>Self-employed and unique credit profiles benefit from independent wholesale brokers</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">
                Top Verified Lenders in Henry County
              </h2>
              <div className="space-y-4">
                {henryLenders.map((lender, i) => (
                  <LenderCard
                    key={lender.id}
                    lender={lender}
                    rank={i + 1}
                    countyLabel="Henry County"
                  />
                ))}
              </div>
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
              stateName="Metro Atlanta Outer Ring"
              categoryId="mortgage"
              variant="state-page-v2"
            />
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/local-lenders/georgia/north-atlanta" className="text-[#14B8A6] hover:underline">
                    North Atlanta Hub →
                  </Link>
                </li>
                <li>
                  <Link href="/local-lenders/georgia/coastal-savannah" className="text-[#14B8A6] hover:underline">
                    Coastal Savannah Hub →
                  </Link>
                </li>
                <li>
                  <Link href="/local-lenders/georgia/fulton" className="text-[#14B8A6] hover:underline">
                    Fulton County / Atlanta →
                  </Link>
                </li>
              </ul>
            </div>
            <LeadCaptureForm
              stateName="Metro Atlanta Outer Ring"
              categoryId="mortgage"
              variant="sidebar-minimal"
            />
          </aside>
        </div>
      </div>
    </>
  );
}