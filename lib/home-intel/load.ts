import 'server-only';

import { loadLenderNetworkMetrics } from '@/lib/metrics/load-network-metrics';
import { projectLenderHomeIntelFromNetworkMetrics } from '@/lib/metrics/project-home-intel';
import type { LenderHomeIntel } from './types';

export type LoadedHomeIntel =
  | {
      status: 'ok';
      source: 'published' | 'superseded' | 'accepted_artifact' | 'network_metrics_v1';
      intel: LenderHomeIntel;
    }
  | { status: 'unavailable'; reason: string };

export async function loadLenderHomeIntel(): Promise<LoadedHomeIntel> {
  try {
    const v1 = loadLenderNetworkMetrics();
    return {
      status: 'ok',
      source: 'network_metrics_v1',
      intel: projectLenderHomeIntelFromNetworkMetrics(v1),
    };
  } catch (err) {
    return {
      status: 'unavailable',
      reason: err instanceof Error ? err.message : 'lender-network-metrics-v1 unavailable',
    };
  }
}
