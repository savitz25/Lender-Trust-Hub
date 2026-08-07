/**
 * Lender Trust Hub Phase 0 — closing-performance metrics.
 *
 * Seed / editorial ~X days close and on-time % must not display without a
 * defensible observed dataset (source, sample size, window, methodology).
 */

export type ClosingPerformanceProvenance = {
  source: string;
  sampleSize: number;
  observationWindow: string;
  methodologyNote: string;
  retrievedAt?: string | null;
};

export type ClosingPerformanceDisplay = {
  avgCloseDays: number | null;
  onTimeCloseRate: number | null;
  displayable: boolean;
  emptyStateLabel: string;
  provenance?: ClosingPerformanceProvenance;
};

export const NO_CLOSING_PERFORMANCE_LABEL =
  'No independently verified closing-performance data available';

/**
 * Phase 0: no observed closing dataset is wired — always suppress display.
 * When a real dataset exists later, pass provenance + values to unlock UI.
 */
export function resolveClosingPerformance(params?: {
  avgCloseDays?: number | null;
  onTimeCloseRate?: number | null;
  provenance?: ClosingPerformanceProvenance | null;
}): ClosingPerformanceDisplay {
  const p = params?.provenance;
  const hasProvenance =
    !!p &&
    Boolean(p.source?.trim()) &&
    typeof p.sampleSize === 'number' &&
    p.sampleSize > 0 &&
    Boolean(p.observationWindow?.trim()) &&
    Boolean(p.methodologyNote?.trim());

  if (
    hasProvenance &&
    typeof params?.avgCloseDays === 'number' &&
    params.avgCloseDays > 0
  ) {
    return {
      avgCloseDays: params.avgCloseDays,
      onTimeCloseRate:
        typeof params.onTimeCloseRate === 'number' && params.onTimeCloseRate >= 0
          ? params.onTimeCloseRate
          : null,
      displayable: true,
      emptyStateLabel: NO_CLOSING_PERFORMANCE_LABEL,
      provenance: p!,
    };
  }

  return {
    avgCloseDays: null,
    onTimeCloseRate: null,
    displayable: false,
    emptyStateLabel: NO_CLOSING_PERFORMANCE_LABEL,
  };
}
