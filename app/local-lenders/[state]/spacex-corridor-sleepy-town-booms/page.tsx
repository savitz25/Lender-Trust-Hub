import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { SPACEX_CORRIDOR_HUB_AREAS, SPACEX_CORRIDOR_HUB_COUNTIES, SPACEX_CORRIDOR_LENDER_SLUGS } from '@/lib/mortgage/texasLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'SpaceX Corridor Mortgage Lenders — Bastrop & Brownsville Sleepy Town Booms (2026)',
  description:
    'NMLS-verified mortgage lenders in the SpaceX Corridor. Bastrop SpaceX/Starlink relocations, Brownsville Starbase workforce housing, engineering tech workers, rural-to-boom financing, and hyper-dense employment hub transitions.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/texas/spacex-corridor-sleepy-town-booms' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function SpacexCorridorSleepyTownBoomsHubPage() {
  const hubLenders = SPACEX_CORRIDOR_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Texas', href: '/local-lenders/texas' }, { label: 'SpaceX Corridor Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Tech &amp; Starbase · Bastrop &amp; Cameron Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — SpaceX Corridor</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Bastrop and Brownsville lenders for SpaceX ecosystem workers, Starbase development,
            engineering relocations, and sleepy towns transforming into hyper-dense employment hubs.
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
                {SPACEX_CORRIDOR_HUB_COUNTIES.map((c) => (
                  <Link key={c.slug} href={`/local-lenders/texas/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-cyan-400">
                    <span className="font-semibold text-[#0A2540]">{c.name} County</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section>
              <h2 className="mb-4 text-xl font-bold text-[#0A2540]">Key Markets</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {SPACEX_CORRIDOR_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/texas/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-cyan-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why the SpaceX Corridor Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>SpaceX, Starlink, and Boring Company jobs transform Bastrop from rural to employment hub</li>
                <li>Starbase drives immense transactional velocity in Brownsville and Southmost</li>
                <li>High-earning engineering workers create jumbo and workforce housing demand</li>
                <li>Rural affordability rapidly shifting to hyper-dense boomtown dynamics</li>
                <li>Fast-closing brokers essential for industrial job creation pressure in both counties</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — SpaceX Corridor</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="SpaceX Corridor" />
                  )
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/texas/bastrop" className="text-[#3B82F6] hover:underline">Bastrop County →</Link>
                {' · '}
                <Link href="/local-lenders/texas/cameron" className="text-[#3B82F6] hover:underline">Cameron County →</Link>
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
            <LeadCaptureForm stateName="SpaceX Corridor" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/texas/dfw-suburbs-silicon-prairie" className="text-[#14B8A6] hover:underline">DFW Silicon Prairie Hub →</Link></li>
                <li><Link href="/local-lenders/texas/greater-houston-metro" className="text-[#14B8A6] hover:underline">Greater Houston Metro Hub →</Link></li>
                <li><Link href="/local-lenders/california/silicon-valley-spine" className="text-[#14B8A6] hover:underline">Silicon Valley Spine Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="SpaceX Corridor" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}