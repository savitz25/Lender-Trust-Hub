import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { SILICON_VALLEY_HUB_AREAS, SILICON_VALLEY_LENDER_SLUGS } from '@/lib/mortgage/californiaLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Silicon Valley Spine Mortgage Lenders — San Jose & Cupertino, CA (2026)',
  description:
    'NMLS-verified mortgage lenders in Silicon Valley Spine. Jumbo and high-net-worth financing, RSU stock compensation, 12–13 day DOM, 65–68% above-list offers, and ultra-competitive Santa Clara County closings.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/california/silicon-valley-spine' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function SiliconValleySpineHubPage() {
  const hubLenders = SILICON_VALLEY_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'California', href: '/local-lenders/california' }, { label: 'Silicon Valley Spine Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Jumbo &amp; Tech Corridor · Santa Clara County Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Silicon Valley Spine</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            San Jose and Cupertino lenders for AI and semiconductor professionals, stock-compensation buyers,
            multiple-offer dynamics, and premium properties in North America&apos;s most competitive corridor.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Silicon Valley Spine — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {SILICON_VALLEY_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/california/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-sky-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Silicon Valley Spine Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>12–13 days on market with 65–68% of sales closing above list price</li>
                <li>$1.5M+ medians driven by AI funding, semiconductor growth, and cash-heavy buyer pools</li>
                <li>RSU and stock-liquidity income requires jumbo and portfolio underwriting expertise</li>
                <li>Multiple-offer, non-contingent contracts demand fast closings and pre-underwritten strength</li>
                <li>Tech-employee credit unions and private bank arms compete with national retail lenders</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Silicon Valley Spine</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Silicon Valley Spine" />
                  )
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/california/santa-clara" className="text-[#3B82F6] hover:underline">
                  View all Santa Clara County lenders →
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
            <LeadCaptureForm stateName="Silicon Valley Spine" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/north-carolina/research-triangle" className="text-[#14B8A6] hover:underline">Research Triangle Hub →</Link></li>
                <li><Link href="/local-lenders/arizona/west-valley-boomtowns" className="text-[#14B8A6] hover:underline">West Valley Boomtowns Hub →</Link></li>
                <li><Link href="/local-lenders/tennessee/greater-nashville-metro" className="text-[#14B8A6] hover:underline">Greater Nashville Metro Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Silicon Valley Spine" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}