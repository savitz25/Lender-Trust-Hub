import { SPECIALIST_SEARCH_ANALYTICS_EVENTS } from './contract';

export type LenderSearchEvent = (typeof SPECIALIST_SEARCH_ANALYTICS_EVENTS)[number];
export type LenderSearchAnalytics = {
  hub: 'lender'; intent: string; state?: string; county?: string; hasIdentifier: boolean;
  identifierType?: 'NMLS_INSTITUTION' | 'LEI'; loanType?: string; loanPurpose?: string;
  action?: string; evidenceFamily?: string; coverageState?: string; resultCountBucket?: '0' | '1' | '2-10' | '11-25' | '26+';
};

export function lenderResultCountBucket(count: number): LenderSearchAnalytics['resultCountBucket'] {
  if (count <= 0) return '0'; if (count === 1) return '1'; if (count <= 10) return '2-10'; if (count <= 25) return '11-25'; return '26+';
}
