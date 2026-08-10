import {
  getMatchedHmdaSlugs,
  loadAllHmdaStateData,
  loadHmdaStateData,
  MAJOR_FLORIDA_COUNTY_SLUGS,
  MAJOR_TEXAS_COUNTY_SLUGS,
} from '@/lib/hmda';
import { getLenderBySlug } from '@/lib/lenders';

export type AnalyzerLenderOption = {
  slug: string;
  name: string;
  nmlsId: string;
  /** Combined product-state originations (FL+TX) for sort/display */
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
        existing.floridaOriginations += orig;
        continue;
      }
      bySlug.set(m.ourLenderSlug, {
        slug: m.ourLenderSlug,
        name: catalog?.name || m.institutionName || m.ourLenderSlug,
        nmlsId: m.nmlsId || catalog?.nmlsId || '',
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
      floridaOriginations: 0,
    });
  }

  return [...bySlug.values()].sort(
    (a, b) => b.floridaOriginations - a.floridaOriginations || a.name.localeCompare(b.name)
  );
}

/** Major FL + TX counties for optional market context (prefixed names). */
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

  return out.sort((a, b) => b.originations - a.originations);
}
