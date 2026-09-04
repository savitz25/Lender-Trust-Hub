import manifest from '@/data/home/lender-network-metrics-v1.json';
import {
  LENDER_NETWORK_METRICS_VERSION,
  type LenderNetworkMetricsV1,
} from './lender-network-metrics-v1';

export function loadLenderNetworkMetrics(): LenderNetworkMetricsV1 {
  const snap = manifest as LenderNetworkMetricsV1;
  if (snap.schemaVersion !== LENDER_NETWORK_METRICS_VERSION) {
    throw new Error(`Unexpected network metrics version: ${snap.schemaVersion}`);
  }
  return snap;
}
