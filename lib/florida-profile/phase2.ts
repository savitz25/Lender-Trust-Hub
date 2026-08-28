import manifestFile from '@/docs/fl-lend-008-phase2-manifest.json';

export const FLORIDA_PHASE2_VERSION = 'fl-lend-008-phase2-v1' as const;

export type Phase2Cohort = 'B2' | 'C2';
export type Phase2Kind = 'FLORIDA_ONLY';

export type Phase2Row = {
  cohort: Phase2Cohort;
  kind: Phase2Kind;
  institution_id: string;
  nmls_id: string;
  slug: string;
  name: string;
  stable_key?: string;
  has_national_snapshot: boolean;
  ofr: number;
  credential_count: number;
  selection_hash?: string;
};

type ManifestFile = {
  version: string;
  count: number;
  fingerprint?: string;
  rows: Phase2Row[];
};

const MANIFEST = manifestFile as ManifestFile;

export const FLORIDA_PHASE2_ROWS: Phase2Row[] = MANIFEST.rows;
export const FLORIDA_PHASE2_COUNT = FLORIDA_PHASE2_ROWS.length;
export const FLORIDA_PHASE2_FINGERPRINT = MANIFEST.fingerprint || '';

const BY_SLUG = new Map(FLORIDA_PHASE2_ROWS.map((r) => [r.slug, r]));

export function getPhase2Row(slug: string): Phase2Row | undefined {
  return BY_SLUG.get(slug);
}

export function isFloridaPhase2Slug(slug: string): boolean {
  return BY_SLUG.has(slug);
}

/** After Production Phase 2A + indexation gate. Search remains false. */
export const FLORIDA_PHASE2_GATE = {
  version: FLORIDA_PHASE2_VERSION,
  robotsIndex: true as boolean,
  sitemap: true as boolean,
  search: false,
  count: FLORIDA_PHASE2_COUNT,
};
