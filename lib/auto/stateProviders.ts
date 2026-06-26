/**
 * AUTO LOAN STATE DATA LAYER — clone of lib/mortgage/stateLenders.ts
 */
import { autoProviders } from './providers';
import type { AutoLoanProvider, StateAutoStats } from './types';

export function getProvidersByStateSlug(stateSlug: string): AutoLoanProvider[] {
  return autoProviders
    .filter((p) => p.stateSlug === stateSlug)
    .sort((a, b) => b.trustScore - a.trustScore);
}

export function getStateSlugsWithAutoProviders(): string[] {
  return [...new Set(autoProviders.map((p) => p.stateSlug))].sort();
}

function parseAprLow(aprRange: string): number {
  const match = aprRange.match(/([\d.]+)%/);
  return match ? parseFloat(match[1]) : 0;
}

export function getStateAutoStats(stateSlug: string): StateAutoStats {
  const providers = getProvidersByStateSlug(stateSlug);
  const aprLows = providers.map((p) => parseAprLow(p.aprRange)).filter((n) => n > 0);
  const avgAprLow =
    aprLows.length > 0
      ? Math.round((aprLows.reduce((s, n) => s + n, 0) / aprLows.length) * 10) / 10
      : 0;
  const avgTrustScore =
    providers.length > 0
      ? Math.round(providers.reduce((s, p) => s + p.trustScore, 0) / providers.length)
      : 0;

  return {
    total: providers.length,
    verified: providers.filter((p) => p.verified).length,
    avgTrustScore,
    avgAprLow,
    topProvider: providers[0],
  };
}

export const AUTO_DATA_UPDATED = '2026-06-26';