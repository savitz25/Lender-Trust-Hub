import raw from '@/docs/fl-lend-005-snapshot.json';
import { DISCOVERY_INDEXABLE_COUNT, DISCOVERY_SEARCHABLE_COUNT } from '@/lib/national-profile/discovery';
import { INDEXING_COHORT } from '@/lib/national-profile/publication';

export type FloridaIntelligenceSnapshot = typeof raw;

export const FLORIDA_SNAPSHOT = raw as FloridaIntelligenceSnapshot;

export function fmtInt(n: number | null | undefined): string {
  return Number(n || 0).toLocaleString('en-US');
}

export function fmtUsdCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${n.toLocaleString('en-US')}`;
}

export function snapshotLocks() {
  const s = FLORIDA_SNAPSHOT;
  return {
    credentials: s.licensing.approved_credentials,
    companies: s.licensing.unique_nmls,
    confirmed: s.licensing.confirmed_nmls,
    held: s.licensing.held_nmls,
    mbr: s.licensing.mbr,
    mld: s.licensing.mld,
    dual: s.licensing.dual_nmls,
    sre: s.ofr.written_observations,
    companyEvents: s.ofr.company,
    personEvents: s.ofr.person_mlo,
    branchEvents: s.ofr.branch,
    mixedEvents: s.ofr.mixed,
    confirmedEvents: s.ofr.company_confirmed,
    confirmedInst: s.ofr.confirmed_institutions,
    reviewEvents: s.ofr.company_review,
    unresolvedEvents: s.ofr.company_unresolved,
    fines: s.ofr.company_fines,
    fineDollars: s.ofr.company_fine_dollars,
    finalOrder: s.ofr.company_types.FINAL_ORDER,
    denial: s.ofr.company_types.LICENSE_DENIAL,
    withdrawal: s.ofr.company_types.WITHDRAWAL,
    other: s.ofr.company_types.OTHER,
    emergency: s.ofr.company_types.EMERGENCY_ORDER,
    indexCohort: INDEXING_COHORT.length,
    searchable: DISCOVERY_SEARCHABLE_COUNT,
    indexable: DISCOVERY_INDEXABLE_COUNT,
    institutions: s.baseline.institutions,
    nmls: s.baseline.nmls,
    profiles: s.baseline.profiles,
  };
}

export function identityPct(): string {
  const { confirmed_nmls, unique_nmls } = FLORIDA_SNAPSHOT.licensing;
  return ((confirmed_nmls / unique_nmls) * 100).toFixed(1);
}
