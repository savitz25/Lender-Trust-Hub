/** Shared HMDA evidence types — state-agnostic shape for multi-state expansion. */

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
  floridaOriginations: number;
  year: number;
}

export interface HmdaLenderStateSummary {
  lei: string;
  institutionName: string;
  nmlsId: string;
  ourLenderSlug: string;
  year: number;
  state: string;
  floridaApplications: number;
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

export interface HmdaLenderEvidence {
  lei: string;
  institutionName: string;
  nmlsId: string | null;
  slug: string;
  year: number;
  state: string;
  floridaOriginations: number | null;
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
  source: string;
  sourceNote: string;
}

export interface HmdaCountyEvidence {
  countyName: string;
  countySlug: string;
  state: string;
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
