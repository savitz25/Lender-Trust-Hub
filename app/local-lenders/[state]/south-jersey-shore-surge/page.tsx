import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { SOUTH_JERSEY_SHORE_SURGE_HUB_AREAS, SOUTH_JERSEY_SHORE_SURGE_LENDER_SLUGS } from '@/lib/mortgage/newJerseyLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Wildwood & Ocean City Mortgage Lenders — South Jersey Shore Surge (2026)',
  description:
    'NMLS-verified mortgage lenders in Wildwood, North Wildwood, Ocean City, and Ventnor City. 54–60% YoY price spikes, $1.4M+ Ocean City medians, and ultra-luxury shore battlegrounds.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/new-jersey/south-jersey-shore-surge' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function SouthJerseyShoreSurgeHubPage() {
  const hubLenders = SOUTH_JERSEY_SHORE_SURGE_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'New Jersey', href: '/local-lenders/new-jersey' }, { label: 'South Jersey Shore Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Cape May County · Shore Surge
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — South Jersey Shore</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Cape May County lenders for the state&apos;s highest year-over-year appreciation — luxury buyers,
            vacation-rental investors, and unprecedented coastal growth along the southern shoreline.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Shore Surge — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {SOUTH_JERSEY_SHORE_SURGE_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/new-jersey/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-emerald-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why the South Jersey Shore Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Wildwood registered a staggering 54–60% year-over-year price spike past $600K medians</li>
                <li>Ocean City average sale prices breached $1.4 million with 25%+ year-over-year growth</li>
                <li>Ventnor City saw a 60% jump in average sale prices to nearly $963,000</li>
                <li>Luxury buyers and vacation-rental investors drive unprecedented coastal demand</li>
                <li>Wildwood ranks among the top 10 hottest real estate markets in the country</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — South Jersey Shore</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Cape May Shore" />
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
            <LeadCaptureForm stateName="South Jersey Shore" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/new-jersey/national-superstars-suburban-velocity" className="text-[#14B8A6] hover:underline">National Superstars Hub →</Link></li>
                <li><Link href="/local-lenders/new-jersey/sweet-spot-commuter-towns" className="text-[#14B8A6] hover:underline">Sweet Spot Commuter Hub →</Link></li>
                <li><Link href="/local-lenders/new-jersey/hudson-river-gold-coast" className="text-[#14B8A6] hover:underline">Hudson Gold Coast Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="South Jersey Shore" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}