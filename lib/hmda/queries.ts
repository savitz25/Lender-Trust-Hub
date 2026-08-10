import { loadAllHmdaStateData, loadHmdaStateData, type HmdaStateBundle } from './load';
import {
  HMDA_STATE_CONFIGS,
  hmdaStateFromSlug,
  type HmdaStateCode,
} from './states';
import {
  HMDA_SOURCE_LABEL,
  HMDA_SOURCE_NOTE,
  type HmdaCountyEvidence,
  type HmdaLenderEvidence,
  type HmdaLoanTypeMix,
} from './types';

/** @deprecated Use HMDA_STATE_CONFIGS.FL.majorCountySlugs */
export const MAJOR_FLORIDA_COUNTY_SLUGS = HMDA_STATE_CONFIGS.FL.majorCountySlugs;

export const MAJOR_TEXAS_COUNTY_SLUGS = HMDA_STATE_CONFIGS.TX.majorCountySlugs;

export const MAJOR_GEORGIA_COUNTY_SLUGS = HMDA_STATE_CONFIGS.GA.majorCountySlugs;

export const MAJOR_CALIFORNIA_COUNTY_SLUGS = HMDA_STATE_CONFIGS.CA.majorCountySlugs;

export const MAJOR_NORTH_CAROLINA_COUNTY_SLUGS = HMDA_STATE_CONFIGS.NC.majorCountySlugs;

export const MAJOR_SOUTH_CAROLINA_COUNTY_SLUGS = HMDA_STATE_CONFIGS.SC.majorCountySlugs;

export const MAJOR_NEW_JERSEY_COUNTY_SLUGS = HMDA_STATE_CONFIGS.NJ.majorCountySlugs;

export const MAJOR_NEW_YORK_COUNTY_SLUGS = HMDA_STATE_CONFIGS.NY.majorCountySlugs;

export const MAJOR_PENNSYLVANIA_COUNTY_SLUGS = HMDA_STATE_CONFIGS.PA.majorCountySlugs;

export const MAJOR_MASSACHUSETTS_COUNTY_SLUGS = HMDA_STATE_CONFIGS.MA.majorCountySlugs;

export const MAJOR_RHODE_ISLAND_COUNTY_SLUGS = HMDA_STATE_CONFIGS.RI.majorCountySlugs;

export const MAJOR_VERMONT_COUNTY_SLUGS = HMDA_STATE_CONFIGS.VT.majorCountySlugs;

export const MAJOR_MAINE_COUNTY_SLUGS = HMDA_STATE_CONFIGS.ME.majorCountySlugs;

export const MAJOR_CONNECTICUT_COUNTY_SLUGS = HMDA_STATE_CONFIGS.CT.majorCountySlugs;

export const MAJOR_NEW_HAMPSHIRE_COUNTY_SLUGS = HMDA_STATE_CONFIGS.NH.majorCountySlugs;

export const MAJOR_VIRGINIA_COUNTY_SLUGS = HMDA_STATE_CONFIGS.VA.majorCountySlugs;

export const MAJOR_MARYLAND_COUNTY_SLUGS = HMDA_STATE_CONFIGS.MD.majorCountySlugs;

export const MAJOR_DELAWARE_COUNTY_SLUGS = HMDA_STATE_CONFIGS.DE.majorCountySlugs;

export const MAJOR_DISTRICT_OF_COLUMBIA_COUNTY_SLUGS = HMDA_STATE_CONFIGS.DC.majorCountySlugs;

export const MAJOR_TENNESSEE_COUNTY_SLUGS = HMDA_STATE_CONFIGS.TN.majorCountySlugs;

export const MAJOR_ILLINOIS_COUNTY_SLUGS = HMDA_STATE_CONFIGS.IL.majorCountySlugs;

export const MAJOR_OHIO_COUNTY_SLUGS = HMDA_STATE_CONFIGS.OH.majorCountySlugs;

export const MAJOR_MICHIGAN_COUNTY_SLUGS = HMDA_STATE_CONFIGS.MI.majorCountySlugs;

export const MAJOR_INDIANA_COUNTY_SLUGS = HMDA_STATE_CONFIGS.IN.majorCountySlugs;

export const MAJOR_ARIZONA_COUNTY_SLUGS = HMDA_STATE_CONFIGS.AZ.majorCountySlugs;

export const MAJOR_COLORADO_COUNTY_SLUGS = HMDA_STATE_CONFIGS.CO.majorCountySlugs;

export const MAJOR_WISCONSIN_COUNTY_SLUGS = HMDA_STATE_CONFIGS.WI.majorCountySlugs;

export const MAJOR_MINNESOTA_COUNTY_SLUGS = HMDA_STATE_CONFIGS.MN.majorCountySlugs;

export const MAJOR_MISSOURI_COUNTY_SLUGS = HMDA_STATE_CONFIGS.MO.majorCountySlugs;

