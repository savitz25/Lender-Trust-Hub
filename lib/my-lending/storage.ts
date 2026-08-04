/**
 * Guest-first My Lending persistence (localStorage).
 * Storage key: lth:my-lending:v1
 * SSR-safe: empty on server. Quota errors fail soft.
 */

import {
  type CalculatorSnapshot,
  type FinancePlan,
  type LenderResearchStatus,
  type MyLendingState,
  type PlanStatus,
  type SavedLender,
  MY_LENDING_STORE_KEY,
  newId,
  nowIso,
} from '@/lib/my-lending/types';
import {
  gateShortlistAdd,
  getHistory,
  getResearching,
  getShortlisted,
  lendersOnPlan,
  SHORTLIST_CAP,
  countShortlisted as countShortlistedList,
} from '@/lib/my-lending/shortlist-rules';

export {
  SHORTLIST_CAP,
  getShortlisted,
  getResearching,
  getHistory,
  lendersOnPlan,
} from '@/lib/my-lending/shortlist-rules';

const MAX_SAVED_LENDERS = 50;
const MAX_PLANS = 20;

function emptyState(): MyLendingState {
  return {
    version: 2,
    activePlanId: null,
    plans: [],
    savedLenders: [],
  };
}

function listNonArchived(plans: FinancePlan[]): FinancePlan[] {
  return plans
    .filter((p) => p.status !== 'archived')
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

const VALID_STATUSES: LenderResearchStatus[] = [
  'researching',
  'shortlisted',
  'reached_out',
  'done',
];

function normalizeLender(l: SavedLender): SavedLender {
  const savedAt = l.savedAt || nowIso();
  const status = VALID_STATUSES.includes(l.status) ? l.status : 'shortlisted';
  return {
    ...l,
    lenderSlug: String(l.lenderSlug || ''),
    lenderName: String(l.lenderName || l.lenderSlug || 'Lender'),
    profilePath: l.profilePath || `/lenders/${l.lenderSlug}`,
    savedAt,
    updatedAt: l.updatedAt || savedAt,
    status,
  };
}

/**
 * Phase D migration: accept v1|v2, backfill planId on lenders, ensure activePlanId.
 */
function normalizeState(raw: unknown): MyLendingState | null {
  if (!raw || typeof raw !== 'object') return null;
  const parsed = raw as MyLendingState;
  if (parsed.version !== 1 && parsed.version !== 2) return null;
  if (!Array.isArray(parsed.plans)) return null;

  let plans: FinancePlan[] = (Array.isArray(parsed.plans) ? parsed.plans : [])
    .filter((p) => p && typeof p.id === 'string')
    .map((p) => ({
      ...p,
      label: String(p.label || 'My financing research'),
      loanFocus: Array.isArray(p.loanFocus) ? p.loanFocus : [],
      status: p.status === 'archived' ? ('archived' as const) : ('active' as const),
      createdAt: p.createdAt || nowIso(),
      updatedAt: p.updatedAt || p.createdAt || nowIso(),
      savedLenderIds: Array.isArray(p.savedLenderIds) ? p.savedLenderIds : [],
      calculatorSnapshots: Array.isArray(p.calculatorSnapshots)
        ? p.calculatorSnapshots
        : [],
    }))
    .slice(0, MAX_PLANS);

  let savedLenders = (Array.isArray(parsed.savedLenders) ? parsed.savedLenders : [])
    .map(normalizeLender)
    .filter((l) => l.lenderSlug);

  const idToPlan = new Map<string, string>();
  for (const plan of plans) {
    for (const lid of plan.savedLenderIds) {
      idToPlan.set(lid, plan.id);
    }
  }
  const fallbackPlanId =
    parsed.activePlanId && plans.some((p) => p.id === parsed.activePlanId)
      ? parsed.activePlanId
      : listNonArchived(plans)[0]?.id ?? plans[0]?.id ?? null;

  savedLenders = savedLenders.map((l) => {
    if (l.planId && plans.some((pl) => pl.id === l.planId)) return l;
    const fromList = idToPlan.get(l.id);
    if (fromList) return { ...l, planId: fromList };
    if (fallbackPlanId) return { ...l, planId: fallbackPlanId };
    return l;
  });

  plans = plans.map((plan) => {
    const fromField = savedLenders.filter((l) => l.planId === plan.id).map((l) => l.id);
    return {
      ...plan,
      savedLenderIds: Array.from(new Set([...plan.savedLenderIds, ...fromField])),
      calculatorSnapshots: (plan.calculatorSnapshots ?? []).map((s) => ({
        ...s,
        planId: s.planId || plan.id,
      })),
    };
  });

  let activePlanId = parsed.activePlanId ?? null;
  if (activePlanId) {
    const hit = plans.find((p) => p.id === activePlanId);
    if (!hit || hit.status === 'archived') {
      activePlanId = listNonArchived(plans)[0]?.id ?? null;
    }
  } else {
    activePlanId = listNonArchived(plans)[0]?.id ?? null;
  }

  return {
    version: 2,
    activePlanId,
    plans,
    savedLenders: savedLenders.slice(0, MAX_SAVED_LENDERS),
  };
}

function dispatchChange(): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent('lth-my-lending-store'));
}

