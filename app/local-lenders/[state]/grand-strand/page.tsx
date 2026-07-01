import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { GRAND_STRAND_HUB_COUNTIES } from '@/lib/mortgage/southCarolinaLenders';
import { getLendersByCounty } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Grand Strand Mortgage Lenders — Myrtle Beach & Horry County (2026)',
  description:
    'NMLS-verified mortgage lenders on the Grand Strand. Retiree relocations, condo and beach financing, manufactured homes, FHA/VA, and 7-day upfront underwriting in Myrtle Beach.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/south-carolina/grand-strand' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function GrandStrandHubPage() {
  const horryLenders = getLendersByCounty('south-carolina', 'horry');

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Mortgage Lenders', href: '/local-lenders' },
            { label: 'South Carolina', href: '/local-lenders/south-carolina' },
            { label: 'Grand Strand Hub' },
          ]}
        />
      </div>

      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Zero Paid Placements · Horry County Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Grand Strand</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Myrtle Beach, Conway, and Horry County lenders for retiree relocations, coastal condos,
            manufactured homes, remote workers, and fast competitive resale closings.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Horry County — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {GRAND_STRAND_HUB_COUNTIES.map((c) => (
                  <Link key={c.slug} href={`/local-lenders/south-carolina/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-cyan-400">
                    <span className="font-semibold text-[#0A2540]">{c.name} County</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why the Grand Strand Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Northeast and Midwest retiree relocations drive second-home and primary-residence volume</li>
                <li>Warrantable vs non-warrantable condo rules differ sharply from inland markets</li>
                <li>High-wind mitigation credits and flood zone insurance affect every coastal pre-approval</li>
                <li>Conway suburbs offer affordable manufactured and modular entry points</li>
                <li>Competitive beachside listings need upfront underwriting and sub-30-day closes</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders in Horry County</h2>
              <div className="space-y-4">
                {horryLenders.map((lender, i) => (
                  <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Horry County" />
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

            <LeadCaptureForm stateName="Grand Strand" categoryId="mortgage" variant="state-page-v2" />
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/south-carolina/upstate" className="text-[#14B8A6] hover:underline">Upstate SC Hub →</Link></li>
                <li><Link href="/local-lenders/south-carolina/lowcountry" className="text-[#14B8A6] hover:underline">Lowcountry Hub →</Link></li>
                <li><Link href="/local-lenders/florida/panhandle" className="text-[#14B8A6] hover:underline">Florida Panhandle Hub →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Grand Strand" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}