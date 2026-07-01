import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { FIRST_TIME_BUYER_WATERFRONT_HUBS_AREAS, FIRST_TIME_BUYER_WATERFRONT_HUBS_LENDER_SLUGS } from '@/lib/mortgage/districtOfColumbiaLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Brookland & Navy Yard Mortgage Lenders — First-Time Buyer & Waterfront Hubs (2026)',
  description:
    'NMLS-verified mortgage lenders in DC Brookland and Navy Yard. First-time buyer entry-level rowhomes, modern waterfront condos with luxury amenities, Little Rome arts district, Capitol Riverfront, and high-transactional volume for younger buyers.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/district-of-columbia/first-time-buyer-waterfront-hubs' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function FirstTimeBuyerWaterfrontHubsPage() {
  const hubLenders = FIRST_TIME_BUYER_WATERFRONT_HUBS_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'District of Columbia', href: '/local-lenders/district-of-columbia' }, { label: 'First-Time Buyer & Waterfront Hubs' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · First-Time Buyers · Brookland &amp; Navy Yard
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Brookland &amp; Navy Yard</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Brookland and Navy Yard lenders for first-time buyer entry points, tree-lined Little Rome rowhouses,
            and sleek waterfront condos with luxury amenities near Nationals Park.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">DC Hubs — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {FIRST_TIME_BUYER_WATERFRONT_HUBS_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/district-of-columbia/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-cyan-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Brookland &amp; Navy Yard Are Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Brookland offers tree-lined streets and Little Rome arts-district charm as a safety-valve entry point</li>
                <li>Navy Yard delivers sleek waterfront condos with rooftop pools and plug-and-play modern lifestyle amenities</li>
                <li>Capitol Riverfront attracts DC&apos;s incoming professional class with high transactional volume</li>
                <li>First-time buyer programs essential for younger buyers priced into these dynamic hubs</li>
                <li>High appreciation potential in two of DC&apos;s highest-volume neighborhoods for modern urban living</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Brookland &amp; Navy Yard</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Brookland & Navy Yard" />
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
            <LeadCaptureForm stateName="Brookland & Navy Yard" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/district-of-columbia/upper-northwest-value-surge" className="text-[#14B8A6] hover:underline">Upper Northwest Value Surge Hub →</Link></li>
                <li><Link href="/local-lenders/district-of-columbia/high-velocity-mid-city-core" className="text-[#14B8A6] hover:underline">Mid-City Core Hub →</Link></li>
                <li><Link href="/local-lenders/washington/south-sound-tacoma-puyallup" className="text-[#14B8A6] hover:underline">South Sound Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Brookland & Navy Yard" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}