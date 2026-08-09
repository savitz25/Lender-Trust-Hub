import { loadHmdaFloridaData } from './load';
import {
  HMDA_SOURCE_LABEL,
  HMDA_SOURCE_NOTE,
  type HmdaCountyEvidence,
  type HmdaLenderEvidence,
  type HmdaLoanTypeMix,
} from './types';

/** Major FL counties for first-pass market intelligence panels (high volume). */
export const MAJOR_FLORIDA_COUNTY_SLUGS = new Set([
  'miami-dade',
  'broward',
  'palm-beach',
  'hillsborough',
  'orange',
  'duval',
  'pinellas',
  'lee',
  'polk',
  'brevard',
  'volusia',
  'pasco',
  'seminole',
  'sarasota',
  'manatee',
  'collier',
  'osceola',
  'lake',
  'marion',
  'st-johns',
  'st-lucie',
]);

function parseTopCounties(raw: string): { name: string; originations: number }[] {
  if (!raw.trim()) return [];
  // Formats: "Broward:4462; Miami-Dade:4456" or "Broward (4462); Miami-Dade (4456)"
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

/** Lender evidence for a directory profile slug (matched LEIs only). */
export function getHmdaLenderEvidenceBySlug(slug: string): HmdaLenderEvidence | null {
  const { mappings, stateSummaries, countyActivity } = loadHmdaFloridaData();
  const matched = mappings.filter((m) => m.ourLenderSlug === slug);
  if (matched.length === 0) return null;

  // Prefer highest Florida volume LEI if multiple map to same slug
  const mapping = [...matched].sort((a, b) => b.floridaOriginations - a.floridaOriginations)[0];
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

  // Aggregate originations across matched LEIs for this slug when present
  let floridaOriginations = summary?.floridaOriginations ?? mapping.floridaOriginations ?? null;
  let floridaApplications = summary?.floridaApplications ?? null;
  if (matched.length > 1) {
    const related = stateSummaries.filter((s) => leis.has(s.lei));
    if (related.length > 0) {
      floridaOriginations = related.reduce((n, s) => n + s.floridaOriginations, 0);
      floridaApplications = related.reduce((n, s) => n + s.floridaApplications, 0);
    }
  }

  return {
    lei: mapping.lei,
    institutionName: mapping.institutionName || summary?.institutionName || slug,
    nmlsId: mapping.nmlsId || summary?.nmlsId || null,
    slug,
    year: summary?.year || mapping.year || 2025,
    state: summary?.state || 'FL',
    floridaOriginations,
    floridaApplications,
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

/** County market intelligence for major Florida counties. */
export function getHmdaCountyEvidence(
  stateSlug: string,
  countySlug: string
): HmdaCountyEvidence | null {
  if (stateSlug !== 'florida' && stateSlug !== 'fl') return null;
  if (!MAJOR_FLORIDA_COUNTY_SLUGS.has(countySlug)) return null;

  const { countyMarkets, countyActivity, mappings } = loadHmdaFloridaData();
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
  return [
    ...new Set(
      loadHmdaFloridaData()
        .mappings.map((m) => m.ourLenderSlug)
        .filter(Boolean)
    ),
  ];
}

export function getHmdaCountySlugsForState(stateSlug: string): string[] {
  if (stateSlug !== 'florida' && stateSlug !== 'fl') return [];
  return loadHmdaFloridaData()
    .countyMarkets.map((c) => c.countySlug)
    .filter((s) => MAJOR_FLORIDA_COUNTY_SLUGS.has(s));
}
