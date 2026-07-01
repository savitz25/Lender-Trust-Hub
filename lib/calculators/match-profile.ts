import type { CreditTier, LoanType } from '@/lib/mockData';
import type { LenderFilters } from '@/lib/lenders';

export interface CalcMatchProfile {
  loanType?: LoanType;
  creditTier?: CreditTier;
  estimatedLoan?: number;
  estimatedRate?: number;
  estimatedPayment?: number;
  ltv?: number;
  zip?: string;
  specialty?: string;
}

export function creditTierFromRate(rate: number): CreditTier {
  if (rate <= 6.5) return 'Excellent';
  if (rate <= 7.25) return 'Good';
  if (rate <= 8) return 'Fair';
  return 'Rebuilding';
}

export function loanTypeFromProfile(p: CalcMatchProfile): LoanType {
  if (p.loanType) return p.loanType;
  if (p.ltv != null && p.ltv > 95) return 'FHA';
  if (p.estimatedLoan != null && p.estimatedLoan > 766_550) return 'Jumbo';
  return 'Conventional';
}

export function buildCalcMatchFilters(profile: CalcMatchProfile): LenderFilters {
  return {
    loanType: loanTypeFromProfile(profile),
    creditTier: profile.creditTier ?? (profile.estimatedRate ? creditTierFromRate(profile.estimatedRate) : 'Good'),
    zip: profile.zip,
    specialty: profile.specialty,
    estimatedLoan: profile.estimatedLoan,
    estimatedRate: profile.estimatedRate,
    estimatedPayment: profile.estimatedPayment,
    ltv: profile.ltv,
  };
}

export function personalizeMessage(profile: CalcMatchProfile): string | null {
  if (profile.estimatedLoan) {
    return `Based on your ${formatCompact(profile.estimatedLoan)} loan${profile.estimatedRate ? ` at ${profile.estimatedRate.toFixed(2)}%` : ''}, we'll match lenders suited to your profile.`;
  }
  return null;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
}