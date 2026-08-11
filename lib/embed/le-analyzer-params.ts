/**
 * Stage C.2 — resolve embed query params for Loan Estimate Analyzer.
 */

import { normalizeState } from '@/lib/network/journey-context';
import { analyzerCountyOptionSlug } from '@/lib/tools/loan-estimate-analyzer/county-option';
import type { AnalyzerBootstrap } from '@/lib/tools/loan-estimate-analyzer/serialize-context';

function first(
  sp: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const v = sp[key];
  const s = Array.isArray(v) ? v[0] : v;
  const t = s?.trim();
  return t || undefined;
}

function normalizeCounty(raw?: string): string | undefined {
  if (!raw) return undefined;
  return (
    raw
      .toLowerCase()
      .replace(/county/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || undefined
  );
}

export type LeEmbedResolved = {
  lenderSlug: string;
  countyOptionSlug: string;
  embedSrc?: string;
  /** Soft note when URL params could not be fully applied */
  contextNote: string | null;
};

/**
 * Map URL params to bootstrap-valid lender + county option slugs.
 * Invalid values fail soft (ignored + note).
 */
export function resolveLeEmbedParams(
  sp: Record<string, string | string[] | undefined>,
  bootstrap: AnalyzerBootstrap
): LeEmbedResolved {
  const embedSrc = first(sp, 'src')?.slice(0, 64);
  const lenderRaw = first(sp, 'lender');
  const countyRaw = normalizeCounty(first(sp, 'county'));
  const stateRaw = first(sp, 'state');

  const notes: string[] = [];

  let lenderSlug = '';
  if (lenderRaw) {
    if (bootstrap.lenderContextBySlug[lenderRaw]) {
      lenderSlug = lenderRaw;
    } else {
      notes.push(
        `Lender “${lenderRaw}” is not in our HMDA-matched set for this tool — fee bands still work without lender context.`
      );
    }
  }

  let countyOptionSlug = '';
  if (countyRaw) {
    const st = stateRaw ? normalizeState(stateRaw) : null;
    // Prefer prefixed option when state known (non-FL); bare for FL or bare county keys
    const candidates: string[] = [];
    if (st) {
      candidates.push(analyzerCountyOptionSlug(st.stateSlug, countyRaw));
    }
    candidates.push(countyRaw);
    // Also try common bare + state prefix from code
    if (stateRaw && stateRaw.length === 2) {
      const code = stateRaw.toLowerCase();
      if (code !== 'fl') candidates.push(`${code}:${countyRaw}`);
    }

    const hit = candidates.find((c) => bootstrap.countyContextBySlug[c]);
    if (hit) {
      countyOptionSlug = hit;
    } else {
      notes.push(
        `County “${countyRaw}” is not in our major HMDA county set — educational fee bands still apply.`
      );
    }
  }

  return {
    lenderSlug,
    countyOptionSlug,
    embedSrc,
    contextNote: notes.length ? notes.join(' ') : null,
  };
}
