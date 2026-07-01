import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { CHICAGO_PROPER_URBAN_RESURGENCE_HUB_AREAS, CHICAGO_PROPER_URBAN_RESURGENCE_LENDER_SLUGS } from '@/lib/mortgage/illinoisLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Chicago Proper Mortgage Lenders — Lincoln Park, Logan Square & Urban Resurgence (2026)',
  description:
    'NMLS-verified mortgage lenders in Chicago neighborhoods. Lincoln Park, West Town, Logan Square, and Roscoe Village bidding wars, 48-hour multiple offers, and rent-vs-own flip economics.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/illinois/chicago-proper-urban-resurgence' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function ChicagoProperUrbanResurgenceHubPage() {
  const hubLenders = CHICAGO_PROPER_URBAN_RESURGENCE_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Illinois', href: '/local-lenders/illinois' }, { label: 'Chicago Proper Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-violet-400/40 bg-violet-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Chicago Proper · Urban Resurgence
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Chicago Proper</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Cook County lenders for Lincoln Park, West Town, Logan Square, and Roscoe Village — rising rental costs
            flipping the math toward ownership and calendar-driven family demand.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Chicago Proper — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {CHICAGO_PROPER_URBAN_RESURGENCE_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/illinois/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-violet-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Chicago Proper Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Bidding wars and multiple offers within 48 hours are common in Lincoln Park, West Town, Logan Square, and Roscoe Village</li>
                <li>Rising rental costs across neighborhoods have flipped monthly cost math toward homeownership</li>
                <li>Calendar-driven buyers — pandemic city-stayers with school-age children — face hard deadlines before the school year</li>
                <li>Historic rowhomes and renovated condos require lenders experienced in urban property types</li>
                <li>Speed and certainty of close are competitive advantages in the urban resurgence</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Chicago Proper</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Chicago Proper" />
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
            <LeadCaptureForm stateName="Chicago Proper" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/illinois/rockford-national-standout" className="text-[#14B8A6] hover:underline">Rockford Hub →</Link></li>
                <li><Link href="/local-lenders/illinois/highly-competitive-chicago-suburbs" className="text-[#14B8A6] hover:underline">Chicago Suburbs Hub →</Link></li>
                <li><Link href="/local-lenders/illinois/central-illinois-affordability-gems" className="text-[#14B8A6] hover:underline">Central IL Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Chicago Proper" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}