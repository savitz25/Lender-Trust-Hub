import { buildLenderHomeIntelFromSnapshot } from '@/lib/home-intel/build';
import type { LenderHomeIntel } from '@/lib/home-intel/types';
import type { LenderNetworkMetricsV1 } from './lender-network-metrics-v1';
import {
  assertPublicHomepageInventory,
  buildLenderHomepageEvidenceInventory,
} from '@/lib/home-intel/evidence-inventory';

const STATE_INTEL_HREF: Record<string, string> = {
  FL: '/florida',
  NJ: '/new-jersey',
  CA: '/california',
  TX: '/texas',
  WA: '/washington',
  AZ: '/arizona',
  CO: '/colorado',
  VA: '/virginia',
  NY: '/new-york',
  IL: '/illinois',
};

export function projectLenderHomeIntelFromNetworkMetrics(
  m: LenderNetworkMetricsV1,
): LenderHomeIntel {
  const intel = buildLenderHomeIntelFromSnapshot(m.homeProjection, m.generatedAt);
  const evidenceInventory = buildLenderHomepageEvidenceInventory(m);
  assertPublicHomepageInventory(evidenceInventory);
  return {
    ...intel,
    freshnessClocks: {
      generatedAt: m.generatedAt,
      newestDocumentedSourceAsOf: m.newestDocumentedSourceAsOf,
      note: m.newestDocumentedSourceAsOfNote,
    },
    geography: intel.geography.map((row) => ({
      ...row,
      intelligenceHref: STATE_INTEL_HREF[row.state] ?? null,
    })),
    evidenceInventory,
    stateCards: m.homepage!.stateCards,
  };
}
