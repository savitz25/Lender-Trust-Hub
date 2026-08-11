/**
 * Stage C.3 — parse embed params for lender evidence card.
 */

import { normalizeState } from '@/lib/network/journey-context';

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

export type LenderEvidenceEmbedParams = {
  lenderSlug?: string;
  stateSlug?: string;
  stateCode?: string;
  county?: string;
  embedSrc?: string;
  error?: 'missing-lender';
};

export function parseLenderEvidenceEmbedParams(
  sp: Record<string, string | string[] | undefined>
): LenderEvidenceEmbedParams {
  const lenderSlug = first(sp, 'lender')?.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  const embedSrc = first(sp, 'src')?.slice(0, 64);
  const county = normalizeCounty(first(sp, 'county'));
  const stateRaw = first(sp, 'state');
  const st = stateRaw ? normalizeState(stateRaw) : null;

  if (!lenderSlug) {
    return { error: 'missing-lender', embedSrc };
  }

  return {
    lenderSlug,
    stateSlug: st?.stateSlug,
    stateCode: st?.stateCode,
    county,
    embedSrc,
  };
}
