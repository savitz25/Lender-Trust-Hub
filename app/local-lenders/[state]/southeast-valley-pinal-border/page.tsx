import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { SOUTHEAST_VALLEY_HUB_AREAS, SOUTHEAST_VALLEY_LENDER_SLUGS } from '@/lib/mortgage/arizonaLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Southeast Valley Mortgage Lenders — Queen Creek & San Tan Valley, AZ (2026)',
  description:
    'NMLS-verified mortgage lenders on the Maricopa/Pinal border. Queen Creek new construction, San Tan Valley family spillover, 50%+ growth, and accessible East Valley financing.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/arizona/southeast-valley-pinal-border' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function SoutheastValleyPinalBorderHubPage() {
  const hubLenders = SOUTHEAST_VALLEY_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Arizona', href: '/local-lenders/arizona' }, { label: 'Southeast Valley & Pinal Border Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-teal-400/40 bg-teal-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Family-Centric Growth · Queen Creek Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Southeast Valley &amp; Pinal Border</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Queen Creek and San Tan Valley lenders for 50%+ population surge, Queen Creek Marketplace,
            premium suburban amenities, and affordable new-construction spillover on the Maricopa/Pinal line.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Areas — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {SOUTHEAST_VALLEY_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/arizona/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-teal-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Southeast Valley Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Queen Creek and San Tan Valley lead Arizona with 50%+ population growth corridors</li>
                <li>Queen Creek Marketplace and new schools drive premium suburban amenity demand</li>
                <li>San Tan Valley offers more affordable new-construction spillover on the Pinal border</li>
                <li>Tech and infrastructure expansions attract family relocations from central Phoenix</li>
                <li>Fast-closing brokers win competitive offers in high-transaction master-planned communities</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Southeast Valley &amp; Pinal Border</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Southeast Valley & Pinal Border" />
                  )
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/arizona/maricopa" className="text-[#3B82F6] hover:underline">Maricopa County →</Link>
                {' · '}
                <Link href="/local-lenders/arizona/pinal" className="text-[#3B82F6] hover:underline">Pinal County →</Link>
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
            <LeadCaptureForm stateName="Southeast Valley & Pinal Border" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/arizona/west-valley-boomtowns" className="text-[#14B8A6] hover:underline">West Valley Boomtowns Hub →</Link></li>
                <li><Link href="/local-lenders/tennessee/greater-nashville-metro" className="text-[#14B8A6] hover:underline">Greater Nashville Metro Hub →</Link></li>
                <li><Link href="/local-lenders/florida/central-florida" className="text-[#14B8A6] hover:underline">Central Florida Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Southeast Valley & Pinal Border" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}