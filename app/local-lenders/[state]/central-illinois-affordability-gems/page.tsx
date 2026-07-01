import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { CENTRAL_ILLINOIS_AFFORDABILITY_GEMS_HUB_AREAS, CENTRAL_ILLINOIS_AFFORDABILITY_GEMS_LENDER_SLUGS } from '@/lib/mortgage/illinoisLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Central Illinois Mortgage Lenders — Peoria & Normal Affordability Gems (2026)',
  description:
    'NMLS-verified mortgage lenders in Peoria and McLean Counties. Peoria investment appeal, 20–26 day DOM, Normal as Zillow #1 college town, and exceptional rent-to-price ratios.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/illinois/central-illinois-affordability-gems' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function CentralIllinoisAffordabilityGemsHubPage() {
  const hubLenders = CENTRAL_ILLINOIS_AFFORDABILITY_GEMS_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Illinois', href: '/local-lenders/illinois' }, { label: 'Central IL Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-lime-400/40 bg-lime-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Central Illinois · Affordability Gems
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Central Illinois</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Peoria and Normal lenders for high-value, low-entry markets — exceptional rent-to-price ratios,
            fast-moving inventory, and Zillow&apos;s #1 most popular college town.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Central Illinois — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {CENTRAL_ILLINOIS_AFFORDABILITY_GEMS_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/illinois/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-lime-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Central Illinois Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Peoria ranks as a top midsize city for real estate investment with exceptional rent-to-price ratios</li>
                <li>Peoria homes move in a median of just 20–26 days on market</li>
                <li>Normal was named Zillow&apos;s #1 most popular college town in America</li>
                <li>Revitalized uptown Normal and strong ISU-area rental demand drive McLean County activity</li>
                <li>Low entry costs attract both first-time buyers and cash-flow-focused investors</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Central Illinois</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Central Illinois" />
                  )
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
            <LeadCaptureForm stateName="Central Illinois" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/illinois/rockford-national-standout" className="text-[#14B8A6] hover:underline">Rockford Hub →</Link></li>
                <li><Link href="/local-lenders/illinois/highly-competitive-chicago-suburbs" className="text-[#14B8A6] hover:underline">Chicago Suburbs Hub →</Link></li>
                <li><Link href="/local-lenders/illinois/chicago-proper-urban-resurgence" className="text-[#14B8A6] hover:underline">Chicago Proper Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Central Illinois" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}