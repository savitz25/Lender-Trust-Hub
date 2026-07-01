import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { TRANSIT_ORIENTED_URBAN_HOTSPOTS_HUB_AREAS, TRANSIT_ORIENTED_URBAN_HOTSPOTS_LENDER_SLUGS } from '@/lib/mortgage/massachusettsLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Cambridge & Somerville Mortgage Lenders — Transit-Oriented Urban Hotspots, Middlesex (2026)',
  description:
    'NMLS-verified mortgage lenders in Cambridge and Somerville. Green Line extension impact, tech/biotech and higher education professionals, $930K+ Somerville and $1M+ Cambridge medians, and fierce transit-oriented demand.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/massachusetts/transit-oriented-urban-hotspots-somerville-cambridge' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function TransitOrientedUrbanHotspotsHubPage() {
  const hubLenders = TRANSIT_ORIENTED_URBAN_HOTSPOTS_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Massachusetts', href: '/local-lenders/massachusetts' }, { label: 'Cambridge & Somerville Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Transit-Oriented Urban · Cambridge &amp; Somerville
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Cambridge &amp; Somerville</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Middlesex County lenders for perennially hot transit-oriented urban cores — Green Line extension demand,
            tech/biotech and higher education professionals, and premium walkable neighborhoods.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Middlesex Urban Core — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {TRANSIT_ORIENTED_URBAN_HOTSPOTS_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/massachusetts/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-sky-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Cambridge &amp; Somerville Are Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Green Line extension continuously drives up demand near new Somerville transit stations</li>
                <li>Tech/biotech and higher education professionals fuel fierce competition for walkable urban stock</li>
                <li>$930K+ Somerville and $1M+ Cambridge medians require jumbo-ready lender expertise</li>
                <li>Modern condos and renovated rowhomes dominate premium transit-adjacent inventory</li>
                <li>Perennially hot markets reward lenders who close fast on limited urban core listings</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Cambridge &amp; Somerville</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Cambridge & Somerville" />
                  )
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/massachusetts/middlesex" className="text-[#3B82F6] hover:underline">
                  View all Middlesex County lenders →
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
            <LeadCaptureForm stateName="Cambridge & Somerville" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/massachusetts/worcester-undisputed-growth-leader" className="text-[#14B8A6] hover:underline">Worcester Growth Leader Hub →</Link></li>
                <li><Link href="/local-lenders/district-of-columbia/high-velocity-mid-city-core" className="text-[#14B8A6] hover:underline">Mid-City Core Hub →</Link></li>
                <li><Link href="/local-lenders/colorado/denver-metro-outer-rings-north-suburbs" className="text-[#14B8A6] hover:underline">Denver Outer Rings Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Cambridge & Somerville" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}