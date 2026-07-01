import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { PIEDMONT_TRIAD_HUB_COUNTIES } from '@/lib/mortgage/northCarolinaLenders';
import { getLendersByCounty } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Piedmont Triad Mortgage Lenders — Greensboro & Winston-Salem (2026)',
  description:
    'NMLS-verified mortgage lenders in the Piedmont Triad. Affordable $283K–$315K entry, equity-building markets, first-time buyers, and investor-friendly fast closings in Guilford and Forsyth.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/north-carolina/piedmont-triad' },
};

export default function PiedmontTriadHubPage() {
  const guilfordLenders = getLendersByCounty('north-carolina', 'guilford');
  const forsythLenders = getLendersByCounty('north-carolina', 'forsyth');

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'North Carolina', href: '/local-lenders/north-carolina' }, { label: 'Piedmont Triad Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Guilford &amp; Forsyth Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Piedmont Triad</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Greensboro, Winston-Salem, and High Point lenders for affordable entry-level homes,
            12.5%+ appreciation, new construction, and retiree-friendly equity markets.
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
                {PIEDMONT_TRIAD_HUB_COUNTIES.map((c) => (
                  <Link key={c.slug} href={`/local-lenders/north-carolina/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-amber-400">
                    <span className="font-semibold text-[#0A2540]">{c.name} County</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Guilford County — 4 Lenders</h2>
              <div className="space-y-4">
                {guilfordLenders.map((lender, i) => (
                  <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Guilford County" />
                ))}
              </div>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Forsyth County — 5 Lenders</h2>
              <div className="space-y-4">
                {forsythLenders.map((lender, i) => (
                  <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Forsyth County" />
                ))}
              </div>
            </section>
            <LeadCaptureForm stateName="Piedmont Triad" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <ul className="space-y-2">
                <li><Link href="/local-lenders/north-carolina/charlotte-metro" className="text-[#14B8A6] hover:underline">Charlotte Metro Hub →</Link></li>
                <li><Link href="/local-lenders/north-carolina/research-triangle" className="text-[#14B8A6] hover:underline">Research Triangle Hub →</Link></li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}