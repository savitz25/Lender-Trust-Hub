/** Mortgage program explainers + educational finder (not eligibility determination). */

export type ProgramId =
  | 'conventional'
  | 'fha'
  | 'va'
  | 'usda'
  | 'down-payment-assistance';

export type ProgramFitLevel = 'often-discussed' | 'sometimes-relevant' | 'less-common' | 'learn-more';

export type FinderAnswers = {
  firstTimeBuyer: 'yes' | 'no' | 'unsure' | '';
  militaryInterest: 'yes' | 'no' | 'unsure' | '';
  downPaymentComfort: 'under-3' | '3-to-5' | '5-to-20' | '20-plus' | 'unsure' | '';
  purpose: 'purchase' | 'refinance' | 'unsure' | '';
  /** Optional — for DPA framing only */
  stateSlug: string;
};

export type ProgramFitResult = {
  programId: ProgramId;
  fit: ProgramFitLevel;
  reasons: string[];
  caveats: string[];
};

export type ProgramGuide = {
  id: ProgramId;
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  summary: string;
  typicalDownPayment: string;
  mortgageInsuranceTheme: string;
  eligibilityThemes: string[];
  commonlyUsedWhen: string[];
  notAGuarantee: string;
  comparisonBullets: string[];
  relatedToolHrefs: { href: string; label: string }[];
  sources: { label: string; href: string }[];
};
