/**
 * Lender Trust Hub Phase 0 — company identity by NMLS ID.
 * Trust / research scores are entity-level, not per geo-variant row.
 */

import type { Lender } from '@/lib/mockData';
import { cleanNmlsId } from '@/lib/verification/nmls';

export type LenderEntityKey = string;

/** Primary company key: numeric NMLS when valid, else unique row fallback. */
export function lenderEntityKey(lender: Pick<Lender, 'nmlsId' | 'id' | 'slug'>): LenderEntityKey {
  const nmls = cleanNmlsId(lender.nmlsId);
  if (nmls) return `nmls:${nmls}`;
  return `row:${lender.id || lender.slug}`;
}

/**
 * Prefer the richest / most local-looking row as the canonical profile for an entity.
 * Higher trust, then more reviews, then shorter slug (stable).
 */
export function pickCanonicalLender<T extends Lender>(rows: T[]): T {
  if (rows.length === 1) return rows[0]!;
  return [...rows].sort((a, b) => {
    if (b.trustScore !== a.trustScore) return b.trustScore - a.trustScore;
    if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
    if (b.countyExperienceScore !== a.countyExperienceScore) {
      return b.countyExperienceScore - a.countyExperienceScore;
    }
    return a.slug.localeCompare(b.slug);
  })[0]!;
}

/** Apply a single entity trust score to every geo row sharing that NMLS. */
export function applyEntityTrustScores<T extends Lender>(rows: T[]): T[] {
  const byEntity = new Map<LenderEntityKey, T[]>();
  for (const row of rows) {
    const key = lenderEntityKey(row);
    const list = byEntity.get(key);
    if (list) list.push(row);
    else byEntity.set(key, [row]);
  }

  const entityTrust = new Map<LenderEntityKey, number>();
  for (const [key, group] of byEntity) {
    const scores = group.map((r) => r.trustScore).filter((n) => typeof n === 'number');
    const trust = scores.length ? Math.max(...scores) : 0;
    entityTrust.set(key, trust);
  }

  return rows.map((row) => {
    const key = lenderEntityKey(row);
    const trust = entityTrust.get(key);
    if (trust == null || trust === row.trustScore) return row;
    return { ...row, trustScore: trust };
  });
}

/**
 * Dedupe a list to one row per entity (NMLS).
 * Use for national directories and headline counts — not for multi-branch branch-only views.
 */
export function dedupeLendersByEntity<T extends Lender>(rows: T[]): T[] {
  const byEntity = new Map<LenderEntityKey, T[]>();
  for (const row of rows) {
    const key = lenderEntityKey(row);
    const list = byEntity.get(key);
    if (list) list.push(row);
    else byEntity.set(key, [row]);
  }
  return [...byEntity.values()].map((group) => pickCanonicalLender(group));
}

/** Canonical profile slug for an NMLS entity within a catalog slice. */
export function getCanonicalSlugForEntity(
  rows: Lender[],
  nmlsId: string | null | undefined
): string | null {
  const nmls = cleanNmlsId(nmlsId);
  if (!nmls) return null;
  const group = rows.filter((r) => cleanNmlsId(r.nmlsId) === nmls);
  if (group.length === 0) return null;
  return pickCanonicalLender(group).slug;
}

export function isCanonicalLenderProfile(lender: Lender, catalog: Lender[]): boolean {
  const nmls = cleanNmlsId(lender.nmlsId);
  if (!nmls) return true; // incomplete identity — keep URL but noindex elsewhere
  const canonical = getCanonicalSlugForEntity(catalog, nmls);
  return canonical === lender.slug;
}
