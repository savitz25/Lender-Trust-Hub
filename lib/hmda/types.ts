/** Shared HMDA evidence types — multi-state (FL, TX, …). */

export const HMDA_VINTAGE_YEAR = 2025;
export const HMDA_SOURCE_LABEL = '2025 HMDA';
export const HMDA_SOURCE_NOTE =
  'Figures are derived from public HMDA records published by the CFPB/FFIEC Data Browser. They reflect reported mortgage applications and originations, not a rating or endorsement.';

export interface HmdaLeiMapping {
  lei: string;
  institutionName: string;
  nmlsId: string;
  ourLenderSlug: string;
  matchMethod: string;
  /** Originations in this slice's state */
  stateOriginations: number;
  /** @deprecated alias of stateOriginations for FL-era callers */
  floridaOriginations: number;
  year: number;
  state?: string;
}

export interface HmdaLenderStateSummary {
  lei: string;
  institutionName: string;
  nmlsId: string;
  ourLenderSlug: string;
  year: number;
  state: string;
  stateApplications: number;
  stateOriginations: number;
  /** @deprecated use stateApplications */
  floridaApplications: number;
  /** @deprecated use stateOriginations */
  floridaOriginations: number;
  floridaDenials: number;
  denialRatePct: number;
  countiesWithActivity: number;
  topCounties: string;
  conventionalOrig: number;
  fhaOrig: number;
  vaOrig: number;
  usdaOrig: number;
  conventionalPct: number;
  fhaPct: number;
  vaPct: number;
  usdaPct: number;
  source: string;
}

export interface HmdaLenderCountyActivity {
  lei: string;
  institutionName: string;
  countyFips: string;
  countyName: string;
  countySlug: string;
  state: string;
  year: number;
  originations: number;
  countyMarketSharePct: number | null;
  source: string;
}

export interface HmdaCountyMarketSummary {
  countyFips: string;
  countyName: string;
  countySlug: string;
  state: string;
  year: number;
  applications: number;
  originations: number;
  denials: number;
  denialRatePct: number;
  conventionalOrig: number;
  fhaOrig: number;
  vaOrig: number;
  usdaOrig: number;
  conventionalPct: number;
  fhaPct: number;
  vaPct: number;
  usdaPct: number;
  purchaseOrig: number;
  refinanceOrig: number;
  purchasePct: number;
  refinancePct: number;
  source: string;
  sourceNote: string;
}

export interface HmdaLoanTypeMix {
  conventionalPct: number;
  fhaPct: number;
  vaPct: number;
  usdaPct: number;
  conventionalOrig: number;
  fhaOrig: number;
  vaOrig: number;
  usdaOrig: number;
}

export interface HmdaLenderStateSlice {
  stateCode: string;
  stateName: string;
  stateSlug: string;
  originations: number | null;
  applications: number | null;
  countiesWithActivity: number | null;
  topCounties: { name: string; originations: number }[];
  countyShares: {
    countyName: string;
    countySlug: string;
    originations: number;
    marketSharePct: number | null;
  }[];
  loanTypeMix: HmdaLoanTypeMix | null;
}

export interface HmdaLenderEvidence {
  lei: string;
  institutionName: string;
  nmlsId: string | null;
  slug: string;
  year: number;
  /** Primary state (highest originations among active product states) */
  state: string;
  stateName: string;
  stateSlug: string;
  stateOriginations: number | null;
  stateApplications: number | null;
  /** @deprecated use stateOriginations — kept for CFPB normalization / older UI */
  floridaOriginations: number | null;
  /** @deprecated use stateApplications */
  floridaApplications: number | null;
  countiesWithActivity: number | null;
  topCounties: { name: string; originations: number }[];
  loanTypeMix: HmdaLoanTypeMix | null;
  countyShares: {
    countyName: string;
    countySlug: string;
    originations: number;
    marketSharePct: number | null;
  }[];
  /** Other product states with mapped activity (excludes primary) */
  otherStates: { stateCode: string; stateName: string; originations: number }[];
  source: string;
  sourceNote: string;
}

export interface HmdaCountyEvidence {
  countyName: string;
  countySlug: string;
  state: string;
  stateSlug: string;
  year: number;
  applications: number;
  originations: number;
  denialRatePct: number;
  loanTypeMix: HmdaLoanTypeMix;
  purchasePct: number;
  refinancePct: number;
  purchaseOrig: number;
  refinanceOrig: number;
  topMatchedLenders: {
    name: string;
    slug: string | null;
    lei: string;
    originations: number;
    marketSharePct: number | null;
  }[];
  source: string;
  sourceNote: string;
}
