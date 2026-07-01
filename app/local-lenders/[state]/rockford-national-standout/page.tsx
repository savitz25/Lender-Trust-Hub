import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { ROCKFORD_NATIONAL_STANDOUT_HUB_AREAS, ROCKFORD_NATIONAL_STANDOUT_LENDER_SLUGS } from '@/lib/mortgage/illinoisLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Rockford Mortgage Lenders — #1 US Home Shopping Market (2026)',
  description:
    'NMLS-verified mortgage lenders in Rockford and Winnebago County. Zillow #1 most popular US city, 11-day median contracts, 60%+ out-of-town buyers, and nearly 50% above-list sales.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/illinois/rockford-national-standout' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function RockfordNationalStandoutHubPage() {
  const hubLenders = ROCKFORD_NATIONAL_STANDOUT_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Illinois', href: '/local-lenders/illinois' }, { label: 'Rockford Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-orange-400/40 bg-orange-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Rockford · National Standout
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Rockford</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Winnebago County lenders for Zillow&apos;s #1 most popular US home shopping city — Chicago spillover demand,
            11-day median contracts, and nearly 50% above-list sales.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Rockford — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {ROCKFORD_NATIONAL_STANDOUT_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/illinois/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-orange-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Rockford Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Rockford ranks as Zillow&apos;s #1 most popular city for home shoppers in the entire United States</li>
                <li>Over 60% of listing views come from out-of-town buyers priced out of the Chicago metro</li>
                <li>Homes routinely go under contract in a median of just 11 days</li>
                <li>Nearly 50% of properties sell above the original list price</li>
                <li>Accessible entry point 90 minutes northwest of Chicago without collar-county price tags</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Rockford</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Rockford" />
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
            <LeadCaptureForm stateName="Rockford" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/illinois/highly-competitive-chicago-suburbs" className="text-[#14B8A6] hover:underline">Chicago Suburbs Hub →</Link></li>
                <li><Link href="/local-lenders/illinois/chicago-proper-urban-resurgence" className="text-[#14B8A6] hover:underline">Chicago Proper Hub →</Link></li>
                <li><Link href="/local-lenders/illinois/central-illinois-affordability-gems" className="text-[#14B8A6] hover:underline">Central IL Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Rockford" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}