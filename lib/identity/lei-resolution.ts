import { cleanNmlsId } from '@/lib/verification/nmls';
import type { IdentityConfidence, LeiMapRow, NmlsSlotClass } from './types';
import { normalizeLeiValue } from './namespaces';
import { isQuarantinedLei, isQuarantinedInstitutionNmls } from './quarantine';

export type LeiNmlsPair = {
  lei: string;
  nmlsIds: Set<string>;
  methods: Set<string>;
  slugs: Set<string>;
  names: Set<string>;
};

export function indexLeiMaps(rows: LeiMapRow[]): Map<string, LeiNmlsPair> {
  const byLei = new Map<string, LeiNmlsPair>();
  for (const row of rows) {
    const lei = normalizeLeiValue(row.lei);
    if (!lei) continue;
    const nmls = cleanNmlsId(row.nmlsId);
    let entry = byLei.get(lei);
    if (!entry) {
      entry = { lei, nmlsIds: new Set(), methods: new Set(), slugs: new Set(), names: new Set() };
      byLei.set(lei, entry);
    }
    if (nmls) entry.nmlsIds.add(nmls);
    if (row.method) entry.methods.add(row.method);
    if (row.slug) entry.slugs.add(row.slug);
    if (row.institutionName) entry.names.add(row.institutionName);
  }
  return byLei;
}

export function methodIsNameOnly(methods: Set<string>): boolean {
  if (methods.size === 0) return true;
  const joined = [...methods].join('|').toLowerCase();
  const hasCuratedPublic =
    joined.includes('public_nmls') ||
    joined.includes('curated_lei_public_nmls') ||
    joined.includes('company_nmls');
  const hasName =
    joined.includes('gleif_name') ||
    joined.includes('directory_name') ||
    joined.includes('directory_slug');
  return hasName && !hasCuratedPublic;
}

export function methodIsDeterministicCurated(methods: Set<string>): boolean {
  const joined = [...methods].join('|').toLowerCase();
  if (methodIsNameOnly(methods)) return false;
  return (
    joined.includes('curated_lei_public_nmls') ||
    joined.includes('public_nmls') ||
    joined.includes('company_nmls')
  );
}

export type LeiResolution = {
  lei: string;
  nmlsId: string | null;
  confidence: IdentityConfidence;
  reason: string;
};

/**
 * CONFIRMED requires 1 LEI → 1 institution NMLS, curated public-NMLS method,
 * no quarantine, no name-only. HIGH_CONFIDENCE is never auto-attached.
 */
export function resolveLeiToInstitutionNmls(
  pair: LeiNmlsPair,
  nmlsClass: (nmls: string) => NmlsSlotClass
): LeiResolution {
  const lei = pair.lei;
  if (isQuarantinedLei(lei)) {
    return {
      lei,
      nmlsId: null,
      confidence: 'review_required',
      reason: 'named LEND-NAT-001 collision quarantine',
    };
  }
  if (pair.nmlsIds.size === 0) {
    return { lei, nmlsId: null, confidence: 'unresolved', reason: 'no NMLS on mapping row' };
  }
  if (pair.nmlsIds.size > 1) {
    return {
      lei,
      nmlsId: null,
      confidence: 'review_required',
      reason: `one LEI → ${pair.nmlsIds.size} NMLS candidates`,
    };
  }
  const nmls = [...pair.nmlsIds][0]!;
  if (isQuarantinedInstitutionNmls(nmls)) {
    return {
      lei,
      nmlsId: null,
      confidence: 'review_required',
      reason: `mapped NMLS ${nmls} is branch/person quarantine`,
    };
  }
  const slot = nmlsClass(nmls);
  if (slot === 'LIKELY_BRANCH_NMLS' || slot === 'LIKELY_PERSON_OR_TEAM_NMLS') {
    return {
      lei,
      nmlsId: null,
      confidence: 'review_required',
      reason: `mapped NMLS ${nmls} classified ${slot}`,
    };
  }
  if (slot === 'COLLISION') {
    return {
      lei,
      nmlsId: null,
      confidence: 'review_required',
      reason: `mapped NMLS ${nmls} is a name-collision ID`,
    };
  }
  if (methodIsNameOnly(pair.methods)) {
    return {
      lei,
      nmlsId: null,
      confidence: 'unresolved',
      reason: 'name/GLEIF/directory-only method is insufficient for CONFIRMED',
    };
  }
  if (slot !== 'CONFIRMED_INSTITUTION_NMLS') {
    return {
      lei,
      nmlsId: null,
      confidence: 'unresolved',
      reason: `NMLS ${nmls} is not a confirmed institution ID (${slot})`,
    };
  }
  if (!methodIsDeterministicCurated(pair.methods)) {
    return {
      lei,
      nmlsId: null,
      confidence: 'unresolved',
      reason: 'mapping method is not a curated public-NMLS crosswalk',
    };
  }
  return {
    lei,
    nmlsId: nmls,
    confidence: 'confirmed',
    reason: 'one LEI → one confirmed institution NMLS via curated public-NMLS method',
  };
}