let lastSaveError: string | null = null;

export function getLastSaveError(): string | null {
  return lastSaveError;
}

export function loadState(): MyLendingState {
  if (!isBrowser()) return emptyState();
  try {
    const raw = localStorage.getItem(MY_LENDING_STORE_KEY);
    if (!raw) return emptyState();
    const parsed = normalizeState(JSON.parse(raw));
    return parsed ?? emptyState();
  } catch {
    return emptyState();
  }
}

export function saveState(
  state: MyLendingState
): { ok: true } | { ok: false; error: string } {
  if (!isBrowser()) return { ok: false, error: 'Not available on server' };
  const next: MyLendingState = {
    version: 2,
    activePlanId: state.activePlanId,
    plans: state.plans.slice(0, MAX_PLANS),
    savedLenders: state.savedLenders
      .map(normalizeLender)
      .filter((l) => l.lenderSlug)
      .slice(0, MAX_SAVED_LENDERS),
  };
  try {
    localStorage.setItem(MY_LENDING_STORE_KEY, JSON.stringify(next));
    lastSaveError = null;
    dispatchChange();
    return { ok: true };
  } catch (e) {
    const msg =
      e instanceof DOMException && e.name === 'QuotaExceededError'
        ? 'Storage full - could not save My Lending on this device.'
        : 'Could not save My Lending on this device (storage blocked or unavailable).';
    if (typeof console !== 'undefined') console.warn('[my-lending]', msg, e);
    lastSaveError = msg;
    return { ok: false, error: msg };
  }
}

/** Non-archived plans (library open set). */
export function listActivePlans(state?: MyLendingState): FinancePlan[] {
  const s = state ?? loadState();
  return listNonArchived(s.plans);
}

