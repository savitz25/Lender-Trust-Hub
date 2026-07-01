import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { DENVER_OUTER_RINGS_HUB_AREAS, DENVER_OUTER_RINGS_HUB_COUNTIES, DENVER_OUTER_RINGS_LENDER_SLUGS } from '@/lib/mortgage/coloradoLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Denver Metro Outer Rings & North Suburbs Mortgage Lenders — Erie, Parker & Lafayette (2026)',
  description:
    'NMLS-verified mortgage lenders in Denver Metro outer rings. Erie and Parker master-planned new construction, Lafayette and Louisville top schools, Centennial family suburbs, and bidding-war-free suburban financing.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/colorado/denver-metro-outer-rings-north-suburbs' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function DenverMetroOuterRingsNorthSuburbsHubPage() {
  const hubLenders = DENVER_OUTER_RINGS_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Colorado', href: '/local-lenders/colorado' }, { label: 'Denver Metro Outer Rings & North Suburbs Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-violet-400/40 bg-violet-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Master-Planned &amp; Schools · Adams, Boulder &amp; Douglas Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Denver Metro Outer Rings &amp; North Suburbs</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Erie, Parker, Centennial, Lafayette, and Louisville lenders for master-planned new construction,
            top-tier school districts, and family-friendly suburbs beyond Denver urban-core bidding wars.
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
                {DENVER_OUTER_RINGS_HUB_COUNTIES.map((c) => (
                  <Link key={c.slug} href={`/local-lenders/colorado/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-violet-400">
                    <span className="font-semibold text-[#0A2540]">{c.name} County</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section>
              <h2 className="mb-4 text-xl font-bold text-[#0A2540]">Key Markets</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {DENVER_OUTER_RINGS_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/colorado/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-violet-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Denver Outer Rings &amp; North Suburbs Are Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Transactional volume shifting to Erie and Parker master-planned communities with modern layouts</li>
                <li>Lafayette and Louisville offer top-tier schools and tech-corridor access without urban-core premiums</li>
                <li>Centennial and Parker family suburbs avoid intense Denver proper bidding wars</li>
                <li>Steady new-construction inventory increases demand for construction-to-permanent specialists</li>
                <li>Corporate and family relocations drive move-up and VA program volume in outer rings</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Denver Metro Outer Rings</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Denver Metro Outer Rings" />
                  )
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/colorado/adams" className="text-[#3B82F6] hover:underline">Adams County →</Link>
                {' · '}
                <Link href="/local-lenders/colorado/boulder" className="text-[#3B82F6] hover:underline">Boulder County →</Link>
                {' · '}
                <Link href="/local-lenders/colorado/douglas" className="text-[#3B82F6] hover:underline">Douglas County →</Link>
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
            <LeadCaptureForm stateName="Denver Metro Outer Rings" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/california/silicon-valley-spine" className="text-[#14B8A6] hover:underline">Silicon Valley Spine Hub →</Link></li>
                <li><Link href="/local-lenders/arizona/west-valley-boomtowns" className="text-[#14B8A6] hover:underline">West Valley Boomtowns Hub →</Link></li>
                <li><Link href="/local-lenders/tennessee/greater-nashville-metro" className="text-[#14B8A6] hover:underline">Greater Nashville Metro Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Denver Metro Outer Rings" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}