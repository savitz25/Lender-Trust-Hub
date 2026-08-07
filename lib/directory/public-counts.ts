/**
 * Phase 2 — public inventory count taxonomy.
 *
 * Only publish counts derived from live production data, with labels
 * consumers can understand. Prefer distinct-entity counts for "lenders."
 */

import { lenders, TRUST_STATS } from '@/lib/mockData';
import { countLenderCatalog, type LenderCatalogCounts } from '@/lib/verification/counts';
import { catalogDistinctEntities } from '@/lib/verification';

export type PublicCountKind =
  | 'mortgage_entities'
  | 'mortgage_branch_listings'
  | 'mortgage_nmls_id_verified'
  | 'mortgage_profiles_published'
  | 'fdic_bank_records'
  | 'auto_providers'
  | 'states_with_mortgage';

export type LabeledCount = {
  kind: PublicCountKind;
  value: number;
  /** Short label for UI */
  label: string;
  /** One-line explanation */
  explanation: string;
};

/** Live mortgage catalog snapshot (Phase 0–1 honesty). */
export function getMortgagePublicCounts(): LenderCatalogCounts & {
  publishedProfiles: number;
  labeled: {
    entities: LabeledCount;
    verified: LabeledCount;
    branches: LabeledCount;
    profiles: LabeledCount;
  };
  /** Consumer-facing headline without ambiguous inflation */
  directoryHeadline: string;
  directorySummary: string;
} {
  const base = countLenderCatalog(lenders);
  const publishedProfiles = catalogDistinctEntities(lenders).length;

  const entities: LabeledCount = {
    kind: 'mortgage_entities',
    value: base.distinctEntities,
    label: 'Distinct mortgage companies',
    explanation: 'Unique companies by NMLS ID (or row when NMLS is incomplete)',
  };
  const verified: LabeledCount = {
    kind: 'mortgage_nmls_id_verified',
    value: base.verifiedEntities,
    label: 'With NMLS ID verified',
    explanation: 'Numeric NMLS ID on file plus directory verification flag',
  };
  const branches: LabeledCount = {
    kind: 'mortgage_branch_listings',
    value: base.branchListings,
    label: 'Catalog location rows',
    explanation: 'Geo rows before entity dedupe — not additional companies',
  };
  const profiles: LabeledCount = {
    kind: 'mortgage_profiles_published',
    value: publishedProfiles,
    label: 'Published company profiles',
    explanation: 'Distinct profiles available in the public directory',
  };

  const directoryHeadline =
    base.branchListings > base.distinctEntities
      ? `${base.distinctEntities} companies · ${base.branchListings} location rows`
      : `${base.distinctEntities} mortgage companies`;

  const directorySummary =
    base.verifiedEntities > 0
      ? `${base.distinctEntities} distinct companies (${base.verifiedEntities} with NMLS ID verified). Research directory — not a complete national census.`
      : `${base.distinctEntities} distinct companies in the research directory. Confirm licensing on NMLS Consumer Access.`;

  return {
    ...base,
    publishedProfiles,
    labeled: { entities, verified, branches, profiles },
    directoryHeadline,
    directorySummary,
  };
}

/** Format a count for display — no decorative "+" unless value is explicitly a floor. */
export function formatExactCount(n: number): string {
  return n.toLocaleString('en-US');
}

export function formatLenderCount(n: number): string {
  return `${formatExactCount(n)} lender${n === 1 ? '' : 's'}`;
}

export function formatFdicBankCount(n: number): string {
  return `${formatExactCount(n)} FDIC-insured institutions`;
}

/** Trust bar / about stats from live TRUST_STATS (no invented review millions). */
export function getPublicTrustBarStats(): {
  nmlsVerified: LabeledCount;
  companies: LabeledCount;
  coverageLabel: string;
  sourcesLabel: string;
} {
  const m = getMortgagePublicCounts();
  return {
    nmlsVerified: m.labeled.verified,
    companies: m.labeled.entities,
    coverageLabel: TRUST_STATS.countiesCoveredLabel,
    sourcesLabel: TRUST_STATS.dataSources.join(' · '),
  };
}