/** Full library: open + archived, most recently updated first. */
export function listAllPlans(state?: MyLendingState): FinancePlan[] {
  const s = state ?? loadState();
  return s.plans.slice().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function listPlans(state?: MyLendingState): FinancePlan[] {
  return listAllPlans(state);
}

export function getPlanById(planId: string, state?: MyLendingState): FinancePlan | null {
  const s = state ?? loadState();
  return s.plans.find((p) => p.id === planId) ?? null;
}

export function getActivePlan(state?: MyLendingState): FinancePlan | null {
  const s = state ?? loadState();
  if (s.activePlanId) {
    const hit = s.plans.find((p) => p.id === s.activePlanId && p.status !== 'archived');
    if (hit) return hit;
  }
  return listActivePlans(s)[0] ?? null;
}

/** Switch HQ active plan. Unarchives if needed so Open from library works. */
export function setActivePlan(planId: string): FinancePlan | null {
  const state = loadState();
  const idx = state.plans.findIndex((p) => p.id === planId);
  if (idx < 0) return null;
  const ts = nowIso();
  const plan: FinancePlan = {
    ...state.plans[idx],
    status: 'active',
    updatedAt: ts,
  };
  state.plans[idx] = plan;
  state.activePlanId = plan.id;
  saveState(state);
  return plan;
}

export function getLendersForPlan(
  planId: string,
  state?: MyLendingState
): SavedLender[] {
  const s = state ?? loadState();
  const plan = s.plans.find((p) => p.id === planId);
  if (!plan) return [];
  const byId = new Map(s.savedLenders.map((l) => [l.id, l]));
  return plan.savedLenderIds
    .map((id) => byId.get(id))
    .filter((l): l is SavedLender => Boolean(l));
}

export type UpsertPlanInput = {
  id?: string;
  label: string;
  loanFocus?: string[];
  location?: FinancePlan['location'];
  notes?: string;
  status?: PlanStatus;
};

/**
 * Create or update plan. Phase D: creating does NOT archive siblings;
 * sets activePlanId when status is active.
 */
export function upsertPlan(input: UpsertPlanInput): FinancePlan {
  const state = loadState();
  const ts = nowIso();
  const label = input.label.trim() || 'My financing research';

  if (input.id) {
    const idx = state.plans.findIndex((p) => p.id === input.id);
    if (idx >= 0) {
      const next: FinancePlan = {
        ...state.plans[idx],
        label,
        loanFocus: input.loanFocus ?? state.plans[idx].loanFocus,
        location: input.location !== undefined ? input.location : state.plans[idx].location,
        notes: input.notes !== undefined ? input.notes : state.plans[idx].notes,
        status: input.status ?? state.plans[idx].status,
        updatedAt: ts,
      };
      state.plans[idx] = next;
      if (next.status === 'active') {
        state.activePlanId = next.id;
      } else if (state.activePlanId === next.id) {
        state.activePlanId = listNonArchived(state.plans)[0]?.id ?? null;
      }
      saveState(state);
      return next;
    }
  }

  return createPlan({
    label,
    loanFocus: input.loanFocus,
    location: input.location,
    notes: input.notes,
    makeActive: true,
  });
}

/** Create a new plan without archiving existing plans. */
export function createPlan(input: {
  label?: string;
  loanFocus?: string[];
  location?: FinancePlan['location'];
  notes?: string;
  makeActive?: boolean;
}): FinancePlan {
  const state = loadState();
  const ts = nowIso();
  const plan: FinancePlan = {
    id: newId(),
    label: (input.label?.trim() || 'My financing research').slice(0, 120),
    loanFocus: input.loanFocus ?? [],
    location: input.location,
    notes: input.notes,
    status: 'active',
    createdAt: ts,
    updatedAt: ts,
    savedLenderIds: [],
    calculatorSnapshots: [],
  };
  state.plans = [plan, ...state.plans].slice(0, MAX_PLANS);
  if (input.makeActive !== false) {
    state.activePlanId = plan.id;
  } else if (!state.activePlanId) {
    state.activePlanId = plan.id;
  }
  saveState(state);
  return plan;
}

export function archivePlan(planId: string): void {
  const state = loadState();
  const ts = nowIso();
  state.plans = state.plans.map((p) =>
    p.id === planId ? { ...p, status: 'archived' as const, updatedAt: ts } : p
  );
  if (state.activePlanId === planId) {
    state.activePlanId = listNonArchived(state.plans)[0]?.id ?? null;
  }
  saveState(state);
}

/** Permanently remove plan + its lenders/snapshots. */
export function deletePlan(planId: string): void {
  const state = loadState();
  const plan = state.plans.find((p) => p.id === planId);
  if (!plan) return;
  const removeIds = new Set(plan.savedLenderIds);
  state.savedLenders = state.savedLenders.filter(
    (l) => l.planId !== planId && !removeIds.has(l.id)
  );
  state.plans = state.plans.filter((p) => p.id !== planId);
  if (state.activePlanId === planId) {
    state.activePlanId = listNonArchived(state.plans)[0]?.id ?? null;
  }
  saveState(state);
}

/** Clone plan + lenders + snapshots; becomes active. */
export function duplicatePlan(planId: string): FinancePlan | null {
  const state = loadState();
  const source = state.plans.find((p) => p.id === planId);
  if (!source) return null;
  const ts = nowIso();
  const newPlanId = newId();
  const clonedLenders: SavedLender[] = getLendersForPlan(planId, state).map((l) => {
    const nid = newId();
    return {
      ...l,
      id: nid,
      planId: newPlanId,
      savedAt: ts,
      updatedAt: ts,
    };
  });
  const plan: FinancePlan = {
    ...source,
    id: newPlanId,
    label: `${source.label} (copy)`.slice(0, 120),
    status: 'active',
    createdAt: ts,
    updatedAt: ts,
    savedLenderIds: clonedLenders.map((l) => l.id),
    calculatorSnapshots: (source.calculatorSnapshots ?? []).map((s) => ({
      ...s,
      id: newId(),
      planId: newPlanId,
      savedAt: ts,
    })),
  };
  state.plans = [plan, ...state.plans].slice(0, MAX_PLANS);
  state.savedLenders = [...clonedLenders, ...state.savedLenders].slice(0, MAX_SAVED_LENDERS);
  state.activePlanId = plan.id;
  saveState(state);
  return plan;
}

export function renamePlan(planId: string, label: string): FinancePlan | null {
  const existing = loadState().plans.find((p) => p.id === planId);
  if (!existing) return null;
  return upsertPlan({
    id: planId,
    label: label.trim() || existing.label,
    loanFocus: existing.loanFocus,
    location: existing.location,
    notes: existing.notes,
    status: existing.status,
  });
}

export function getPlanStats(
  planId: string,
  state?: MyLendingState
): { shortlist: number; lenders: number; snapshots: number } {
  const s = state ?? loadState();
  const lenders = getLendersForPlan(planId, s);
  return {
    shortlist: getShortlisted(lenders).length,
    lenders: lenders.length,
    snapshots: (s.plans.find((p) => p.id === planId)?.calculatorSnapshots ?? []).length,
  };
}

export function ensureActivePlan(input: {
  label?: string;
  loanFocus?: string[];
  location?: FinancePlan['location'];
  notes?: string;
} = {}): FinancePlan {
  const existing = getActivePlan();
  if (existing) {
    if (input.label || input.loanFocus || input.location || typeof input.notes === 'string') {
      return upsertPlan({
        id: existing.id,
        label: input.label ?? existing.label,
        loanFocus: input.loanFocus ?? existing.loanFocus,
        location: input.location ?? existing.location,
        notes: input.notes !== undefined ? input.notes : existing.notes,
      });
    }
    return existing;
  }
  return upsertPlan({
    label: input.label ?? 'My financing research',
    loanFocus: input.loanFocus ?? [],
    location: input.location,
    notes: input.notes,
  });
}

export type UpsertSavedLenderInput = {
  lenderSlug: string;
  lenderName: string;
  profilePath?: string;
  planId?: string | null;
  nmlsId?: string;
  licenseSummary?: string;
  loanTypes?: string[];
  status?: LenderResearchStatus;
  notes?: string;
  /**
   * When shortlist is full and desired status is shortlisted:
   * - block (default): return shortlist_full without writing shortlisted status
   * - demote_oldest: oldest shortlisted → researching, then shortlist this one
   * - replace_slug: demote specific slug → researching, then shortlist this one
   */
  shortlistPolicy?: 'block' | 'demote_oldest' | 'replace_slug';
  replaceShortlistedSlug?: string;
};

export type UpsertSavedLenderResult =
  | { ok: true; lender: SavedLender; alreadySaved: boolean; created: boolean }
  | {
      ok: false;
      error: string;
      reason?: 'shortlist_full';
      shortlisted?: SavedLender[];
    };

export function countShortlisted(planId?: string): number {
  const state = loadState();
  const plan = planId
    ? state.plans.find((p) => p.id === planId)
    : getActivePlan(state);
  if (!plan) return 0;
  return countShortlistedList(lendersOnPlan(plan, state.savedLenders));
}

export function canShortlist(planId?: string, lenderSlug?: string): boolean {
  const state = loadState();
  const plan = planId
    ? state.plans.find((p) => p.id === planId)
    : getActivePlan(state);
  if (!plan) return true;
  const onPlan = lendersOnPlan(plan, state.savedLenders);
  if (lenderSlug && getShortlisted(onPlan).some((l) => l.lenderSlug === lenderSlug)) {
    return true;
  }
  return countShortlistedList(onPlan) < SHORTLIST_CAP;
}

/** Prefer shortlist when under cap; Phase B entry point for Save controls. */
export function shortlistLender(
  input: UpsertSavedLenderInput
): UpsertSavedLenderResult {
  return upsertSavedLender({
    ...input,
    status: input.status ?? 'shortlisted',
  });
}

export function upsertSavedLender(
  input: UpsertSavedLenderInput
): UpsertSavedLenderResult {
  const state = loadState();
  let plan =
    (input.planId
      ? state.plans.find((p) => p.id === input.planId)
      : getActivePlan(state)) ?? null;

  if (!plan) {
    plan = ensureActivePlan({ label: 'My financing research' });
    Object.assign(state, loadState());
    plan = getActivePlan(state)!;
  }

  const profilePath = input.profilePath || `/lenders/${input.lenderSlug}`;
  const existing = state.savedLenders.find(
    (l) =>
      l.lenderSlug === input.lenderSlug &&
      (l.planId === plan!.id || !l.planId || plan!.savedLenderIds.includes(l.id))
  );
  const ts = nowIso();
  let desiredStatus: LenderResearchStatus =
    input.status ?? (existing ? existing.status : 'shortlisted');

  let planLenders = lendersOnPlan(plan, state.savedLenders);
  const gate = gateShortlistAdd(planLenders, input.lenderSlug, desiredStatus);

  if (!gate.ok) {
    const policy = input.shortlistPolicy ?? 'block';
    if (policy === 'block') {
      return {
        ok: false,
        error: gate.message,
        reason: 'shortlist_full',
        shortlisted: gate.shortlisted,
      };
    }
    if (policy === 'demote_oldest') {
      const oldest = [...getShortlisted(planLenders)].sort((a, b) =>
        a.updatedAt > b.updatedAt ? 1 : -1
      )[0];
      if (oldest) {
        state.savedLenders = state.savedLenders.map((l) =>
          l.id === oldest.id
            ? { ...l, status: 'researching' as const, updatedAt: ts }
            : l
        );
      }
    } else if (policy === 'replace_slug' && input.replaceShortlistedSlug) {
      state.savedLenders = state.savedLenders.map((l) =>
        l.lenderSlug === input.replaceShortlistedSlug &&
        (l.planId === plan!.id || plan!.savedLenderIds.includes(l.id))
          ? { ...l, status: 'researching' as const, updatedAt: ts }
          : l
      );
    }
    planLenders = lendersOnPlan(plan, state.savedLenders);
    const gate2 = gateShortlistAdd(planLenders, input.lenderSlug, desiredStatus);
    if (!gate2.ok) {
      return {
        ok: false,
        error: gate2.message,
        reason: 'shortlist_full',
        shortlisted: gate2.shortlisted,
      };
    }
  }

  if (existing) {
    const updated: SavedLender = {
      ...existing,
      lenderName: input.lenderName || existing.lenderName,
      profilePath,
      nmlsId: input.nmlsId ?? existing.nmlsId,
      licenseSummary: input.licenseSummary ?? existing.licenseSummary,
      loanTypes: input.loanTypes ?? existing.loanTypes,
      status: desiredStatus,
      notes: input.notes ?? existing.notes,
      planId: plan.id,
      updatedAt: ts,
      savedAt: existing.savedAt || ts,
    };
    state.savedLenders = state.savedLenders.map((l) =>
      l.id === existing.id ? updated : l
    );
    if (!plan.savedLenderIds.includes(existing.id)) {
      plan.savedLenderIds = [existing.id, ...plan.savedLenderIds];
    }
    plan.updatedAt = ts;
    state.plans = state.plans.map((p) => (p.id === plan!.id ? plan! : p));
    state.activePlanId = plan.id;
    const result = saveState(state);
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, lender: updated, alreadySaved: true, created: false };
  }

  const saved: SavedLender = {
    id: newId(),
    planId: plan.id,
    lenderSlug: input.lenderSlug,
    lenderName: input.lenderName,
    profilePath,
    nmlsId: input.nmlsId,
    licenseSummary: input.licenseSummary,
    loanTypes: input.loanTypes,
    status: desiredStatus,
    notes: input.notes,
    savedAt: ts,
    updatedAt: ts,
  };
  state.savedLenders = [saved, ...state.savedLenders].slice(0, MAX_SAVED_LENDERS);
  plan.savedLenderIds = [saved.id, ...plan.savedLenderIds.filter((id) => id !== saved.id)];
  plan.updatedAt = ts;
  state.plans = state.plans.map((p) => (p.id === plan!.id ? plan! : p));
  state.activePlanId = plan.id;
  const result = saveState(state);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, lender: saved, alreadySaved: false, created: true };
}

