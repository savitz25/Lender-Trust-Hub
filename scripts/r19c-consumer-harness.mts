// TH-SEARCH-R1-019C: CONSUMER HARNESS for the proposed network operation.
// Plays the role a future Ask adapter would: real HTTP against a running Lender build, contract pins,
// name-filter proof, state handling, paging, and Ask's OWN current relevance guard (imported read-only
// from an Ask checkout, not re-implemented). This proves compatibility inside the harness only --
// it is NOT live Ask activation, and Ask is not modified.
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { NAME_CANDIDATES_CONTRACT, NAME_CANDIDATES_PATH, NAME_CANDIDATES_SCHEMA_FINGERPRINT, NAME_CANDIDATES_VERSION } from '../lib/name-candidates/operation';

const BASE = process.argv[2] ?? 'http://localhost:3131';
const ASK_REPO = process.argv[3];
const OUT = process.argv[4] ?? 'docs/qa/th-search-r1-019c/consumer-harness.json';
type Guard = (supplied: string, matched: string | null, method: string) => boolean;
let askGuard: Guard | null = null;
if (ASK_REPO) askGuard = ((await import(pathToFileURL(`${ASK_REPO}/lib/network/name-candidates/adapters.ts`).href)) as { rowRelatesToName: Guard }).rowRelatesToName;

