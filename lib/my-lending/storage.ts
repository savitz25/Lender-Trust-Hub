/**
 * Guest-first My Lending persistence (localStorage).
 * Storage key: lth:my-lending:v1
 * SSR-safe: empty on server. Quota errors fail soft.
 */

import {
  type FinancePlan,
  type LenderResearchStatus,
  type MyLendingState,
  type PlanStatus,
  type SavedLender,
  MY_LENDING_STORE_KEY,
  newId,
  nowIso,
} from '@/lib/my-lending/types';

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
};

export type UpsertSavedLenderResult =
  | { ok: true; lender: SavedLender; alreadySaved: boolean; created: boolean }
  | { ok: false; error: string };

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
  const desiredStatus: LenderResearchStatus =
    input.status ?? (existing ? existing.status : 'shortlisted');

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
  const plan = getActivePlan();
  if (!plan) return loadState().savedLenders.length;
  return getLendersForPlan(plan.id).length;
}

export const loadMyLendingStore = loadState;
