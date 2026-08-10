import {
  getMatchedHmdaSlugs,
  loadAllHmdaStateData,
  loadHmdaStateData,
  MAJOR_FLORIDA_COUNTY_SLUGS,
  MAJOR_TEXAS_COUNTY_SLUGS,
  MAJOR_GEORGIA_COUNTY_SLUGS,
  MAJOR_CALIFORNIA_COUNTY_SLUGS,
  MAJOR_NORTH_CAROLINA_COUNTY_SLUGS,
  MAJOR_SOUTH_CAROLINA_COUNTY_SLUGS,
  MAJOR_NEW_JERSEY_COUNTY_SLUGS,
  MAJOR_NEW_YORK_COUNTY_SLUGS,
} from '@/lib/hmda';
import { getLenderBySlug } from '@/lib/lenders';

export type AnalyzerLenderOption = {
  slug: string;
  name: string;
  nmlsId: string;
  /** Combined product-state originations for sort/display */
  originations: number;
  /** @deprecated Use originations */
  floridaOriginations: number;
};

export type AnalyzerCountyOption = {
  slug: string;
  name: string;
  originations: number;
  stateSlug: string;
};

/** HMDA-matched lenders for the analyzer dropdown (server-side). */
export function getAnalyzerLenderOptions(): AnalyzerLenderOption[] {
  const bySlug = new Map<string, AnalyzerLenderOption>();

  for (const bundle of loadAllHmdaStateData()) {
    const { mappings, stateSummaries } = bundle;
    for (const m of mappings) {
      if (!m.ourLenderSlug) continue;
      const summary = stateSummaries.find((s) => s.lei === m.lei);
      const catalog = getLenderBySlug(m.ourLenderSlug);
      const orig = summary?.stateOriginations ?? m.stateOriginations ?? 0;
      const existing = bySlug.get(m.ourLenderSlug);
      if (existing) {
        existing.originations += orig;
        existing.floridaOriginations = existing.originations;
        continue;
      }
      bySlug.set(m.ourLenderSlug, {
        slug: m.ourLenderSlug,
        name: catalog?.name || m.institutionName || m.ourLenderSlug,
        nmlsId: m.nmlsId || catalog?.nmlsId || '',
        originations: orig,
        floridaOriginations: orig,
      });
    }
  }

  for (const slug of getMatchedHmdaSlugs()) {
    if (bySlug.has(slug)) continue;
    const catalog = getLenderBySlug(slug);
    bySlug.set(slug, {
      slug,
      name: catalog?.name || slug,
      nmlsId: catalog?.nmlsId || '',
      originations: 0,
      floridaOriginations: 0,
    });
  }

  return [...bySlug.values()].sort(
    (a, b) => b.originations - a.originations || a.name.localeCompare(b.name)
  );
}

/** Major product-state counties for optional market context (prefixed names). */
export function getAnalyzerCountyOptions(): AnalyzerCountyOption[] {
  const out: AnalyzerCountyOption[] = [];

  const fl = loadHmdaStateData('FL');
  for (const c of fl.countyMarkets) {
    if (!MAJOR_FLORIDA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: c.countySlug,
      name: `${c.countyName} (FL)`,
      originations: c.originations,
      stateSlug: 'florida',
    });
  }

  const tx = loadHmdaStateData('TX');
  for (const c of tx.countyMarkets) {
    if (!MAJOR_TEXAS_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `tx:${c.countySlug}`,
      name: `${c.countyName} (TX)`,
      originations: c.originations,
      stateSlug: 'texas',
    });
  }

  const ga = loadHmdaStateData('GA');
  for (const c of ga.countyMarkets) {
    if (!MAJOR_GEORGIA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `ga:${c.countySlug}`,
      name: `${c.countyName} (GA)`,
      originations: c.originations,
      stateSlug: 'georgia',
    });
  }

  const ca = loadHmdaStateData('CA');
  for (const c of ca.countyMarkets) {
    if (!MAJOR_CALIFORNIA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `ca:${c.countySlug}`,
      name: `${c.countyName} (CA)`,
      originations: c.originations,
      stateSlug: 'california',
    });
  }

  const nc = loadHmdaStateData('NC');
  for (const c of nc.countyMarkets) {
    if (!MAJOR_NORTH_CAROLINA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `nc:${c.countySlug}`,
      name: `${c.countyName} (NC)`,
      originations: c.originations,
      stateSlug: 'north-carolina',
    });
  }

  const sc = loadHmdaStateData('SC');
  for (const c of sc.countyMarkets) {
    if (!MAJOR_SOUTH_CAROLINA_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `sc:${c.countySlug}`,
      name: `${c.countyName} (SC)`,
      originations: c.originations,
      stateSlug: 'south-carolina',
    });
  }

  const nj = loadHmdaStateData('NJ');
  for (const c of nj.countyMarkets) {
    if (!MAJOR_NEW_JERSEY_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `nj:${c.countySlug}`,
      name: `${c.countyName} (NJ)`,
      originations: c.originations,
      stateSlug: 'new-jersey',
    });
  }

  const ny = loadHmdaStateData('NY');
  for (const c of ny.countyMarkets) {
    if (!MAJOR_NEW_YORK_COUNTY_SLUGS.has(c.countySlug)) continue;
    out.push({
      slug: `ny:${c.countySlug}`,
      name: `${c.countyName} (NY)`,
      originations: c.originations,
      stateSlug: 'new-york',
    });
  }

  return out.sort((a, b) => b.originations - a.originations);
}
