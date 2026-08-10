/**
 * My Lending Phase A — guest-first financing research model.
 * Plan · Saved lenders · Status vocabulary for later phases.
 */

export type LoanFocus =
  | 'purchase'
  | 'refinance'
  | 'fha'
  | 'va'
  | 'conventional'
  | 'jumbo'
  | 'heloc'
  | 'other';

export type LenderResearchStatus =
  | 'researching'
  | 'shortlisted'
  | 'reached_out'
  | 'done';

export type PlanStatus = 'active' | 'archived';

export type PlanLocation = {
  zip?: string;
  state?: string;
  city?: string;
  label?: string;
};

/** Phase C — calculator result saved onto a plan (educational only). */
export type CalculatorSnapshot = {
  id: string;
  planId: string;
  toolId: string;
  title: string;
  summary: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  href?: string;
  savedAt: string;
};

/**
 * Phase 3 — saved Loan Estimate analysis (guest workspace).
 * Inputs are the analyzer form values; summary is human-readable.
 */
export type SavedLoanEstimate = {
  id: string;
  planId: string;
  label: string;
  notes?: string;
  /** LoanEstimateInputs-compatible plain object */
  inputs: Record<string, unknown>;
  /** Key derived metrics for list display */
  summary: string;
  /** Optional snapshot of fee band labels */
  bandSummary?: string;
  lenderSlug?: string;
  countySlug?: string;
  savedAt: string;
  updatedAt: string;
};

/** Phase 3 — saved multi-LE comparison (2–3 offers). */
export type SavedLeComparison = {
  id: string;
  planId: string;
  label: string;
  notes?: string;
  /** Array of { id, label, inputs } for estimates A/B/C */
  estimates: Array<{
    id: string;
    label: string;
    inputs: Record<string, unknown>;
  }>;
  summary: string;
  /** Headline callouts from last compare */
  headlineCallouts?: string[];
  savedAt: string;
  updatedAt: string;
};

/** Financing research plan. Phase A uses one active plan; array shape ready for Phase D. */
export type FinancePlan = {
  id: string;
  label: string;
  loanFocus: string[];
  location?: PlanLocation;
  notes?: string;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
  savedLenderIds: string[];
  /** Phase C calculator saves (default []) */
  calculatorSnapshots?: CalculatorSnapshot[];
  /** Phase 3 Loan Estimate research */
  savedLoanEstimates?: SavedLoanEstimate[];
  savedLeComparisons?: SavedLeComparison[];
};

/** Lender shortlist item — research only, not a lead. */
export type SavedLender = {
  id: string;
  planId?: string | null;
  lenderSlug: string;
  lenderName: string;
  profilePath: string;
  nmlsId?: string;
  licenseSummary?: string;
  loanTypes?: string[];
  status: LenderResearchStatus;
  notes?: string;
  savedAt: string;
  updatedAt: string;
};

/**
 * Guest / signed-in workspace state (same shape).
 * v1/v2 — plans + lenders (+ calculator snapshots on plans)
 * v3 — + saved Loan Estimates and LE comparisons on plans
 * Notes on LEs / comparisons / lenders are supported in v3 (optional fields).
 */
export type MyLendingState = {
  version: 1 | 2 | 3;
  activePlanId: string | null;
  plans: FinancePlan[];
  savedLenders: SavedLender[];
};

/** Workspace list sort for V1.1 organization */
export type WorkspaceItemSort = 'newest' | 'oldest' | 'alpha';

/** SessionStorage key to reopen a saved LE/comparison in the tools */
export const LE_WORKSPACE_REOPEN_KEY = 'lth:my-lending:le-reopen:v1';

export type LeWorkspaceReopen =
  | { type: 'loan-estimate'; inputs: Record<string, unknown> }
  | {
      type: 'comparison';
      estimates: Array<{ id: string; label: string; inputs: Record<string, unknown> }>;
    };

export const LOAN_FOCUS_OPTIONS: { id: LoanFocus; label: string }[] = [
  { id: 'purchase', label: 'Purchase' },
  { id: 'refinance', label: 'Refinance' },
  { id: 'fha', label: 'FHA' },
  { id: 'va', label: 'VA' },
  { id: 'conventional', label: 'Conventional' },
  { id: 'jumbo', label: 'Jumbo' },
  { id: 'heloc', label: 'HELOC' },
  { id: 'other', label: 'Other' },
];

/** Extra chips used only in guided setup UI */
export const SETUP_SITUATION_OPTIONS = [
  { id: 'first_home', label: 'First-time homebuyer' },
  { id: 'rate_shop', label: 'Shopping rates / refinance' },
  { id: 'relocating', label: 'Relocating' },
  { id: 'investment', label: 'Investment property research' },
] as const;

export const LENDER_STATUS_OPTIONS: {
  id: LenderResearchStatus;
  label: string;
}[] = [
  { id: 'researching', label: 'Researching' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'reached_out', label: 'Reached out' },
  { id: 'done', label: 'Done' },
];

export const MY_LENDING_STORE_KEY = 'lth:my-lending:v1';
/** Signed-in device cache: `${MY_LENDING_STORE_KEY}:user:${userId}` */
export function myLendingUserStoreKey(userId: string): string {
  return `${MY_LENDING_STORE_KEY}:user:${userId}`;
}
export const MY_LENDING_PATH = '/my-lending';

export const MAX_SAVED_LOAN_ESTIMATES = 25;
export const MAX_SAVED_LE_COMPARISONS = 15;
/** Private research notes — short, not a document system */
export const MAX_PRIVATE_NOTE_CHARS = 500;

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `lth_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
