import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, FileSearch, Shield } from 'lucide-react';
import { LoanEstimateAnalyzer } from '@/components/tools/LoanEstimateAnalyzer';
import { buildAnalyzerBootstrap } from '@/lib/tools/loan-estimate-analyzer/serialize-context';
import { JsonLd } from '@/components/directory/JsonLd';

export const metadata: Metadata = {
  title: 'Loan Estimate Analyzer — Compare Fees to Market Context | Lender Trust Hub',
  description:
    'Paste key numbers from your Loan Estimate and see educational fee bands, APR/rate context, and 2025 multi-state HMDA activity (FL, TX, GA, CA, NC, SC, NJ, NY, PA, MA) for matched lenders and counties. Free research tool — no lead form required.',
  alternates: {
    canonical: 'https://www.lendertrusthub.com/tools/loan-estimate-analyzer',
  },
  openGraph: {
    title: 'Loan Estimate Analyzer | Lender Trust Hub',
    description:
      'Educational Loan Estimate research: fee bands, points vs rate, and federal HMDA market context. No phone number required.',
    url: 'https://www.lendertrusthub.com/tools/loan-estimate-analyzer',
    type: 'website',
  },
};

const FAQ = [
  {
    q: 'Is this financial advice?',
    a: 'No. The Loan Estimate Analyzer is educational research only. It does not approve loans, set rates, or recommend a specific lender.',
  },
  {
    q: 'Do you use real HMDA fee percentiles?',
    a: 'Not yet. Our cleaned 2025 HMDA tables summarize applications, originations, denials, and product mix — not loan-level origination charge distributions. Fee placement uses published educational bands. When a matched lender or major product-state county is selected, we show real HMDA volume and mix context separately.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'No. Results are available immediately with no phone number or lead form required.',
  },
  {
    q: 'What is the national mortgage rate shown next to my interest rate?',
    a: 'It is the Freddie Mac Primary Mortgage Market Survey average (30-year fixed), distributed via FRED. It is a research benchmark for context only — not a rate you are offered and not advice to accept or reject a Loan Estimate.',
  },
];

export default async function LoanEstimateAnalyzerPage({
  searchParams,
}: {
  searchParams: Promise<{ lender?: string; county?: string }>;
}) {
  const sp = await searchParams;
  const bootstrap = await buildAnalyzerBootstrap();
  const initialLenderSlug =
    sp.lender && bootstrap.lenderContextBySlug[sp.lender] ? sp.lender : '';
  const initialCountySlug =
    sp.county && bootstrap.countyContextBySlug[sp.county] ? sp.county : '';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Loan Estimate Analyzer',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description:
      'Educational tool to interpret Loan Estimate fees with transparent bands and optional 2025 HMDA market context.',
    url: 'https://www.lendertrusthub.com/tools/loan-estimate-analyzer',
  };

  return (
    <>
      <JsonLd data={schema} />

      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540]/[0.04] via-white to-emerald-50/50">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-500">
            <ol className="flex flex-wrap items-center gap-1">
              <li>
                <Link href="/" className="hover:text-[#059669]">
                  Home
                </Link>
              </li>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              <li>
                <Link href="/calculators" className="hover:text-[#059669]">
                  Calculators
                </Link>
              </li>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              <li>
                <span className="text-[#0A2540]">Loan Estimate Analyzer</span>
              </li>
            </ol>
          </nav>

          <div className="mx-auto max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              <FileSearch className="h-3.5 w-3.5" aria-hidden="true" />
              Flagship research tool · Free · No lead form
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0A2540] md:text-4xl">
              Loan Estimate Analyzer
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-zinc-600">
              Received a Loan Estimate and unsure if the fees look reasonable? Enter the key numbers
              from the form. We show transparent educational fee bands, points vs rate context, and —
              when you select a matched lender or major product-state county — real{' '}
              <strong className="font-semibold text-[#0A2540]">2025 HMDA</strong> market activity.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-zinc-600">
              <li className="flex gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                Every comparison cites its source (educational bands vs 2025 HMDA volume/mix).
              </li>
              <li className="flex gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                We do not invent fee percentiles from data we do not have.
              </li>
              <li className="flex gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                Not underwriting or advice — research framing only.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 md:py-12">
        <LoanEstimateAnalyzer
          bootstrap={bootstrap}
          initialLenderSlug={initialLenderSlug}
          initialCountySlug={initialCountySlug}
        />
      </div>

      <section className="border-t border-zinc-200 bg-zinc-50/80 py-12" aria-labelledby="le-faq">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 id="le-faq" className="mb-6 text-2xl font-bold text-[#0A2540]">
            Common questions
          </h2>
          <dl className="space-y-5">
            {FAQ.map((item) => (
              <div key={item.q} className="rounded-xl border border-zinc-200 bg-white p-4">
                <dt className="font-semibold text-[#0A2540]">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-zinc-600">{item.a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 text-center text-sm text-zinc-500">
            Related:{' '}
            <Link
              href="/tools/compare-loan-estimates"
              className="font-medium text-[#059669] hover:underline"
            >
              Compare 2–3 Loan Estimates
            </Link>
            {' · '}
            <Link href="/calculators" className="font-medium text-[#059669] hover:underline">
              All calculators
            </Link>
            {' · '}
            <Link href="/methodology" className="font-medium text-[#059669] hover:underline">
              Research methodology
            </Link>
            {' · '}
            <Link href="/local-lenders/florida" className="font-medium text-[#059669] hover:underline">
              Florida lenders
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
