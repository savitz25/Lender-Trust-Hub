import fs from 'fs';
import path from 'path';
import { parseCsv, num, numOrNull } from './parse-csv';
import type {
  HmdaCountyMarketSummary,
  HmdaLeiMapping,
  HmdaLenderCountyActivity,
  HmdaLenderStateSummary,
} from './types';

const DATA_DIR = path.join(process.cwd(), 'data', 'hmda', 'florida');

let cache: {
  mappings: HmdaLeiMapping[];
  stateSummaries: HmdaLenderStateSummary[];
  countyActivity: HmdaLenderCountyActivity[];
  countyMarkets: HmdaCountyMarketSummary[];
} | null = null;

function readCsvFile(filename: string): Record<string, string>[] {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  return parseCsv(fs.readFileSync(filePath, 'utf-8'));
}

/** HMDA county_name → site countySlug */
export function countyNameToSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/'/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function loadMappings(): HmdaLeiMapping[] {
  return readCsvFile('lei_to_nmls_mapping.csv').map((r) => ({
    lei: r.lei,
    institutionName: r.institution_name_hmda || r.institution_name || r.legal_name || '',
    nmlsId: r.nmls_id || '',
    ourLenderSlug: (r.our_lender_slug || '').trim(),
    matchMethod: r.match_method || '',
    floridaOriginations: num(r.florida_originations),
    year: num(r.year) || 2025,
  }));
}

function loadStateSummaries(): HmdaLenderStateSummary[] {
  const nameByLei = new Map(loadMappings().map((m) => [m.lei, m.institutionName]));
  const slugByLei = new Map(
    loadMappings()
      .filter((m) => m.ourLenderSlug)
      .map((m) => [m.lei, m.ourLenderSlug])
  );
  const nmlsByLei = new Map(loadMappings().map((m) => [m.nmlsId ? m.lei : m.lei, m.nmlsId]));

  return readCsvFile('lender_state_summary_fl.csv').map((r) => {
    const lei = r.lei;
    return {
      lei,
      institutionName: r.institution_name || nameByLei.get(lei) || '',
      nmlsId: r.nmls_id || nmlsByLei.get(lei) || '',
      ourLenderSlug: r.our_lender_slug || slugByLei.get(lei) || '',
      year: num(r.year) || 2025,
      state: r.state || 'FL',
      floridaApplications: num(r.total_applications ?? r.florida_applications),
      floridaOriginations: num(r.total_originations ?? r.florida_originations),
      floridaDenials: num(r.denial_count ?? r.florida_denials),
      denialRatePct: num(r.denial_rate_pct),
      countiesWithActivity: 0, // derived in queries from activity file
      topCounties: r.top_counties_served || r.top_counties || '',
      conventionalOrig: num(r.orig_conventional ?? r.conventional_orig),
      fhaOrig: num(r.orig_fha ?? r.fha_orig),
      vaOrig: num(r.orig_va ?? r.va_orig),
      usdaOrig: num(r.orig_usda_other ?? r.usda_orig),
      conventionalPct: num(r.orig_conventional_pct ?? r.conventional_pct),
      fhaPct: num(r.orig_fha_pct ?? r.fha_pct),
      vaPct: num(r.orig_va_pct ?? r.va_pct),
      usdaPct: num(r.orig_usda_other_pct ?? r.usda_pct),
      source: '2025 HMDA',
    };
  });
}

function loadCountyActivity(): HmdaLenderCountyActivity[] {
  return readCsvFile('lender_activity_by_county_fl.csv').map((r) => {
    const countyName = r.county_name || '';
    return {
      lei: r.lei,
      institutionName: r.institution_name || '',
      countyFips: r.county_fips,
      countyName,
      countySlug: countyNameToSlug(countyName),
      state: r.state || 'FL',
      year: num(r.year) || 2025,
      originations: num(r.originations),
      countyMarketSharePct: numOrNull(r.market_share_orig_pct ?? r.county_market_share_pct),
      source: '2025 HMDA',
    };
  });
}

function loadCountyMarkets(): HmdaCountyMarketSummary[] {
  return readCsvFile('county_market_summary_fl.csv').map((r) => {
    const countyName = r.county_name || '';
    return {
      countyFips: r.county_fips,
      countyName,
      countySlug: countyNameToSlug(countyName),
      state: r.state || 'FL',
      year: num(r.year) || 2025,
      applications: num(r.total_applications ?? r.applications),
      originations: num(r.total_originations ?? r.originations),
      denials: num(r.denial_count ?? r.denials),
      denialRatePct: num(r.denial_rate_pct),
      conventionalOrig: num(r.orig_conventional ?? r.conventional_orig),
      fhaOrig: num(r.orig_fha ?? r.fha_orig),
      vaOrig: num(r.orig_va ?? r.va_orig),
      usdaOrig: num(r.orig_usda_other ?? r.usda_orig),
      conventionalPct: num(r.orig_conventional_pct ?? r.conventional_pct),
      fhaPct: num(r.orig_fha_pct ?? r.fha_pct),
      vaPct: num(r.orig_va_pct ?? r.va_pct),
      usdaPct: num(r.orig_usda_other_pct ?? r.usda_pct),
      purchaseOrig: num(r.purchase_count ?? r.purchase_orig),
      refinanceOrig: num(r.refinance_count ?? r.refinance_orig),
      // Remote schema: purchase/refi % of applications; convert to share of purchase+refi for UI split
      purchasePct: (() => {
        const p = num(r.purchase_count ?? r.purchase_orig);
        const ref = num(r.refinance_count ?? r.refinance_orig);
        const base = p + ref;
        if (base > 0) return Math.round((1000 * p) / base) / 10;
        return num(r.purchase_pct ?? r.purchase_pct_of_apps);
      })(),
      refinancePct: (() => {
        const p = num(r.purchase_count ?? r.purchase_orig);
        const ref = num(r.refinance_count ?? r.refinance_orig);
        const base = p + ref;
        if (base > 0) return Math.round((1000 * ref) / base) / 10;
        return num(r.refinance_pct ?? r.refinance_pct_of_apps);
      })(),
      source: '2025 HMDA',
      sourceNote:
        r.priority_market === 'yes'
          ? 'Priority Florida market. Denial rate = denials ÷ applications (HMDA cleaned extract).'
          : 'Denial rate = denials ÷ applications (HMDA cleaned extract).',
    };
  });
}

export function loadHmdaFloridaData() {
  if (cache) return cache;
  const mappings = loadMappings();
  const countyActivity = loadCountyActivity();
  const nameByLei = new Map(mappings.map((m) => [m.lei, m.institutionName]));

  // Fill missing institution names on activity rows from mapping
  for (const row of countyActivity) {
    if (!row.institutionName) {
      row.institutionName = nameByLei.get(row.lei) || row.lei;
    }
  }

  const stateSummaries = loadStateSummaries().map((s) => {
    const counties = new Set(
      countyActivity.filter((a) => a.lei === s.lei && a.originations > 0).map((a) => a.countySlug)
    );
    return {
      ...s,
      institutionName: s.institutionName || nameByLei.get(s.lei) || s.lei,
      countiesWithActivity: counties.size,
    };
  });

  cache = {
    mappings,
    stateSummaries,
    countyActivity,
    countyMarkets: loadCountyMarkets(),
  };
  return cache;
}

export function hmdaDataAvailable(): boolean {
  return fs.existsSync(path.join(DATA_DIR, 'county_market_summary_fl.csv'));
}
