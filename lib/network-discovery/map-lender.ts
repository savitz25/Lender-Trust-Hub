/**
 * Map Lender catalog row (+ optional HMDA evidence) → NetworkDiscoveryEntity.
 */

import type { Lender } from '@/lib/mockData';
import { cleanNmlsId } from '@/lib/verification/nmls';
import { STATE_BY_SLUG, STATE_BY_CODE } from '@/lib/fdic/states';
import type { HmdaLenderEvidence } from '@/lib/hmda/types';
import type {
  DiscoveryServiceArea,
  LenderDiscoveryEntityType,
  NetworkDiscoveryEntity,
} from './types';

const SITE = 'https://www.lendertrusthub.com';

export function buildLenderNetworkId(nmlsId: string): string {
  const nmls = cleanNmlsId(nmlsId);
  if (!nmls) throw new Error('buildLenderNetworkId requires clean NMLS');
  return `lender:nmls-${nmls}`;
}

export function buildCanonicalProfileUrl(slug: string): string {
  return `${SITE}/lenders/${encodeURIComponent(slug)}`;
}

export function mapLenderEntityType(type: Lender['type']): LenderDiscoveryEntityType {
  switch (type) {
    case 'Broker':
      return 'mortgage_broker';
    case 'Bank':
    case 'Credit Union':
      return 'bank';
    case 'Lender':
    default:
      return 'mortgage_company';
  }
}

function stateCodeFromSlug(slug: string | undefined): string | undefined {
  if (!slug) return undefined;
  return STATE_BY_SLUG.get(slug)?.code;
}

function stateCodeFromHmda(codeOrName: string): string | undefined {
  const c = codeOrName.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(c) && STATE_BY_CODE.get(c)) return c;
  const bySlug = STATE_BY_SLUG.get(codeOrName.trim().toLowerCase());
  if (bySlug) return bySlug.code;
  return undefined;
}

/** HMDA-backed product categories only — never catalog loanTypes alone. */
export function hmdaProductCategories(ev: HmdaLenderEvidence | null | undefined): string[] {
  if (!ev?.loanTypeMix) return [];
  const mix = ev.loanTypeMix;
  const out: string[] = [];
  if ((mix.conventionalOrig || 0) > 0) out.push('conventional');
  if ((mix.fhaOrig || 0) > 0) out.push('fha');
  if ((mix.vaOrig || 0) > 0) out.push('va');
  if ((mix.usdaOrig || 0) > 0) out.push('usda');
  // Refinance is not on lender-level HMDA evidence — omit (fail closed).
  return out;
}

export function mapLenderToDiscovery(
  lender: Lender,
  opts: {
    sourceVersion: string;
    updatedAt: string;
    hmda?: HmdaLenderEvidence | null;
  }
): NetworkDiscoveryEntity {
  const nmls = cleanNmlsId(lender.nmlsId)!;
  const entity_type = mapLenderEntityType(lender.type);
  const network_entity_id = buildLenderNetworkId(nmls);
  const physicalState = stateCodeFromSlug(lender.stateSlug);
  const zip = lender.zipCodes?.[0];

  const categories = new Set<string>();
  categories.add(entity_type);
  if (lender.type === 'Credit Union') categories.add('credit_union');
  for (const c of hmdaProductCategories(opts.hmda)) categories.add(c);

  const service_areas: DiscoveryServiceArea[] = [];
  const seenState = new Set<string>();
  const seenCounty = new Set<string>();

  // HMDA activity states (service/originations) — not office presence
  if (opts.hmda) {
    const primary = stateCodeFromSlug(opts.hmda.stateSlug) || stateCodeFromHmda(opts.hmda.state);
    if (primary && !seenState.has(primary)) {
      seenState.add(primary);
      service_areas.push({ kind: 'state', state: primary, label: 'hmda_activity' });
    }
    for (const o of opts.hmda.otherStates || []) {
      const code = stateCodeFromHmda(o.stateCode);
      if (!code || seenState.has(code)) continue;
      seenState.add(code);
      service_areas.push({ kind: 'state', state: code, label: 'hmda_activity' });
    }
    // Top county shares in primary HMDA state (activity, not HQ)
    for (const share of (opts.hmda.countyShares || []).slice(0, 8)) {
      const st = primary;
      if (!st || !share.countyName) continue;
      const ck = `${st}:${share.countySlug || share.countyName}`;
      if (seenCounty.has(ck)) continue;
      seenCounty.add(ck);
      const countyLabel = /county$/i.test(share.countyName)
        ? share.countyName
        : `${share.countyName} County`;
      service_areas.push({ kind: 'county', county: countyLabel, state: st });
    }
  }

  // Physical HQ state as separate service_area label when present
  if (physicalState) {
    if (!seenState.has(physicalState)) {
      seenState.add(physicalState);
      service_areas.push({ kind: 'state', state: physicalState, label: 'physical_hq' });
    }
  }

  const search_terms = [
    lender.name,
    lender.slug.replace(/-/g, ' '),
    entity_type.replace(/_/g, ' '),
    lender.city,
    physicalState,
    ...categories,
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  return {
    network_entity_id,
    hub: 'lender',
    source_entity_id: `nmls-${nmls}`,
    entity_type,
    display_name: lender.name.trim(),
    city: lender.city || undefined,
    county: lender.county || undefined,
    state: physicalState,
    zip: zip || undefined,
    categories: [...categories],
    service_areas,
    regulatory_status_summary: 'NMLS registration verified',
    trust_report_available: true,
    canonical_profile_url: buildCanonicalProfileUrl(lender.slug),
    canonical_search_url: physicalState
      ? `${SITE}/local-lenders/${lender.stateSlug}`
      : `${SITE}/local-lenders`,
    search_terms: [...new Set(search_terms)],
    discovery_status: 'active',
    source_version: opts.sourceVersion,
    updated_at: opts.updatedAt,
  };
}
