export type AskMode =
  | 'entity'
  | 'count'
  | 'aggregate'
  | 'comparison'
  | 'evidence'
  | 'definition'
  | 'fail_closed';

export type AskAction = 'application' | 'origination' | 'denial';
export type AskLoanType = 'conventional' | 'FHA' | 'VA' | 'USDA' | 'other';
export type AskLoanPurpose = 'purchase' | 'refinance';
export type AskGeoGrain = 'national' | 'state' | 'county' | 'property' | 'headquarters' | 'branch';
export type AskIdentityStatus =
  | 'public_profile'
  | 'unpublished_research_identity'
  | 'lei_only'
  | 'identity_hold';

export type LenderResearchQuery = {
  mode: AskMode;
  geography?: {
    grain: AskGeoGrain;
    state?: string;
    county?: string;
    countyFips?: string;
    compareCounty?: string;
    compareCountyFips?: string;
    note: string;
  };
  lenderType?: string[];
  loanPurpose?: string[];
  loanType?: string[];
  actionTaken?: string[];
  evidenceFamilies?: string[];
  requestedMetric?: 'count' | 'rate' | 'most' | 'median' | 'share' | null;
  sort?: { field: string; direction: 'asc' | 'desc' };
  failReason?: string;
  failClosedKind?: string;
};

export type AskInterpretationLine = { label: string; value: string };

export type AskFilterChip = {
  id: string;
  label: string;
  href: string;
  active: boolean;
};

export type AskInstitutionRow = {
  rank: number;
  lei: string;
  displayName: string;
  metric: number;
  metricLabel: string;
  applications: number | null;
  originations: number | null;
  denials: number | null;
  identityStatus: AskIdentityStatus;
  identityNote: string;
  href?: string;
  hrefLabel?: string;
  whyMatched: string[];
  nmls?: string | null;
};

export const LENDER_ASK_CONTRACT = 'lender-ask-v1' as const;

export type AskTrace = {
  contract: typeof LENDER_ASK_CONTRACT;
  sourceFiles: string[];
  method: string;
  indexes: string[];
  identityPolicy: string;
  publicationGate: string;
  cache: string;
  grain: string;
  period: string;
};

export type AskExecution = {
  contract?: typeof LENDER_ASK_CONTRACT;
  query: LenderResearchQuery;
  interpretation: AskInterpretationLine[];
  geographyWarning: string;
  headline: string;
  body: string;
  href?: string;
  hrefLabel?: string;
  facts?: Array<{ label: string; value: string }>;
  rows?: AskInstitutionRow[];
  totalRows?: number;
  page?: number;
  pageSize?: number;
  pageCount?: number;
  denominator?: { label: string; value: number };
  period?: string;
  grain?: string;
  caveats?: string[];
  filters?: AskFilterChip[];
  trace?: AskTrace;
  sharePath?: string;
  failClosed?: boolean;
  elapsedMs?: number;
};

export const ASK_PAGE_SIZE = 25;
export const ASK_GEO_NOTE =
  'HMDA geography is the property/census location tied to the application — not lender headquarters, branch location, or service territory.';
