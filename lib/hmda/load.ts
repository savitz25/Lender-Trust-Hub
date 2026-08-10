import fs from 'fs';
import path from 'path';
import { parseCsv, num, numOrNull } from './parse-csv';
import type {
  HmdaCountyMarketSummary,
  HmdaLeiMapping,
  HmdaLenderCountyActivity,
  HmdaLenderStateSummary,
} from './types';
import {
  HMDA_ACTIVE_STATE_CODES,
  HMDA_STATE_CONFIGS,
  type HmdaStateCode,
  type HmdaStateConfig,
} from './states';

export type HmdaStateBundle = {
  code: HmdaStateCode;
  config: HmdaStateConfig;
  mappings: HmdaLeiMapping[];
  stateSummaries: HmdaLenderStateSummary[];
  countyActivity: HmdaLenderCountyActivity[];
  countyMarkets: HmdaCountyMarketSummary[];
};

const bundleCache = new Map<HmdaStateCode, HmdaStateBundle>();

function dataDir(cfg: HmdaStateConfig): string {
  return path.join(process.cwd(), 'data', 'hmda', cfg.dataFolder);
}

function readCsvFile(cfg: HmdaStateConfig, filename: string): Record<string, string>[] {
  const filePath = path.join(dataDir(cfg), filename);
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

/**
 * Align HMDA names with directory URL slugs when they diverge.
 * Manhattan: HMDA "New York" county → site `/local-lenders/new-york/new-york-county`.
 */
export function resolveHmdaCountySlug(
  cfg: HmdaStateConfig,
  countyName: string,
  countyFips?: string
): string {
  const fips = (countyFips || '').trim();
  if (cfg.code === 'NY' && (fips === '36061' || countyNameToSlug(countyName) === 'new-york')) {
    return 'new-york-county';
  }
  return countyNameToSlug(countyName);
}

function loadMappings(cfg: HmdaStateConfig): HmdaLeiMapping[] {
  return readCsvFile(cfg, 'lei_to_nmls_mapping.csv').map((r) => ({
    lei: r.lei,
    institutionName: r.institution_name_hmda || r.institution_name || r.legal_name || '',
    nmlsId: r.nmls_id || '',
    ourLenderSlug: (r.our_lender_slug || '').trim(),
    matchMethod: r.match_method || '',
    // Column may be florida_originations or texas_originations
    stateOriginations: num(
      r[cfg.originationsColumn] ??
        r.florida_originations ??
        r.texas_originations ??
        r.georgia_originations ??
        r.california_originations ??
        r.north_carolina_originations ??
        r.south_carolina_originations ??
        r.new_jersey_originations ??
        r.new_york_originations ??
        r.pennsylvania_originations ??
        r.massachusetts_originations ??
        r.rhode_island_originations ??
        r.vermont_originations ??
        r.maine_originations ??
        r.connecticut_originations ??
        r.new_hampshire_originations ??
        r.virginia_originations ??
        r.maryland_originations ??
        r.delaware_originations ??
        r.district_of_columbia_originations ??
        r.tennessee_originations ??
        r.illinois_originations ??
        r.ohio_originations
    ),
    // Legacy alias used by older FL-only code paths
    floridaOriginations: num(
      r[cfg.originationsColumn] ??
        r.florida_originations ??
        r.texas_originations ??
        r.georgia_originations ??
        r.california_originations ??
        r.north_carolina_originations ??
        r.south_carolina_originations ??
        r.new_jersey_originations ??
        r.new_york_originations ??
        r.pennsylvania_originations ??
        r.massachusetts_originations ??
        r.rhode_island_originations ??
        r.vermont_originations ??
        r.maine_originations ??
        r.connecticut_originations ??
        r.new_hampshire_originations ??
        r.virginia_originations ??
        r.maryland_originations ??
        r.delaware_originations ??
        r.district_of_columbia_originations ??
        r.tennessee_originations ??
        r.illinois_originations ??
        r.ohio_originations
    ),
    year: num(r.year) || 2025,
    state: cfg.code,
  }));
}

function loadStateSummaries(cfg: HmdaStateConfig): HmdaLenderStateSummary[] {
  const maps = loadMappings(cfg);
  const nameByLei = new Map(maps.map((m) => [m.lei, m.institutionName]));
  const slugByLei = new Map(
    maps.filter((m) => m.ourLenderSlug).map((m) => [m.lei, m.ourLenderSlug])
  );
  const nmlsByLei = new Map(maps.map((m) => [m.lei, m.nmlsId]));

  const file = `lender_state_summary${cfg.fileSuffix}.csv`;
  return readCsvFile(cfg, file).map((r) => {
    const lei = r.lei;
    const originations = num(r.total_originations ?? r.florida_originations);
    const applications = num(r.total_applications ?? r.florida_applications);
    return {
      lei,
      institutionName: r.institution_name || nameByLei.get(lei) || '',
      nmlsId: r.nmls_id || nmlsByLei.get(lei) || '',
      ourLenderSlug: r.our_lender_slug || slugByLei.get(lei) || '',
      year: num(r.year) || 2025,
      state: r.state || cfg.code,
      stateApplications: applications,
      stateOriginations: originations,
      floridaApplications: applications,
      floridaOriginations: originations,
      floridaDenials: num(r.denial_count ?? r.florida_denials),
      denialRatePct: num(r.denial_rate_pct),
      countiesWithActivity: 0,
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

function loadCountyActivity(cfg: HmdaStateConfig): HmdaLenderCountyActivity[] {
  const file = `lender_activity_by_county${cfg.fileSuffix}.csv`;
  return readCsvFile(cfg, file).map((r) => {
    const countyName = r.county_name || '';
    const countyFips = r.county_fips || '';
    return {
      lei: r.lei,
      institutionName: r.institution_name || '',
      countyFips,
      countyName,
      countySlug: resolveHmdaCountySlug(cfg, countyName, countyFips),
      state: r.state || cfg.code,
      year: num(r.year) || 2025,
      originations: num(r.originations),
      countyMarketSharePct: numOrNull(r.market_share_orig_pct ?? r.county_market_share_pct),
      source: '2025 HMDA',
    };
  });
}

function loadCountyMarkets(cfg: HmdaStateConfig): HmdaCountyMarketSummary[] {
  const file = `county_market_summary${cfg.fileSuffix}.csv`;
  return readCsvFile(cfg, file).map((r) => {
    const countyName = r.county_name || '';
    const countyFips = r.county_fips || '';
    return {
      countyFips,
      countyName,
      countySlug: resolveHmdaCountySlug(cfg, countyName, countyFips),
      state: r.state || cfg.code,
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
          ? `Priority ${cfg.name} market. Denial rate = denials ÷ applications (HMDA cleaned extract).`
          : 'Denial rate = denials ÷ applications (HMDA cleaned extract).',
    };
  });
}

export function loadHmdaStateData(code: HmdaStateCode): HmdaStateBundle {
  const cached = bundleCache.get(code);
  if (cached) return cached;

  const config = HMDA_STATE_CONFIGS[code];
  const mappings = loadMappings(config);
  const countyActivity = loadCountyActivity(config);
  const nameByLei = new Map(mappings.map((m) => [m.lei, m.institutionName]));

  for (const row of countyActivity) {
    if (!row.institutionName) {
      row.institutionName = nameByLei.get(row.lei) || row.lei;
    }
  }

  const stateSummaries = loadStateSummaries(config).map((s) => {
    const counties = new Set(
      countyActivity.filter((a) => a.lei === s.lei && a.originations > 0).map((a) => a.countySlug)
    );
    return {
      ...s,
      institutionName: s.institutionName || nameByLei.get(s.lei) || s.lei,
      countiesWithActivity: counties.size,
    };
  });

  const bundle: HmdaStateBundle = {
    code,
    config,
    mappings,
    stateSummaries,
    countyActivity,
    countyMarkets: loadCountyMarkets(config),
  };
  bundleCache.set(code, bundle);
  return bundle;
}

/** @deprecated Use loadHmdaStateData('FL') — kept for existing imports. */
export function loadHmdaFloridaData() {
  return loadHmdaStateData('FL');
}

export function loadAllHmdaStateData(): HmdaStateBundle[] {
  return HMDA_ACTIVE_STATE_CODES.map((c) => loadHmdaStateData(c));
}

export function hmdaDataAvailable(code: HmdaStateCode = 'FL'): boolean {
  const cfg = HMDA_STATE_CONFIGS[code];
  return fs.existsSync(
    path.join(dataDir(cfg), `county_market_summary${cfg.fileSuffix}.csv`)
  );
}
