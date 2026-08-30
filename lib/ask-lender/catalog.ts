import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { num, parseCsv } from '@/lib/hmda/parse-csv';
import type { AskAction, AskLoanType } from './types';

export type StateLeiRow = {
  year: number;
  state: string;
  lei: string;
  applications: number;
  originations: number;
  origConventional: number;
  origFha: number;
  origVa: number;
  origUsda: number;
  origOther: number;
};

export type CountyLeiRow = {
  year: number;
  state: string;
  countyFips: string;
  countyName: string;
  lei: string;
  applications: number;
  originations: number;
  denials: number;
  appsConventional: number;
  appsFha: number;
  appsVa: number;
  appsUsda: number;
  appsOther: number;
  origConventional: number;
  origFha: number;
  origVa: number;
  origUsda: number;
  origOther: number;
};

export type CountyMarketRow = {
  year: number;
  state: string;
  countyFips: string;
  countyName: string;
  applications: number;
  originations: number;
  denials: number;
  purchaseApps: number | null;
  refinanceApps: number | null;
  origConventional: number;
  origFha: number;
  origVa: number;
  origUsda: number;
};

export type AskCatalog = {
  stateRows: StateLeiRow[];
  countyRows: CountyLeiRow[];
  countyMarkets: CountyMarketRow[];
  flCountyByLei: Map<string, CountyLeiRow>;
  loadedAt: number;
};

let cached: AskCatalog | null = null;

function read(...parts: string[]): Record<string, string>[] {
  const path = join(/* turbopackIgnore: true */ process.cwd(), 'data', ...parts);
  if (!existsSync(path)) return [];
  return parseCsv(readFileSync(path, 'utf8'));
}

function aggregateFloridaCounty(rows: CountyLeiRow[]): Map<string, CountyLeiRow> {
  const byLei = new Map<string, CountyLeiRow>();
  for (const row of rows) {
    const cur = byLei.get(row.lei);
    if (!cur) {
      byLei.set(row.lei, { ...row, countyFips: '12', countyName: 'Florida (sum of counties)' });
      continue;
    }
    cur.applications += row.applications;
    cur.originations += row.originations;
    cur.denials += row.denials;
    cur.appsConventional += row.appsConventional;
    cur.appsFha += row.appsFha;
    cur.appsVa += row.appsVa;
    cur.appsUsda += row.appsUsda;
    cur.appsOther += row.appsOther;
    cur.origConventional += row.origConventional;
    cur.origFha += row.origFha;
    cur.origVa += row.origVa;
    cur.origUsda += row.origUsda;
    cur.origOther += row.origOther;
  }
  return byLei;
}

export function loadAskCatalog(): AskCatalog {
  if (cached) return cached;
  const stateRows: StateLeiRow[] = read('hmda', 'national', 'lender_state_summary.csv').map((r) => ({
    year: num(r.year) || 2025,
    state: (r.state || '').trim(),
    lei: (r.lei || '').trim(),
    applications: num(r.total_applications),
    originations: num(r.total_originations),
    origConventional: num(r.orig_conventional),
    origFha: num(r.orig_fha),
    origVa: num(r.orig_va),
    origUsda: num(r.orig_usda_other),
    origOther: num(r.orig_other_loan_type),
  }));
  const countyRows: CountyLeiRow[] = read('hmda', 'by-state', 'FL', 'lender_activity_by_county.csv').map((r) => ({
    year: num(r.year) || 2025,
    state: (r.state || 'FL').trim(),
    countyFips: (r.county_fips || '').trim(),
    countyName: (r.county_name || '').trim(),
    lei: (r.lei || '').trim(),
    applications: num(r.applications),
    originations: num(r.originations),
    denials: num(r.denials),
    appsConventional: num(r.apps_conventional),
    appsFha: num(r.apps_fha),
    appsVa: num(r.apps_va),
    appsUsda: num(r.apps_usda_other),
    appsOther: num(r.apps_other_loan_type),
    origConventional: num(r.orig_conventional),
    origFha: num(r.orig_fha),
    origVa: num(r.orig_va),
    origUsda: num(r.orig_usda_other),
    origOther: num(r.orig_other_loan_type),
  }));
  const countyMarkets: CountyMarketRow[] = read('hmda', 'by-state', 'FL', 'county_market_summary.csv').map((r) => ({
    year: num(r.year) || 2025,
    state: (r.state || 'FL').trim(),
    countyFips: (r.county_fips || '').trim(),
    countyName: (r.county_name || '').trim(),
    applications: num(r.total_applications ?? r.applications),
    originations: num(r.total_originations ?? r.originations),
    denials: num(r.denial_count ?? r.denials),
    purchaseApps: r.purchase_count === '' ? null : num(r.purchase_count),
    refinanceApps: r.refinance_count === '' ? null : num(r.refinance_count),
    origConventional: num(r.orig_conventional),
    origFha: num(r.orig_fha),
    origVa: num(r.orig_va),
    origUsda: num(r.orig_usda_other),
  }));
  cached = {
    stateRows,
    countyRows,
    countyMarkets,
    flCountyByLei: aggregateFloridaCounty(countyRows),
    loadedAt: Date.now(),
  };
  return cached;
}

export function metricFromState(row: StateLeiRow, action: AskAction, loanType?: AskLoanType): number | null {
  if (action === 'denial') return null;
  if (!loanType) return action === 'origination' ? row.originations : row.applications;
  if (action === 'application') return null;
  if (loanType === 'conventional') return row.origConventional;
  if (loanType === 'FHA') return row.origFha;
  if (loanType === 'VA') return row.origVa;
  if (loanType === 'USDA') return row.origUsda;
  if (loanType === 'other') return row.origOther;
  return null;
}

export function metricFromCounty(row: CountyLeiRow, action: AskAction, loanType?: AskLoanType): number {
  if (!loanType) {
    if (action === 'origination') return row.originations;
    if (action === 'denial') return row.denials;
    return row.applications;
  }
  if (action === 'denial') return 0;
  if (action === 'application') {
    if (loanType === 'conventional') return row.appsConventional;
    if (loanType === 'FHA') return row.appsFha;
    if (loanType === 'VA') return row.appsVa;
    if (loanType === 'USDA') return row.appsUsda;
    return row.appsOther;
  }
  if (loanType === 'conventional') return row.origConventional;
  if (loanType === 'FHA') return row.origFha;
  if (loanType === 'VA') return row.origVa;
  if (loanType === 'USDA') return row.origUsda;
  return row.origOther;
}

export const ASK_SOURCE_FILES = [
  'data/hmda/national/lender_state_summary.csv',
  'data/hmda/by-state/FL/lender_activity_by_county.csv',
  'data/hmda/by-state/FL/county_market_summary.csv',
  'data/hmda/florida/lei_to_nmls_mapping.csv',
  'data/hmda/florida/_gleif_name_cache.json',
  'docs/lend-nat-016-search-index.json',
];
