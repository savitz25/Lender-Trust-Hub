import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { HUDSON_RIVER_GOLD_COAST_HUB_AREAS, HUDSON_RIVER_GOLD_COAST_LENDER_SLUGS } from '@/lib/mortgage/newJerseyLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Jersey City & Hoboken Mortgage Lenders — Hudson River Gold Coast (2026)',
  description:
    'NMLS-verified mortgage lenders in Jersey City and Hoboken. Return-to-office driven demand, 22.6% YoY luxury growth, rapid high-density absorption, and Hudson River waterfront financing.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/new-jersey/hudson-river-gold-coast' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function HudsonRiverGoldCoastHubPage() {
  const hubLenders = HUDSON_RIVER_GOLD_COAST_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'New Jersey', href: '/local-lenders/new-jersey' }, { label: 'Hudson Gold Coast Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Jersey City &amp; Hoboken · Gold Coast
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Hudson River Gold Coast</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Hudson County lenders for the Manhattan-adjacent waterfront powerhouse — return-to-office mandates,
            luxury appreciation, and rapid absorption of high-density residential developments.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Gold Coast — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {HUDSON_RIVER_GOLD_COAST_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/new-jersey/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-emerald-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why the Hudson Gold Coast Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Return-to-office mandates in Manhattan keep the Hudson River waterfront a powerhouse</li>
                <li>Hoboken posted 22.6% year-over-year price growth for luxury properties</li>
                <li>Jersey City continues absorbing new high-density residential developments at rapid speed</li>
                <li>Waterfront luxury and commuter financing demand outpaces supply across Hudson County</li>
                <li>Manhattan-adjacent proximity drives relentless buyer competition on Gold Coast listings</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Hudson Gold Coast</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Hudson Gold Coast" />
                  )
                ))}
              </div>
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
            <LeadCaptureForm stateName="Hudson Gold Coast" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/new-jersey/national-superstars-suburban-velocity" className="text-[#14B8A6] hover:underline">National Superstars Hub →</Link></li>
                <li><Link href="/local-lenders/new-jersey/south-jersey-shore-surge" className="text-[#14B8A6] hover:underline">South Jersey Shore Hub →</Link></li>
                <li><Link href="/local-lenders/new-jersey/sweet-spot-commuter-towns" className="text-[#14B8A6] hover:underline">Sweet Spot Commuter Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Hudson Gold Coast" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}