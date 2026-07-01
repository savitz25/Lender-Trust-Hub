import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { LOWCOUNTRY_HUB_COUNTIES } from '@/lib/mortgage/southCarolinaLenders';
import { getLendersByCounty } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Lowcountry Mortgage Lenders — Charleston Metro & Mt. Pleasant (2026)',
  description:
    'NMLS-verified mortgage lenders in the Charleston Lowcountry. Luxury jumbo condos, Boeing/Volvo relocations, non-warrantable coastal financing, and rapid upfront underwriting.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/south-carolina/lowcountry' },
};

export default function LowcountryHubPage() {
  const charlestonLenders = getLendersByCounty('south-carolina', 'charleston');

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Mortgage Lenders', href: '/local-lenders' },
            { label: 'South Carolina', href: '/local-lenders/south-carolina' },
            { label: 'Lowcountry Hub' },
          ]}
        />
      </div>

      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Zero Paid Placements · Charleston Metro Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Lowcountry</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Charleston, Mt. Pleasant, and Summerville lenders for luxury condos, corporate relocations,
            flood underwriting, and competitive coastal resale speed.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Counties — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {LOWCOUNTRY_HUB_COUNTIES.map((c) => (
                  <Link key={c.slug} href={`/local-lenders/south-carolina/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-indigo-400">
                    <span className="font-semibold text-[#0A2540]">{c.name} County</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why the Lowcountry Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Boeing, Volvo, and port sector relocations drive corporate purchase volume</li>
                <li>Non-warrantable condos and strict coastal HOA rules require specialized lenders</li>
                <li>Wind-pool and flood insurance contingencies must clear early in underwriting</li>
                <li>Summerville and Mt. Pleasant listings move fast — upfront pre-approvals win offers</li>
                <li>Historic downtown Charleston assets need tailored appraisal coordination</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders in Charleston County</h2>
              <div className="space-y-4">
                {charlestonLenders.map((lender, i) => (
                  <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Charleston County" />
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/south-carolina/berkeley" className="text-[#3B82F6] hover:underline">
                  Berkeley &amp; Dorchester counties — same 5 lenders via CSRA supplements →
                </Link>
              </p>
            </section>

            <LeadCaptureForm stateName="Lowcountry" categoryId="mortgage" variant="state-page-v2" />
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/south-carolina/grand-strand" className="text-[#14B8A6] hover:underline">Grand Strand Hub →</Link></li>
                <li><Link href="/local-lenders/georgia/coastal-savannah" className="text-[#14B8A6] hover:underline">Coastal Savannah Hub →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Lowcountry" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}