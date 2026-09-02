import accepted from './accepted-snapshot.json';

export type NewJerseyIntelligenceSnapshot = typeof accepted;

export const NJ_SNAPSHOT_CONTRACT = 'lender-nj-state-intel-v1' as const;

export const NEW_JERSEY_SNAPSHOT = accepted as NewJerseyIntelligenceSnapshot;

export function fmtInt(n: number | null | undefined): string {
  return Number(n || 0).toLocaleString('en-US');
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toFixed(2)}%`;
}

export function fmtUsd(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}
