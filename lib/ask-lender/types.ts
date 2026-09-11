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

export type IdentifierFamily = 'NMLS_INSTITUTION' | 'LEI';
export type IdentityClass = 'institution' | 'person' | 'branch' | 'unknown';
export type LookupState = 'FOUND' | 'NO_MATCH' | 'IDENTIFIER_REQUIRED' | 'NEEDS_CLARIFICATION' | 'CONFLICT' | 'UNSUPPORTED' | 'INVALID' | 'UNAVAILABLE';
export type IdentifierSpan = { type: IdentifierFamily; value: string; rawSpan: string; start: number; end: number; normalization: string[] };
export type IdentityRequest = {
  rawQuestion: string;
  families: IdentifierFamily[];
  identifiers: IdentifierSpan[];
  requestedClass: IdentityClass;
  remainingText: string;
  problem?: { state: LookupState; message: string };
};
export type IdentityCondition = { text: string; state: 'APPLIED' | 'NEEDS_CLARIFICATION' | 'UNSUPPORTED' | 'CONFLICT'; explanation: string };
export type ExactMatchEvidence = {
  method: 'exact_identifier'; family: IdentifierFamily; requestedValue: string;
  matchedField: 'nmls' | 'lei'; returnedValue: string; institutionKey: string;
  sourceReference: string; sourceAsOf: string | null; normalization: string[];
};

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
  identityQuery?: string;
  identifier?: { type: 'NMLS_INSTITUTION' | 'LEI'; value: string };
  identityRequest?: IdentityRequest;
  definitionId?: 'nmls' | 'lei' | 'hmda' | 'application' | 'origination' | 'denial' | 'cfpb' | 'institution_types';
  coverageState?: 'KNOWN' | 'UNKNOWN' | 'PARTIAL' | 'NOT_ACQUIRED' | 'REQUEST_ONLY' | 'UNSUPPORTED';
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
  evidenceAvailable?: string[];
  institutionKey?: string;
  resolvedClass?: IdentityClass;
  matchEvidence?: ExactMatchEvidence[];
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
  terminalState?: LookupState;
  lookup?: {
    scope: string; requestedClass: IdentityClass; resolvedClass: IdentityClass;
    identifiers: IdentifierSpan[]; conditions: IdentityCondition[];
    officialActions: Array<{ family: IdentifierFamily; href: string; label: string; instruction: string }>;
  };
};

export const ASK_PAGE_SIZE = 25;
export const ASK_GEO_NOTE =
  'HMDA geography is the property/census location tied to the application — not lender headquarters, branch location, or service territory.';
