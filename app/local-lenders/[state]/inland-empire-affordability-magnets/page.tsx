import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { INLAND_EMPIRE_HUB_AREAS, INLAND_EMPIRE_LENDER_SLUGS } from '@/lib/mortgage/californiaLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Inland Empire Affordability Magnets Mortgage Lenders — Riverside & Moreno Valley, CA (2026)',
  description:
    'NMLS-verified mortgage lenders in the Inland Empire affordability corridor. Middle-income family financing, logistics-worker relocations, $625K–$710K medians, new construction, and fast closings in Riverside County.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/california/inland-empire-affordability-magnets' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function InlandEmpireAffordabilityMagnetsHubPage() {
  const hubLenders = INLAND_EMPIRE_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'California', href: '/local-lenders/california' }, { label: 'Inland Empire Affordability Magnets Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · SoCal Affordability Valve · Riverside County Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Inland Empire Affordability Magnets</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Riverside and Moreno Valley lenders for logistics job growth, coastal spillover demand,
            master-planned new homes, and middle-income families in California&apos;s high-transaction inland corridor.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Inland Empire — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {INLAND_EMPIRE_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/california/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-amber-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Inland Empire Affordability Magnets Are Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>SoCal&apos;s affordability safety valve with 50%+ spillover from coastal priced-out buyers</li>
                <li>$625K–$710K medians attract middle-income families and logistics/distribution workers</li>
                <li>Massive transactional volume with compressed timelines in Riverside and Moreno Valley</li>
                <li>Master-planned and distribution-adjacent new construction drives builder-lender demand</li>
                <li>Community credit unions and fast-closing brokers compete in high-volume purchase corridors</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Inland Empire Affordability Magnets</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Inland Empire Affordability Magnets" />
                  )
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/california/riverside" className="text-[#3B82F6] hover:underline">
                  View all Riverside County lenders →
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
            <LeadCaptureForm stateName="Inland Empire Affordability Magnets" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/california/silicon-valley-spine" className="text-[#14B8A6] hover:underline">Silicon Valley Spine Hub →</Link></li>
                <li><Link href="/local-lenders/arizona/southeast-valley-pinal-border" className="text-[#14B8A6] hover:underline">Southeast Valley &amp; Pinal Border Hub →</Link></li>
                <li><Link href="/local-lenders/arizona/west-valley-boomtowns" className="text-[#14B8A6] hover:underline">West Valley Boomtowns Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Inland Empire Affordability Magnets" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}