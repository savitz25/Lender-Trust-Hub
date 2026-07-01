import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { PHILADELPHIA_METRO_AREA_LENDER_SLUGS, PHILADELPHIA_METRO_HUB_AREAS } from '@/lib/mortgage/pennsylvaniaLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Philadelphia Metro Mortgage Lenders — Collar Counties (2026)',
  description:
    'NMLS-verified mortgage lenders in Philadelphia, Montgomery, Chester, and Bucks Counties. #6 hottest US market, 41%+ above-asking sales, collar county bidding wars, and NYC/DC affordability.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/pennsylvania/philadelphia-metro-area-collar-counties' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function PhiladelphiaMetroAreaCollarCountiesHubPage() {
  const hubLenders = PHILADELPHIA_METRO_AREA_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Pennsylvania', href: '/local-lenders/pennsylvania' }, { label: 'Philadelphia Metro Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-teal-400/40 bg-teal-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Philadelphia Metro · Collar Counties
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Philadelphia Metro</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Philadelphia and collar county lenders for the #6 hottest US housing market — intense bidding wars,
            move-in-ready demand, and affordability relative to NYC and DC.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Philadelphia Metro — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {PHILADELPHIA_METRO_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/pennsylvania/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-teal-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Philadelphia Metro Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Philadelphia Metro ranks as the #6 hottest US housing market with 41%+ above-asking sales</li>
                <li>Inventory sits roughly 39% below pre-pandemic levels, amplifying seller leverage</li>
                <li>Montgomery, Chester, and Bucks collar counties drive suburban bidding wars on move-in-ready homes</li>
                <li>NYC and DC relocators seek affordability without sacrificing suburban amenities</li>
                <li>Lean inventory rewards lenders who close quickly on competitive collar county stock</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Philadelphia Metro</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Philadelphia Metro" />
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
            <LeadCaptureForm stateName="Philadelphia Metro" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/pennsylvania/greater-pittsburgh-key-suburbs" className="text-[#14B8A6] hover:underline">Greater Pittsburgh Hub →</Link></li>
                <li><Link href="/local-lenders/pennsylvania/central-eastern-pa-affordability-havens" className="text-[#14B8A6] hover:underline">Central/Eastern PA Hub →</Link></li>
                <li><Link href="/local-lenders/new-york/nyc-suburbs-westchester-putnam" className="text-[#14B8A6] hover:underline">NYC Suburbs Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Philadelphia Metro" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}