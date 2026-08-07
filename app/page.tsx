import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { LenderHero } from '@/components/lender-hero';
import { TrustBar } from '@/components/TrustBar';
import { HomeTabs } from '@/components/HomeTabs';
import { getFeaturedLenders } from '@/lib/lenders';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const featured = getFeaturedLenders(6);

  return (
    <div>
      {/* Phase 2 — primary hero (Wealth & Finance research layer) */}
      <LenderHero />

      <TrustBar />

      <section className="border-y border-zinc-100 bg-zinc-50/80 py-16" aria-labelledby="how-it-works-heading">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#059669]">
              How it works
            </p>
            <h2 id="how-it-works-heading" className="text-3xl font-bold text-[#0A2540]">
              Research first — then re-check NMLS
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-600 md:text-base">
              Light, independent research flow — same Trust Hub chrome as Insurance and Move.
            </p>
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
                <div className="mb-3 text-3xl font-bold text-[#059669]/40">{item.step}</div>
                <h3 className="mb-2 text-lg font-semibold text-[#0A2540]">{item.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-600">{item.desc}</p>
              </div>
            ))}
          </div>
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