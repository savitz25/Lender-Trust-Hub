import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { GREATER_HOUSTON_HUB_AREAS, GREATER_HOUSTON_HUB_COUNTIES, GREATER_HOUSTON_LENDER_SLUGS } from '@/lib/mortgage/texasLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Greater Houston Metro Mortgage Lenders — Katy, The Woodlands & Sugar Land (2026)',
  description:
    'NMLS-verified mortgage lenders in Greater Houston Metro. Katy and Conroe master-planned communities, The Woodlands top schools, Sugar Land medical sector, energy and VA programs, and resilient suburban financing.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/texas/greater-houston-metro' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function GreaterHoustonMetroHubPage() {
  const hubLenders = GREATER_HOUSTON_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Texas', href: '/local-lenders/texas' }, { label: 'Greater Houston Metro Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-orange-400/40 bg-orange-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Resilient Suburbs · Harris, Fort Bend &amp; Montgomery Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Greater Houston Metro</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Katy, The Woodlands, Sugar Land, and Conroe lenders for master-planned community absorption,
            top-rated school districts, medical and energy sector jobs, and positive year-over-year suburban growth.
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
                {GREATER_HOUSTON_HUB_COUNTIES.map((c) => (
                  <Link key={c.slug} href={`/local-lenders/texas/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-orange-400">
                    <span className="font-semibold text-[#0A2540]">{c.name} County</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section>
              <h2 className="mb-4 text-xl font-bold text-[#0A2540]">Key Markets</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {GREATER_HOUSTON_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/texas/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-orange-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Greater Houston Metro Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Texas stability leader with positive year-over-year appreciation in suburban corridors</li>
                <li>Katy and Conroe master-planned communities drive high-absorption new-build demand</li>
                <li>The Woodlands and Sugar Land offer top-rated schools at manageable price points</li>
                <li>Medical center and energy sector jobs support diverse relocation financing needs</li>
                <li>Fast-closing brokers win competitive offers in resilient family suburban markets</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Greater Houston Metro</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Greater Houston Metro" />
                  )
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/texas/harris" className="text-[#3B82F6] hover:underline">Harris County →</Link>
                {' · '}
                <Link href="/local-lenders/texas/fort-bend" className="text-[#3B82F6] hover:underline">Fort Bend County →</Link>
                {' · '}
                <Link href="/local-lenders/texas/montgomery" className="text-[#3B82F6] hover:underline">Montgomery County →</Link>
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
            <LeadCaptureForm stateName="Greater Houston Metro" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/texas/dfw-suburbs-silicon-prairie" className="text-[#14B8A6] hover:underline">DFW Silicon Prairie Hub →</Link></li>
                <li><Link href="/local-lenders/colorado/denver-metro-outer-rings-north-suburbs" className="text-[#14B8A6] hover:underline">Denver Metro Outer Rings Hub →</Link></li>
                <li><Link href="/local-lenders/florida/tampa-bay" className="text-[#14B8A6] hover:underline">Tampa Bay Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Greater Houston Metro" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}