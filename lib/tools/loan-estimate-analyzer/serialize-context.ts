import { getHmdaCountyEvidence, getHmdaLenderEvidenceBySlug } from '@/lib/hmda';
import type { FredMortgageBenchmarks } from '@/lib/fred';
import { getFredMortgageBenchmarks } from '@/lib/fred/server';
import type { HmdaAnalyzerCountyContext, HmdaAnalyzerLenderContext } from './types';
import { parseAnalyzerCountyOption } from './county-option';
import {
  getAnalyzerCountyOptions,
  getAnalyzerLenderOptions,
  type AnalyzerCountyOption,
  type AnalyzerLenderOption,
} from './options';

function toLenderCtx(slug: string): HmdaAnalyzerLenderContext | null {
  const e = getHmdaLenderEvidenceBySlug(slug);
  if (!e) return null;
  const stateOrig = e.stateOriginations ?? e.floridaOriginations;
  return {
    slug: e.slug,
    name: e.institutionName,
    nmlsId: e.nmlsId,
    primaryStateName: e.stateName,
    primaryStateCode: e.state,
    stateOriginations: stateOrig,
    floridaOriginations: stateOrig,
    countiesWithActivity: e.countiesWithActivity,
    topCounties: e.topCounties,
    conventionalPct: e.loanTypeMix?.conventionalPct ?? null,
    fhaPct: e.loanTypeMix?.fhaPct ?? null,
    vaPct: e.loanTypeMix?.vaPct ?? null,
    source: e.source,
    profileHref: `/lenders/${e.slug}`,
  };
}

function toCountyCtx(optionSlug: string): HmdaAnalyzerCountyContext | null {
  const parsed = parseAnalyzerCountyOption(optionSlug);
  if (!parsed) return null;
  const e = getHmdaCountyEvidence(parsed.stateSlug, parsed.countySlug);
  if (!e) return null;
  const stateName =
    e.stateSlug === 'texas'
      ? 'Texas'
      : e.stateSlug === 'georgia'
        ? 'Georgia'
        : e.stateSlug === 'california'
          ? 'California'
          : e.stateSlug === 'florida'
            ? 'Florida'
            : e.state;
  return {
    countyName: e.countyName,
    countySlug: e.countySlug,
    stateName,
    stateSlug: e.stateSlug,
    applications: e.applications,
    originations: e.originations,
    denialRatePct: e.denialRatePct,
    conventionalPct: e.loanTypeMix.conventionalPct,
    fhaPct: e.loanTypeMix.fhaPct,
    vaPct: e.loanTypeMix.vaPct,
    purchasePct: e.purchasePct,
    refinancePct: e.refinancePct,
    source: e.source,
    countyHref: `/local-lenders/${e.stateSlug}/${e.countySlug}`,
  };
}

export type AnalyzerBootstrap = {
  lenders: AnalyzerLenderOption[];
  counties: AnalyzerCountyOption[];
  lenderContextBySlug: Record<string, HmdaAnalyzerLenderContext>;
  countyContextBySlug: Record<string, HmdaAnalyzerCountyContext>;
  /** National mortgage rate benchmarks (FRED) — null payload still includes unavailable flags */
  mortgageBenchmarks: FredMortgageBenchmarks;
};

/** Server-only: serialize HMDA + FRED context the client tools need. */
export async function buildAnalyzerBootstrap(): Promise<AnalyzerBootstrap> {
  const lenders = getAnalyzerLenderOptions();
  const counties = getAnalyzerCountyOptions();
  const lenderContextBySlug: Record<string, HmdaAnalyzerLenderContext> = {};
  const countyContextBySlug: Record<string, HmdaAnalyzerCountyContext> = {};

  for (const l of lenders) {
    const ctx = toLenderCtx(l.slug);
    if (ctx) {
      // Prefer directory display name when richer
      lenderContextBySlug[l.slug] = { ...ctx, name: l.name || ctx.name };
    }
  }
  for (const c of counties) {
    const ctx = toCountyCtx(c.slug);
    if (ctx) countyContextBySlug[c.slug] = ctx;
  }

  const mortgageBenchmarks = await getFredMortgageBenchmarks();

  return {
    lenders,
    counties,
    lenderContextBySlug,
    countyContextBySlug,
    mortgageBenchmarks,
  };
}
