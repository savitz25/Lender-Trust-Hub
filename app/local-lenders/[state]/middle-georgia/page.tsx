import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { MIDDLE_GEORGIA_HUB_COUNTIES } from '@/lib/mortgage/georgiaLenders';
import { getLendersByCounty } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Middle Georgia Mortgage Lenders — Augusta & Columbus / Fort Moore (2026)',
  description:
    'NMLS-verified mortgage lenders in Middle Georgia. Fort Eisenhower military and cyber relocations, Augusta CSRA VA specialists, Columbus first-time buyers, and Fort Moore renovation loans.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/georgia/middle-georgia' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function MiddleGeorgiaHubPage() {
  const richmondLenders = getLendersByCounty('georgia', 'richmond');
  const muscogeeLenders = getLendersByCounty('georgia', 'muscogee');

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Mortgage Lenders', href: '/local-lenders' },
            { label: 'Georgia', href: '/local-lenders/georgia' },
            { label: 'Middle Georgia Hub' },
          ]}
        />
      </div>

      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-violet-400/40 bg-violet-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Zero Paid Placements · Augusta &amp; Columbus Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">
            Trusted Mortgage Lenders — Middle Georgia
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Augusta CSRA and Columbus metro lenders with Fort Eisenhower cyber relocations,
            Fort Moore VA expertise, new construction, and first-time buyer programs.
          </p>
          <div className="mt-6">
            <SearchBar className="mx-auto max-w-md" />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Counties — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {MIDDLE_GEORGIA_HUB_COUNTIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/local-lenders/georgia/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-[#8B5CF6]"
                  >
                    <span className="font-semibold text-[#0A2540]">{c.name} County</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Middle Georgia Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Fort Eisenhower drives military and cybersecurity contractor relocation volume in the CSRA</li>
                <li>Evans and Grovetown new construction needs early rate locks during builder contracts</li>
                <li>Columbus sees double-digit price growth in the $180K–$280K first-time buyer range</li>
                <li>Fort Moore VA buyers need BAH-matched loans and deployment-flexible timelines</li>
                <li>Historic Columbus homes benefit from single-close renovation mortgage products</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">
                Augusta / Richmond County — 3 Lenders
              </h2>
              <div className="space-y-4">
                {richmondLenders.map((lender, i) => (
                  <LenderCard
                    key={lender.id}
                    lender={lender}
                    rank={i + 1}
                    countyLabel="Richmond County"
                  />
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/georgia/richmond" className="text-[#3B82F6] hover:underline">
                  View all {richmondLenders.length} Richmond County lenders →
                </Link>
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">
                Columbus / Muscogee County — 2 Lenders
              </h2>
              <div className="space-y-4">
                {muscogeeLenders.map((lender, i) => (
                  <LenderCard
                    key={lender.id}
                    lender={lender}
                    rank={i + 1}
                    countyLabel="Muscogee County"
                  />
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/georgia/muscogee" className="text-[#3B82F6] hover:underline">
                  View all {muscogeeLenders.length} Muscogee County lenders →
                </Link>
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-bold text-[#0A2540]">Free Calculators</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {CALCULATORS.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    className="rounded-xl border border-zinc-200 bg-white p-4 text-sm font-medium hover:border-[#3B82F6]"
                  >
                    {c.label} →
                  </Link>
                ))}
              </div>
            </section>

            <LeadCaptureForm
              stateName="Middle Georgia"
              categoryId="mortgage"
              variant="state-page-v2"
            />
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/local-lenders/georgia/coastal-savannah" className="text-[#14B8A6] hover:underline">
                    Coastal Savannah Hub →
                  </Link>
                </li>
                <li>
                  <Link href="/local-lenders/georgia/metro-outer-ring" className="text-[#14B8A6] hover:underline">
                    Metro Outer Ring Hub →
                  </Link>
                </li>
                <li>
                  <Link href="/local-lenders/georgia/north-atlanta" className="text-[#14B8A6] hover:underline">
                    North Atlanta Hub →
                  </Link>
                </li>
              </ul>
            </div>
            <LeadCaptureForm
              stateName="Middle Georgia"
              categoryId="mortgage"
              variant="sidebar-minimal"
            />
          </aside>
        </div>
      </div>
    </>
  );
}