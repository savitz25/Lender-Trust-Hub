import { getMatchedHmdaSlugs, loadHmdaFloridaData, MAJOR_FLORIDA_COUNTY_SLUGS } from '@/lib/hmda';
import { getLenderBySlug } from '@/lib/lenders';

export type AnalyzerLenderOption = {
  slug: string;
  name: string;
  nmlsId: string;
  floridaOriginations: number;
};

export type AnalyzerCountyOption = {
  slug: string;
  name: string;
  originations: number;
};

/** HMDA-matched lenders for the analyzer dropdown (server-side). */
export function getAnalyzerLenderOptions(): AnalyzerLenderOption[] {
  const { mappings, stateSummaries } = loadHmdaFloridaData();
  const bySlug = new Map<string, AnalyzerLenderOption>();

  for (const m of mappings) {
    if (!m.ourLenderSlug) continue;
    const summary = stateSummaries.find((s) => s.lei === m.lei);
    const catalog = getLenderBySlug(m.ourLenderSlug);
    const orig =
      summary?.floridaOriginations ?? m.floridaOriginations ?? 0;
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

  // Ensure all matched slugs appear even if mapping load order differs
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

export function getAnalyzerCountyOptions(): AnalyzerCountyOption[] {
  const { countyMarkets } = loadHmdaFloridaData();
  return countyMarkets
    .filter((c) => MAJOR_FLORIDA_COUNTY_SLUGS.has(c.countySlug))
    .map((c) => ({
      slug: c.countySlug,
      name: c.countyName,
      originations: c.originations,
    }))
    .sort((a, b) => b.originations - a.originations);
}
