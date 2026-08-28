import manifestFile from '@/docs/fl-lend-007-phase1-manifest.json';

export const FLORIDA_PHASE1_VERSION = 'fl-lend-007-phase1-v1' as const;

export type Phase1Kind = 'NATIONAL_PLUS_FLORIDA' | 'FLORIDA_ONLY';
export type Phase1Cohort = 'A' | 'B' | 'C';

export type Phase1Row = {
  cohort: Phase1Cohort;
  kind: Phase1Kind;
  institution_id: string;
  nmls_id: string;
  slug: string;
  name: string;
  stable_key?: string;
  has_national_snapshot: boolean;
  ofr: number;
  credential_count: number;
};

type ManifestFile = {
  version: string;
  count: number;
  rows: Phase1Row[];
};

const MANIFEST = manifestFile as ManifestFile;

export const FLORIDA_PHASE1_ROWS: Phase1Row[] = MANIFEST.rows;
export const FLORIDA_PHASE1_COUNT = FLORIDA_PHASE1_ROWS.length;

const BY_SLUG = new Map(FLORIDA_PHASE1_ROWS.map((r) => [r.slug, r]));

export function getPhase1Row(slug: string): Phase1Row | undefined {
  return BY_SLUG.get(slug);
}

export function isFloridaPhase1Slug(slug: string): boolean {
  return BY_SLUG.has(slug);
}

export const FLORIDA_PHASE1_GATE = {
  version: FLORIDA_PHASE1_VERSION,
  robotsIndex: true as boolean,
  sitemap: true as boolean,
  search: false,
  count: FLORIDA_PHASE1_COUNT,
};
