/**
 * Per-listing Ask match reasons. Physical HQ ≠ HMDA activity ≠ licensed.
 */

import type { Lender } from '@/lib/mockData';
import { getHmdaLenderEvidenceBySlug } from '@/lib/hmda';
import type { LenderAskSearchContext, LenderHandoffCategory } from './allowlist';
import type { ResolvedLenderGeography } from './geography';

export type LenderListingReason =
  | 'exact_physical_city'
  | 'physical_county'
  | 'physical_state'
  | 'hmda_activity_county'
  | 'hmda_activity_state'
  | 'entity_type_match'
  | 'product_category_match';

const REASON_ORDER: LenderListingReason[] = [
  'exact_physical_city',
  'physical_county',
  'hmda_activity_county',
  'physical_state',
  'hmda_activity_state',
  'entity_type_match',
  'product_category_match',
];

export type LenderAskMatch = {
  lender: Lender;
  reasons: LenderListingReason[];
  best: LenderListingReason;
};

function norm(s: string | undefined): string {
  return (s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function mapCatalogTypeToEntity(
  type: Lender['type']
): 'mortgage_company' | 'mortgage_broker' | 'bank' {
  if (type === 'Broker') return 'mortgage_broker';
  if (type === 'Bank' || type === 'Credit Union') return 'bank';
  return 'mortgage_company';
}

function hmdaProductOrig(slug: string, category: LenderHandoffCategory): number {
  const ev = getHmdaLenderEvidenceBySlug(slug);
  const mix = ev?.loanTypeMix;
  if (!mix) return 0;
  if (category === 'fha') return mix.fhaOrig || 0;
  if (category === 'va') return mix.vaOrig || 0;
  if (category === 'usda') return mix.usdaOrig || 0;
  return mix.conventionalOrig || 0;
}

function hmdaStateOriginations(slug: string, stateCode: string): number {
  const ev = getHmdaLenderEvidenceBySlug(slug);
  if (!ev) return 0;
  if (ev.state === stateCode) return ev.stateOriginations || 0;
  const other = ev.otherStates?.find((s) => s.stateCode === stateCode);
  return other?.originations || 0;
}

function hmdaCountyOriginations(slug: string, countySlug: string): number {
  const ev = getHmdaLenderEvidenceBySlug(slug);
  if (!ev?.countyShares?.length) return 0;
  const hit = ev.countyShares.find((c) => c.countySlug === countySlug);
  return hit?.originations || 0;
}

export function classifyLenderAgainstAsk(
  lender: Lender,
  ctx: LenderAskSearchContext,
  geo?: ResolvedLenderGeography | null
): LenderAskMatch | null {
  if (ctx.entityType && mapCatalogTypeToEntity(lender.type) !== ctx.entityType) {
    return null;
  }
  if (ctx.category && hmdaProductOrig(lender.slug, ctx.category) <= 0) {
    return null;
  }

  const reasons: LenderListingReason[] = [];
  const stateCode = geo?.stateCode || ctx.state;
  const countySlug = geo?.countySlug || ctx.county;
  const city = ctx.city || geo?.city;

  if (city && norm(lender.city) === norm(city)) {
    reasons.push('exact_physical_city');
  }
  if (countySlug && lender.countySlug === countySlug) {
    reasons.push('physical_county');
  }
  if (stateCode && (lender.state === stateCode || lender.stateSlug === geo?.stateSlug)) {
    reasons.push('physical_state');
  }
  if (countySlug && hmdaCountyOriginations(lender.slug, countySlug) > 0) {
    reasons.push('hmda_activity_county');
  }
  if (stateCode && hmdaStateOriginations(lender.slug, stateCode) > 0) {
    reasons.push('hmda_activity_state');
  }

  const wantsGeo = Boolean(stateCode || countySlug || city);
  if (wantsGeo && reasons.length === 0) return null;

  if (ctx.entityType) reasons.push('entity_type_match');
  if (ctx.category) reasons.push('product_category_match');

  const unique = [...new Set(reasons)];
  const best = REASON_ORDER.find((r) => unique.includes(r)) || unique[0] || 'entity_type_match';
  return { lender, reasons: unique, best };
}

export function filterLendersForAskHandoff(
  source: Lender[],
  ctx: LenderAskSearchContext,
  geo?: ResolvedLenderGeography | null
): LenderAskMatch[] {
  const out: LenderAskMatch[] = [];
  for (const lender of source) {
    const hit = classifyLenderAgainstAsk(lender, ctx, geo);
    if (hit) out.push(hit);
  }
  return out;
}
