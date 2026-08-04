/**
 * Phase B — shortlist discipline (Insurance / My Move parity).
 * Cap applies per active plan; only status === shortlisted counts.
 */

import type {
  FinancePlan,
  LenderResearchStatus,
  SavedLender,
} from '@/lib/my-lending/types';

export const SHORTLIST_CAP = 3;

export function lendersOnPlan(plan: FinancePlan, all: SavedLender[]): SavedLender[] {
  const ids = new Set(plan.savedLenderIds);
  return all.filter((l) => ids.has(l.id) || l.planId === plan.id);
}

export function getShortlisted(lenders: SavedLender[]): SavedLender[] {
  return lenders
    .filter((l) => l.status === 'shortlisted')
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getResearching(lenders: SavedLender[]): SavedLender[] {
  return lenders
    .filter((l) => l.status === 'researching')
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getHistory(lenders: SavedLender[]): SavedLender[] {
  return lenders
    .filter((l) => l.status === 'reached_out' || l.status === 'done')
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function countShortlisted(lenders: SavedLender[]): number {
  return getShortlisted(lenders).length;
}

export function wouldExceedShortlist(
  planLenders: SavedLender[],
  nextStatus: LenderResearchStatus,
  lenderSlug: string
): boolean {
  if (nextStatus !== 'shortlisted') return false;
  const shortlisted = getShortlisted(planLenders);
  if (shortlisted.some((l) => l.lenderSlug === lenderSlug)) return false;
  return shortlisted.length >= SHORTLIST_CAP;
}

export type ShortlistGateResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'shortlist_full';
      shortlisted: SavedLender[];
      message: string;
    };

export function gateShortlistAdd(
  planLenders: SavedLender[],
  lenderSlug: string,
  desiredStatus: LenderResearchStatus
): ShortlistGateResult {
  if (!wouldExceedShortlist(planLenders, desiredStatus, lenderSlug)) {
    return { ok: true };
  }
  const shortlisted = getShortlisted(planLenders);
  return {
    ok: false,
    reason: 'shortlist_full',
    shortlisted,
    message: `Shortlist is full (${SHORTLIST_CAP}). Replace one, move one to Researching, or save as Researching.`,
  };
}
