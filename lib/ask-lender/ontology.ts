/** Consumer synonyms that do not distort HMDA semantics. */

export const PURPOSE_TERMS: Record<string, string> = {
  purchase: 'purchase',
  'home purchase': 'purchase',
  'purchase mortgage': 'purchase',
  refinance: 'refinance',
  refi: 'refinance',
};

export const LOAN_TYPE_TERMS: Record<string, string> = {
  fha: 'FHA',
  'federal housing administration': 'FHA',
  va: 'VA',
  'veterans mortgage': 'VA',
  conventional: 'conventional',
  'conventional mortgage': 'conventional',
  'conventional loan': 'conventional',
  usda: 'USDA',
};

export const ACTION_TERMS: Record<string, string> = {
  originated: 'origination',
  origination: 'origination',
  originations: 'origination',
  'closed loans': 'origination',
  'mortgages made': 'origination',
  applications: 'application',
  'mortgage applications': 'application',
  'loan applications': 'application',
  'received the most applications': 'application',
  denied: 'denial',
  denials: 'denial',
  denial: 'denial',
};

export const DEPOSITORY_TERMS: Record<string, string> = {
  bank: 'FDIC',
  banks: 'FDIC',
  'credit union': 'NCUA',
  'credit unions': 'NCUA',
  depository: 'depository',
  nonbank: 'NONBANK',
  'non-bank': 'NONBANK',
};

/** Explicit Ask-supported Florida counties (HMDA property geography). */
export const FL_ASK_COUNTIES: Record<string, { name: string; fips: string }> = {
  broward: { name: 'Broward', fips: '12011' },
  'palm beach': { name: 'Palm Beach', fips: '12099' },
  'miami-dade': { name: 'Miami-Dade', fips: '12086' },
  'miami dade': { name: 'Miami-Dade', fips: '12086' },
  hillsborough: { name: 'Hillsborough', fips: '12057' },
  orange: { name: 'Orange', fips: '12095' },
};
