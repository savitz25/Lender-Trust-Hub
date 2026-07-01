import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { NYC_SUBURBS_HUB_AREAS, NYC_SUBURBS_WESTCHESTER_PUTNAM_LENDER_SLUGS } from '@/lib/mortgage/newYorkLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'NYC Suburbs Mortgage Lenders — Westchester & Putnam Counties (2026)',
  description:
    'NMLS-verified mortgage lenders in White Plains, New Rochelle, and Putnam County. Tri-State surge, 56%+ over-asking sales, 102%+ sale-to-list, and suburban safety valve for Manhattan/Brooklyn buyers.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/new-york/nyc-suburbs-westchester-putnam' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function NycSuburbsWestchesterPutnamHubPage() {
  const hubLenders = NYC_SUBURBS_WESTCHESTER_PUTNAM_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'New York', href: '/local-lenders/new-york' }, { label: 'NYC Suburbs Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Tri-State Surge · Westchester &amp; Putnam
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — NYC Suburbs</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            White Plains, New Rochelle, and Putnam County lenders for buyers priced out of Manhattan and Brooklyn —
            over-asking premiums, limited inventory, and double-digit suburban price gains.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">NYC Suburbs — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {NYC_SUBURBS_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/new-york/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-rose-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why NYC Suburbs Are Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>White Plains and New Rochelle rank highly on national market heat indexes</li>
                <li>Over 56% of homes sell above asking with 102%+ average sale-to-list in Westchester</li>
                <li>Putnam County offers a more affordable alternative with ~11% year-over-year median gains</li>
                <li>Major safety valve for Manhattan and Brooklyn buyers competing for limited suburban stock</li>
                <li>Tri-State commuter access rewards lenders who understand relocation financing urgency</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — NYC Suburbs</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="NYC Suburbs" />
                  )
                ))}
              </div>
              <p className="mt-4 flex flex-wrap gap-4 text-sm">
                <Link href="/local-lenders/new-york/westchester" className="text-[#3B82F6] hover:underline">
                  View all Westchester County lenders →
                </Link>
                <Link href="/local-lenders/new-york/putnam" className="text-[#3B82F6] hover:underline">
                  View all Putnam County lenders →
                </Link>
              </p>
            </section>
            <section>
              <h2 className="mb-4 text-xl font-bold text-[#0A2540]">Free Calculators</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {CALCULATORS.map((c) => (
                  <Link key={c.href} href={c.href}
                    className="rounded-xl border border-zinc-200 bg-white p-4 text-sm font-medium hover:border-[#3B82F6]">
                    {c.label} →
                  </Link>
                ))}
              </div>
            </section>
            <LeadCaptureForm stateName="NYC Suburbs" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/new-york/upstate-powerhouses-buffalo-albany" className="text-[#14B8A6] hover:underline">Upstate Powerhouses Hub →</Link></li>
                <li><Link href="/local-lenders/massachusetts/high-demand-boston-neighborhoods" className="text-[#14B8A6] hover:underline">Boston Neighborhoods Hub →</Link></li>
                <li><Link href="/local-lenders/massachusetts/metrowest-bread-and-butter-markets" className="text-[#14B8A6] hover:underline">MetroWest Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="NYC Suburbs" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}