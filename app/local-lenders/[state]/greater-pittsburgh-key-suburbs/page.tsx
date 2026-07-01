import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { GREATER_PITTSBURGH_HUB_AREAS, GREATER_PITTSBURGH_KEY_SUBURBS_LENDER_SLUGS } from '@/lib/mortgage/pennsylvaniaLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Greater Pittsburgh Mortgage Lenders — Allegheny & Beaver Counties (2026)',
  description:
    'NMLS-verified mortgage lenders in Pittsburgh and Baden. #3 hottest national suburb, 8–14 day pending times, remote worker influx, and stable Western PA markets.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/pennsylvania/greater-pittsburgh-key-suburbs' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function GreaterPittsburghKeySuburbsHubPage() {
  const hubLenders = GREATER_PITTSBURGH_KEY_SUBURBS_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Pennsylvania', href: '/local-lenders/pennsylvania' }, { label: 'Greater Pittsburgh Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-yellow-400/40 bg-yellow-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Greater Pittsburgh · Allegheny &amp; Beaver
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Greater Pittsburgh</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Pittsburgh and Baden lenders for Western PA&apos;s surge — remote workers, tech professionals,
            retirees, and the #3 hottest national suburb with 8–14 day pending velocity.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Greater Pittsburgh — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {GREATER_PITTSBURGH_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/pennsylvania/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-yellow-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Greater Pittsburgh Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Baden (Beaver County) ranked #3 hottest housing market nationally on recent indexes</li>
                <li>Pittsburgh Proper offers stability with well-priced homes pending in 8–14 days</li>
                <li>Remote workers, tech professionals, and retirees drive lower cost-of-living demand</li>
                <li>Tight suburban inventory pushes sale prices above historical averages rapidly</li>
                <li>Minimal boom-and-bust volatility rewards lenders who understand Western PA pace</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Greater Pittsburgh</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Greater Pittsburgh" />
                  )
                ))}
              </div>
              <p className="mt-4 flex flex-wrap gap-4 text-sm">
                <Link href="/local-lenders/pennsylvania/allegheny" className="text-[#3B82F6] hover:underline">
                  View all Allegheny County lenders →
                </Link>
                <Link href="/local-lenders/pennsylvania/beaver" className="text-[#3B82F6] hover:underline">
                  View all Beaver County lenders →
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
            <LeadCaptureForm stateName="Greater Pittsburgh" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/pennsylvania/philadelphia-metro-area-collar-counties" className="text-[#14B8A6] hover:underline">Philadelphia Metro Hub →</Link></li>
                <li><Link href="/local-lenders/pennsylvania/central-eastern-pa-affordability-havens" className="text-[#14B8A6] hover:underline">Central/Eastern PA Hub →</Link></li>
                <li><Link href="/local-lenders/new-york/upstate-powerhouses-buffalo-albany" className="text-[#14B8A6] hover:underline">Upstate NY Powerhouses Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Greater Pittsburgh" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}