export function shortlistWithDemoteOldest(
  input: UpsertSavedLenderInput
): UpsertSavedLenderResult {
  return upsertSavedLender({
    ...input,
    status: 'shortlisted',
    shortlistPolicy: 'demote_oldest',
  });
}

export function shortlistReplacing(
  input: UpsertSavedLenderInput,
  replaceShortlistedSlug: string
): UpsertSavedLenderResult {
  return upsertSavedLender({
    ...input,
    status: 'shortlisted',
    shortlistPolicy: 'replace_slug',
    replaceShortlistedSlug,
  });
}

export function saveAsResearching(input: UpsertSavedLenderInput): UpsertSavedLenderResult {
  return upsertSavedLender({ ...input, status: 'researching', shortlistPolicy: 'block' });
}

export function removeSavedLender(lenderSlug: string, planId?: string): void {
  const state = loadState();
  const plan = planId
    ? state.plans.find((p) => p.id === planId)
    : getActivePlan(state);
  const toRemove = state.savedLenders.filter(
    (l) =>
      l.lenderSlug === lenderSlug &&
      (!plan || l.planId === plan.id || plan.savedLenderIds.includes(l.id))
  );
  if (toRemove.length === 0) return;
  const removeIds = new Set(toRemove.map((l) => l.id));
  state.savedLenders = state.savedLenders.filter((l) => !removeIds.has(l.id));
  const ts = nowIso();
  state.plans = state.plans.map((p) => ({
    ...p,
    savedLenderIds: p.savedLenderIds.filter((id) => !removeIds.has(id)),
    updatedAt: ts,
  }));
  saveState(state);
}

