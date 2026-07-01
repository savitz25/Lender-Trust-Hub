import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import {
  UPSTATE_ALBANY_LENDER_SLUGS,
  UPSTATE_BUFFALO_LENDER_SLUGS,
  UPSTATE_POWERHOUSES_HUB_AREAS,
} from '@/lib/mortgage/newYorkLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'Upstate NY Mortgage Lenders — Buffalo & Albany Powerhouses (2026)',
  description:
    'NMLS-verified mortgage lenders in Buffalo and Albany. Low-inventory bidding wars, climate refuge appeal, healthcare/education hubs, Capital District supply-demand imbalance, and affordable $227K–$277K median entry.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/new-york/upstate-powerhouses-buffalo-albany' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function UpstatePowerhousesBuffaloAlbanyHubPage() {
  const buffaloLenders = UPSTATE_BUFFALO_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);
  const albanyLenders = UPSTATE_ALBANY_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'New York', href: '/local-lenders/new-york' }, { label: 'Upstate Powerhouses Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-orange-400/40 bg-orange-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Upstate Powerhouses · Buffalo &amp; Albany
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — Upstate NY</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Buffalo and Albany lenders for top-hot markets — low-inventory bidding wars, climate refuge appeal,
            healthcare and education job growth, and Capital District steady demand.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Upstate Powerhouses — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {UPSTATE_POWERHOUSES_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/new-york/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-orange-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why Upstate Markets Are Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Buffalo ranks among the top 3 hottest U.S. housing markets with 65% of homes selling above asking</li>
                <li>40% fewer homes for sale drives low DOM and intense bidding wars in Erie County</li>
                <li>Affordable $227K–$277K median entry attracts climate refuge and first-time buyers</li>
                <li>Albany Capital District faces supply-and-demand imbalance with steady government-sector activity</li>
                <li>Healthcare and education hub job growth rewards lenders who close fast on limited stock</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Buffalo</h2>
              <div className="space-y-4">
                {buffaloLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Buffalo / Erie County" />
                  )
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/new-york/erie" className="text-[#3B82F6] hover:underline">
                  View all Erie County lenders →
                </Link>
              </p>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — Albany (Capital District)</h2>
              <div className="space-y-4">
                {albanyLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="Albany / Capital District" />
                  )
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/new-york/albany" className="text-[#3B82F6] hover:underline">
                  View all Albany County lenders →
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
            <LeadCaptureForm stateName="Upstate NY" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/new-york/nyc-suburbs-westchester-putnam" className="text-[#14B8A6] hover:underline">NYC Suburbs Hub →</Link></li>
                <li><Link href="/local-lenders/massachusetts/worcester-undisputed-growth-leader" className="text-[#14B8A6] hover:underline">Worcester Growth Hub →</Link></li>
                <li><Link href="/local-lenders/massachusetts/gateway-cities-suburban-alternatives" className="text-[#14B8A6] hover:underline">Gateway Cities Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="Upstate NY" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}