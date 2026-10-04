import type { AskExecution } from '@/lib/ask-lender/types';

/**
 * Institution identity discovery uses cards.
 * Mortgage-market counts, aggregates, comparisons, and numeric ranks stay tables.
 */
export function isIdentityDiscovery(result: AskExecution): boolean {
  if (result.nameCandidates || result.lookup) return true;
  if (result.volumeEvidence || result.countEvidence) return false;
  const mode = result.query.mode;
  if (mode === 'count' || mode === 'aggregate' || mode === 'comparison') return false;
  if (result.query.identifier) return true;
  if (!result.query.identityQuery || mode !== 'entity') return false;
  return (result.rows ?? []).every((row) => row.metric === 0 && row.applications == null && row.originations == null && row.denials == null);
}
