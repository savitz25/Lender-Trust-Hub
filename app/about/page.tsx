import type { Metadata } from 'next';
import { Shield, Database, Eye, Ban } from 'lucide-react';
import { TrustBar } from '@/components/TrustBar';
import { getMortgagePublicCounts, formatExactCount } from '@/lib/directory/public-counts';

export const metadata: Metadata = {
  title: 'Trust & Transparency',
  description:
    'Learn how Lender Trust Hub verifies mortgage lenders using NMLS, CFPB, BBB, Google, and Trustpilot data. Independent, zero paid placements.',
};

export default function AboutPage() {
  return (
    <div>
      <section className="lth-hero-wash border-b border-zinc-200 py-16 text-[#0A2540]">
        <div className="container mx-auto px-4 text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-[#14B8A6]" aria-hidden="true" />
          <h1 className="text-3xl font-bold md:text-5xl">Trust & Transparency</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600">
            Independent, data-obsessed, consumer-empowering. We deliver verified local
            expertise backed by national scale — with zero paid placements.
          </p>
        </div>
      </section>

      <TrustBar />

      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-2xl font-bold text-[#0A2540]">Our Independence Statement</h2>
          <div className="space-y-6 text-zinc-600 leading-relaxed">
            <p>
              Lender Trust Hub is not a lender, broker, or paid advertising platform. We do
              not accept payment for placement, ranking, or featured listings. Our directory
              rankings are based on verifiable data from multiple independent sources.
            </p>
            <p>
              Every lender profile includes transparent disclaimers about data freshness,
              methodology, and limitations. We believe consumers deserve the same quality of
              due diligence that institutional investors perform — applied to their most
              important financial decision.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-center text-2xl font-bold text-[#0A2540]">
            Multi-Source Verification
          </h2>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {[
              {
                icon: Database,
                title: 'NMLS Licensing',
                desc: 'Every lender is cross-referenced against the Nationwide Multistate Licensing System registry for active status and history.',
              },
              {
                icon: Eye,
                title: 'CFPB Complaints',
                desc: 'Consumer Financial Protection Bureau complaint data is aggregated and normalized per lender for fair comparison.',
              },
              {
                icon: Shield,
                title: 'BBB & Review Platforms',
                desc: 'Better Business Bureau ratings plus Google and Trustpilot review scores provide consumer sentiment signals.',
              },
              {
                icon: Ban,
                title: 'Zero Paid Placements',
                desc: 'Rankings cannot be bought. County experience scores and trust scores are calculated from public and verified data only.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6"
              >
                <item.icon className="mb-3 h-8 w-8 text-[#059669]" aria-hidden="true" />
                <h3 className="mb-2 font-semibold text-[#0A2540]">{item.title}</h3>
                <p className="text-sm text-zinc-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">County coverage</h2>
        <p className="mx-auto mb-8 max-w-xl text-zinc-600">
          Coverage is <strong className="font-semibold text-[#0A2540]">expanding by state and
          county</strong>. We do not claim every U.S. county has verified lenders in our directory.
          Full methodology (Research Score, Data Confidence, sources) is on{' '}
          <a href="/methodology" className="font-medium text-[#059669] hover:underline">
            /methodology
          </a>
          .
        </p>
        <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            {(() => {
              const c = getMortgagePublicCounts();
              return (
                <>
                  <div>
                    <div className="text-2xl font-bold text-[#14B8A6]">
                      {formatExactCount(c.verifiedEntities)}
                    </div>
                    <div className="text-xs text-zinc-500">NMLS ID verified</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#059669]">
                      {formatExactCount(c.distinctEntities)}
                    </div>
                    <div className="text-xs text-zinc-500">Distinct companies</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#0A2540]">Expanding</div>
                    <div className="text-xs text-zinc-500">County coverage</div>
                  </div>
                </>
              );
            })()}
          </div>
          <p className="mt-4 text-[11px] text-zinc-500">
            Live catalog counts only — distinct companies by NMLS, not padded location rows or
            marketing floors.
          </p>
        </div>
      </section>
    </div>
  );
}