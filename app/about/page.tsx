import type { Metadata } from 'next';
import { Shield, Database, Eye, Ban } from 'lucide-react';
import { TrustBar } from '@/components/TrustBar';
import { TRUST_STATS } from '@/lib/mockData';

export const metadata: Metadata = {
  title: 'Trust & Transparency',
  description:
    'Learn how Lender Trust Hub verifies mortgage lenders using NMLS, CFPB, BBB, Google, and Trustpilot data. Independent, zero paid placements.',
};

export default function AboutPage() {
  return (
    <div>
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0A2540]/90 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-[#14B8A6]" aria-hidden="true" />
          <h1 className="text-3xl font-bold md:text-5xl">Trust & Transparency</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
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
                <item.icon className="mb-3 h-8 w-8 text-[#3B82F6]" aria-hidden="true" />
                <h3 className="mb-2 font-semibold text-[#0A2540]">{item.title}</h3>
                <p className="text-sm text-zinc-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold text-[#0A2540]">County Coverage</h2>
        <p className="mx-auto mb-8 max-w-xl text-zinc-600">
          We map lender experience to {TRUST_STATS.countiesCovered.toLocaleString()} U.S.
          counties, surfacing local expertise scores alongside national volume rankings.
        </p>
        <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[#14B8A6]">
                {TRUST_STATS.verifiedLenders.toLocaleString()}+
              </div>
              <div className="text-xs text-zinc-500">Lenders</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#3B82F6]">
                {(TRUST_STATS.totalReviews / 1_000_000).toFixed(1)}M
              </div>
              <div className="text-xs text-zinc-500">Reviews</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#0A2540]">
                {TRUST_STATS.countiesCovered.toLocaleString()}
              </div>
              <div className="text-xs text-zinc-500">Counties</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}