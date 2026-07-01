import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { GREATER_NASHVILLE_HUB_COUNTIES, GREATER_NASHVILLE_LENDER_SLUGS } from '@/lib/mortgage/tennesseeLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Greater Nashville Metro Mortgage Lenders — Davidson, Williamson & Rutherford (2026)',
  description:
    'NMLS-verified mortgage lenders in Greater Nashville. Corporate relocations, Franklin/Brentwood luxury, Murfreesboro fast closings, VA programs, and new-construction financing.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/tennessee/greater-nashville-metro' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function GreaterNashvilleMetroHubPage() {
  const hubLenders = GREATER_NASHVILLE_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Tennessee', href: '/local-lenders/tennessee' }, { label: 'Greater Nashville Metro Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Growth &amp; Wealth Engine · Davidson County Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Greater Nashville Metro</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Nashville, Franklin, Brentwood, and Murfreesboro lenders for corporate relocations,
            no state income tax advantage, healthcare/tech expansion, and high-transaction suburban growth.
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
                {GREATER_NASHVILLE_HUB_COUNTIES.map((c) => (
                  <Link key={c.slug} href={`/local-lenders/tennessee/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-amber-400">
                    <span className="font-semibold text-[#0A2540]">{c.name} County</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Greater Nashville Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>No state income tax draws high-earning corporate and healthcare relocations</li>
                <li>Williamson County luxury in Franklin/Brentwood commands premium school-district pricing</li>
                <li>Rutherford and Murfreesboro absorb high-volume starter and new-construction demand</li>
                <li>Fort Campbell veteran influx and VA programs need military-specialist lenders</li>
                <li>Competitive offer timelines demand brokers with sub-30-day close track records</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Greater Nashville Metro</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Greater Nashville Metro" />
                  )
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/tennessee/davidson" className="text-[#3B82F6] hover:underline">
                  View Davidson County lenders →
                </Link>
                {' · '}
                <Link href="/local-lenders/tennessee/williamson" className="text-[#3B82F6] hover:underline">
                  Williamson County →
                </Link>
                {' · '}
                <Link href="/local-lenders/tennessee/rutherford" className="text-[#3B82F6] hover:underline">
                  Rutherford County →
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
            <LeadCaptureForm stateName="Greater Nashville Metro" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/north-carolina/charlotte-metro" className="text-[#14B8A6] hover:underline">Charlotte Metro Hub →</Link></li>
                <li><Link href="/local-lenders/georgia/north-atlanta" className="text-[#14B8A6] hover:underline">North Atlanta Hub →</Link></li>
                <li><Link href="/local-lenders/florida" className="text-[#14B8A6] hover:underline">Florida Regional Hubs →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Greater Nashville Metro" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}