export function updateSavedLenderStatus(
  savedId: string,
  status: LenderResearchStatus
): UpsertSavedLenderResult {
  const state = loadState();
  const existing = state.savedLenders.find((l) => l.id === savedId);
  if (!existing) return { ok: false, error: 'Lender not found' };
  return upsertSavedLender({
    lenderSlug: existing.lenderSlug,
    lenderName: existing.lenderName,
    profilePath: existing.profilePath,
    planId: existing.planId,
    nmlsId: existing.nmlsId,
    licenseSummary: existing.licenseSummary,
    loanTypes: existing.loanTypes,
    notes: existing.notes,
    status,
  });
}

export function isLenderSaved(lenderSlug: string, state?: MyLendingState): boolean {
  const s = state ?? loadState();
  const plan = getActivePlan(s);
  if (!plan) return s.savedLenders.some((l) => l.lenderSlug === lenderSlug);
  const ids = new Set(plan.savedLenderIds);
  return s.savedLenders.some(
    (l) => l.lenderSlug === lenderSlug && (ids.has(l.id) || l.planId === plan.id)
  );
}

export function guestSavedCount(): number {
  return countShortlisted();
}

export function getSavedLenderOnActivePlan(
  lenderSlug: string
): SavedLender | null {
  const state = loadState();
  const plan = getActivePlan(state);
  if (!plan) return null;
  return (
    lendersOnPlan(plan, state.savedLenders).find((l) => l.lenderSlug === lenderSlug) ??
    null
  );
}

