/**
 * Multi–Loan Estimate comparison (educational).
 * Does not declare a sales “winner” — surfaces lowest/highest per metric and dollar/rate deltas.
 */

import { deriveMetrics } from './client-analyze';
import type { DerivedEstimateMetrics, LoanEstimateInputs } from './types';

export const MAX_COMPARE_ESTIMATES = 3;
export const MIN_COMPARE_ESTIMATES = 2;

export type CompareSlotId = 'A' | 'B' | 'C';

export type CompareMetricKey =
  | 'interestRate'
  | 'apr'
  | 'originationCharges'
  | 'discountPoints'
  | 'lenderCredits'
  | 'netLenderCost'
  | 'estimatedPrincipalAndInterest'
  | 'totalClosingCosts';

export type CompareDirection = 'lower_better' | 'higher_better';

export interface CompareMetricDef {
  key: CompareMetricKey;
  label: string;
  shortLabel: string;
  direction: CompareDirection;
  format: 'money' | 'rate' | 'pct';
  /** Input field vs derived */
  source: 'input' | 'derived';
}

export const COMPARE_METRICS: CompareMetricDef[] = [
  {
    key: 'interestRate',
    label: 'Interest rate',
    shortLabel: 'Rate',
    direction: 'lower_better',
    format: 'rate',
    source: 'input',
  },
  {
    key: 'apr',
    label: 'APR',
    shortLabel: 'APR',
    direction: 'lower_better',
    format: 'rate',
    source: 'input',
  },
  {
    key: 'originationCharges',
    label: 'Origination charges',
    shortLabel: 'Origination',
    direction: 'lower_better',
    format: 'money',
    source: 'input',
  },
  {
    key: 'discountPoints',
    label: 'Discount points (paid)',
    shortLabel: 'Points',
    direction: 'lower_better',
    format: 'money',
    source: 'input',
  },
  {
    key: 'lenderCredits',
    label: 'Lender credits',
    shortLabel: 'Credits',
    direction: 'higher_better',
    format: 'money',
    source: 'input',
  },
  {
    key: 'netLenderCost',
    label: 'Net lender fees (orig + points − credits)',
    shortLabel: 'Net fees',
    direction: 'lower_better',
    format: 'money',
    source: 'derived',
  },
  {
    key: 'estimatedPrincipalAndInterest',
    label: 'Est. monthly P&I (30-year)',
    shortLabel: 'P&I / mo',
    direction: 'lower_better',
    format: 'money',
    source: 'derived',
  },
  {
    key: 'totalClosingCosts',
    label: 'Total closing costs (if entered)',
    shortLabel: 'Total closing',
    direction: 'lower_better',
    format: 'money',
    source: 'input',
  },
];

export interface CompareEstimateRow {
  id: CompareSlotId;
  label: string;
  inputs: LoanEstimateInputs;
  derived: DerivedEstimateMetrics;
}

export interface MetricComparison {
  metric: CompareMetricDef;
  /** value per slot id (null if missing) */
  values: Record<CompareSlotId, number | null>;
  /** slots that share the best value for this metric */
  bestSlots: CompareSlotId[];
  /** slots that share the worst value */
  worstSlots: CompareSlotId[];
  /** human callouts, e.g. "Estimate B is $1,850 lower in origination than A" */
  callouts: string[];
}

export interface LoanEstimateComparison {
  rows: CompareEstimateRow[];
  metrics: MetricComparison[];
  /** High-signal callouts across all metrics */
  headlineCallouts: string[];
  educationalNotes: string[];
  limitations: string[];
}

function metricValue(
  key: CompareMetricKey,
  inputs: LoanEstimateInputs,
  derived: DerivedEstimateMetrics
): number | null {
  switch (key) {
    case 'interestRate':
      return Number.isFinite(inputs.interestRate) ? inputs.interestRate : null;
    case 'apr':
      return inputs.apr != null && Number.isFinite(inputs.apr) ? inputs.apr : null;
    case 'originationCharges':
      return inputs.originationCharges;
    case 'discountPoints':
      return inputs.discountPoints;
    case 'lenderCredits':
      return inputs.lenderCredits;
    case 'netLenderCost':
      return derived.netLenderCost;
    case 'estimatedPrincipalAndInterest':
      return derived.estimatedPrincipalAndInterest;
    case 'totalClosingCosts':
      return inputs.totalClosingCosts;
    default:
      return null;
  }
}

