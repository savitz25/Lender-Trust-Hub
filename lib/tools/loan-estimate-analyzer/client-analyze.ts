/**
 * Client-safe analysis: educational bands + math only.
 * HMDA context is injected from server-serialized props (no filesystem).
 */

import { classifyNetLenderPct, classifyOriginationPct } from './educational-bands';
import type {
  DerivedEstimateMetrics,
  HmdaAnalyzerCountyContext,
  HmdaAnalyzerLenderContext,
  LoanEstimateAnalysis,
  LoanEstimateInputs,
} from './types';

function monthlyPrincipalAndInterest(
  loanAmount: number,
  annualRatePct: number,
  termYears = 30
): number | null {
  if (loanAmount <= 0 || annualRatePct < 0) return null;
  const r = annualRatePct / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return loanAmount / n;
  const factor = Math.pow(1 + r, n);
  return (loanAmount * r * factor) / (factor - 1);
}

export function deriveMetrics(inputs: LoanEstimateInputs): DerivedEstimateMetrics {
  const loan = Math.max(0, inputs.loanAmount);
  const orig = Math.max(0, inputs.originationCharges);
  const points = Math.max(0, inputs.discountPoints);
  const credits = Math.max(0, inputs.lenderCredits);
  const net = orig + points - credits;

  const pct = (dollars: number) => (loan > 0 ? (100 * dollars) / loan : 0);
  const bps = (dollars: number) => (loan > 0 ? (10_000 * dollars) / loan : 0);

  const rateAprSpread =
    inputs.apr != null && Number.isFinite(inputs.apr) && Number.isFinite(inputs.interestRate)
      ? Math.round((inputs.apr - inputs.interestRate) * 1000) / 1000
      : null;

  return {
    originationPct: Math.round(pct(orig) * 100) / 100,
    originationBps: Math.round(bps(orig) * 10) / 10,
    discountPointsPct: Math.round(pct(points) * 100) / 100,
    lenderCreditsPct: Math.round(pct(credits) * 100) / 100,
    netLenderCost: Math.round(net * 100) / 100,
    netLenderPct: Math.round(pct(net) * 100) / 100,
    netLenderBps: Math.round(bps(net) * 10) / 10,
    rateAprSpread,
    estimatedPrincipalAndInterest: monthlyPrincipalAndInterest(loan, inputs.interestRate),
    totalClosingPct:
      inputs.totalClosingCosts != null && loan > 0
        ? Math.round(pct(inputs.totalClosingCosts) * 100) / 100
        : null,
  };
}

function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export function analyzeLoanEstimateClient(
  inputs: LoanEstimateInputs,
  hmdaLender: HmdaAnalyzerLenderContext | null,
  hmdaCounty: HmdaAnalyzerCountyContext | null
): LoanEstimateAnalysis {
  const derived = deriveMetrics(inputs);

  const limitations: string[] = [
    'This tool is educational research only — not underwriting, not a rate quote, and not financial advice.',
    'HMDA does not tell you whether your specific Loan Estimate fees are “approved” or “correct.”',
  ];

  if (!hmdaLender) {
    limitations.push(
      'No matched 2025 HMDA evidence for the selected lender (or none selected) among product-state HMDA slices (all 50 states + DC). Fee placement uses educational bands only.'
    );
  } else {
    limitations.push(
      'We have 2025 HMDA volume and mix for this lender, but not loan-level HMDA fee percentiles yet. “Lender history” is market activity, not a fee range.'
    );
  }

  if (!hmdaCounty) {
    limitations.push(
      'No major county market summary selected (or outside our product-state major-county set). Market context is limited.'
    );
  }

  const rateAprNote =
    derived.rateAprSpread == null
      ? 'Add APR from the Loan Estimate to see how much higher APR is than the interest rate (a rough fee/cost signal).'
      : derived.rateAprSpread < 0
        ? 'APR is below the note rate on your inputs — double-check the Loan Estimate; APR is usually at or above the interest rate.'
        : derived.rateAprSpread <= 0.25
          ? `APR is about ${derived.rateAprSpread.toFixed(3)} percentage points above the interest rate — a relatively narrow spread on these inputs (still not a quality score).`
          : derived.rateAprSpread <= 0.75
            ? `APR is about ${derived.rateAprSpread.toFixed(3)} percentage points above the interest rate — a moderate spread often reflects fees financed or paid upfront.`
            : `APR is about ${derived.rateAprSpread.toFixed(3)} percentage points above the interest rate — a wider spread can mean higher prepaid finance charges. Compare full Loan Estimates, not rate alone.`;

  const citations = [
    {
      label: 'Educational fee bands',
      detail:
        'Published thresholds in Lender Trust Hub for origination % and net lender cost %. Not government fee caps; not HMDA fee microdata.',
    },
  ];
  if (hmdaLender) {
    citations.push({
      label: `Lender ${hmdaLender.primaryStateName} activity`,
      detail: `${hmdaLender.source} via CFPB/FFIEC — originations and loan-type mix, not fee distributions.`,
    });
  }
  if (hmdaCounty) {
    citations.push({
      label: 'County market activity',
      detail: `${hmdaCounty.source} — applications, originations, denial rate, product mix.`,
    });
  }

  return {
    derived,
    originationBand: classifyOriginationPct(derived.originationPct),
    netCostBand: classifyNetLenderPct(Math.max(0, derived.netLenderPct)),
    pointsEducation: {
      headline: 'Discount points vs interest rate (plain English)',
      bullets: [
        'One discount point usually costs about 1% of the loan amount and may lower the interest rate (exact trade-off is lender-specific).',
        `On your inputs, discount points are ${derived.discountPointsPct.toFixed(2)}% of the loan (${formatUsd(inputs.discountPoints)}).`,
        'Paying points can make sense if you keep the loan long enough to recover the upfront cost — only if the rate reduction is documented on the Loan Estimate.',
        'Lender credits often raise the rate slightly in exchange for reducing cash due at closing — the reverse of points.',
      ],
    },
    rateAprNote,
    hmdaLender,
    hmdaCounty,
    limitations,
    citations,
  };
}
