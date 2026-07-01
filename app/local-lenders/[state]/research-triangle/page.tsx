import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { RESEARCH_TRIANGLE_HUB_COUNTIES } from '@/lib/mortgage/northCarolinaLenders';
import { getLendersByCounty } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Research Triangle Mortgage Lenders — Raleigh, Durham & Cary (2026)',
  description:
    'NMLS-verified mortgage lenders in the Research Triangle. Tech and education relocations, Cary/Apex suburbs, same-as-cash approvals, and competitive Wake County financing.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/north-carolina/research-triangle' },
};

export default function ResearchTriangleHubPage() {
  const wakeLenders = getLendersByCounty('north-carolina', 'wake');
  const durhamLenders = getLendersByCounty('north-carolina', 'durham');

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'North Carolina', href: '/local-lenders/north-carolina' }, { label: 'Research Triangle Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-teal-400/40 bg-teal-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Wake &amp; Durham Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Research Triangle</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Raleigh-Durham-Chapel Hill lenders for tech, healthcare, and university relocations —
            Cary, Apex, Fuquay-Varina, and $447K Raleigh median markets.
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
                {RESEARCH_TRIANGLE_HUB_COUNTIES.map((c) => (
                  <Link key={c.slug} href={`/local-lenders/north-carolina/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-[#14B8A6]">
                    <span className="font-semibold text-[#0A2540]">{c.name} County</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Wake County — 5 Lenders</h2>
              <div className="space-y-4">
                {wakeLenders.map((lender, i) => (
                  <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Wake County" />
                ))}
              </div>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Durham County — 5 Lenders</h2>
              <div className="space-y-4">
                {durhamLenders.map((lender, i) => (
                  <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Durham County" />
                ))}
              </div>
            </section>
            <LeadCaptureForm stateName="Research Triangle" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <ul className="space-y-2">
                <li><Link href="/local-lenders/north-carolina/charlotte-metro" className="text-[#14B8A6] hover:underline">Charlotte Metro Hub →</Link></li>
                <li><Link href="/local-lenders/north-carolina/piedmont-triad" className="text-[#14B8A6] hover:underline">Piedmont Triad Hub →</Link></li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}