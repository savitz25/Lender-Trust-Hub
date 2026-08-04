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
    version: 1,
    activePlanId: null,
    plans: [],
    savedLenders: [],
  };
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

function normalizeState(raw: unknown): MyLendingState | null {
  if (!raw || typeof raw !== 'object') return null;
  const parsed = raw as MyLendingState;
  if (parsed.version !== 1 || !Array.isArray(parsed.plans)) return null;
  return {
    version: 1,
    activePlanId: parsed.activePlanId ?? null,
    plans: (Array.isArray(parsed.plans) ? parsed.plans : []).map((p) => ({
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
    })),
    savedLenders: (Array.isArray(parsed.savedLenders) ? parsed.savedLenders : [])
      .map(normalizeLender)
      .filter((l) => l.lenderSlug)
      .slice(0, MAX_SAVED_LENDERS),
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
    version: 1,
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

export function listActivePlans(state?: MyLendingState): FinancePlan[] {
  const s = state ?? loadState();
  return s.plans
    .filter((p) => p.status === 'active')
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getActivePlan(state?: MyLendingState): FinancePlan | null {
  const s = state ?? loadState();
  if (s.activePlanId) {
    const hit = s.plans.find((p) => p.id === s.activePlanId && p.status === 'active');
    if (hit) return hit;
  }
  return listActivePlans(s)[0] ?? null;
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

/** Create or update plan. Phase A: new plan archives other actives (one active). */
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
      if (next.status === 'active') state.activePlanId = next.id;
      saveState(state);
      return next;
    }
  }

  // New plan - Phase A keeps one simple active plan
  state.plans = state.plans.map((p) =>
    p.status === 'active' ? { ...p, status: 'archived' as const, updatedAt: ts } : p
  );
  const plan: FinancePlan = {
    id: newId(),
    label,
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
  state.activePlanId = plan.id;
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
    state.activePlanId = listActivePlans(state)[0]?.id ?? null;
  }
  saveState(state);
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