function formatMetric(format: CompareMetricDef['format'], n: number): string {
  if (format === 'rate') return `${n.toFixed(3)}%`;
  if (format === 'pct') return `${n.toFixed(2)}%`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDelta(format: CompareMetricDef['format'], delta: number): string {
  const abs = Math.abs(delta);
  if (format === 'rate') return `${abs.toFixed(3)} percentage points`;
  if (format === 'pct') return `${abs.toFixed(2)}%`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(abs);
}

/**
 * Build educational comparison across 2–3 estimates.
 * `rows` should already be the active set (length 2 or 3).
 */
export function compareLoanEstimates(
  estimates: { id: CompareSlotId; label: string; inputs: LoanEstimateInputs }[]
): LoanEstimateComparison {
  const rows: CompareEstimateRow[] = estimates.map((e) => ({
    id: e.id,
    label: e.label,
    inputs: e.inputs,
    derived: deriveMetrics(e.inputs),
  }));

  const metrics: MetricComparison[] = COMPARE_METRICS.map((metric) => {
    const values = {} as Record<CompareSlotId, number | null>;
    for (const row of rows) {
      values[row.id] = metricValue(metric.key, row.inputs, row.derived);
    }

    const present = rows
      .map((r) => ({ id: r.id, v: values[r.id] }))
      .filter((x): x is { id: CompareSlotId; v: number } => x.v != null && Number.isFinite(x.v));

    let bestSlots: CompareSlotId[] = [];
    let worstSlots: CompareSlotId[] = [];
    const callouts: string[] = [];

    if (present.length >= 2) {
      const sorted = [...present].sort((a, b) =>
        metric.direction === 'lower_better' ? a.v - b.v : b.v - a.v
      );
      const bestVal = sorted[0]!.v;
      const worstVal = sorted[sorted.length - 1]!.v;
      bestSlots = present.filter((p) => p.v === bestVal).map((p) => p.id);
      worstSlots = present.filter((p) => p.v === worstVal).map((p) => p.id);

      // Pairwise vs first estimate (A if present, else first row)
      const baseline = rows[0]!;
      const baseVal = values[baseline.id];
      for (const row of rows.slice(1)) {
        const other = values[row.id];
        if (baseVal == null || other == null) continue;
        const delta = other - baseVal;
        if (Math.abs(delta) < 1e-9) {
          callouts.push(`${row.label} matches ${baseline.label} on ${metric.shortLabel.toLowerCase()}.`);
          continue;
        }
        const lower = delta < 0;
        const betterForConsumer =
          metric.direction === 'lower_better' ? lower : !lower;
        const verb = betterForConsumer ? 'lower' : 'higher';
        // For credits (higher better), invert language slightly
        if (metric.key === 'lenderCredits') {
          if (delta > 0) {
            callouts.push(
              `${row.label} offers ${formatDelta(metric.format, delta)} more in lender credits than ${baseline.label}.`
            );
          } else {
            callouts.push(
              `${row.label} offers ${formatDelta(metric.format, delta)} less in lender credits than ${baseline.label}.`
            );
          }
        } else {
          callouts.push(
            `${row.label} is ${formatDelta(metric.format, delta)} ${verb} in ${metric.shortLabel.toLowerCase()} than ${baseline.label}.`
          );
        }
      }
    }

    return { metric, values, bestSlots, worstSlots, callouts };
  });

  const headlineCallouts: string[] = [];
  for (const m of metrics) {
    if (m.bestSlots.length === 0) continue;
    if (m.metric.key === 'totalClosingCosts' && m.bestSlots.length && m.values[m.bestSlots[0]!] == null)
      continue;
    const labels = m.bestSlots
      .map((id) => rows.find((r) => r.id === id)?.label ?? id)
      .join(' & ');
    const sample = m.values[m.bestSlots[0]!];
    if (sample == null) continue;
    // Skip if all equal
    const vals = rows.map((r) => m.values[r.id]).filter((v): v is number => v != null);
    if (vals.length >= 2 && vals.every((v) => v === vals[0])) continue;

    const word =
      m.metric.direction === 'lower_better' ? 'Lowest' : 'Highest';
    headlineCallouts.push(
      `${word} ${m.metric.shortLabel.toLowerCase()}: ${labels} (${formatMetric(m.metric.format, sample)})`
    );
  }

  // Cap headliners
  const educationalNotes = [
    'A lower rate with higher points can cost more cash at closing — check how long you expect to keep the loan.',
    'Lender credits often raise the rate; lower cash due today can mean higher monthly P&I over time.',
    'APR is a useful cross-check when fees differ, but it is not a quality score and depends on assumptions in the Loan Estimate.',
    'These comparisons use the numbers you entered. Always re-read the official Loan Estimate and Closing Disclosure.',
  ];

  const limitations = [
    'Educational comparison only — not underwriting, not a recommendation of any lender, and not financial advice.',
    'We do not declare an overall “winner.” Trade-offs (cash at closing vs monthly payment vs rate) depend on your situation.',
    'HMDA context, if shown, is 2025 multi-state market activity (42 product states including Arkansas, Mississippi, and Oklahoma) — not historical fee percentiles for these Loan Estimates.',
  ];

  return {
    rows,
    metrics,
    headlineCallouts: headlineCallouts.slice(0, 6),
    educationalNotes,
    limitations,
  };
}

export const COMPARE_DRAFT_STORAGE_KEY = 'lth-le-compare-draft-v1';

export type CompareDraftPayload = {
  estimates?: Partial<Record<CompareSlotId, LoanEstimateInputs>>;
  activeCount?: number;
  fromAnalyzer?: boolean;
};
