import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { KNOXVILLE_EAST_TN_HUB_COUNTIES, KNOXVILLE_EAST_TN_LENDER_SLUGS } from '@/lib/mortgage/tennesseeLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Knoxville & East Tennessee Mortgage Lenders — Knox, Blount & Sevier (2026)',
  description:
    'NMLS-verified mortgage lenders in Knoxville and East Tennessee. Farragut appreciation, Maryville retirees, Gatlinburg vacation rentals, VA programs, and tight-inventory expertise.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/tennessee/knoxville-east-tennessee' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function KnoxvilleEastTennesseeHubPage() {
  const hubLenders = KNOXVILLE_EAST_TN_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Tennessee', href: '/local-lenders/tennessee' }, { label: 'Knoxville & East Tennessee Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Appreciation &amp; Scenic Living · Knox County Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Knoxville &amp; East Tennessee</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Knoxville, Farragut, Maryville, and Smoky Mountains lenders for 5%+ appreciation,
            tight inventory, retiree relocations, and Gatlinburg vacation rental investment.
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
                {KNOXVILLE_EAST_TN_HUB_COUNTIES.map((c) => (
                  <Link key={c.slug} href={`/local-lenders/tennessee/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-emerald-400">
                    <span className="font-semibold text-[#0A2540]">{c.name} County</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why East Tennessee Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Farragut and Knox suburbs seeing 24%+ price surges with tight listing inventory</li>
                <li>Retiree and remote-worker influx drives Maryville and Blount County demand</li>
                <li>Gatlinburg and Pigeon Forge short-term rental investors need specialized financing</li>
                <li>Mountain-view and lake properties require lenders familiar with scenic collateral</li>
                <li>Competitive low-inventory markets demand brokers with sub-30-day close records</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Knoxville &amp; East Tennessee</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Knoxville & East Tennessee" />
                  )
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/tennessee/knox" className="text-[#3B82F6] hover:underline">Knox County →</Link>
                {' · '}
                <Link href="/local-lenders/tennessee/blount" className="text-[#3B82F6] hover:underline">Blount County →</Link>
                {' · '}
                <Link href="/local-lenders/tennessee/sevier" className="text-[#3B82F6] hover:underline">Sevier County →</Link>
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
            <LeadCaptureForm stateName="Knoxville & East Tennessee" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/tennessee/greater-nashville-metro" className="text-[#14B8A6] hover:underline">Greater Nashville Metro Hub →</Link></li>
                <li><Link href="/local-lenders/north-carolina/research-triangle" className="text-[#14B8A6] hover:underline">Research Triangle Hub →</Link></li>
                <li><Link href="/local-lenders/georgia/middle-georgia" className="text-[#14B8A6] hover:underline">Middle Georgia Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Knoxville & East Tennessee" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}