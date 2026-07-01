import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { NATIONAL_SUPERSTARS_SUBURBAN_VELOCITY_HUB_AREAS, NATIONAL_SUPERSTARS_SUBURBAN_VELOCITY_LENDER_SLUGS } from '@/lib/mortgage/newJerseyLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Marlton & Wayne Mortgage Lenders — National Superstars Suburban Velocity (2026)',
  description:
    'NMLS-verified mortgage lenders in Marlton and Wayne. Realtor.com #2 and #5 hottest US ZIP codes, 17–19 day contracts, triple-average listing views, and immediate bidding wars.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/new-jersey/national-superstars-suburban-velocity' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function NationalSuperstarsSuburbanVelocityHubPage() {
  const hubLenders = NATIONAL_SUPERSTARS_SUBURBAN_VELOCITY_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'New Jersey', href: '/local-lenders/new-jersey' }, { label: 'National Superstars Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Marlton &amp; Wayne · Suburban Velocity
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — National Superstars</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Burlington and Passaic County lenders for two of America&apos;s hottest ZIP codes — extreme buyer demand,
            blistering 17–19 day contracts, and I-295/Manhattan commuter sweet spots.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Marlton &amp; Wayne — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {NATIONAL_SUPERSTARS_SUBURBAN_VELOCITY_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/new-jersey/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-emerald-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Marlton &amp; Wayne Are Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Marlton ranked #2 and Wayne #5 on Realtor.com&apos;s hottest ZIP codes in America</li>
                <li>Marlton properties receive nearly triple the national average for listing views</li>
                <li>Homes go under contract in a mere 17–19 days in these suburban velocity markets</li>
                <li>Wayne faces severe structural under-supply with immediate bidding wars on every listing</li>
                <li>I-295 corridor Philly commuters and Manhattan transit routes drive relentless demand</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — National Superstars</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Marlton & Wayne" />
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
            <LeadCaptureForm stateName="Marlton & Wayne" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/new-jersey/south-jersey-shore-surge" className="text-[#14B8A6] hover:underline">South Jersey Shore Hub →</Link></li>
                <li><Link href="/local-lenders/new-jersey/sweet-spot-commuter-towns" className="text-[#14B8A6] hover:underline">Sweet Spot Commuter Hub →</Link></li>
                <li><Link href="/local-lenders/new-jersey/hudson-river-gold-coast" className="text-[#14B8A6] hover:underline">Hudson Gold Coast Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Marlton & Wayne" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}