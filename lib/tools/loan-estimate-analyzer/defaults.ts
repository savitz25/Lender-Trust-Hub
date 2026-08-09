import type { LoanEstimateInputs } from './types';

/** Safe defaults for empty form (client-safe). */
export function emptyLoanEstimateInputs(
  partial?: Partial<LoanEstimateInputs>
): LoanEstimateInputs {
  return {
    loanAmount: 350_000,
    interestRate: 6.5,
    apr: 6.75,
    originationCharges: 3_500,
    discountPoints: 0,
    lenderCredits: 0,
    totalClosingCosts: null,
    loanType: 'conventional',
    lenderSlug: '',
    countySlug: '',
    ...partial,
  };
}
