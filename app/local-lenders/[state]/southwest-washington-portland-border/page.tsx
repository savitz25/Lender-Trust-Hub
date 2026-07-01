import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { SOUTHWEST_WA_PORTLAND_BORDER_HUB_AREAS, SOUTHWEST_WA_PORTLAND_BORDER_LENDER_SLUGS } from '@/lib/mortgage/washingtonLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Vancouver Mortgage Lenders — Southwest Washington / Portland Border, Clark County (2026)',
  description:
    'NMLS-verified mortgage lenders in Clark County. Tax-advantage relocation, waterfront revitalization, remote workers and retirees, cross-river commuters, and Portland cost-of-living spillover in Vancouver.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/washington/southwest-washington-portland-border' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function SouthwestWaPortlandBorderHubPage() {
  const hubLenders = SOUTHWEST_WA_PORTLAND_BORDER_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Washington', href: '/local-lenders/washington' }, { label: 'Portland Border Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Tax Advantage &amp; Waterfront · Clark County Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Vancouver / Portland Border</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Vancouver lenders for tax-haven lifestyle migration, downtown waterfront revitalization,
            and high transactional volume from remote workers, retirees, and Portland spillover buyers.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Southwest Washington — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {SOUTHWEST_WA_PORTLAND_BORDER_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/washington/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-indigo-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Vancouver Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>No Washington income tax plus Oregon sales-tax shopping creates a unique tax-haven financial setup</li>
                <li>Massive downtown Vancouver waterfront revitalization drives urban-infill lending demand</li>
                <li>Remote workers, retirees, and families flee Portland&apos;s higher cost of living across the Columbia River</li>
                <li>High transactional volume from Portland spillover requires fast-closing broker expertise</li>
                <li>Columbia River access and lifestyle appeal anchor one of the PNW&apos;s fastest-growing border markets</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Vancouver</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Vancouver" />
                  )
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/washington/clark" className="text-[#3B82F6] hover:underline">
                  View all Clark County lenders →
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
            <LeadCaptureForm stateName="Vancouver" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/washington/snohomish-transit-corridor" className="text-[#14B8A6] hover:underline">Snohomish Transit Corridor Hub →</Link></li>
                <li><Link href="/local-lenders/washington/south-sound-tacoma-puyallup" className="text-[#14B8A6] hover:underline">South Sound Hub →</Link></li>
                <li><Link href="/local-lenders/california/inland-empire-affordability-magnets" className="text-[#14B8A6] hover:underline">Inland Empire Affordability Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Vancouver" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}