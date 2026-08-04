import Link from 'next/link';
import { Shield, ArrowRight, CheckCircle } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { TrustBar } from '@/components/TrustBar';
import { HomeTabs } from '@/components/HomeTabs';
import { HeroGoalChips } from '@/components/hero-goal-chips';
import { NetworkBelongingLine } from '@/components/network/network-belonging-line';
import { TrustMark } from '@/components/network/trust-mark';
import { getFeaturedLenders } from '@/lib/lenders';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const featured = getFeaturedLenders(6);

  return (
    <div>
      <section className="lth-hero-wash relative border-b border-zinc-200">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
              <Shield className="h-4 w-4" aria-hidden="true" />
              INDEPENDENT NMLS RESEARCH · ZERO PAID PLACEMENTS
            </div>
            <NetworkBelongingLine className="mb-3" />
            <div className="mb-5 flex justify-center">
              <TrustMark />
            </div>

            <h1 className="mb-3 text-4xl font-bold leading-tight tracking-tight text-[#0A2540] md:text-5xl lg:text-6xl">
              What are you trying to accomplish?
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-600 md:text-xl">
              Pick a financing goal, then research NMLS-verified lenders and educational calculators.
              Independent directory — we do not originate loans or sell ranking position. Re-check
              every ID on NMLS Consumer Access.
            </p>

            <HeroGoalChips />

            <div className="mx-auto mt-8 max-w-xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Or search by ZIP / market
              </p>
              <SearchBar className="mx-auto" />
            </div>

            <p className="mt-6 mb-6 text-sm text-zinc-500">
              Expanding state &amp; county coverage · Educational tools · Not a lender
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/local-lenders">
                <Button size="lg" variant="trust" className="gap-2 min-h-11">
                  Browse lenders <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/calculators">
                <Button size="lg" variant="outline" className="gap-2 min-h-11">
                  Educational calculators
                </Button>
              </Link>
              <Link href="/methodology">
                <Button size="lg" variant="outline" className="min-h-11">
                  Methodology
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TrustBar />

      <section className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#059669]">
            How It Works
          </p>
          <h2 className="text-3xl font-bold text-[#0A2540]">
            Research first — then re-check NMLS
          </h2>
        </div>
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Search your market',
              desc: 'Enter a ZIP or browse state/county pages for mortgage lenders in markets we cover. Coverage is expanding — not every U.S. county is listed.',
            },
            {
              step: '02',
              title: 'Compare public signals',
              desc: 'Review NMLS identifiers, Trust Scores as research aids, CFPB pattern signals where used, and attributed reputation — not paid rankings.',
            },
            {
              step: '03',
              title: 'Verify and decide',
              desc: 'Re-confirm licenses on NMLS Consumer Access, use educational calculators for payment math, and compare written Loan Estimates yourself.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 text-3xl font-bold text-emerald-600/30">{item.step}</div>
              <h3 className="mb-2 text-lg font-semibold text-[#0A2540]">{item.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-6">
            {[
              'NMLS License Verification',
              'CFPB Complaint Data',
              'BBB Accreditation',
              'Google & Trustpilot Reviews',
              'County Experience Scores',
              'No Paid Placements',
            ].map((badge) => (
              <span key={badge} className="trust-badge gap-1.5 px-4 py-2 text-sm">
                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      <HomeTabs lenders={featured} />
    </div>
  );
}