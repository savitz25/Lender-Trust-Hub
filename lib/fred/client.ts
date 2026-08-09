import 'server-only';

import { unstable_cache } from 'next/cache';
import {
  FRED_RATE_NOTE,
  FRED_SERIES_MORTGAGE_15,
  FRED_SERIES_MORTGAGE_30,
  FRED_SOURCE_LABEL,
  FRED_SOURCE_URL,
  type FredMortgageBenchmarks,
  type FredObservation,
  type FredSeriesId,
} from './types';

const FRED_OBS_URL = 'https://api.stlouisfed.org/fred/series/observations';

/** Revalidate ~6h — Freddie Mac PMMS is typically weekly. */
const REVALIDATE_SECONDS = 6 * 60 * 60;

type FredApiObservation = {
  date: string;
  value: string;
};

type FredApiResponse = {
  observations?: FredApiObservation[];
  error_code?: number;
  error_message?: string;
};

function getApiKey(): string | null {
  const key = process.env.FRED_API_KEY?.trim();
  return key || null;
}

async function fetchLatestObservation(
  seriesId: FredSeriesId,
  apiKey: string
): Promise<FredObservation | null> {
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: 'json',
    sort_order: 'desc',
    limit: '5',
  });

  const res = await fetch(`${FRED_OBS_URL}?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'LenderTrustHub/1.0 (+https://www.lendertrusthub.com; research)',
    },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!res.ok) {
    console.warn(`[fred] ${seriesId} HTTP ${res.status}`);
    return null;
  }

  const data = (await res.json()) as FredApiResponse;
  if (data.error_message) {
    console.warn(`[fred] ${seriesId} API error:`, data.error_message);
    return null;
  }

  for (const obs of data.observations ?? []) {
    if (!obs?.value || obs.value === '.') continue;
    const value = Number(obs.value);
    if (!Number.isFinite(value) || value <= 0 || value > 30) continue;
    return {
      seriesId,
      value: Math.round(value * 1000) / 1000,
      date: obs.date,
    };
  }

  return null;
}

async function loadBenchmarksUncached(): Promise<FredMortgageBenchmarks> {
  const base = {
    sourceLabel: FRED_SOURCE_LABEL,
    sourceUrl: FRED_SOURCE_URL,
    note: FRED_RATE_NOTE,
    fetchedAt: new Date().toISOString(),
  };

  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      ...base,
      rate30: null,
      rate15: null,
      available: false,
      unavailableReason: 'no_api_key',
    };
  }

  try {
    const [rate30, rate15] = await Promise.all([
      fetchLatestObservation(FRED_SERIES_MORTGAGE_30, apiKey),
      fetchLatestObservation(FRED_SERIES_MORTGAGE_15, apiKey),
    ]);

    const available = Boolean(rate30 || rate15);
    return {
      ...base,
      rate30,
      rate15,
      available,
      unavailableReason: available ? undefined : 'empty',
    };
  } catch (err) {
    console.warn('[fred] fetch failed', err);
    return {
      ...base,
      rate30: null,
      rate15: null,
      available: false,
      unavailableReason: 'fetch_failed',
    };
  }
}

/**
 * Cached mortgage benchmarks for server components / route handlers.
 * Never call from client components — keeps FRED_API_KEY server-only.
 */
export const getFredMortgageBenchmarks = unstable_cache(
  loadBenchmarksUncached,
  ['fred-mortgage-benchmarks-v1'],
  { revalidate: REVALIDATE_SECONDS }
);
