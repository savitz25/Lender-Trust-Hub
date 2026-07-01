import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { DFW_SILICON_PRAIRIE_HUB_AREAS, DFW_SILICON_PRAIRIE_HUB_COUNTIES, DFW_SILICON_PRAIRIE_LENDER_SLUGS } from '@/lib/mortgage/texasLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'DFW Suburbs & Silicon Prairie Mortgage Lenders — Frisco, McKinney & Sherman (2026)',
  description:
    'NMLS-verified mortgage lenders in North Texas Silicon Prairie. Frisco and McKinney corporate relocations, Prosper master-planned new construction, Sherman-Denison Texas Instruments workforce housing, and high-transaction suburban boom financing.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/texas/dfw-suburbs-silicon-prairie' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function DfwSuburbsSiliconPrairieHubPage() {
  const hubLenders = DFW_SILICON_PRAIRIE_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Texas', href: '/local-lenders/texas' }, { label: 'DFW Suburbs & Silicon Prairie Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-red-400/40 bg-red-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Corporate Relocations · Collin, Denton &amp; Grayson Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — DFW Suburbs &amp; Silicon Prairie</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Frisco, McKinney, Prosper, and Sherman-Denison lenders for the endless wave of corporate relocations,
            Texas Instruments manufacturing corridor, and master-planned suburban transactional boom.
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
                {DFW_SILICON_PRAIRIE_HUB_COUNTIES.map((c) => (
                  <Link key={c.slug} href={`/local-lenders/texas/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-red-400">
                    <span className="font-semibold text-[#0A2540]">{c.name} County</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section>
              <h2 className="mb-4 text-xl font-bold text-[#0A2540]">Key Markets</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {DFW_SILICON_PRAIRIE_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/texas/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-red-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why DFW Silicon Prairie Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Endless corporate relocation wave shifting volume north from Dallas proper</li>
                <li>Texas Instruments and manufacturing/tech expansions drive Sherman-Denison workforce housing</li>
                <li>Frisco, McKinney, and Prosper master-planned communities fuel new-construction demand</li>
                <li>Infrastructure expansions support explosive suburban transactional growth</li>
                <li>Fast-closing brokers win competitive offers in the Silicon Prairie equity-gain corridor</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — DFW Suburbs &amp; Silicon Prairie</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="DFW Silicon Prairie" />
                  )
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/texas/collin" className="text-[#3B82F6] hover:underline">Collin County →</Link>
                {' · '}
                <Link href="/local-lenders/texas/denton" className="text-[#3B82F6] hover:underline">Denton County →</Link>
                {' · '}
                <Link href="/local-lenders/texas/grayson" className="text-[#3B82F6] hover:underline">Grayson County →</Link>
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
            <LeadCaptureForm stateName="DFW Silicon Prairie" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/colorado/denver-metro-outer-rings-north-suburbs" className="text-[#14B8A6] hover:underline">Denver Metro Outer Rings Hub →</Link></li>
                <li><Link href="/local-lenders/georgia/north-atlanta" className="text-[#14B8A6] hover:underline">North Atlanta Hub →</Link></li>
                <li><Link href="/local-lenders/arizona/southeast-valley-pinal-border" className="text-[#14B8A6] hover:underline">Southeast Valley Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="DFW Silicon Prairie" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}