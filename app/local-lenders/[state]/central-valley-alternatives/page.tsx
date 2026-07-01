import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { CENTRAL_VALLEY_HUB_COUNTIES, CENTRAL_VALLEY_LENDER_SLUGS } from '@/lib/mortgage/californiaLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Central Valley Alternatives Mortgage Lenders — Clovis & Bakersfield, CA (2026)',
  description:
    'NMLS-verified mortgage lenders in Central Valley Alternatives. Clovis elite-school suburbs, Bakersfield affordability, remote worker relocations, positive cash-flow investing, and $400K–$430K median financing.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/california/central-valley-alternatives' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function CentralValleyAlternativesHubPage() {
  const hubLenders = CENTRAL_VALLEY_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'California', href: '/local-lenders/california' }, { label: 'Central Valley Alternatives Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Affordability &amp; Cash Flow · Fresno &amp; Kern Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Central Valley Alternatives</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Clovis and Bakersfield lenders for coastal California migrants, remote tech workers,
            positive cash-flow investors, and traditional suburban buyers at roughly half state median prices.
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
                {CENTRAL_VALLEY_HUB_COUNTIES.map((c) => (
                  <Link key={c.slug} href={`/local-lenders/california/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-emerald-400">
                    <span className="font-semibold text-[#0A2540]">{c.name} County</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Central Valley Alternatives Are Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Clovis offers elite schools and low-crime suburbs at $400K–$430K medians — half coastal California</li>
                <li>Bakersfield anchors agricultural heartland affordability with strong investor cash-flow potential</li>
                <li>Bay Area and LA remote workers drive migration-driven purchase volume</li>
                <li>Master-planned suburban layouts attract first-time buyers seeking traditional neighborhoods</li>
                <li>Community credit unions and fast-closing brokers serve both family and investor segments</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Central Valley Alternatives</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Central Valley Alternatives" />
                  )
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/california/fresno" className="text-[#3B82F6] hover:underline">
                  View all Fresno County lenders →
                </Link>
                {' · '}
                <Link href="/local-lenders/california/kern" className="text-[#3B82F6] hover:underline">
                  View all Kern County lenders →
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
            <LeadCaptureForm stateName="Central Valley Alternatives" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/california/inland-empire-affordability-magnets" className="text-[#14B8A6] hover:underline">Inland Empire Affordability Magnets Hub →</Link></li>
                <li><Link href="/local-lenders/california/silicon-valley-spine" className="text-[#14B8A6] hover:underline">Silicon Valley Spine Hub →</Link></li>
                <li><Link href="/local-lenders/arizona/west-valley-boomtowns" className="text-[#14B8A6] hover:underline">West Valley Boomtowns Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Central Valley Alternatives" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}