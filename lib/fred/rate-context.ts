import type {
  FredMortgageBenchmarks,
  FredSeriesId,
  RateBenchmarkTone,
  RateVsBenchmark,
} from './types';
import { FRED_SERIES_MORTGAGE_15, FRED_SERIES_MORTGAGE_30 } from './types';

/** Within this band (percentage points) we call the rate “near” the benchmark. */
const NEAR_BAND = 0.125;

/**
 * Compare a user-entered interest rate to a national average benchmark.
 * Pure helper — safe for client and server.
 */
export function compareRateToBenchmark(
  userRate: number,
  benchmark: number,
  meta: { seriesId: FredSeriesId; asOfDate: string }
): RateVsBenchmark | null {
  if (!Number.isFinite(userRate) || userRate <= 0 || userRate > 30) return null;
  if (!Number.isFinite(benchmark) || benchmark <= 0) return null;

  const deltaPctPoints = Math.round((userRate - benchmark) * 1000) / 1000;
  let tone: RateBenchmarkTone;
  if (Math.abs(deltaPctPoints) <= NEAR_BAND) tone = 'near';
  else if (deltaPctPoints < 0) tone = 'below';
  else tone = 'above';

  const absFixed = Math.abs(deltaPctPoints).toFixed(2);
  const userLabel = Number.isInteger(userRate * 1000)
    ? userRate.toFixed(3).replace(/\.?0+$/, '')
    : userRate.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');

  let framing: string;
  if (tone === 'near') {
    framing = `Your rate (${userLabel}%) is near the national ${seriesLabel(meta.seriesId)} average of ${benchmark.toFixed(2)}% (as of ${meta.asOfDate}). Small differences are common by credit, LTV, and product.`;
  } else if (tone === 'below') {
    framing = `Your rate is ${absFixed} percentage points below the national ${seriesLabel(meta.seriesId)} average of ${benchmark.toFixed(2)}% (as of ${meta.asOfDate}). That is a favorable comparison to the national average — not a guarantee of a better deal for your situation.`;
  } else {
    framing = `Your rate is ${absFixed} percentage points above the national ${seriesLabel(meta.seriesId)} average of ${benchmark.toFixed(2)}% (as of ${meta.asOfDate}). National averages are not personalized quotes — ask the lender how your product and credit tier compare.`;
  }

  return {
    userRate,
    benchmark,
    seriesId: meta.seriesId,
    asOfDate: meta.asOfDate,
    deltaPctPoints,
    tone,
    framing,
  };
}

function seriesLabel(id: FredSeriesId): string {
  if (id === FRED_SERIES_MORTGAGE_15) return '15-year fixed';
  return '30-year fixed';
}

/**
 * Prefer 30-year for standard LE comparison; fall back to 15-year if only that is present.
 */
export function compareUserRateToBenchmarks(
  userRate: number,
  benchmarks: FredMortgageBenchmarks | null | undefined
): RateVsBenchmark | null {
  if (!benchmarks?.available) return null;
  if (benchmarks.rate30) {
    return compareRateToBenchmark(userRate, benchmarks.rate30.value, {
      seriesId: FRED_SERIES_MORTGAGE_30,
      asOfDate: benchmarks.rate30.date,
    });
  }
  if (benchmarks.rate15) {
    return compareRateToBenchmark(userRate, benchmarks.rate15.value, {
      seriesId: FRED_SERIES_MORTGAGE_15,
      asOfDate: benchmarks.rate15.date,
    });
  }
  return null;
}

export function formatBenchmarkRate(value: number): string {
  return `${value.toFixed(2)}%`;
}
