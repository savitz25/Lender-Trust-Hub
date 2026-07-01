import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { GATEWAY_CITIES_HUB_AREAS, GATEWAY_CITIES_SUBURBAN_ALTERNATIVES_LENDER_SLUGS } from '@/lib/mortgage/massachusettsLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Gateway Cities Mortgage Lenders — Lowell, Lynn, Revere & Malden (2026)',
  description:
    'NMLS-verified mortgage lenders in Lowell, Lynn, Revere, and Malden. Boston spillover affordability, Orange and Blue Line transit access, and sharp competitiveness in gateway city safety valves.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/massachusetts/gateway-cities-suburban-alternatives' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function GatewayCitiesSuburbanAlternativesHubPage() {
  const hubLenders = GATEWAY_CITIES_SUBURBAN_ALTERNATIVES_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Massachusetts', href: '/local-lenders/massachusetts' }, { label: 'Gateway Cities Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Gateway Cities · Lowell / Lynn / Revere / Malden
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Gateway Cities</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Lowell, Lynn, Revere, and Malden lenders for Boston-priced-out buyers — urban amenities,
            strong commuting transit, and significantly lower pricing than Boston proper.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Gateway Cities — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {GATEWAY_CITIES_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/massachusetts/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-emerald-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Gateway Cities Are Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Safety-valve markets for buyers priced out of immediate Boston metro pricing</li>
                <li>Lowell and Lynn offer urban amenities with commuter rail and transit connections</li>
                <li>Revere and Malden provide Blue and Orange Line access with northward migration demand</li>
                <li>Sharp rises in competitiveness reward lenders who close quickly on gateway inventory</li>
                <li>Fraction of Boston costs with strong transit-oriented development momentum</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Gateway Cities</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Gateway Cities MA" />
                  )
                ))}
              </div>
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
            <LeadCaptureForm stateName="Gateway Cities MA" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/massachusetts/high-demand-boston-neighborhoods" className="text-[#14B8A6] hover:underline">Boston Neighborhoods Hub →</Link></li>
                <li><Link href="/local-lenders/massachusetts/metrowest-bread-and-butter-markets" className="text-[#14B8A6] hover:underline">MetroWest Hub →</Link></li>
                <li><Link href="/local-lenders/massachusetts/worcester-undisputed-growth-leader" className="text-[#14B8A6] hover:underline">Worcester Growth Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Gateway Cities MA" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}