// ── Phase C: calculator snapshots ───────────────────────────────────────────

export type AddCalculatorSnapshotInput = {
  toolId: string;
  title: string;
  summary: string;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  href?: string;
  planId?: string;
};

/** Attach educational calculator result to active plan (replaces same toolId). */
export function addCalculatorSnapshot(
  input: AddCalculatorSnapshotInput
): CalculatorSnapshot | null {
  const state = loadState();
  let plan =
    (input.planId
      ? state.plans.find((p) => p.id === input.planId)
      : getActivePlan(state)) ?? null;
  if (!plan) {
    plan = ensureActivePlan({ label: 'My financing research' });
    Object.assign(state, loadState());
    plan = getActivePlan(state)!;
  }
  const snap: CalculatorSnapshot = {
    id: newId(),
    planId: plan.id,
    toolId: input.toolId.trim() || 'calculator',
    title: input.title.trim() || 'Calculator result',
    summary: input.summary.trim() || 'Saved research estimate',
    inputs: input.inputs ?? {},
    outputs: input.outputs ?? {},
    href: input.href || '/calculators',
    savedAt: nowIso(),
  };
  const existing = plan.calculatorSnapshots ?? [];
  const nextSnaps = [
    snap,
    ...existing.filter((s) => s.toolId !== snap.toolId),
  ].slice(0, 12);
  const nextPlan: FinancePlan = {
    ...plan,
    calculatorSnapshots: nextSnaps,
    updatedAt: nowIso(),
  };
  state.plans = state.plans.map((p) => (p.id === plan!.id ? nextPlan : p));
  state.activePlanId = plan.id;
  const result = saveState(state);
  if (!result.ok) return null;
  return snap;
}

export function getCalculatorSnapshots(planId?: string): CalculatorSnapshot[] {
  const plan = planId
    ? loadState().plans.find((p) => p.id === planId)
    : getActivePlan();
  return plan?.calculatorSnapshots ?? [];
}

export function removeCalculatorSnapshot(snapshotId: string, planId?: string): void {
  const state = loadState();
  const plan = planId
    ? state.plans.find((p) => p.id === planId)
    : getActivePlan(state);
  if (!plan) return;
  const nextPlan: FinancePlan = {
    ...plan,
    calculatorSnapshots: (plan.calculatorSnapshots ?? []).filter(
      (s) => s.id !== snapshotId
    ),
    updatedAt: nowIso(),
  };
  state.plans = state.plans.map((p) => (p.id === plan!.id ? nextPlan : p));
  saveState(state);
}

export const loadMyLendingStore = loadState;
