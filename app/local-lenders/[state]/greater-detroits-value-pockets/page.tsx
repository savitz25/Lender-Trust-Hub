import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { GREATER_DETROITS_VALUE_POCKETS_HUB_AREAS, GREATER_DETROITS_VALUE_POCKETS_LENDER_SLUGS } from '@/lib/mortgage/michiganLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Greater Detroit Mortgage Lenders — Dearborn, Lincoln Park & Howell (2026)',
  description:
    'NMLS-verified mortgage lenders in Dearborn, Lincoln Park, and Howell. Zillow top 5 city, Redfin top 10 hottest neighborhoods, 40% over-asking sales, and Southeast Michigan value pockets.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/michigan/greater-detroits-value-pockets' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function GreaterDetroitsValuePocketsHubPage() {
  const hubLenders = GREATER_DETROITS_VALUE_POCKETS_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Michigan', href: '/local-lenders/michigan' }, { label: 'Greater Detroit Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Greater Detroit · Value Pockets
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Greater Detroit</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Southeast Michigan lenders for Dearborn, Lincoln Park, and Howell — national hot markets where buyers
            maximize purchasing power in entry-level, transitional, and high-end value pockets.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Greater Detroit — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {GREATER_DETROITS_VALUE_POCKETS_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/michigan/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-amber-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Greater Detroit Value Pockets Are Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Dearborn ranks as one of Zillow&apos;s top 5 most popular cities for home shoppers nationwide</li>
                <li>Lincoln Park is a Redfin top 10 hottest neighborhood with 14% YoY sales growth and nearly 40% over-asking</li>
                <li>Howell cracked Redfin&apos;s national top 10 hottest markets with a massive page-view surge and rapid bidding wars</li>
                <li>Entry-level and transitional neighborhoods let buyers maximize purchasing power across the budget spectrum</li>
                <li>Strong local economies and cultural communities drive intense competition at accessible price points</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Greater Detroit</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Greater Detroit" />
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
            <LeadCaptureForm stateName="Greater Detroit" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/illinois/rockford-national-standout" className="text-[#14B8A6] hover:underline">Rockford Hub →</Link></li>
                <li><Link href="/local-lenders/pennsylvania/greater-pittsburgh-key-suburbs" className="text-[#14B8A6] hover:underline">Greater Pittsburgh Hub →</Link></li>
                <li><Link href="/local-lenders/michigan/wayne" className="text-[#14B8A6] hover:underline">Wayne County Lenders →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Greater Detroit" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}