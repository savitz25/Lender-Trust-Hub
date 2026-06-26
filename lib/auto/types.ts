/** Auto loan vertical listing shape — mirrors mortgage Lender for clone consistency */

export type AutoLoanType = 'New' | 'Used' | 'Refinance' | 'Lease Buyout' | 'Bad Credit';
export type AutoProviderType = 'Credit Union' | 'Bank' | 'Online Lender' | 'Dealer Finance';

export interface AutoLoanProvider {
  id: string;
  slug: string;
  name: string;
  type: AutoProviderType;
  city: string;
  state: string;
  stateSlug: string;
  rating: number;
  reviewCount: number;
  trustScore: number;
  aprRange: string;
  loanTypes: AutoLoanType[];
  specialties: string[];
  verified: boolean;
  shortDescription: string;
  website?: string;
  phone?: string;
}

export interface StateAutoStats {
  total: number;
  verified: number;
  avgTrustScore: number;
  avgAprLow: number;
  topProvider?: AutoLoanProvider;
}