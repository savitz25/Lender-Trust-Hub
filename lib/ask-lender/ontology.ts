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
