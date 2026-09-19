/**
 * TH-SEARCH-R1-019C behavioral gate. Real normalizer, engine, native adapter, network operation,
 * parser and exact identity/evidence executor. Fixture institutions are HYPOTHETICAL and isolated;
 * no test writes anywhere. The real committed catalog is used only for read-only known cases.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { searchNameCandidates, type CatalogInstitution, type CatalogName } from './engine';
import { loadCandidateCatalog, type CandidateCatalog } from './catalog';
import { executeNameCandidates, NAME_CANDIDATES_CONTRACT, NAME_CANDIDATES_SCHEMA_FINGERPRINT } from './operation';
import { decideNativeNameSearch, executeNativeNameCandidates } from './native';
import { parseLenderAsk } from '../ask-lender/parse';
import { executeAskQuery } from '../ask-lender/execute-query';
import { executeIdentityOrEvidence } from '../specialist-execution/identity-execution';
import { SPECIALIST_SCHEMA_FINGERPRINT, SPECIALIST_CONTRACT_VERSION } from '../specialist-execution/contract';
import { AskResultView } from '../../components/ask-lender/ask-result-view';
import type { ExactIdentityStore } from '../specialist-execution/identity-store';
Object.assign(globalThis, { React });

// ---------------------------------------------------------------- isolated fixture catalog
const name = (value: string, field: CatalogName['field'] = 'canonical_name'): CatalogName => ({ value, field, sourceLabel: `fixture ${field}` });
let seq = 0;
function inst(display: string, extra: Partial<CatalogInstitution> & { historical?: string[]; slugForm?: string } = {}): CatalogInstitution {
  seq += 1;
  const names = [name(display), ...(extra.historical ?? []).map((h) => name(h, 'historical_name')), ...(extra.slugForm ? [name(extra.slugForm, 'derived_slug_form')] : [])];
  const profile = extra.publicationState === undefined || extra.publicationState === 'public_profile';
  return { institutionKey: extra.institutionKey ?? `nmls-inst:90${String(seq).padStart(5, '0')}`, displayName: display, entityType: 'Fixture institution', names, nmls: extra.nmls === undefined ? `90${String(seq).padStart(5, '0')}` : extra.nmls, lei: extra.lei ?? null, publicationState: extra.publicationState ?? 'public_profile', profilePath: profile ? `/lender/fx-${seq}` : null, sourceReference: 'fixture' };
}
const FIXTURE: CatalogInstitution[] = [
  inst('Allied Home Lending, LLC'), inst('Allied Mortgage Group Inc.', { publicationState: 'unpublished_research_identity', nmls: null, lei: 'FX00000000000000ALLI' }),
  inst('First Allied Bank, N.A.'), inst('Allied First Federal Credit Union'),
  inst('Alliedbank Mortgage'), // a word-PREFIX candidate for "Allied" (the name begins with it), ordered after whole-word matches
  inst('Cleverallied Lending'), // mid-word containment: must NEVER match "Allied"
  inst('Union Trust Bank', { institutionKey: 'nmls-inst:9100001' }), inst('Union Trust Bank', { institutionKey: 'nmls-inst:9100002' }),
  inst('Heritage Home Lending', { historical: ['Old Dominion Mortgage'], slugForm: 'heritage home lending co' }),
  inst('Mortgage Bank'), inst('Florida Capital Bank'), inst('New York Community Lending'), inst('1st Source Bank'), inst("O'Neil-Hart Mortgage"),
  inst('Randolph-Brooks Federal Credit Union'), inst('Northwind Credit Union', { publicationState: 'unpublished_research_identity', nmls: null, lei: null }),
  ...Array.from({ length: 30 }, (_, i) => inst(`Summit ${String.fromCharCode(65 + (i % 26))}${i} Mortgage`)),
];
const catalogOf = (institutions: CatalogInstitution[]): CandidateCatalog => ({ institutions, sourceVersion: { profiles: 'fixture', hmdaIdentity: 'fixture', fingerprint: 'fixture' }, counts: { publishedProfiles: institutions.length, hmdaOnly: 0, identityHold: 0 } });
const fx = () => catalogOf(FIXTURE);
const keys = (q: string, options = {}) => searchNameCandidates(FIXTURE, q, { limit: 25, ...options }).candidates.map((c) => c.institution.displayName);
const first = (q: string) => searchNameCandidates(FIXTURE, q).candidates[0];

// ---------------------------------------------------------------- matching
test('01 full, lowercase, legal-suffix and punctuation variants recover the SAME stable identity', () => {
  const expected = FIXTURE[0]!.institutionKey;
  for (const q of ['Allied Home Lending, LLC', 'allied home lending llc', 'ALLIED HOME LENDING', 'Allied Home Lending', 'allied-home lending, l.l.c.', '  Allied   Home  Lending  ']) {
    assert.equal(first(q)?.institution.institutionKey, expected, q);
    assert.ok(first(q)!.rank <= 3, `${q} is a full-name match`);
  }
  assert.equal(first("oneil hart mortgage")?.institution.displayName, "O'Neil-Hart Mortgage", 'apostrophe and hyphen forms');
  assert.equal(first('1st Source Bank')?.institution.displayName, '1st Source Bank', 'numbers are kept');
});

test('01b dotted / spaced initialisms are the same search form as the joined letters (found by holdout run 1: V.I.P. vs VIP)', () => {
  const cat = [inst('V.I.P. Mortgage, Inc.'), inst('U.S. Prairie Bank, N.A.'), inst('VIPER Lending')];
  const top = (q: string) => searchNameCandidates(cat, q).candidates[0];
  for (const q of ['VIP MORTGAGE INC', 'V.I.P. Mortgage', 'v i p mortgage', 'vip mortgage']) { assert.equal(top(q)?.institution.displayName, 'V.I.P. Mortgage, Inc.', q); assert.ok(top(q)!.rank <= 3, q); }
  assert.equal(top('US Prairie Bank')?.institution.displayName, 'U.S. Prairie Bank, N.A.');
  assert.equal(top('U S Prairie Bank NA')?.institution.displayName, 'U.S. Prairie Bank, N.A.');
});

test('02 a short distinctive prefix returns the actually related institutions -- several Allied records, whole words only', () => {
  const got = keys('Allied');
  assert.deepEqual([...got].sort(), ['Allied First Federal Credit Union', 'Allied Home Lending, LLC', 'Allied Mortgage Group Inc.', 'Alliedbank Mortgage', 'First Allied Bank, N.A.'].sort());
  assert.ok(!got.includes('Cleverallied Lending'), 'mid-word containment is never a match');
  assert.ok(got.indexOf('Alliedbank Mortgage') > got.indexOf('Allied Mortgage Group Inc.'), 'whole-word prefix matches order before a partial-word prefix');
  assert.equal(got[got.length - 1], 'First Allied Bank, N.A.', 'a whole word elsewhere in the name is the weakest candidate tier');
  assert.deepEqual(keys('alli').sort(), got.filter((n) => n.startsWith('Allied')).sort(), 'a partial last word is a word PREFIX only');
});

test('03 adding another eligible source record makes it discoverable with no company-specific code', () => {
  const added = inst('Allied Prairie Lending Co.');
  const got = searchNameCandidates([...FIXTURE, added], 'Allied', { limit: 25 }).candidates.map((c) => c.institution.institutionKey);
  assert.ok(got.includes(added.institutionKey));
});

test('04 FCU expansion is a search-form normalization, never reported as a documented alias', () => {
  const hit = first('Randolph-Brooks FCU')!;
  assert.equal(hit.institution.displayName, 'Randolph-Brooks Federal Credit Union');
  assert.equal(hit.method, 'ABBREVIATION_NORMALIZED'); assert.match(hit.explanation, /not a documented legal alias/i);
  assert.equal(hit.matchedName.value, 'Randolph-Brooks Federal Credit Union', 'the real source text is returned, not the typed abbreviation');
});

test('05 real source historical names work; unsupported brands / affiliates are never joined', () => {
  const hit = first('Old Dominion Mortgage')!;
  assert.equal(hit.method, 'DOCUMENTED_HISTORICAL_NAME'); assert.equal(hit.matchedName.value, 'Old Dominion Mortgage'); assert.equal(hit.institution.displayName, 'Heritage Home Lending');
  const slug = first('heritage home lending co')!;
  assert.equal(slug.rank <= 4, true);
  assert.deepEqual(keys('Heritage Brand Affiliates'), [], 'no invented brand bridge');
  assert.deepEqual(keys('HHL'), [], 'no invented acronym expansion');
  const op = executeNameCandidates({ name: 'heritage home lending co' }, () => catalogOf([inst('Zeta Lending', { slugForm: 'heritage home lending co' })]));
  assert.equal((op.body.candidates as Array<{ match: { isDocumentedSourceName: boolean; method: string } }>)[0]!.match.isDocumentedSourceName, false, 'a slug-derived form is labeled as derived, not as an alias');
});

test('06 identical names on DISTINCT institution keys stay separate; a repeated key is one institution', () => {
  const r = searchNameCandidates(FIXTURE, 'Union Trust Bank');
  assert.deepEqual(r.candidates.map((c) => c.institution.institutionKey), ['nmls-inst:9100001', 'nmls-inst:9100002']);
  assert.equal(r.exactNameAmbiguous, true);
  const duplicateRepresentation = [...FIXTURE, { ...FIXTURE[5]!, displayName: 'UNION TRUST BANK (second source row)' }];
  assert.equal(searchNameCandidates(duplicateRepresentation, 'Union Trust Bank').total, 2, 'same verified key = same institution');
});

test('07 the name filter runs BEFORE paging: a relevant record beyond the first page is reachable, and totals are honest', () => {
  const p1 = searchNameCandidates(FIXTURE, 'Summit', { limit: 10 }); const p3 = searchNameCandidates(FIXTURE, 'Summit', { limit: 10, page: 3 }); const p4 = searchNameCandidates(FIXTURE, 'Summit', { limit: 10, page: 4 });
  assert.equal(p1.total, 30); assert.equal(p1.hasMore, true); assert.equal(p3.candidates.length, 10); assert.equal(p3.hasMore, false); assert.equal(p4.candidates.length, 0);
  const all = [1, 2, 3].flatMap((page) => searchNameCandidates(FIXTURE, 'Summit', { limit: 10, page }).candidates.map((c) => c.institution.institutionKey));
  assert.equal(new Set(all).size, 30, 'pages do not overlap or skip');
  assert.ok(p1.candidates.every((c) => /^Summit /.test(c.institution.displayName)), 'never an alphabetical first page filtered afterwards');
});

test('08 generic words never produce a directory; a generic-looking FULL name still matches its exact record; places stay in names', () => {
  for (const q of ['Mortgage', 'Bank', 'Credit Union', 'Bank LLC', 'The Mortgage Company', 'zzqx nonexistent']) assert.equal(searchNameCandidates(FIXTURE, q).total, 0, q);
  assert.equal(first('Mortgage Bank')?.institution.displayName, 'Mortgage Bank');
  assert.equal(first('Florida Capital Bank')?.institution.displayName, 'Florida Capital Bank');
  assert.equal(first('New York Community')?.institution.displayName, 'New York Community Lending');
  assert.ok(searchNameCandidates(FIXTURE, 'Summit Mortgage').candidates.every((c) => /Summit/.test(c.institution.displayName)), 'a shared generic word does not swamp the distinctive one');
});

test('09 profile absence is not discovery prohibition: research rows appear inline with NO invented profile URL; null metadata is not fabricated', () => {
  const op = executeNameCandidates({ name: 'Allied Mortgage Group' }, fx);
  const c = (op.body.candidates as Array<Record<string, unknown>>)[0]! as { publicationState: string; action: { type: string; url: string } | null; identifiers: Array<{ label: string }>; source: { clock: { value: string | null } } };
  assert.equal(c.publicationState, 'unpublished_research_identity'); assert.equal(c.action?.type, 'OFFICIAL_IDENTIFIER_VERIFICATION'); assert.match(c.action!.url, /^https:\/\/search\.gleif\.org\//);
  assert.deepEqual(c.identifiers.map((i) => i.label), ['LEI'], 'no NMLS is invented'); assert.equal(c.source.clock.value, null, 'no as-of date is invented');
  const bare = (executeNameCandidates({ name: 'Northwind Credit Union' }, fx).body.candidates as Array<{ action: unknown; identifiers: unknown[] }>)[0]!;
  assert.equal(bare.action, null); assert.deepEqual(bare.identifiers, []);
});

test('10 the REAL catalog excludes people, branches, held projections and exact-ID-only research identities', () => {
  const real = loadCandidateCatalog();
  assert.equal(real.counts.publishedProfiles, 311);
  assert.ok(real.institutions.every((i) => /^(nmls-inst:|lei:|fdic:|ncua:|hmda-lei:|[a-z-]+:)/.test(i.institutionKey)));
  assert.ok(real.institutions.every((i) => i.publicationState !== 'public_profile' || (i.profilePath ?? '').startsWith('/')));
  assert.ok(real.institutions.filter((i) => i.publicationState !== 'public_profile').every((i) => i.profilePath === null));
  // Altura (NMLS 401403) and AnnieMac (NMLS 338923) exist ONLY in the internal exact-identifier store. They must not be enumerable by name.
  for (const q of ['Altura Credit Union', 'AnnieMac Home Mortgage', 'Acrisure Mortgage', 'Martini Mortgage Group']) assert.equal(searchNameCandidates(real.institutions, q).total, 0, q);
  const source = readFileSync(new URL('./catalog.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /supabase|service_?role|identity-store|createClient/i, 'the catalog never touches the service-role store');
  // A profile never repeats an LEI the hub itself holds as conflicting.
  const held = new Set(real.institutions.filter((i) => i.publicationState === 'identity_hold').map((i) => i.lei));
  assert.ok(held.size > 0); assert.ok(real.institutions.filter((i) => i.publicationState === 'public_profile').every((i) => !i.lei || !held.has(i.lei)));
});

test('11 known present institutions are found by ordinary names in the REAL catalog, with their source identifiers', () => {
  const real = loadCandidateCatalog().institutions;
  const cases: Array<[string, string]> = [['BMO Bank', '401052'], ['bmo', '401052'], ['Alliant Credit Union', '197185'], ['alliant', '197185'], ['Randolph-Brooks FCU', '583215'], ['Randolph-Brooks Federal Credit Union', '583215'], ['Rocket Mortgage', '3030'], ['rocket mortgage llc', '3030'], ['Rocket Mortg', '3030']];
  for (const [q, nmls] of cases) assert.ok(searchNameCandidates(real, q, { limit: 25 }).candidates.some((c) => c.institution.nmls === nmls), `${q} -> NMLS ${nmls}`);
});

// ---------------------------------------------------------------- source failure / request validation
test('12 a source failure is SOURCE_UNAVAILABLE / UNAVAILABLE -- never a miss -- and the name is kept', () => {
  const boom = () => { throw new Error('secret internal detail'); };
  const op = executeNameCandidates({ name: 'Allied' }, boom);
  assert.equal(op.status, 503); assert.equal(op.body.resultState, 'SOURCE_UNAVAILABLE'); assert.equal(op.body.name.supplied, 'Allied'); assert.doesNotMatch(JSON.stringify(op.body), /secret internal detail/);
  const native = executeNativeNameCandidates({ q: 'Allied', page: 1, pageSize: 25, overrides: {} }, parseLenderAsk('Allied'), { name: 'Allied', basis: 'BARE_NAME', unresolvedConditions: [] }, boom);
  assert.equal(native.terminalState, 'UNAVAILABLE'); assert.equal(native.nameCandidates?.state, 'UNAVAILABLE'); assert.match(native.headline, /Allied/); assert.match(native.body, /not a “no match”/);
});

test('13 the network operation validates input, refuses identifiers/people/branches, and distinguishes every outcome', () => {
  const state = (request: Record<string, unknown>) => { const r = executeNameCandidates(request, fx); return [r.status, r.body.resultState]; };
  assert.deepEqual(state({ name: 'Allied' }), [200, 'CANDIDATES']);
  assert.deepEqual(state({ name: 'Union Trust Bank' }), [200, 'AMBIGUOUS_EXACT_NAME']);
  assert.deepEqual(state({ name: 'zzqx nonexistent' }), [200, 'NO_MATCH']);
  assert.deepEqual(state({ name: 'NMLS 3030' }), [422, 'RESTRICTED_SCOPE']); assert.deepEqual(state({ name: '3030' }), [422, 'RESTRICTED_SCOPE']); assert.deepEqual(state({ name: 'John Smith loan officer' }), [422, 'RESTRICTED_SCOPE']);
  for (const bad of [{}, { name: 5 }, { name: 'A' }, { name: 'x'.repeat(200) }, { name: 'Allied', page: 0 }, { name: 'Allied', limit: 500 }, { name: 'Allied', page: 1.5 }, { name: 'Allied', url: 'https://evil.example' }, { name: 'Allied', rows: [] }, { name: 'Allied', sql: 'select 1' }, { name: 'Allied', operation: 'evidence' }]) assert.deepEqual(state(bad), [400, 'INVALID_REQUEST'], JSON.stringify(bad));
  const ok = executeNameCandidates({ operation: 'name_candidates', name: '  Allied ', page: 1, limit: 2 }, fx).body as unknown as { contract: string; schemaFingerprint: string; name: { supplied: string; predicateApplied: boolean }; pagination: { returned: number; total: number; hasMore: boolean }; candidates: Array<{ stableKey: string; match: { value: string; field: string; method: string } }> };
  assert.equal(ok.contract, NAME_CANDIDATES_CONTRACT); assert.equal(ok.schemaFingerprint, NAME_CANDIDATES_SCHEMA_FINGERPRINT);
  assert.deepEqual(ok.name.supplied, 'Allied'); assert.equal(ok.name.predicateApplied, true);
  assert.deepEqual([ok.pagination.returned, ok.pagination.total, ok.pagination.hasMore], [2, 5, true]);
  assert.ok(ok.candidates.every((c) => c.stableKey.startsWith('lender:') && c.match.value && c.match.field && c.match.method));
});

// ---------------------------------------------------------------- one engine, two callers
test('14 native Ask and the network operation use the same matcher and scope for equivalent inputs', () => {
  for (const q of ['Allied', 'Union Trust Bank', 'Summit', 'Randolph-Brooks FCU', 'zzqx nonexistent']) {
    const op = executeNameCandidates({ name: q, limit: 25 }, fx).body as unknown as { candidates: Array<{ stableKey: string }>; pagination: { total: number } | null };
    const native = executeNativeNameCandidates({ q, page: 1, pageSize: 25, overrides: {} }, parseLenderAsk(q), { name: q, basis: 'BARE_NAME', unresolvedConditions: [] }, fx);
    assert.deepEqual(native.rows!.map((r) => `lender:${r.institutionKey}`), op.candidates.map((c) => c.stableKey), q);
    assert.equal(native.totalRows, op.pagination?.total ?? 0, q);
  }
});

test('15 native /ask accepts ordinary names end-to-end (real parser + real catalog) without an NMLS', () => {
  for (const q of ['BMO Bank', 'bmo bank', '"BMO Bank"', 'Find BMO Bank', 'Research Alliant Credit Union', 'Randolph-Brooks FCU', 'rocket mortgage llc', 'Guild Mortgage Company LLC', 'Frost Bank']) {
    const r = executeAskQuery({ q });
    assert.ok(r.nameCandidates, `${q} is a name search`); assert.ok((r.rows?.length ?? 0) >= 1, `${q} shows candidates`); assert.equal(r.failClosed ?? false, false, q);
  }
  const guild = executeAskQuery({ q: 'Guild Mortgage Company LLC' });
  assert.ok(guild.rows!.every((row) => /guild/i.test(row.displayName)), 'never the unfiltered top-lender list the old path returned for this name');
  const miss = executeAskQuery({ q: 'Zzqx Nonexistent Lending' });
  assert.equal(miss.nameCandidates?.state, 'NO_MATCH'); assert.match(miss.headline, /Zzqx Nonexistent Lending/); assert.equal(miss.rows?.length, 0); assert.notEqual(miss.terminalState, 'UNAVAILABLE');
});

test('16 real question types are NOT turned into literal name searches; identifiers keep precedence', () => {
  for (const q of ['How many mortgage applications were there in Florida?', 'Which lenders originated the most mortgages in New Jersey?', 'mortgage lenders in Texas', 'Texas mortgage lenders', 'What is an NMLS ID?', 'What is HMDA?', 'best mortgage lender for me', 'Should I refinance now?', 'Is Rocket Mortgage licensed in Ohio?', 'complaints about Rocket Mortgage', 'lenders near me', 'mortgage company']) {
    assert.equal(executeAskQuery({ q }).nameCandidates, undefined, q);
  }
  const exact = executeAskQuery({ q: 'NMLS 3030' }); assert.equal(exact.nameCandidates, undefined); assert.equal(exact.terminalState, 'FOUND');
  const exactMiss = executeAskQuery({ q: 'NMLS 99999999' }); assert.equal(exactMiss.nameCandidates, undefined); assert.equal(exactMiss.terminalState, 'NO_MATCH');
  assert.equal(executeAskQuery({ q: 'NMLS #3,030' }).nameCandidates, undefined, 'formatted identifier input keeps the identifier path');
});

test('17 an explicit location condition on a name stays visible as NOT applied; a place inside a name is just the name', () => {
  const d = decideNativeNameSearch('Florida Capital Bank in Texas', parseLenderAsk('Florida Capital Bank in Texas'), fx)!;
  assert.equal(d.name, 'Florida Capital Bank'); assert.deepEqual(d.unresolvedConditions, ['in Texas']);
  const r = executeNativeNameCandidates({ q: 'Florida Capital Bank in Texas', page: 1, pageSize: 25, overrides: {} }, parseLenderAsk('Florida Capital Bank in Texas'), d, fx);
  assert.ok(r.interpretation.some((line) => line.label === 'Not applied' && line.value === 'in Texas')); assert.ok(r.caveats!.some((c) => /was not applied/.test(c)));
  assert.equal(decideNativeNameSearch('Florida Capital Bank', parseLenderAsk('Florida Capital Bank'), fx)?.name, 'Florida Capital Bank');
  assert.equal(decideNativeNameSearch('mortgage lenders in Florida', parseLenderAsk('mortgage lenders in Florida'), fx), null);
});

// ---------------------------------------------------------------- evidence stays exact
const emptyStore: ExactIdentityStore = { lookupNmls: async () => [], lookupLei: async () => [] };
test('18 NO candidate match can attach complaint evidence: the exact identity/bridge path is unchanged', async () => {
  const candidateOnly = ['Rocket Mortg', 'rocket mortgage llc', 'Rocket'];
  for (const q of candidateOnly) {
    assert.ok(searchNameCandidates(loadCandidateCatalog().institutions, q).total >= 1, `${q} IS a candidate`);
    const evidence = await executeIdentityOrEvidence({ queryType: 'evidence', identityName: q, requestedEvidence: ['CFPB_COMPLAINTS'] }, { store: emptyStore });
    assert.equal(evidence.body.resultState, 'NO_CONFIDENT_MATCH', `${q} must NOT receive complaint evidence`); assert.deepEqual(evidence.body.rows, []);
    const identity = await executeIdentityOrEvidence({ queryType: 'identity', identityName: q }, { store: emptyStore });
    assert.equal(identity.body.resultState, 'NO_CONFIDENT_MATCH', 'the v2 identity-name semantics are still exact');
  }
  const exact = await executeIdentityOrEvidence({ queryType: 'evidence', identityName: 'Rocket Mortgage', requestedEvidence: ['CFPB_COMPLAINTS'] }, { store: emptyStore });
  assert.ok(['SUPPORTED_RESULTS', 'ZERO_MATCHING_ROWS'].includes(exact.body.resultState as string), 'the exact positive still resolves');
  const evidenceSource = readFileSync(new URL('../specialist-execution/identity-execution.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(evidenceSource, /name-candidates/, 'the evidence executor never imports the candidate engine');
  // A name candidate result never carries complaint evidence itself.
  const native = executeAskQuery({ q: 'Rocket Mortgage' }); assert.doesNotMatch(JSON.stringify(native.rows), /CFPB|observation|attachedObservationCount|companyResponses/i);
});

test('19 the existing v2 contract that Ask pins is byte-stable: version and schema fingerprint unchanged', () => {
  assert.equal(SPECIALIST_CONTRACT_VERSION, '2.1.0');
  assert.equal(SPECIALIST_SCHEMA_FINGERPRINT, '0da572d08450e68f4f01a4f4b28e2e813503f50b1a84546a29d7eb817db205dd');
  assert.notEqual(NAME_CANDIDATES_SCHEMA_FINGERPRINT, SPECIALIST_SCHEMA_FINGERPRINT);
});

// ---------------------------------------------------------------- selection / paging / stale state
test('20 paging, edits and new submissions never carry another institution or stale evidence', () => {
  const page1 = executeAskQuery({ q: 'First', page: 1, pageSize: 10 }); const page2 = executeAskQuery({ q: 'First', page: 2, pageSize: 10 });
  assert.ok(page1.nameCandidates && page2.nameCandidates); assert.ok((page1.totalRows ?? 0) > 10); assert.equal(page1.pageCount, Math.ceil(page1.totalRows! / 10));
  const k1 = page1.rows!.map((r) => r.institutionKey), k2 = page2.rows!.map((r) => r.institutionKey);
  assert.equal(k1.filter((k) => k2.includes(k)).length, 0); assert.equal(page2.rows![0]!.rank, 11, 'rank continues across pages');
  assert.match(page1.sharePath ?? '', /q=First/, 'the query is preserved through View more / paging');
  const edited = executeAskQuery({ q: 'BMO Bank' });
  assert.ok(edited.rows!.every((r) => !k1.includes(r.institutionKey) || /bmo/i.test(r.displayName)), 'a new submission starts clean');
  assert.equal(executeAskQuery({ q: 'BMO Bank' }).rows![0]!.institutionKey, edited.rows![0]!.institutionKey, 'deterministic: same input, same identity');
});

test('21 rendered native result: candidates table, inline research row with official action, honest pager noun, name retained on miss', () => {
  const html = (q: string, pageSize = 25) => renderToStaticMarkup(React.createElement(AskResultView, { result: executeAskQuery({ q, pageSize }), question: q }));
  const bmo = html('BMO Bank'); assert.match(bmo, /data-name-candidates-state="CANDIDATES"/); assert.match(bmo, /BMO Bank/); assert.match(bmo, /Research this lender/); assert.match(bmo, /NMLS 401052/);
  const frost = html('Frost Bank'); assert.match(frost, /Unpublished research identity/); assert.match(frost, /No LenderTrustHub profile/); assert.match(frost, /search\.gleif\.org/); assert.doesNotMatch(frost, /href="\/lender\/frost/);
  const many = html('First', 10); assert.match(many, /name candidate records/); assert.doesNotMatch(many, /reporting institutions<\/span>/);
  const miss = html('Zzqx Nonexistent Lending'); assert.match(miss, /data-name-candidates-state="NO_MATCH"/); assert.match(miss, /Zzqx Nonexistent Lending/);
});
