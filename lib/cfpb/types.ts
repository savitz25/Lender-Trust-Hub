/**
 * CFPB Consumer Complaint Database — evidence types for lender profiles.
 * Phase 1: mortgage product only; curated company-name matching.
 */

export const CFPB_PRODUCT_MORTGAGE = 'Mortgage' as const;

export const CFPB_SOURCE_LABEL = 'CFPB Consumer Complaint Database';
export const CFPB_SOURCE_URL =
  'https://www.consumerfinance.gov/data-research/consumer-complaints/';
export const CFPB_API_BASE =
  'https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/';

export const CFPB_SOURCE_NOTE =
  'Complaint counts come from the public CFPB Consumer Complaint Database (mortgage product only). They are not a finding of fault, not size-normalized by default, and are not a rating or ranking. Larger originators and servicers naturally attract more complaints.';

export type CfpbMatchMethod =
  | 'curated-exact'
  | 'curated-dba'
  | 'curated-affiliate'
  | 'curated-multi';

export interface CfpbCompanyMapping {
  /** Directory / HMDA lender slug */
  ourLenderSlug: string;
  /** Exact `company` filter values accepted by the CFPB search API */
  cfpbCompanyNames: string[];
  matchMethod: CfpbMatchMethod;
  /** Human-readable matching caveat shown in UI */
  matchNote: string;
}

export interface CfpbCountBucket {
  key: string;
  count: number;
  pct: number;
}

/** Raw per-company pull stored in the snapshot */
export interface CfpbCompanySnapshot {
  company: string;
  product: typeof CFPB_PRODUCT_MORTGAGE;
  totalComplaints: number;
  complaintsLast24Months: number;
  topIssues: CfpbCountBucket[];
  timelyYes: number;
  timelyNo: number;
  companyResponses: CfpbCountBucket[];
  fetchedAt: string;
}

export interface CfpbSnapshotFile {
  version: 1;
  product: typeof CFPB_PRODUCT_MORTGAGE;
  generatedAt: string;
  /** Inclusive window start for "recent" counts (YYYY-MM-DD) */
  recentWindowStart: string;
  source: typeof CFPB_SOURCE_LABEL;
  sourceUrl: typeof CFPB_SOURCE_URL;
  companies: CfpbCompanySnapshot[];
}

/**
 * Normalization prep for complaints-per-1k originations.
 * Phase 1 may leave the rate null when windows are not comparable.
 */
export interface CfpbHmdaNormalizationPrep {
  hmdaFloridaOriginations: number | null;
  hmdaYear: number | null;
  complaintsWindow: 'all-time' | '24m';
  complaintsInWindow: number | null;
  /**
   * Set only when both HMDA FL originations and a complaint window count exist.
   * Interpret carefully: CFPB window is national mortgage complaints; HMDA is FL originations.
   */
  complaintsPerThousandOriginations: number | null;
  readyForDisplay: boolean;
  note: string;
}

export interface CfpbComplaintEvidence {
  slug: string;
  product: typeof CFPB_PRODUCT_MORTGAGE;
  companiesMatched: string[];
  matchMethod: CfpbMatchMethod;
  matchNote: string;
  totalComplaints: number;
  complaintsLast24Months: number;
  topIssues: CfpbCountBucket[];
  timelyYes: number;
  timelyNo: number;
  timelyYesPct: number | null;
  companyResponses: CfpbCountBucket[];
  dataAsOf: string;
  recentWindowStart: string;
  source: string;
  sourceUrl: string;
  sourceNote: string;
  /** Foundation for later CFPB × HMDA evidence panels */
  normalization: CfpbHmdaNormalizationPrep;
}
