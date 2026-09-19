// TH-SEARCH-R1-019C review-2: additional checks against the fresh optimized build (localhost:3131/3132/3133/3134).
import { writeFileSync } from 'node:fs';
const R = 'http://localhost:3131';
const call = async (body: unknown) => { const r = await fetch(`${R}/api/specialist-execution/name-candidates/v1`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); return { status: r.status, body: await r.json() as { resultState: string; candidates: unknown[]; diagnostics?: { dbReads?: number } } }; };
const out: Record<string, unknown> = {};
// malformed NMLS never queries the candidate catalog (dbReads stays 0; RESTRICTED_SCOPE)
for (const q of ['NMLS -3251', 'NMLS 32.51', 'NMLS +3251', 'NMLS 3e3']) { const r = await call({ name: q }); out[`malformed:${q}`] = { status: r.status, state: r.body.resultState, dbReads: r.body.diagnostics?.dbReads, candidates: r.body.candidates.length }; }
// disputed-LEI protection via the live endpoint
const guild = await call({ name: 'Guild Mortgage' }); const freedom = await call({ name: 'Freedom Mortgage' });
out.guild = (guild.body.candidates as Array<{ displayName: string; publicationState: string; action: unknown }>)[0];
out.freedom = (freedom.body.candidates as Array<{ displayName: string; publicationState: string; action: { type: string } | null }>).map((c) => c.displayName);
out.crossBridge = (freedom.body.candidates as Array<{ displayName: string }>).some((c) => /guild/i.test(c.displayName));
// Altura / AnnieMac: same generic miss shape as a nonexistent name
const altura = await call({ name: 'Altura Credit Union' }); const nonexistent = await call({ name: 'Zzqx Nonexistent Lending' }); const anniemac = await call({ name: 'AnnieMac Home Mortgage' });
out.alturaLimitationsEqualGeneric = JSON.stringify(altura.body) === JSON.stringify({ ...altura.body, resultState: nonexistent.body.resultState }) ? undefined : undefined;
out.alturaVsGenericLimitations = JSON.stringify((altura.body as { limitations: string[] }).limitations) === JSON.stringify((nonexistent.body as { limitations: string[] }).limitations);
out.alturaState = altura.body.resultState; out.anniemacState = anniemac.body.resultState;
// AnnieMac's real legal name IS discoverable (not the brand)
const legal = await call({ name: 'American Neighborhood Mortgage Acceptance Company' });
out.annieMacLegalNameFound = (legal.body.candidates as unknown[]).length > 0;
writeFileSync('docs/qa/th-search-r1-019c/review2-additional-checks.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
