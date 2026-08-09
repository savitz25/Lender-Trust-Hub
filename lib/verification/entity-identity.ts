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
 * Normalize a display name to a core company key so branch suffixes do not
 * create false NMLS conflicts (e.g. "Guild Mortgage (Tampa)" ≈ "Guild Mortgage").
 */
export function coreCompanyName(name: string): string {
  let s = (name || '').toLowerCase().trim();
  // Drop parenthetical / em-dash / en-dash market suffixes
  s = s.replace(/\s*[\(（].*$/, '');
  s = s.replace(/\s*[—–].*$/, '');
  // Drop trailing " - Market" style suffixes
  s = s.replace(/\s+-\s+.*$/, '');
  // Legal suffixes must not split HQ vs branch cores ("… Mortgage, LLC" vs "… Mortgage (Tampa)")
  s = s.replace(
    /[,\s]+(llc|l\.?l\.?c\.?|inc\.?|incorporated|corp\.?|corporation|ltd\.?|limited|co\.?|company|lp|l\.p\.|pllc|pc)\.?$/i,
    ''
  );
  // Optional brand tail: "Home Loans" / "Mortgage Company" kept; strip trailing "independents"
  s = s.replace(/\s+independents?$/i, '');
  s = s.replace(/[^a-z0-9\s]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  // Collapse common brand variants
  s = s.replace(/\bhome loans\b/g, 'home loans');
  // "Veterans United Home Loans" ≈ "Veterans United"
  if (s.endsWith(' home loans')) {
    const base = s.slice(0, -' home loans'.length).trim();
    if (base.split(' ').length >= 2) s = base;
  }
  return s;
}

function canonicalPreference(row: Lender): number {
  let score = 0;
  if (row.id?.startsWith('nat-')) score += 100;
  if (row.specialties?.some((s) => /hmda/i.test(s))) score += 50;
  if (row.website?.trim()) score += 5;
  if (row.nmlsVerified) score += 3;
  // Prefer shorter brand names over long "Specialists (...)" placeholders
  score += Math.max(0, 40 - (row.name?.length ?? 40));
  return score;
}

/**
 * When the same NMLS ID is claimed by listings with *different* core company names,
 * keep NMLS only on the winning company family and clear it on the rest.
 *
 * Prevents seed/placeholder reuse (e.g. shared synthetic IDs across unrelated
 * "local specialist" rows) from merging Research Scores and entity counts.
 * Branch clones of the same brand keep their NMLS.
 */
export function resolveNmlsIdentityConflicts<T extends Lender>(rows: T[]): T[] {
  const byNmls = new Map<string, T[]>();
  for (const row of rows) {
    const nmls = cleanNmlsId(row.nmlsId);
    if (!nmls) continue;
    const list = byNmls.get(nmls);
    if (list) list.push(row);
    else byNmls.set(nmls, [row]);
  }

  const clearRowKeys = new Set<string>();

  for (const group of byNmls.values()) {
    if (group.length < 2) continue;

    const byCore = new Map<string, T[]>();
    for (const row of group) {
      const core = coreCompanyName(row.name) || `slug:${row.slug}`;
      const list = byCore.get(core);
      if (list) list.push(row);
      else byCore.set(core, [row]);
    }
    if (byCore.size <= 1) continue;

    let winnerCore = '';
    let winnerScore = -1;
    for (const [core, members] of byCore) {
      const pref = Math.max(...members.map(canonicalPreference));
      const score = members.length * 1000 + pref;
      if (score > winnerScore) {
        winnerScore = score;
        winnerCore = core;
      }
    }

    for (const [core, members] of byCore) {
      if (core === winnerCore) continue;
      for (const row of members) {
        clearRowKeys.add(row.id || row.slug);
      }
    }
  }

  if (clearRowKeys.size === 0) return rows;

  return rows.map((row) => {
    const key = row.id || row.slug;
    if (!clearRowKeys.has(key)) return row;
    return {
      ...row,
      nmlsId: '',
      nmlsVerified: false,
    };
  });
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
