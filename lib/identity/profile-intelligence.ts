/**
 * LEND-NAT-011 — internal National Lender Profile Intelligence contract.
 * Evidence presentation. No rankings, scores, or public routes.
 */

import { FORBIDDEN_PROFILE_KEYS, type Confidence } from './profile-metrics';

export const PROFILE_CONTRACT_VERSION = 'lend-nat-011-v1' as const;

export type IdentifierSlot = {
  identifier_type: string;
  identifier_value: string;
  confidence: Confidence;
  source_dataset: string | null;
};

export type CoverageCard = {
  identity: 'COMPLETE' | 'PARTIAL';
  hmda: 'AVAILABLE' | 'NOT AVAILABLE';
  cfpb: 'AVAILABLE' | 'PARTIAL' | 'UNRESOLVED' | 'NONE';
  enforcement: 'AVAILABLE' | 'NONE OBSERVED' | 'UNRESOLVED';
  servicer_role: 'CONFIRMED' | 'HISTORICAL' | 'NOT ESTABLISHED';
  nmls: 'AVAILABLE' | 'HUMAN_GATED' | 'NOT FOUND';
  depository: 'FDIC' | 'NCUA' | 'NONBANK' | 'UNKNOWN';
};

export type CfpbCoverageDisclosure = {
  attributed_only: true;
  disclosure_concept: string;
  unresolved_related_labels: {
    label: string;
    complaint_count: number | null;
    complaint_count_24m: number | null;
    reason: string;
  }[];
};

export type ProfileIntelligence = {
  contract_version: typeof PROFILE_CONTRACT_VERSION;
  public_projection_status: 'internal_only';
  scores: null;
  rankings: null;
  identity: {
    institution_id: string;
    stable_key: string;
    canonical_name: string;
    display_name: string | null;
    names: { kind: string; name: string; source: string }[];
    identifiers: IdentifierSlot[];
    classifications: { family: string; source: string; authoritative: boolean }[];
    identity_confidence: Confidence;
  };
  lending: Record<string, unknown>;
  geography: Record<string, unknown>;
  cfpb: Record<string, unknown>;
  enforcement: Record<string, unknown>;
  roles: Record<string, unknown>;
  coverage: CoverageCard;
  sources: Record<string, unknown>[];
  limitations: string[];
};

export function assertNoScores(profile: Record<string, unknown>): string[] {
  const hits: string[] = [];
  const walk = (obj: unknown, path: string) => {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      obj.forEach((v, i) => walk(v, `${path}[${i}]`));
      return;
    }
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if ((FORBIDDEN_PROFILE_KEYS as readonly string[]).includes(k)) hits.push(`${path}.${k}`);
      walk(v, `${path}.${k}`);
    }
  };
  walk(profile, 'profile');
  return hits;
}

export const CFPB_DISCLOSURE_CONCEPT =
  'Complaint data includes only records deterministically attributed to this institution. Some CFPB source labels remain unresolved and are listed separately.';
