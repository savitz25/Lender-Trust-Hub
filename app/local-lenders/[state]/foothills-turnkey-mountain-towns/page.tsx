import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { FOOTHILLS_MOUNTAIN_HUB_AREAS, FOOTHILLS_MOUNTAIN_HUB_COUNTIES, FOOTHILLS_MOUNTAIN_LENDER_SLUGS } from '@/lib/mortgage/coloradoLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Foothills & Turnkey Mountain Towns Mortgage Lenders — Evergreen & Steamboat, CO (2026)',
  description:
    'NMLS-verified mortgage lenders in Colorado foothills and mountain towns. Evergreen, Golden, Conifer luxury acreage, Steamboat Springs resort financing, jumbo loans, and affluent out-of-state lifestyle migration.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/colorado/foothills-turnkey-mountain-towns' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function FoothillsTurnkeyMountainTownsHubPage() {
  const hubLenders = FOOTHILLS_MOUNTAIN_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Colorado', href: '/local-lenders/colorado' }, { label: 'Foothills & Mountain Towns Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Luxury &amp; Lifestyle · Jefferson &amp; Routt Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Foothills &amp; Turnkey Mountain Towns</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Evergreen, Golden, Conifer, and Steamboat Springs lenders for premium mountain modern homes,
            acreage privacy, Denver commuter access, and affluent out-of-state lifestyle migration.
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
                {FOOTHILLS_MOUNTAIN_HUB_COUNTIES.map((c) => (
                  <Link key={c.slug} href={`/local-lenders/colorado/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-indigo-400">
                    <span className="font-semibold text-[#0A2540]">{c.name} County</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section>
              <h2 className="mb-4 text-xl font-bold text-[#0A2540]">Key Markets</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {FOOTHILLS_MOUNTAIN_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/colorado/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-indigo-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Foothills &amp; Mountain Towns Are Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Explosive sales-price growth driven by affluent Texas, California, and Florida lifestyle migration</li>
                <li>Evergreen and Conifer offer mountain acreage privacy with Denver commuter pipeline access</li>
                <li>Steamboat Springs turnkey mountain modern homes attract cash-heavy resort-tier buyers</li>
                <li>Golden foothills combine tech-corridor proximity with premium school-driven demand</li>
                <li>Jumbo, portfolio, and mountain-specific underwriting require specialized local lenders</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Foothills &amp; Mountain Towns</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Foothills & Mountain Towns" />
                  )
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/colorado/jefferson" className="text-[#3B82F6] hover:underline">Jefferson County →</Link>
                {' · '}
                <Link href="/local-lenders/colorado/routt" className="text-[#3B82F6] hover:underline">Routt County →</Link>
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
            <LeadCaptureForm stateName="Foothills & Mountain Towns" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/colorado/denver-metro-outer-rings-north-suburbs" className="text-[#14B8A6] hover:underline">Denver Metro Outer Rings Hub →</Link></li>
                <li><Link href="/local-lenders/colorado/colorado-springs-stability-volume" className="text-[#14B8A6] hover:underline">Colorado Springs Hub →</Link></li>
                <li><Link href="/local-lenders/california/silicon-valley-spine" className="text-[#14B8A6] hover:underline">Silicon Valley Spine Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Foothills & Mountain Towns" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}