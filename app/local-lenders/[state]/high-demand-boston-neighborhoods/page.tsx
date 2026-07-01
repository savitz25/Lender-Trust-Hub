import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { HIGH_DEMAND_BOSTON_NEIGHBORHOODS_HUB_AREAS, HIGH_DEMAND_BOSTON_NEIGHBORHOODS_LENDER_SLUGS } from '@/lib/mortgage/massachusettsLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Boston Neighborhood Mortgage Lenders — East Boston, Dorchester & Jamaica Plain (2026)',
  description:
    'NMLS-verified mortgage lenders in East Boston, Dorchester, and Jamaica Plain. Waterfront proximity, cultural districts, rental yields, high-competition neighborhoods, and Back Bay alternatives.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/massachusetts/high-demand-boston-neighborhoods' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function HighDemandBostonNeighborhoodsHubPage() {
  const hubLenders = HIGH_DEMAND_BOSTON_NEIGHBORHOODS_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Massachusetts', href: '/local-lenders/massachusetts' }, { label: 'Boston Neighborhoods Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · High-Demand Neighborhoods · Suffolk County
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Boston Neighborhoods</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            East Boston, Dorchester, and Jamaica Plain lenders for waterfront proximity, cultural appeal,
            strong rental yields, and high-competition transactions without Back Bay pricing.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Boston Neighborhoods — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {HIGH_DEMAND_BOSTON_NEIGHBORHOODS_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/massachusetts/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-amber-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why These Neighborhoods Are Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>East Boston waterfront proximity as a compelling Back Bay pricing alternative</li>
                <li>Dorchester and Jamaica Plain offer space, culture, and strong rental-yield potential</li>
                <li>High-competition transactions amid cooled luxury segments elsewhere in Boston</li>
                <li>Mixed-use and rowhome inventory rewards lenders who understand neighborhood dynamics</li>
                <li>Rapid appreciation pockets demand fast closings on limited neighborhood stock</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Boston Neighborhoods</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Boston Neighborhoods" />
                  )
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/massachusetts/suffolk" className="text-[#3B82F6] hover:underline">
                  View all Suffolk County lenders →
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
            <LeadCaptureForm stateName="Boston Neighborhoods" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/massachusetts/gateway-cities-suburban-alternatives" className="text-[#14B8A6] hover:underline">Gateway Cities Hub →</Link></li>
                <li><Link href="/local-lenders/massachusetts/transit-oriented-urban-hotspots-somerville-cambridge" className="text-[#14B8A6] hover:underline">Cambridge &amp; Somerville Hub →</Link></li>
                <li><Link href="/local-lenders/massachusetts/metrowest-bread-and-butter-markets" className="text-[#14B8A6] hover:underline">MetroWest Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Boston Neighborhoods" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}