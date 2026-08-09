/**
 * Client-safe FRED exports (types + pure helpers).
 * Server fetch: import { getFredMortgageBenchmarks } from '@/lib/fred/server'
 */
export {
  FRED_SERIES_MORTGAGE_30,
  FRED_SERIES_MORTGAGE_15,
  FRED_SOURCE_LABEL,
  FRED_SOURCE_URL,
  FRED_RATE_NOTE,
  type FredSeriesId,
  type FredObservation,
  type FredMortgageBenchmarks,
  type RateBenchmarkTone,
  type RateVsBenchmark,
} from './types';

export {
  compareRateToBenchmark,
  compareUserRateToBenchmarks,
  formatBenchmarkRate,
} from './rate-context';
