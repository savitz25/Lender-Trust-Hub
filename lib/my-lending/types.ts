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

export type MyLendingState = {
  version: 1;
  activePlanId: string | null;
  plans: FinancePlan[];
  savedLenders: SavedLender[];
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
export const MY_LENDING_PATH = '/my-lending';

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `lth_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
