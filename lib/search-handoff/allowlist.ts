/**
 * ASK-SEARCH-LENDER-002 — approved Ask → Lender structured handoff keys.
 * No raw query. No PII. No arbitrary JSON.
 */

export const ASK_HANDOFF_KEYS = [
  'src',
  'journey',
  'state',
  'county',
  'intent',
  'entity',
  'category',
  'city',
  'zip',
  'sid',
] as const;

export const ASK_HANDOFF_FORBIDDEN_KEYS = [
  'q',
  'query',
  'email',
  'phone',
  'name',
  'address',
  'street_address',
  'document',
  'account',
  'ssn',
  'income',
  'credit',
  'credit_score',
  'loan',
  'financial',
  'health',
  'next',
  'redirect',
] as const;

export const LENDER_HANDOFF_ENTITY_TYPES = [
  'mortgage_company',
  'mortgage_broker',
  'bank',
] as const;

export type LenderHandoffEntityType = (typeof LENDER_HANDOFF_ENTITY_TYPES)[number];

/** HMDA originations > 0 only — never catalog loanTypes / refinance / jumbo / ARM. */
export const LENDER_HANDOFF_CATEGORIES = ['conventional', 'fha', 'va', 'usda'] as const;
export type LenderHandoffCategory = (typeof LENDER_HANDOFF_CATEGORIES)[number];

export const UNSUPPORTED_PRODUCT_CATEGORIES = new Set([
  'refinance',
  'refi',
  'jumbo',
  'arm',
]);

export type LenderAskSearchContext = {
  source: 'ask';
  entityType?: LenderHandoffEntityType;
  unsupportedEntity?: string;
  category?: LenderHandoffCategory;
  unsupportedCategory?: string;
  state?: string;
  county?: string;
  city?: string;
  zip?: string;
  intent?: string;
  journey?: string;
  sid?: string;
};
