import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { COASTAL_SAVANNAH_HUB_COUNTIES } from '@/lib/mortgage/georgiaLenders';
import { getLendersByCounty } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Coastal Savannah Mortgage Lenders — Chatham County, Pooler & Port Relocations (2026)',
  description:
    'NMLS-verified mortgage lenders in Coastal Savannah. Native leadership teams, VA/military relocations, flood zone expertise, Pooler new construction, and Port of Savannah industrial buyer programs.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/georgia/coastal-savannah' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function CoastalSavannahHubPage() {
  const chathamLenders = getLendersByCounty('georgia', 'chatham');

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Mortgage Lenders', href: '/local-lenders' },
            { label: 'Georgia', href: '/local-lenders/georgia' },
            { label: 'Coastal Savannah Hub' },
          ]}
        />
      </div>

      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-teal-400/40 bg-teal-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Zero Paid Placements · Chatham County Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">
            Trusted Mortgage Lenders — Coastal Savannah
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Savannah, Pooler, Rincon, and Chatham County lenders with port relocation expertise,
            coastal flood insurance navigation, and fast-tracked new-construction financing.
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
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Chatham County — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {COASTAL_SAVANNAH_HUB_COUNTIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={
                      c.slug === 'chatham'
                        ? '/local-lenders/georgia/chatham'
                        : `/local-lenders/georgia/${c.slug}`
                    }
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-[#14B8A6]"
                  >
                    <span className="font-semibold text-[#0A2540]">{c.name} County</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Coastal Savannah Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Port of Savannah and Hyundai Metaplant drive industrial relocation volume</li>
                <li>Flood zone insurance requirements differ sharply from inland Atlanta markets</li>
                <li>Pooler and Rincon subdivisions sell in days — fast pre-approvals win offers</li>
                <li>Historic Savannah homes need specialized appraisal and insurance coordination</li>
                <li>VA and military families need local teams who understand timeline shifts</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">
                Top Verified Lenders in Chatham County
              </h2>
              <div className="space-y-4">
                {chathamLenders.map((lender, i) => (
                  <LenderCard
                    key={lender.id}
                    lender={lender}
                    rank={i + 1}
                    countyLabel="Chatham County"
                  />
                ))}
              </div>
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
              stateName="Coastal Savannah"
              categoryId="mortgage"
              variant="state-page-v2"
            />
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
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
                <li>
                  <Link href="/calculators" className="text-[#14B8A6] hover:underline">
                    Mortgage Calculators →
                  </Link>
                </li>
              </ul>
            </div>
            <LeadCaptureForm
              stateName="Coastal Savannah"
              categoryId="mortgage"
              variant="sidebar-minimal"
            />
          </aside>
        </div>
      </div>
    </>
  );
}