/**
 * LEND-NAT-014 — deterministic search-publication policy.
 * Indexation is not implied by snapshot existence or route existence.
 */

import indexingFile from '@/docs/lend-nat-014-indexing-cohort.json';
import renderFile from '@/docs/lend-nat-014-render-cohort.json';
import { SITE_URL } from '@/lib/directory/categories';
import { NATIONAL_PROFILE_GATE, nationalProfilePath } from './cohort';

export const PUBLICATION_STATUSES = [
  'PUBLICATION_ELIGIBLE',
  'PUBLICATION_HOLD',
  'IDENTITY_REVIEW',
  'HISTORICAL_ONLY',
  'NO_PUBLIC_ROUTE',
] as const;

export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export type PublicationManifestRow = {
  institution_id: string;
  stable_key: string;
  slug: string;
  publication_status: PublicationStatus;
  reason: string;
  added_at: string;
  cohort_version: string;
  display_name: string;
  canonical_name: string;
  identity_tier: string;
  content_bucket: string;
  content_families: string[];
  hq_state: string | null;
  depository: string;
  hmda: string;
  apps: number;
  cfpb_n: number;
  enf_n: number;
  servicer: string;
  hmda_period: string;
  slug_strategy?: string;
  catalog_slug_overlap?: boolean;
  index?: boolean;
  cohort_reason?: string;
};

type CohortFile = {
  cohort_version: string;
  added_at: string;
  count: number;
  rows: PublicationManifestRow[];
};

const INDEXING = indexingFile as CohortFile;
const RENDER = renderFile as CohortFile;

export const INDEXING_COHORT_VERSION = INDEXING.cohort_version;
export const INDEXING_COHORT: PublicationManifestRow[] = INDEXING.rows;
export const RENDER_COHORT: PublicationManifestRow[] = RENDER.rows;

const INDEXING_BY_SLUG = new Map(INDEXING_COHORT.map((r) => [r.slug, r]));
const RENDER_BY_SLUG = new Map(RENDER_COHORT.map((r) => [r.slug, r]));

export function getIndexingRow(slug: string): PublicationManifestRow | undefined {
  return INDEXING_BY_SLUG.get(slug);
}

export function getRenderRow(slug: string): PublicationManifestRow | undefined {
  return RENDER_BY_SLUG.get(slug);
}

export function isNationalIndexingSlug(slug: string): boolean {
  return INDEXING_BY_SLUG.has(slug);
}

export function isNationalRenderSlug(slug: string): boolean {
  return RENDER_BY_SLUG.has(slug);
}

const NOINDEX = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
} as const;

const INDEX_FOLLOW = {
  index: true,
  follow: true,
  googleBot: { index: true, follow: true },
} as const;

export type LenderRobots = typeof NOINDEX | typeof INDEX_FOLLOW;

/**
 * Profile rendering and profile indexation are separate.
 * index,follow only when launch is on AND the slug is in the approved indexing cohort.
 */
export function publicLenderRobots(input: {
  slug?: string;
  isLanding?: boolean;
  productionLaunchEnabled?: boolean;
}): LenderRobots {
  if (input.isLanding || !input.slug) return NOINDEX;
  const launch =
    input.productionLaunchEnabled ?? NATIONAL_PROFILE_GATE.productionLaunchEnabled;
  if (!launch) return NOINDEX;
  if (!isNationalIndexingSlug(input.slug)) return NOINDEX;
  return INDEX_FOLLOW;
}

export function nationalIndexingSitemapLocs(): string[] {
  if (!NATIONAL_PROFILE_GATE.sitemap || !NATIONAL_PROFILE_GATE.productionLaunchEnabled) {
    return [];
  }
  return INDEXING_COHORT.map((row) => `${SITE_URL}${nationalProfilePath(row.slug)}`);
}

export function nationalIndexingSitemapCount(): number {
  return nationalIndexingSitemapLocs().length;
}

export const OLD_NATIONAL_PROFILE_SLUGS: Record<string, string> = {
  // Presentation-only. Identity is institution_id / stable_key.
  // When a canonical name change is deterministic, map oldSlug → currentSlug here.
};

export function resolveNationalProfileSlug(slug: string): string {
  return OLD_NATIONAL_PROFILE_SLUGS[slug] || slug;
}
