import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Columns3, Shield } from 'lucide-react';
import { LoanEstimateCompare } from '@/components/tools/LoanEstimateCompare';
import { buildAnalyzerBootstrap } from '@/lib/tools/loan-estimate-analyzer/serialize-context';
import { emptyLoanEstimateInputs } from '@/lib/tools/loan-estimate-analyzer/defaults';
import type { LoanEstimateInputs } from '@/lib/tools/loan-estimate-analyzer/types';
import { JsonLd } from '@/components/directory/JsonLd';

export const metadata: Metadata = {
  title: 'Compare Loan Estimates Side-by-Side | Lender Trust Hub',
  description:
    'Compare 2 or 3 Loan Estimates side-by-side: rate, APR, origination, points, credits, net fees, and monthly P&I. Educational research — no lead form required.',
  alternates: {
    canonical: 'https://www.lendertrusthub.com/tools/compare-loan-estimates',
  },
  openGraph: {
    title: 'Compare Loan Estimates | Lender Trust Hub',
    description:
      'Clear differences in rate, fees, and credits across Loan Estimates. Independent research framing — not a sales ranking.',
    url: 'https://www.lendertrusthub.com/tools/compare-loan-estimates',
    type: 'website',
  },
};

function numParam(v: string | undefined): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default async function CompareLoanEstimatesPage({
  searchParams,
}: {
  searchParams: Promise<{
    lender?: string;
    county?: string;
    loanAmount?: string;
    rate?: string;
    apr?: string;
    origination?: string;
    points?: string;
    credits?: string;
  }>;
}) {
  const sp = await searchParams;
  const bootstrap = await buildAnalyzerBootstrap();

  const initialA: Partial<LoanEstimateInputs> = {};
  if (sp.lender && bootstrap.lenderContextBySlug[sp.lender]) {
    initialA.lenderSlug = sp.lender;
  }
  if (sp.county && bootstrap.countyContextBySlug[sp.county]) {
    initialA.countySlug = sp.county;
  }
  const loanAmount = numParam(sp.loanAmount);
  const rate = numParam(sp.rate);
  const apr = numParam(sp.apr);
  const origination = numParam(sp.origination);
  const points = numParam(sp.points);
  const credits = numParam(sp.credits);
  if (loanAmount != null) initialA.loanAmount = loanAmount;
  if (rate != null) initialA.interestRate = rate;
  if (apr != null) initialA.apr = apr;
  if (origination != null) initialA.originationCharges = origination;
  if (points != null) initialA.discountPoints = points;
  if (credits != null) initialA.lenderCredits = credits;

  const hasQueryPrefill = Object.keys(initialA).length > 0;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Compare Loan Estimates',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description:
      'Educational side-by-side comparison of Loan Estimate rate, fees, points, and credits.',
    url: 'https://www.lendertrusthub.com/tools/compare-loan-estimates',
  };

  return (
    <>
      <JsonLd data={schema} />

      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540]/[0.04] via-white to-sky-50/40">
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
                <Link href="/tools/loan-estimate-analyzer" className="hover:text-[#059669]">
                  Loan Estimate Analyzer
                </Link>
              </li>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              <li>
                <span className="text-[#0A2540]">Compare</span>
              </li>
            </ol>
          </nav>

          <div className="mx-auto max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-900">
              <Columns3 className="h-3.5 w-3.5" aria-hidden="true" />
              Multi-estimate research · Free · No lead form
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0A2540] md:text-4xl">
              Compare Loan Estimates
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-zinc-600">
              Line up two or three Loan Estimates and see clear differences in rate, APR, origination,
              points, credits, net lender fees, and estimated monthly P&amp;I — without a sales pitch
              or phone form.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-zinc-600">
              <li className="flex gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                Desktop: side-by-side matrix. Mobile: tabs and stacked cards (not a squeezed table).
              </li>
              <li className="flex gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                We highlight lower/higher per metric — we do not crown an overall “winner.”
              </li>
              <li className="flex gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                Optional 2025 multi-state HMDA context (47 product states including NM and WV)
                when you pick a matched lender or county.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 md:py-12">
        <LoanEstimateCompare
          bootstrap={bootstrap}
          initialA={hasQueryPrefill ? emptyLoanEstimateInputs(initialA) : undefined}
        />
      </div>

      <section className="border-t border-zinc-200 bg-zinc-50/80 py-10">
        <div className="container mx-auto max-w-2xl px-4 text-center text-sm text-zinc-600">
          <p>
            Related:{' '}
            <Link
              href="/tools/loan-estimate-analyzer"
              className="font-medium text-[#059669] hover:underline"
            >
              Single Loan Estimate Analyzer
            </Link>
            {' · '}
            <Link href="/calculators" className="font-medium text-[#059669] hover:underline">
              All calculators
            </Link>
            {' · '}
            <Link href="/methodology" className="font-medium text-[#059669] hover:underline">
              Methodology
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
