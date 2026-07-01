import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { CENTRAL_EASTERN_PA_AFFORDABILITY_HAVENS_LENDER_SLUGS, CENTRAL_EASTERN_PA_HUB_AREAS } from '@/lib/mortgage/pennsylvaniaLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Central & Eastern PA Mortgage Lenders — Harrisburg, Lehigh Valley & York (2026)',
  description:
    'NMLS-verified mortgage lenders in Harrisburg, Lehigh Valley, and York County. 16% YoY appreciation, 22–31 day pending, Wrightsville #12 hot market, and maximum square footage value.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/pennsylvania/central-eastern-pa-affordability-havens' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function CentralEasternPaAffordabilityHavensHubPage() {
  const hubLenders = CENTRAL_EASTERN_PA_AFFORDABILITY_HAVENS_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Pennsylvania', href: '/local-lenders/pennsylvania' }, { label: 'Central/Eastern PA Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-lime-400/40 bg-lime-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Affordability Havens · Harrisburg / Lehigh / York
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Central &amp; Eastern PA</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Harrisburg, Lehigh Valley, and York County lenders for massive appreciation,
            lean inventory, quick pending times, and maximum square footage for your dollar.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Affordability Havens — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {CENTRAL_EASTERN_PA_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/pennsylvania/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-lime-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Central &amp; Eastern PA Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Harrisburg median sale prices jumped roughly 16% year-over-year with 31-day average sales</li>
                <li>Lehigh Valley (Allentown/Bethlehem) has virtually no inventory equilibrium — 22–31 day pending</li>
                <li>Wrightsville (York County) ranked #12 hottest market nationally for suburban/rural charm</li>
                <li>Proximity to NYC, Philadelphia, and Baltimore drives commuter and relocation demand</li>
                <li>Buyers prioritize maximum square footage value in these scorcher affordability pockets</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Central &amp; Eastern PA</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Central/Eastern PA" />
                  )
                ))}
              </div>
              <p className="mt-4 flex flex-wrap gap-4 text-sm">
                <Link href="/local-lenders/pennsylvania/dauphin" className="text-[#3B82F6] hover:underline">
                  View all Dauphin County lenders →
                </Link>
                <Link href="/local-lenders/pennsylvania/lehigh" className="text-[#3B82F6] hover:underline">
                  View all Lehigh County lenders →
                </Link>
                <Link href="/local-lenders/pennsylvania/york" className="text-[#3B82F6] hover:underline">
                  View all York County lenders →
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
            <LeadCaptureForm stateName="Central/Eastern PA" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/pennsylvania/philadelphia-metro-area-collar-counties" className="text-[#14B8A6] hover:underline">Philadelphia Metro Hub →</Link></li>
                <li><Link href="/local-lenders/pennsylvania/greater-pittsburgh-key-suburbs" className="text-[#14B8A6] hover:underline">Greater Pittsburgh Hub →</Link></li>
                <li><Link href="/local-lenders/massachusetts/gateway-cities-suburban-alternatives" className="text-[#14B8A6] hover:underline">Gateway Cities Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Central/Eastern PA" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}