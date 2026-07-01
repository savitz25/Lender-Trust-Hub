import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { UPSTATE_SC_HUB_COUNTIES } from '@/lib/mortgage/southCarolinaLenders';
import { getLendersByCounty } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Upstate SC Mortgage Lenders — Greenville & Spartanburg (2026)',
  description:
    'NMLS-verified mortgage lenders in Upstate South Carolina. Greenville renovation loans, BMW/Michelin relocations, USDA Spartanburg programs, and fast upfront underwriting.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/south-carolina/upstate' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function UpstateSCHubPage() {
  const greenvilleLenders = getLendersByCounty('south-carolina', 'greenville');
  const spartanburgLenders = getLendersByCounty('south-carolina', 'spartanburg');

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Mortgage Lenders', href: '/local-lenders' },
            { label: 'South Carolina', href: '/local-lenders/south-carolina' },
            { label: 'Upstate SC Hub' },
          ]}
        />
      </div>

      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Zero Paid Placements · Greenville &amp; Spartanburg
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Upstate SC</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Greenville-Spartanburg corridor lenders for manufacturing relocations, renovation loans,
            tech workforce purchases, and USDA zero-down outer-ring programs.
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
                {UPSTATE_SC_HUB_COUNTIES.map((c) => (
                  <Link key={c.slug} href={`/local-lenders/south-carolina/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-emerald-400">
                    <span className="font-semibold text-[#0A2540]">{c.name} County</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Greenville County — 4 Lenders</h2>
              <div className="space-y-4">
                {greenvilleLenders.map((lender, i) => (
                  <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Greenville County" />
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Spartanburg County — 5 Lenders</h2>
              <div className="space-y-4">
                {spartanburgLenders.map((lender, i) => (
                  <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Spartanburg County" />
                ))}
              </div>
            </section>

            <LeadCaptureForm stateName="Upstate SC" categoryId="mortgage" variant="state-page-v2" />
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/south-carolina/grand-strand" className="text-[#14B8A6] hover:underline">Grand Strand Hub →</Link></li>
                <li><Link href="/local-lenders/south-carolina/lowcountry" className="text-[#14B8A6] hover:underline">Lowcountry Hub →</Link></li>
                <li><Link href="/local-lenders/georgia/north-atlanta" className="text-[#14B8A6] hover:underline">North Atlanta Hub →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Upstate SC" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}