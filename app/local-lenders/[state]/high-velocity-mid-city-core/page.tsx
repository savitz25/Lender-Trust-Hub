import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { HIGH_VELOCITY_MID_CITY_CORE_HUB_AREAS, HIGH_VELOCITY_MID_CITY_CORE_LENDER_SLUGS } from '@/lib/mortgage/districtOfColumbiaLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Mid-City DC Mortgage Lenders — Logan Circle & Thomas Circle, Zip 20005 (2026)',
  description:
    'NMLS-verified mortgage lenders in DC Zip 20005. Historic rowhome and premium condo financing, Logan Circle and Thomas Circle, 14th Street corridor, ironclad demand, capped inventory, and nearly 13% price jumps.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/district-of-columbia/high-velocity-mid-city-core' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function HighVelocityMidCityCoreHubPage() {
  const hubLenders = HIGH_VELOCITY_MID_CITY_CORE_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'District of Columbia', href: '/local-lenders/district-of-columbia' }, { label: 'Mid-City Core Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-violet-400/40 bg-violet-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · High-Velocity Urban · Zip 20005 · Logan Circle &amp; Thomas Circle
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Mid-City Core DC</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Logan Circle and Thomas Circle lenders for renovated historic rowhomes and premium condos,
            14th Street corridor lifestyle, and quick premium sales in capped-inventory Zip 20005.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Mid-City Core — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {HIGH_VELOCITY_MID_CITY_CORE_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/district-of-columbia/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-violet-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Mid-City Core Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Ironclad demand for renovated historic rowhomes and premium turn-key condos</li>
                <li>Logan Circle and Thomas Circle anchor walkable, nightlife-adjacent urban core living</li>
                <li>14th Street corridor draws high-earning young professionals, lobbyists, and tech transplants</li>
                <li>Structurally capped inventory drives nearly 13% price jumps and quick premium sales</li>
                <li>Zip 20005 lenders must handle fast closings on limited mid-city stock</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Mid-City Core</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Mid-City DC" />
                  )
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/district-of-columbia/district-of-columbia" className="text-[#3B82F6] hover:underline">
                  View all District of Columbia lenders →
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
            <LeadCaptureForm stateName="Mid-City DC" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/district-of-columbia/upper-northwest-value-surge" className="text-[#14B8A6] hover:underline">Upper Northwest Value Surge Hub →</Link></li>
                <li><Link href="/local-lenders/district-of-columbia/first-time-buyer-waterfront-hubs" className="text-[#14B8A6] hover:underline">First-Time Buyer &amp; Waterfront Hubs →</Link></li>
                <li><Link href="/local-lenders/washington/snohomish-transit-corridor" className="text-[#14B8A6] hover:underline">Snohomish Transit Corridor Hub →</Link></li>
                <li><Link href="/local-lenders/texas/san-antonio-value-play" className="text-[#14B8A6] hover:underline">San Antonio Value Play Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Mid-City DC" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}