type Body = { contract: string; contractVersion: string; schemaFingerprint: string; resultState: string; name: { supplied: string; predicateApplied: boolean }; candidates: Array<{ stableKey: string; displayName: string; match: { method: string; field: string; value: string; isDocumentedSourceName: boolean }; identifiers: Array<{ label: string; value: string }>; publicationState: string; action: { type: string; url: string } | null }>; pagination: { page: number; returned: number; total: number; hasMore: boolean; truncated: boolean } | null; continuation: { url: string } | null; limitations: string[] };
async function call(body: unknown, method: 'POST' | 'GET' = 'POST') {
  const started = Date.now();
  const res = method === 'POST'
    ? await fetch(`${BASE}${NAME_CANDIDATES_PATH}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    : await fetch(`${BASE}${NAME_CANDIDATES_PATH}?${new URLSearchParams(body as Record<string, string>)}`);
  return { status: res.status, ms: Date.now() - started, body: (await res.json()) as Body, cacheControl: res.headers.get('cache-control') };
}
const checks: Array<{ check: string; ok: boolean; detail?: unknown }> = [];
const ok = (check: string, pass: boolean, detail?: unknown) => { checks.push({ check, ok: pass, ...(pass ? {} : { detail }) }); };

// Ask method vocabulary the future adapter would map to (no method is relabeled DOCUMENTED_ALIAS to pass a guard).
const ASK_METHOD: Record<string, string> = { EXACT_NORMALIZED_NAME: 'NORMALIZED_NAME', DOCUMENTED_HISTORICAL_NAME: 'DOCUMENTED_ALIAS', LEGAL_SUFFIX_NORMALIZED: 'NORMALIZED_NAME', ABBREVIATION_NORMALIZED: 'NORMALIZED_NAME', DERIVED_SLUG_FORM: 'HUB_NAME_MATCH', WORD_PREFIX: 'PREFIX_OR_TOKEN', DISTINCTIVE_TOKENS: 'PREFIX_OR_TOKEN' };

const names = ['BMO Bank', 'bmo', 'Alliant Credit Union', 'Randolph-Brooks FCU', 'Rocket Mortgage', 'rocket mortgage llc', 'Guild Mortgage', 'Frost Bank', 'First', 'VIP Mortgage Inc', 'Zzqx Nonexistent Lending', 'Altura Credit Union'];
const perName = [];
for (const name of names) {
  const r = await call({ operation: 'name_candidates', name, page: 1, limit: 10 });
  const pinned = r.body.contract === NAME_CANDIDATES_CONTRACT && r.body.contractVersion === NAME_CANDIDATES_VERSION && r.body.schemaFingerprint === NAME_CANDIDATES_SCHEMA_FINGERPRINT;
  const filterProven = r.body.name.predicateApplied === true && r.body.name.supplied === name;
  ok(`${name}: contract/version/fingerprint pinned`, pinned); ok(`${name}: name filter proven by echo`, filterProven, r.body.name);
  ok(`${name}: state is CANDIDATES | AMBIGUOUS_EXACT_NAME | NO_MATCH`, ['CANDIDATES', 'AMBIGUOUS_EXACT_NAME', 'NO_MATCH'].includes(r.body.resultState), r.body.resultState);
  ok(`${name}: every candidate maps to an Ask card (key, matched value/field/method, truthful action)`, r.body.candidates.every((c) => c.stableKey.startsWith('lender:') && c.match.value && c.match.field && ASK_METHOD[c.match.method] && (c.publicationState === 'public_profile' ? c.action?.type === 'PROFILE' && c.action.url.startsWith('https://www.lendertrusthub.com/') : c.action === null || c.action.type === 'OFFICIAL_IDENTIFIER_VERIFICATION')));
  const guard = askGuard ? r.body.candidates.map((c) => ({ key: c.stableKey, method: c.match.method, admittedByCurrentAskGuard: askGuard!(name, c.match.value, ASK_METHOD[c.match.method]!) })) : null;
  perName.push({ name, status: r.status, ms: r.ms, state: r.body.resultState, total: r.body.pagination?.total ?? 0, hasMore: r.body.pagination?.hasMore ?? false, first: r.body.candidates.slice(0, 3).map((c) => `${c.displayName} [${c.match.method}; ${c.publicationState}; ${c.identifiers.map((i) => `${i.label} ${i.value}`).join(', ') || 'no identifier'}]`), askGuard: guard, rejectedByCurrentAskGuard: guard?.filter((g) => !g.admittedByCurrentAskGuard) ?? null });
}

// paging: no overlap, honest end
const p1 = await call({ name: 'First', page: 1, limit: 10 }), p2 = await call({ name: 'First', page: 2, limit: 10 });
ok('paging: page 2 has different records than page 1', p1.body.candidates.every((c) => !p2.body.candidates.some((d) => d.stableKey === c.stableKey)));
ok('paging: total is stable and hasMore is honest', p1.body.pagination!.total === p2.body.pagination!.total && p1.body.pagination!.hasMore === true && p1.body.pagination!.truncated === false);
const get = await call({ name: 'BMO Bank' }, 'GET'); ok('GET form returns the same first candidate as POST', get.body.candidates[0]?.stableKey === (await call({ name: 'BMO Bank' })).body.candidates[0]?.stableKey);
ok('responses are no-store', /no-store/.test(p1.cacheControl ?? ''), p1.cacheControl);

// non-candidate states
for (const [label, body, status, state] of [['identifier refused', { name: 'NMLS 3030' }, 422, 'RESTRICTED_SCOPE'], ['person refused', { name: 'Jane Doe loan officer' }, 422, 'RESTRICTED_SCOPE'], ['unknown field rejected', { name: 'BMO Bank', url: 'https://evil.example' }, 400, 'INVALID_REQUEST'], ['bad page rejected', { name: 'BMO Bank', page: 0 }, 400, 'INVALID_REQUEST'], ['missing name rejected', {}, 400, 'INVALID_REQUEST']] as const) {
  const r = await call(body); ok(`${label}: ${status} ${state}`, r.status === status && r.body.resultState === state, [r.status, r.body.resultState]);
}
// the EXISTING v2 operation is unchanged for its current consumer
const v2 = await (await fetch(`${BASE}/api/specialist-execution/v2`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contract: 'trusthub-specialist-execution-v2', queryType: 'identity', identityName: 'rocket mortgage llc' }) })).json() as { resultState: string; contractVersion: string; schemaFingerprint: string };
ok('v2 identity-name keeps EXACT semantics (suffix form is still NO_CONFIDENT_MATCH there)', v2.resultState === 'NO_CONFIDENT_MATCH', v2.resultState);
ok('v2 version + schema fingerprint unchanged (Ask pin)', v2.contractVersion === '2.1.0' && v2.schemaFingerprint === '0da572d08450e68f4f01a4f4b28e2e813503f50b1a84546a29d7eb817db205dd');

const failed = checks.filter((c) => !c.ok);
writeFileSync(OUT, JSON.stringify({ ranAt: new Date().toISOString(), base: BASE, note: 'Harness compatibility only. Ask is unmodified and does not call this operation yet.', askGuardSource: ASK_REPO ? 'Ask checkout lib/network/name-candidates/adapters.ts rowRelatesToName (imported read-only)' : 'not supplied', passed: checks.length - failed.length, failed: failed.length, failures: failed, perName }, null, 1));
for (const n of perName) console.log(`${n.name.padEnd(28)} ${n.status} ${String(n.ms).padStart(4)}ms ${n.state.padEnd(22)} total=${n.total} ${n.rejectedByCurrentAskGuard?.length ? `| current Ask guard would reject ${n.rejectedByCurrentAskGuard.length}: ${n.rejectedByCurrentAskGuard.map((g) => g.method).join(',')}` : ''} | ${n.first[0] ?? ''}`);
console.log(`checks: ${checks.length - failed.length} passed, ${failed.length} failed`); if (failed.length) { console.log(JSON.stringify(failed, null, 1)); process.exit(1); }