export const MAJOR_KENTUCKY_COUNTY_SLUGS = HMDA_STATE_CONFIGS.KY.majorCountySlugs;

export const MAJOR_UTAH_COUNTY_SLUGS = HMDA_STATE_CONFIGS.UT.majorCountySlugs;

export const MAJOR_NEVADA_COUNTY_SLUGS = HMDA_STATE_CONFIGS.NV.majorCountySlugs;

export const MAJOR_OREGON_COUNTY_SLUGS = HMDA_STATE_CONFIGS.OR.majorCountySlugs;

export const MAJOR_WASHINGTON_COUNTY_SLUGS = HMDA_STATE_CONFIGS.WA.majorCountySlugs;

export const MAJOR_ALABAMA_COUNTY_SLUGS = HMDA_STATE_CONFIGS.AL.majorCountySlugs;

export const MAJOR_LOUISIANA_COUNTY_SLUGS = HMDA_STATE_CONFIGS.LA.majorCountySlugs;

function parseTopCounties(raw: string): { name: string; originations: number }[] {
  if (!raw.trim()) return [];
  return raw
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const colon = part.match(/^(.*?):(\d+)$/);
      if (colon) return { name: colon[1].trim(), originations: Number(colon[2]) || 0 };
      const paren = part.match(/^(.*)\s+\((\d+)\)$/);
      if (paren) return { name: paren[1].trim(), originations: Number(paren[2]) || 0 };
      return { name: part, originations: 0 };
    });
}

function mixFromSummary(s: {
  conventionalPct: number;
  fhaPct: number;
  vaPct: number;
  usdaPct: number;
  conventionalOrig: number;
  fhaOrig: number;
  vaOrig: number;
  usdaOrig: number;
}): HmdaLoanTypeMix {
  return {
    conventionalPct: s.conventionalPct,
    fhaPct: s.fhaPct,
    vaPct: s.vaPct,
    usdaPct: s.usdaPct,
    conventionalOrig: s.conventionalOrig,
    fhaOrig: s.fhaOrig,
    vaOrig: s.vaOrig,
    usdaOrig: s.usdaOrig,
  };
}

function evidenceForBundle(
  slug: string,
  bundle: HmdaStateBundle
): Omit<
  HmdaLenderEvidence,
  'otherStates' | 'floridaOriginations' | 'floridaApplications'
