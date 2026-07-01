import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { GRAND_RAPIDS_FAST_MOVING_CORE_HUB_AREAS, GRAND_RAPIDS_FAST_MOVING_CORE_LENDER_SLUGS } from '@/lib/mortgage/michiganLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Grand Rapids Mortgage Lenders — Fast-Moving Core (2026)',
  description:
    'NMLS-verified mortgage lenders in Grand Rapids, East Grand Rapids, and Ada. 6-day average DOM, under-15-day pending in suburbs, severe inventory crunch, and top millennial job market.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/michigan/grand-rapids-fast-moving-core' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function GrandRapidsFastMovingCoreHubPage() {
  const hubLenders = GRAND_RAPIDS_FAST_MOVING_CORE_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Michigan', href: '/local-lenders/michigan' }, { label: 'Grand Rapids Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Grand Rapids · Fast-Moving Core
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Grand Rapids</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Kent County lenders for West Michigan&apos;s consistent powerhouse — 6-day average contracts,
            severe inventory crunch, and demand from healthcare and manufacturing professionals.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Grand Rapids — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {GRAND_RAPIDS_FAST_MOVING_CORE_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/michigan/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-rose-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Grand Rapids Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Homes in Grand Rapids proper average just 6 days on market before going under contract</li>
                <li>East Grand Rapids and Ada see pending times under 15 days with multiple offers as standard</li>
                <li>Healthcare and manufacturing professional demand severely outpaces available inventory</li>
                <li>Consistent top job market rankings attract waves of millennial relocations</li>
                <li>Fast closings and strong pre-approval letters are essential to win in this powerhouse market</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Grand Rapids</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Grand Rapids" />
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
            <LeadCaptureForm stateName="Grand Rapids" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/michigan/greater-detroits-value-pockets" className="text-[#14B8A6] hover:underline">Greater Detroit Hub →</Link></li>
                <li><Link href="/local-lenders/michigan/lansing-multi-family-investor-magnet" className="text-[#14B8A6] hover:underline">Lansing Hub →</Link></li>
                <li><Link href="/local-lenders/michigan/ann-arbor-kalamazoo-college-town-demand" className="text-[#14B8A6] hover:underline">Ann Arbor &amp; Kalamazoo Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Grand Rapids" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}