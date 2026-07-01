import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { ANN_ARBOR_KALAMAZOO_COLLEGE_TOWN_DEMAND_HUB_AREAS, ANN_ARBOR_KALAMAZOO_COLLEGE_TOWN_DEMAND_LENDER_SLUGS } from '@/lib/mortgage/michiganLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Ann Arbor & Kalamazoo Mortgage Lenders — College-Town Demand (2026)',
  description:
    'NMLS-verified mortgage lenders in Washtenaw and Kalamazoo Counties. Ann Arbor $549K median, Kalamazoo $245K affordability, medical/tech professionals, and steady university-town appreciation.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/michigan/ann-arbor-kalamazoo-college-town-demand' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function AnnArborKalamazooCollegeTownDemandHubPage() {
  const hubLenders = ANN_ARBOR_KALAMAZOO_COLLEGE_TOWN_DEMAND_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Michigan', href: '/local-lenders/michigan' }, { label: 'Ann Arbor & Kalamazoo Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Ann Arbor &amp; Kalamazoo · College-Town Demand
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — University Towns</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Washtenaw and Kalamazoo county lenders for Michigan&apos;s premier university towns — insulated Ann Arbor
            demand and Kalamazoo&apos;s affordable alternative with strong out-of-state buyer interest.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">University Towns — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {ANN_ARBOR_KALAMAZOO_COLLEGE_TOWN_DEMAND_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/michigan/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-indigo-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Ann Arbor &amp; Kalamazoo Are Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Ann Arbor boasts Michigan&apos;s highest major-city median listing price (~$549K) in insulated Tree Town</li>
                <li>Constant influx of medical, tech, and university professionals sustains competitive luxury and mid-tier demand</li>
                <li>Kalamazoo offers a more affordable college-town alternative (~$245K median) with surging out-of-state interest</li>
                <li>Both markets show incredible resilience and steady price appreciation through economic cycles</li>
                <li>Professional relocation programs and jumbo expertise matter in Ann Arbor; affordability drives Kalamazoo volume</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — University Towns</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Ann Arbor & Kalamazoo" />
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
            <LeadCaptureForm stateName="Ann Arbor & Kalamazoo" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/michigan/greater-detroits-value-pockets" className="text-[#14B8A6] hover:underline">Greater Detroit Hub →</Link></li>
                <li><Link href="/local-lenders/michigan/lansing-multi-family-investor-magnet" className="text-[#14B8A6] hover:underline">Lansing Hub →</Link></li>
                <li><Link href="/local-lenders/michigan/grand-rapids-fast-moving-core" className="text-[#14B8A6] hover:underline">Grand Rapids Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Ann Arbor & Kalamazoo" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}