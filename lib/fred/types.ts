/** FRED / Freddie Mac mortgage rate benchmarks (via St. Louis Fed API). */

export const FRED_SERIES_MORTGAGE_30 = 'MORTGAGE30US' as const;
export const FRED_SERIES_MORTGAGE_15 = 'MORTGAGE15US' as const;

export const FRED_SOURCE_LABEL = 'Freddie Mac via FRED (St. Louis Fed)';
export const FRED_SOURCE_URL =
  'https://fred.stlouisfed.org/series/MORTGAGE30US';

export const FRED_RATE_NOTE =
  'National average contract rates published weekly by Freddie Mac and distributed via FRED. This is a market benchmark, not a quote for your loan, credit profile, or property.';

export type FredSeriesId =
  | typeof FRED_SERIES_MORTGAGE_30
  | typeof FRED_SERIES_MORTGAGE_15;

export type FredObservation = {
  seriesId: FredSeriesId;
  /** Latest published rate, percent (e.g. 6.72) */
  value: number;
  /** Observation date YYYY-MM-DD */
  date: string;
};

export type FredMortgageBenchmarks = {
  rate30: FredObservation | null;
  rate15: FredObservation | null;
  /** ISO timestamp when this payload was assembled */
  fetchedAt: string;
  available: boolean;
  sourceLabel: string;
  sourceUrl: string;
  note: string;
  /** True when API key missing or all series failed */
  unavailableReason?: 'no_api_key' | 'fetch_failed' | 'empty';
};

export type RateBenchmarkTone = 'below' | 'near' | 'above' | 'unavailable';

export type RateVsBenchmark = {
  userRate: number;
  benchmark: number;
  seriesId: FredSeriesId;
  asOfDate: string;
  /** User − benchmark, in percentage points */
  deltaPctPoints: number;
  tone: RateBenchmarkTone;
  /** Plain-language comparison for UI */
  framing: string;
};
