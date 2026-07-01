import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { WEST_VALLEY_HUB_AREAS, WEST_VALLEY_LENDER_SLUGS } from '@/lib/mortgage/arizonaLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'West Valley Boomtowns Mortgage Lenders — Buckeye & Goodyear, AZ (2026)',
  description:
    'NMLS-verified mortgage lenders in West Valley boomtowns. Verrado and Tartesso new construction, 37%+ growth, VA relocations, and $430K median family financing in Maricopa County.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/arizona/west-valley-boomtowns' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function WestValleyBoomtownsHubPage() {
  const hubLenders = WEST_VALLEY_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Arizona', href: '/local-lenders/arizona' }, { label: 'West Valley Boomtowns Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-orange-400/40 bg-orange-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Boomtown Growth · Maricopa County Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — West Valley Boomtowns</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Buckeye and Goodyear lenders for master-planned communities, 37%+ population surge,
            I-10/Loop 303 corporate expansions, and affordable family homes vs. central Phoenix.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">West Valley — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {WEST_VALLEY_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/arizona/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-orange-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why West Valley Boomtowns Are Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Buckeye and Goodyear lead Arizona with 37%+ population growth and master-planned volume</li>
                <li>Verrado, Tartesso, and DR Horton communities need construction-to-permanent specialists</li>
                <li>Healthcare and logistics expansions along I-10 and Loop 303 drive corporate relocations</li>
                <li>$430K median pricing attracts family buyers priced out of central Phoenix</li>
                <li>Fast-closing brokers win competitive offers in high-transaction new-build corridors</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — West Valley Boomtowns</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="West Valley Boomtowns" />
                  )
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/arizona/maricopa" className="text-[#3B82F6] hover:underline">
                  View all Maricopa County lenders →
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
            <LeadCaptureForm stateName="West Valley Boomtowns" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/tennessee/greater-nashville-metro" className="text-[#14B8A6] hover:underline">Greater Nashville Metro Hub →</Link></li>
                <li><Link href="/local-lenders/north-carolina/charlotte-metro" className="text-[#14B8A6] hover:underline">Charlotte Metro Hub →</Link></li>
                <li><Link href="/local-lenders/florida/central-florida" className="text-[#14B8A6] hover:underline">Central Florida Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="West Valley Boomtowns" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}