import { loadLenderNetworkMetrics } from '@/lib/metrics/load-network-metrics';

/** Specialist-owned, source-grain-preserving export for upstream consumers. */
export function GET() {
  return Response.json(loadLenderNetworkMetrics(), {
    headers: { 'Cache-Control': 'public, max-age=0, must-revalidate' },
  });
}