> | null {
  const { mappings, stateSummaries, countyActivity, config } = bundle;
  const matched = mappings.filter((m) => m.ourLenderSlug === slug);
  if (matched.length === 0) return null;

  const mapping = [...matched].sort(
    (a, b) => (b.stateOriginations || 0) - (a.stateOriginations || 0)
  )[0]!;
  const leis = new Set(matched.map((m) => m.lei));

  const summary =
    stateSummaries.find((s) => s.lei === mapping.lei) ||
    stateSummaries.find((s) => s.ourLenderSlug === slug);

  const counties = countyActivity
    .filter((a) => leis.has(a.lei))
    .reduce<
      {
        countyName: string;
        countySlug: string;
        originations: number;
        marketSharePct: number | null;
      }[]
    >((acc, a) => {
      const existing = acc.find((x) => x.countySlug === a.countySlug);
      if (existing) {
        existing.originations += a.originations;
        if (a.countyMarketSharePct != null) {
          existing.marketSharePct =
            (existing.marketSharePct ?? 0) + (a.countyMarketSharePct ?? 0);
        }
      } else {
        acc.push({
          countyName: a.countyName,
          countySlug: a.countySlug,
          originations: a.originations,
          marketSharePct: a.countyMarketSharePct,
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.originations - a.originations);

  const topFromActivity = counties.slice(0, 5).map((c) => ({
    name: c.countyName,
    originations: c.originations,
  }));

  const topCounties =
    topFromActivity.length > 0
      ? topFromActivity
      : parseTopCounties(summary?.topCounties || '');

  let stateOriginations =
    summary?.stateOriginations ?? mapping.stateOriginations ?? null;
  let stateApplications = summary?.stateApplications ?? null;
  if (matched.length > 1) {
    const related = stateSummaries.filter((s) => leis.has(s.lei));
    if (related.length > 0) {
      stateOriginations = related.reduce((n, s) => n + s.stateOriginations, 0);
      stateApplications = related.reduce((n, s) => n + s.stateApplications, 0);
    }
  }

  return {
    lei: mapping.lei,
    institutionName: mapping.institutionName || summary?.institutionName || slug,
    nmlsId: mapping.nmlsId || summary?.nmlsId || null,
    slug,
    year: summary?.year || mapping.year || 2025,
    state: config.code,
    stateName: config.name,
    stateSlug: config.stateSlug,
    stateOriginations,
    stateApplications,
    countiesWithActivity:
      counties.length > 0
        ? counties.length
        : summary?.countiesWithActivity && summary.countiesWithActivity > 0
          ? summary.countiesWithActivity
          : null,
    topCounties,
    loanTypeMix: summary ? mixFromSummary(summary) : null,
    countyShares: counties
      .filter((c) => c.marketSharePct != null && c.marketSharePct >= 1)
      .slice(0, 6)
      .map((c) => ({
        countyName: c.countyName,
        countySlug: c.countySlug,
        originations: c.originations,
        marketSharePct: c.marketSharePct,
      })),
    source: summary?.source || HMDA_SOURCE_LABEL,
    sourceNote: HMDA_SOURCE_NOTE,
  };
}

/**
 * Lender evidence across all active product states (36: FL–LA including OR, WA, AL, LA).
 * Primary = highest state originations; otherStates lists secondary markets.
 */
export function getHmdaLenderEvidenceBySlug(slug: string): HmdaLenderEvidence | null {
  const slices: (ReturnType<typeof evidenceForBundle> & {
    stateOriginations: number | null;
  })[] = [];

  for (const bundle of loadAllHmdaStateData()) {
    const e = evidenceForBundle(slug, bundle);
    if (e) slices.push(e);
  }

  if (slices.length === 0) return null;

  slices.sort(
    (a, b) => (b.stateOriginations ?? 0) - (a.stateOriginations ?? 0)
  );
  const primary = slices[0]!;
  const otherStates = slices.slice(1).map((s) => ({
    stateCode: s.state,
    stateName: s.stateName,
    originations: s.stateOriginations ?? 0,
  }));

  // Florida originations for CFPB normalization (prefer real FL slice)
  const flSlice = slices.find((s) => s.state === 'FL');
  const floridaOriginations =
    flSlice?.stateOriginations ??
    (primary.state === 'FL' ? primary.stateOriginations : null);
  const floridaApplications =
    flSlice?.stateApplications ??
    (primary.state === 'FL' ? primary.stateApplications : null);

  return {
    ...primary,
    floridaOriginations,
    floridaApplications,
    otherStates,
  };
}

/** County market intelligence for major counties in product states. */
export function getHmdaCountyEvidence(
  stateSlug: string,
  countySlug: string
): HmdaCountyEvidence | null {
  const cfg = hmdaStateFromSlug(stateSlug);
  if (!cfg) return null;
  if (!cfg.majorCountySlugs.has(countySlug)) return null;

  const { countyMarkets, countyActivity, mappings } = loadHmdaStateData(cfg.code);
  const market = countyMarkets.find((c) => c.countySlug === countySlug);
  if (!market) return null;

  const slugByLei = new Map(
    mappings.filter((m) => m.ourLenderSlug).map((m) => [m.lei, m.ourLenderSlug])
  );
  const nameByLei = new Map(mappings.map((m) => [m.lei, m.institutionName]));

  const topMatchedLenders = countyActivity
    .filter((a) => a.countySlug === countySlug && a.originations > 0)
    .sort((a, b) => b.originations - a.originations)
    .slice(0, 12)
    .map((a) => ({
      name: a.institutionName || nameByLei.get(a.lei) || a.lei,
      slug: slugByLei.get(a.lei) || null,
      lei: a.lei,
      originations: a.originations,
      marketSharePct: a.countyMarketSharePct,
    }));

  return {
    countyName: market.countyName,
    countySlug: market.countySlug,
    state: market.state,
    stateSlug: cfg.stateSlug,
    year: market.year,
    applications: market.applications,
    originations: market.originations,
    denialRatePct: market.denialRatePct,
    loanTypeMix: mixFromSummary(market),
    purchasePct: market.purchasePct,
    refinancePct: market.refinancePct,
    purchaseOrig: market.purchaseOrig,
    refinanceOrig: market.refinanceOrig,
    topMatchedLenders,
    source: market.source || HMDA_SOURCE_LABEL,
    sourceNote: market.sourceNote || HMDA_SOURCE_NOTE,
  };
}

export function getMatchedHmdaSlugs(): string[] {
  const slugs = new Set<string>();
  for (const bundle of loadAllHmdaStateData()) {
    for (const m of bundle.mappings) {
      if (m.ourLenderSlug) slugs.add(m.ourLenderSlug);
    }
  }
  return [...slugs];
}

export function getHmdaCountySlugsForState(stateSlug: string): string[] {
  const cfg = hmdaStateFromSlug(stateSlug);
  if (!cfg) return [];
  return loadHmdaStateData(cfg.code)
    .countyMarkets.map((c) => c.countySlug)
    .filter((s) => cfg.majorCountySlugs.has(s));
}

export function getHmdaProductStates(): { code: HmdaStateCode; name: string; stateSlug: string }[] {
  return Object.values(HMDA_STATE_CONFIGS).map((c) => ({
    code: c.code,
    name: c.name,
    stateSlug: c.stateSlug,
  }));
}
