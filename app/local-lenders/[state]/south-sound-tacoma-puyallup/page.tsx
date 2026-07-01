import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { LenderCard } from '@/components/LenderCard';
import { SOUTH_SOUND_TACOMA_PUYALLUP_HUB_AREAS, SOUTH_SOUND_TACOMA_PUYALLUP_LENDER_SLUGS } from '@/lib/mortgage/washingtonLenders';
import { getLenderBySlug } from '@/lib/lenders';

export const metadata: Metadata = {
  title: 'South Sound Mortgage Lenders — Tacoma & Puyallup, Pierce County (2026)',
  description:
    'NMLS-verified mortgage lenders in Pierce County. Tacoma historic charm, Puyallup master-planned growth, Sounder train commuters, JBLM military families, and affordability safety valve roughly $300K below King County medians.',
  alternates: { canonical: 'https://www.lendertrusthub.com/local-lenders/washington/south-sound-tacoma-puyallup' },
};

const CALCULATORS = [
  { href: '/calculators/mortgage-payment', label: 'Mortgage Payment' },
  { href: '/calculators/affordability', label: 'Affordability' },
  { href: '/calculators/refinance', label: 'Refinance ROI' },
  { href: '/calculators/va', label: 'VA Loan' },
];

export default function SouthSoundTacomaPuyallupHubPage() {
  const hubLenders = SOUTH_SOUND_TACOMA_PUYALLUP_LENDER_SLUGS.map((slug) => getLenderBySlug(slug)).filter(Boolean);

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: 'Mortgage Lenders', href: '/local-lenders' },
          { label: 'Washington', href: '/local-lenders/washington' }, { label: 'South Sound Hub' },
        ]} />
      </div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-1.5 text-sm">
            NMLS Verified · Commuter &amp; Military · Pierce County Focus
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Trusted Mortgage Lenders — South Sound</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Tacoma and Puyallup lenders for historic North End charm, suburban powerhouse growth,
            Sounder rail commuters, and JBLM military families in Pierce County&apos;s affordability safety valve.
          </p>
          <div className="mt-6"><SearchBar className="mx-auto max-w-md" /></div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">South Sound — Start Here</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {SOUTH_SOUND_TACOMA_PUYALLUP_HUB_AREAS.map((c) => (
                  <Link key={c.name} href={`/local-lenders/washington/${c.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-sky-400">
                    <span className="font-semibold text-[#0A2540]">{c.name}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{c.highlight}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Why South Sound Is Different</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Pierce County medians near $564K — roughly $300K below King County as a priced-out safety valve</li>
                <li>Tacoma North End and Proctor offer historic charm with steady Seattle commuter demand</li>
                <li>Puyallup master-planned communities and excellent schools drive suburban powerhouse growth</li>
                <li>Sounder train corridor supports efficient Seattle commuter relocations</li>
                <li>Joint Base Lewis-McChord proximity creates robust VA and military family lending demand</li>
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">Top Verified Lenders — South Sound</h2>
              <div className="space-y-4">
                {hubLenders.map((lender, i) => (
                  lender && (
                    <LenderCard key={lender.id} lender={lender} rank={i + 1} countyLabel="South Sound" />
                  )
                ))}
              </div>
              <p className="mt-4 text-sm">
                <Link href="/local-lenders/washington/pierce" className="text-[#3B82F6] hover:underline">
                  View all Pierce County lenders →
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
            <LeadCaptureForm stateName="South Sound" categoryId="mortgage" variant="state-page-v2" />
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also Explore</h2>
              <ul className="mt-3 space-y-2">
                <li><Link href="/local-lenders/washington/snohomish-transit-corridor" className="text-[#14B8A6] hover:underline">Snohomish Transit Corridor Hub →</Link></li>
                <li><Link href="/local-lenders/colorado/colorado-springs-stability-volume" className="text-[#14B8A6] hover:underline">Colorado Springs Hub →</Link></li>
                <li><Link href="/local-lenders/texas/san-antonio-value-play" className="text-[#14B8A6] hover:underline">San Antonio Value Play Hub →</Link></li>
                <li><Link href="/calculators" className="text-[#14B8A6] hover:underline">Mortgage Calculators →</Link></li>
              </ul>
            </div>
            <LeadCaptureForm stateName="South Sound" categoryId="mortgage" variant="sidebar-minimal" />
          </aside>
        </div>
      </div>
    </>
  );
}