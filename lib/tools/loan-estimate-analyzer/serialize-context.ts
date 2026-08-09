import { getHmdaCountyEvidence, getHmdaLenderEvidenceBySlug } from '@/lib/hmda';
import type { HmdaAnalyzerCountyContext, HmdaAnalyzerLenderContext } from './types';
import {
  getAnalyzerCountyOptions,
  getAnalyzerLenderOptions,
  type AnalyzerCountyOption,
  type AnalyzerLenderOption,
} from './options';

function toLenderCtx(slug: string): HmdaAnalyzerLenderContext | null {
  const e = getHmdaLenderEvidenceBySlug(slug);
  if (!e) return null;
  return {
    slug: e.slug,
    name: e.institutionName,
    nmlsId: e.nmlsId,
    floridaOriginations: e.floridaOriginations,
    countiesWithActivity: e.countiesWithActivity,
    topCounties: e.topCounties,
    conventionalPct: e.loanTypeMix?.conventionalPct ?? null,
    fhaPct: e.loanTypeMix?.fhaPct ?? null,
    vaPct: e.loanTypeMix?.vaPct ?? null,
    source: e.source,
    profileHref: `/lenders/${e.slug}`,
  };
}

function toCountyCtx(slug: string): HmdaAnalyzerCountyContext | null {
  const e = getHmdaCountyEvidence('florida', slug);
  if (!e) return null;
  return {
    countyName: e.countyName,
    countySlug: e.countySlug,
    applications: e.applications,
    originations: e.originations,
    denialRatePct: e.denialRatePct,
    conventionalPct: e.loanTypeMix.conventionalPct,
    fhaPct: e.loanTypeMix.fhaPct,
    vaPct: e.loanTypeMix.vaPct,
    purchasePct: e.purchasePct,
    refinancePct: e.refinancePct,
    source: e.source,
    countyHref: `/local-lenders/florida/${e.countySlug}`,
  };
}

export type AnalyzerBootstrap = {
  lenders: AnalyzerLenderOption[];
  counties: AnalyzerCountyOption[];
  lenderContextBySlug: Record<string, HmdaAnalyzerLenderContext>;
  countyContextBySlug: Record<string, HmdaAnalyzerCountyContext>;
};

/** Server-only: serialize all HMDA context the client analyzer needs. */
export function buildAnalyzerBootstrap(): AnalyzerBootstrap {
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

  return { lenders, counties, lenderContextBySlug, countyContextBySlug };
}
