import Link from 'next/link';
import { Shield, ArrowRight, CheckCircle } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { TrustBar } from '@/components/TrustBar';
import { HomeTabs } from '@/components/HomeTabs';
import { getFeaturedLenders } from '@/lib/lenders';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const featured = getFeaturedLenders(6);

  return (
    <div>
      <section className="relative border-b border-zinc-200 bg-gradient-to-br from-[#0A2540]/5 via-white to-[#14B8A6]/5">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
              <Shield className="h-4 w-4" aria-hidden="true" />
              NMLS VERIFIED • ZERO PAID PLACEMENTS • COUNTY INSIGHTS
            </div>

            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-[#0A2540] md:text-6xl">
              Discover Honest Lenders
              <br />
              <span className="text-[#3B82F6]">in Your County</span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-600 md:text-xl">
              Transparent data, confident choices. Compare verified local mortgage lenders
              and brokers backed by NMLS licensing, CFPB complaints, BBB ratings, and
              real reviews.
            </p>

            <SearchBar className="mx-auto mb-6 max-w-xl" />

            <p className="mb-8 text-sm text-zinc-500">
              Trusted Local Lenders • Verified County Insights • National Expertise
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/calculators">
                <Button size="lg" variant="trust" className="gap-2">
                  Try Free Calculators <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline">
                  How We Verify Lenders
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TrustBar />

      <section className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#3B82F6]">
            How It Works
          </p>
          <h2 className="text-3xl font-bold text-[#0A2540]">Your Path to the Right Lender</h2>
        </div>
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Search Your County',
              desc: 'Enter your ZIP code to auto-detect your county and see ranked local lenders with county-specific experience scores.',
            },
            {
              step: '02',
              title: 'Compare & Verify',
              desc: 'Review NMLS licensing, CFPB complaints, BBB ratings, Google/Trustpilot reviews, and local loan performance metrics.',
            },
            {
              step: '03',
              title: 'Connect with Confidence',
              desc: 'Use our calculators to understand your numbers, then match with lenders that fit your loan type and credit profile.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 text-3xl font-bold text-[#3B82F6]/30">{item.step}</div>
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