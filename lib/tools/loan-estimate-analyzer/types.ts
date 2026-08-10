/** Loan Estimate Analyzer — input/result contracts (educational research only). */

export type LoanEstimateLoanType =
  | 'conventional'
  | 'fha'
  | 'va'
  | 'usda'
  | 'jumbo'
  | 'other'
  | '';

export type FeeBandLevel = 'lower' | 'typical' | 'higher' | 'unavailable';

export interface LoanEstimateInputs {
  loanAmount: number;
  interestRate: number;
  /** Optional APR from LE */
  apr: number | null;
  /** Section A-style origination charges (dollars) */
  originationCharges: number;
  /** Discount points paid (dollars) — not percent */
  discountPoints: number;
  /** Lender credits (dollars) */
  lenderCredits: number;
  /** Optional total closing costs from LE */
  totalClosingCosts: number | null;
  loanType: LoanEstimateLoanType;
  /** Directory slug for HMDA-matched lender, if known */
  lenderSlug: string;
  /**
   * County market context option slug:
   * bare slug = Florida major county;
   * `tx:`, `ga:`, `ca:`, `nc:`, `sc:`, `nj:`, `ny:`, `pa:`, `ma:` prefixes for other product states.
   */
  countySlug: string;
}

export interface FeeBandResult {
  level: FeeBandLevel;
  label: string;
  /** Short consumer-facing framing */
  framing: string;
  detail: string;
  /** Must make clear this is educational, not HMDA fee microdata */
  sourceNote: string;
}

export interface DerivedEstimateMetrics {
  originationPct: number;
  originationBps: number;
  discountPointsPct: number;
  lenderCreditsPct: number;
  netLenderCost: number;
  netLenderPct: number;
  netLenderBps: number;
  rateAprSpread: number | null;
  estimatedPrincipalAndInterest: number | null;
  totalClosingPct: number | null;
}

export interface HmdaAnalyzerLenderContext {
  slug: string;
  name: string;
  nmlsId: string | null;
  /** Primary product-state name (highest originations among product states) */
  primaryStateName: string;
  primaryStateCode: string;
  /** Originations in the primary product state */
  stateOriginations: number | null;
  /**
   * @deprecated Prefer stateOriginations + primaryStateName.
   * Kept for older call sites; equals primary-state volume in bootstrap.
   */
  floridaOriginations: number | null;
  countiesWithActivity: number | null;
  topCounties: { name: string; originations: number }[];
  conventionalPct: number | null;
  fhaPct: number | null;
  vaPct: number | null;
  source: string;
  profileHref: string;
}

export interface HmdaAnalyzerCountyContext {
  countyName: string;
  countySlug: string;
  stateName: string;
  stateSlug: string;
  applications: number;
  originations: number;
  denialRatePct: number;
  conventionalPct: number;
  fhaPct: number;
  vaPct: number;
  purchasePct: number;
  refinancePct: number;
  source: string;
  countyHref: string;
}

export interface LoanEstimateAnalysis {
  derived: DerivedEstimateMetrics;
  originationBand: FeeBandResult;
  netCostBand: FeeBandResult;
  pointsEducation: {
    headline: string;
    bullets: string[];
  };
  rateAprNote: string | null;
  hmdaLender: HmdaAnalyzerLenderContext | null;
  hmdaCounty: HmdaAnalyzerCountyContext | null;
  limitations: string[];
  citations: { label: string; detail: string }[];
}
