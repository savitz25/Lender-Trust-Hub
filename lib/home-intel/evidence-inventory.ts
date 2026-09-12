import type { HomepageEvidenceMeasure, LenderEvidenceFamily } from './types';
import type { LenderNetworkMetricsV1 } from '../metrics/lender-network-metrics-v1';
import payload from '../../data/home/lender-network-metrics-v1.json';
export const LENDER_EVIDENCE_FAMILY_LABELS: Record<LenderEvidenceFamily, string> = {
  INSTITUTION_IDENTITY_LICENSING: 'Institution identity & licensing',
  MORTGAGE_MARKET_ACTIVITY: 'Mortgage market activity',
  CONSUMER_COMPLAINTS: 'Consumer complaint evidence',
  REGULATORY_ENFORCEMENT: 'Regulatory & enforcement history',
  DEPOSITORY_BANK: 'Depository & bank context',
  HOMEBUYER_PROGRAMS: 'Homebuyer & program intelligence',
  BUSINESS_RELATIONSHIPS: 'Business & relationship evidence',
  PUBLIC_RESEARCH_SURFACES: 'Public research surfaces',
};

export const LENDER_HOMEPAGE_STATE_CARDS = (payload as unknown as LenderNetworkMetricsV1).homepage!.stateCards;

export function buildLenderHomepageEvidenceInventory(metrics: LenderNetworkMetricsV1): HomepageEvidenceMeasure[] {
  if (!metrics.homepage) throw new Error('Generated homepage projection missing; regenerate network metrics');
  return metrics.homepage.evidenceInventory;
}

export function assertPublicHomepageInventory(inventory: HomepageEvidenceMeasure[]): void {
  const allowedPublicationStatuses = new Set<HomepageEvidenceMeasure['publicationStatus']>(['PUBLIC', 'PUBLIC_LIMITATION']);
  const keys = new Set(inventory.map((item) => item.key));
  if (keys.size !== inventory.length) throw new Error('Homepage evidence inventory keys must be unique');
  if (inventory.some((item) => !allowedPublicationStatuses.has(item.publicationStatus))) throw new Error('Homepage evidence inventory contains a non-public publication status');
  if (!inventory.some((item) => item.key === 'wa_dfi_orders') || !inventory.some((item) => item.key === 'az_difi_enforcement_unacquired')) throw new Error('State enforcement semantics missing');
  if (inventory.some((item) => /person_mlo|branch_entities|private/i.test(item.key))) throw new Error('Internal person, branch, or private counts cannot publish');
  if (inventory.some((item) => /grand total|mortgage records/i.test(item.label))) throw new Error('Cross-grain totals cannot publish');
}
