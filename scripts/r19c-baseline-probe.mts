// TH-SEARCH-R1-019C: BEFORE-state probe on the unchanged starting base. Uses only APIs that exist there.
import { parseLenderAsk } from '../lib/ask-lender/parse';
import { executeAskQuery } from '../lib/ask-lender/execute-query';
import { askInputFromParams } from '../lib/ask-lender/request';
import { executeIdentityOrEvidence } from '../lib/specialist-execution/identity-execution';

const NAMES = ['BMO Bank', 'bmo bank', 'Alliant Credit Union', 'Randolph-Brooks FCU', 'Randolph-Brooks Federal Credit Union', 'Rocket Mortgage', 'rocket mortgage llc', '"BMO Bank"', 'Find BMO Bank', 'Research Alliant Credit Union', 'Guild Mortgage Company LLC', 'Guild Mortgage', 'Frost Bank', 'Movement Mortgage', 'Allied', 'Altura Credit Union'];
const out: Record<string, unknown>[] = [];
for (const q of NAMES) {
  const parsed = parseLenderAsk(q);
  const native = executeAskQuery(askInputFromParams({ q }));
  const service = await executeIdentityOrEvidence({ queryType: 'identity', identityName: q.replace(/^"|"$/g, '').replace(/^(find|research)\s+/i, '') });
  out.push({ q, nativeMode: parsed.mode, nativeFailKind: parsed.failClosedKind ?? null, nativeIdentityQuery: parsed.identityQuery ?? null, nativeRows: (native.rows ?? []).map((r) => r.displayName).slice(0, 3), nativeHeadline: native.headline?.slice(0, 80), serviceState: service.body.resultState, serviceIdentity: (service.body.identity as { displayName?: string } | null)?.displayName ?? null });
}
console.log(JSON.stringify({ probedAt: new Date().toISOString(), results: out }, null, 1));
