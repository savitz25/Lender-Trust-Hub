import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { COLORADO_SPRINGS_HUB_AREAS, COLORADO_SPRINGS_LENDER_SLUGS } from '@/lib/mortgage/coloradoLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Colorado Springs Mortgage Lenders — Stability & Volume Leader, El Paso County (2026)',
  description:
    'NMLS-verified mortgage lenders in Colorado Springs. Military and defense financing, aerospace/tech relocations, Fountain and Falcon new construction, Ent Credit Union member rates, and Denver affordability safety valve.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/colorado/colorado-springs-stability-volume' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function ColoradoSpringsStabilityVolumeHubPage() {
  const hubLenders = COLORADO_SPRINGS_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Colorado', href: '/local-lenders/colorado' }, { label: 'Colorado Springs Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-teal-400/40 bg-teal-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Military &amp; Defense · El Paso County Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Colorado Springs</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Colorado Springs, Fountain, and Falcon lenders for military infrastructure, aerospace and tech growth,
            steady high-volume transactions, and relative affordability as a Denver safety valve.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Colorado Springs Metro — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {COLORADO_SPRINGS_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/colorado/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-teal-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Colorado Springs Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Stability and volume leader with balanced purchase and refinance activity year-round</li>
                <li>Strong military and defense infrastructure drives VA and Fountain/Falcon demand</li>
                <li>Aerospace and tech job growth supports steady northeast suburban relocations</li>
                <li>Falcon master-planned new construction absorbs consistent build-to-buy volume</li>
                <li>Relative affordability vs. Denver makes El Paso County a reliable safety valve metro</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Colorado Springs</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Colorado Springs" />
                  )
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/colorado/el-paso" className="text-[#3B82F6] hover:underline">
                  View all El Paso County lenders →
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
            <LeadCaptureForm stateName="Colorado Springs" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/colorado/denver-metro-outer-rings-north-suburbs" className="text-[#14B8A6] hover:underline">Denver Metro Outer Rings Hub →</Link></li>
                <li><Link href="/local-lenders/california/central-valley-alternatives" className="text-[#14B8A6] hover:underline">Central Valley Alternatives Hub →</Link></li>
                <li><Link href="/local-lenders/arizona/west-valley-boomtowns" className="text-[#14B8A6] hover:underline">West Valley Boomtowns Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Colorado Springs" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}