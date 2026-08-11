/**
 * Stage C.1 — parse embed query params for HMDA county snapshot.
 */

import { normalizeState } from '@/lib/network/journey-context';

export function normalizeCountyParam(raw?: string | string[] | null): string | undefined {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s?.trim()) return undefined;
  return s
    .toLowerCase()
    .replace(/county/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || undefined;
}

export function firstParam(
  v: string | string[] | undefined
): string | undefined {
  if (v == null) return undefined;
  const s = Array.isArray(v) ? v[0] : v;
  const t = s?.trim();
  return t || undefined;
}

export function parseEmbedHmdaCountyParams(
  searchParams: Record<string, string | string[] | undefined>
): {
  stateSlug?: string;
  stateCode?: string;
  stateName?: string;
  county?: string;
  src?: string;
  error?: 'missing-params' | 'unknown-state';
} {
  const stateRaw = firstParam(searchParams.state);
  const county = normalizeCountyParam(firstParam(searchParams.county));
  const src = firstParam(searchParams.src)?.slice(0, 64);

  if (!stateRaw || !county) {
    return { error: 'missing-params', src };
  }

  const st = normalizeState(stateRaw);
  if (!st) {
    return { error: 'unknown-state', county, src };
  }

  return {
    stateSlug: st.stateSlug,
    stateCode: st.stateCode,
    stateName: st.stateName,
    county,
    src,
  };
}

export function buildCountyResearchDeepLink(opts: {
  stateSlug: string;
  county: string;
  embedSrc?: string;
}): string {
  const base = `https://www.lendertrusthub.com/local-lenders/${opts.stateSlug}/${opts.county}`;
  const p = new URLSearchParams();
  p.set('src', opts.embedSrc ? 'embed' : 'embed');
  if (opts.embedSrc) p.set('partner', opts.embedSrc);
  p.set('state', opts.stateSlug);
  p.set('county', opts.county);
  return `${base}?${p.toString()}`;
}
