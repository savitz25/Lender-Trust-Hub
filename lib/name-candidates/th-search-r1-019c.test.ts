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
import { activeNameCandidateFixture } from './fixtures';
import { executeNameCandidates, NAME_CANDIDATES_CONTRACT, NAME_CANDIDATES_SCHEMA_FINGERPRINT } from './operation';
import { decideNativeNameSearch, executeNativeNameCandidates } from './native';
import { isBareNumericOnlyInput } from './request-shape';
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
  const native = executeNativeNameCandidates({ q: 'Allied', page: 1, pageSize: 25, overrides: {} }, parseLenderAsk('Allied'), { name: 'Allied', basis: 'ONLY_READING', unresolvedConditions: [] }, boom);
  assert.equal(native.terminalState, 'UNAVAILABLE'); assert.equal(native.nameCandidates?.state, 'UNAVAILABLE'); assert.match(native.headline, /Allied/); assert.match(native.body, /not a “no match”/);
});

test('13 the network operation validates input, refuses identifiers/people/branches, and distinguishes every outcome', () => {
  const state = (request: Record<string, unknown>) => { const r = executeNameCandidates(request, fx); return [r.status, r.body.resultState]; };
  assert.deepEqual(state({ name: 'Allied' }), [200, 'CANDIDATES']);
  assert.deepEqual(state({ name: 'Union Trust Bank' }), [200, 'AMBIGUOUS_EXACT_NAME']);
  assert.deepEqual(state({ name: 'zzqx nonexistent' }), [200, 'NO_MATCH']);
  assert.deepEqual(state({ name: 'NMLS 3030' }), [422, 'RESTRICTED_SCOPE']); // keyword-shaped names and people: see R1 / R1b
  for (const bad of [{}, { name: 5 }, { name: 'A' }, { name: 'x'.repeat(200) }, { name: 'Allied', page: 0 }, { name: 'Allied', page: 21, limit: 10 }, { name: 'Allied', limit: 500 }, { name: 'Allied', page: 1.5 }, { name: 'Allied', url: 'https://evil.example' }, { name: 'Allied', rows: [] }, { name: 'Allied', sql: 'select 1' }, { name: 'Allied', operation: 'evidence' }]) assert.deepEqual(state(bad), [400, 'INVALID_REQUEST'], JSON.stringify(bad));
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
    const native = executeNativeNameCandidates({ q, page: 1, pageSize: 25, overrides: {} }, parseLenderAsk(q), { name: q, basis: 'ONLY_READING', unresolvedConditions: [] }, fx);
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

test('MN-LEND-001R bare numeric input stays fail-closed through the production name seam', () => {
  const parsed = parseLenderAsk('2229');
  assert.notEqual(parsed.mode, 'entity', 'parser already leaves bare digits non-entity');
  assert.equal(decideNativeNameSearch('2229', parsed), null, 'native-name decision must not adopt bare digits');
  const bare = executeAskQuery({ q: '2229' });
  assert.notEqual(bare.query.mode, 'entity');
  assert.equal(bare.query.identityQuery, undefined);
  assert.equal(bare.nameCandidates, undefined);
  assert.equal(bare.failClosed, true);
  assert.equal(bare.interpretation.some((line) => line.value === 'Institution name search'), false);

  const withState = executeAskQuery({ q: '2229 Minnesota' });
  const parsedState = parseLenderAsk('2229 Minnesota');
  assert.equal(decideNativeNameSearch('2229 Minnesota', parsedState), null);
  assert.equal(withState.nameCandidates, undefined);
  assert.notEqual(withState.query.identityQuery, '2229');
  assert.notEqual(withState.query.identityQuery, '2229 Minnesota');
  assert.equal(withState.query.mode, parsedState.mode);

  for (const q of ['NMLS 2229', 'NMLS 2229 Minnesota']) {
    const labeled = executeAskQuery({ q });
    assert.equal(labeled.query.mode, 'entity', q);
    assert.equal(labeled.query.identifier?.type, 'NMLS_INSTITUTION', q);
    assert.equal(labeled.query.identifier?.value, '2229', q);
    assert.equal(labeled.nameCandidates, undefined, q);
  }

  const known = executeAskQuery({ q: 'Rocket Mortgage' });
  assert.equal(known.query.mode, 'entity');
  assert.ok(known.nameCandidates, 'an ordinary institution name still searches');
  assert.equal(isBareNumericOnlyInput('2229'), true);
  assert.equal(isBareNumericOnlyInput('  2229  '), true);
  assert.equal(isBareNumericOnlyInput('1st National Bank'), false);
  assert.equal(isBareNumericOnlyInput('Mortgage 1 LLC'), false);
  assert.equal(isBareNumericOnlyInput('NMLS 2229'), false);
  assert.equal(isBareNumericOnlyInput('2229 Minnesota'), false);
  assert.notEqual(decideNativeNameSearch('1st National Bank', parseLenderAsk('1st National Bank')), null);
  assert.notEqual(decideNativeNameSearch('Mortgage 1 LLC', parseLenderAsk('Mortgage 1 LLC')), null);
});

test('17 an explicit location condition on a name stays visible as NOT applied; a place inside a name is just the name', () => {
  const d = decideNativeNameSearch('Florida Capital Bank in Texas', parseLenderAsk('Florida Capital Bank in Texas'), fx)!;
  assert.equal(d.name, 'Florida Capital Bank'); assert.deepEqual(d.unresolvedConditions, ['in Texas']);
  const r = executeNativeNameCandidates({ q: 'Florida Capital Bank in Texas', page: 1, pageSize: 25, overrides: {} }, parseLenderAsk('Florida Capital Bank in Texas'), d, fx);
  assert.ok(r.interpretation.some((line) => line.label === 'Not applied' && line.value === 'in Texas')); assert.ok(r.caveats!.some((c) => /NOT APPLIED: "in Texas"/.test(c)));
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

// ================================================================ REVIEW 1 CORRECTIONS (reviewed head fec563b)
// ---------------------------------------------------------------- finding 1: no keyword gates
const KEYWORD_SHAPED = ['Charter Bank', 'Branch River Bank', 'Originator Home Loans', 'LEI Financial Group', 'NMLS Lending Corp', 'Cert Capital Mortgage', 'Best Bank', 'First Person Lending', 'Abcdefghijklmnopqrst'];
const KEYWORD_CATALOG = () => catalogOf([...KEYWORD_SHAPED.map((n) => inst(n)), inst('Branch River Savings'), inst('Which Way Lending')]);

test('R1 organization names built from identifier / person / branch VOCABULARY reach the catalog and are found (no keyword gate)', () => {
  for (const q of KEYWORD_SHAPED) {
    const op = executeNameCandidates({ name: q }, KEYWORD_CATALOG);
    assert.equal(op.status, 200, q); assert.notEqual(op.body.resultState, 'RESTRICTED_SCOPE', q);
    assert.equal((op.body.candidates as Array<{ displayName: string }>)[0]?.displayName, q, `${q} is found by its exact name`);
    const d = decideNativeNameSearch(q, parseLenderAsk(q), KEYWORD_CATALOG);
    assert.equal(d?.name, q, `native also treats "${q}" as a name`);
  }
  // ordinary PARTIAL names retrieve candidates: exact source-name equality is not a prerequisite for attempting a name search
  const partial = executeNameCandidates({ name: 'Branch River' }, KEYWORD_CATALOG).body.candidates as Array<{ displayName: string }>;
  assert.deepEqual(partial.map((c) => c.displayName).sort(), ['Branch River Bank', 'Branch River Savings']);
  assert.equal(decideNativeNameSearch('Branch River', parseLenderAsk('Branch River'), KEYWORD_CATALOG)?.name, 'Branch River');
  assert.equal(decideNativeNameSearch('Which Way', parseLenderAsk('Which Way'), KEYWORD_CATALOG)?.name, 'Which Way', 'an interrogative-looking first word does not reject a name');
});

test('R1b genuine labeled identifiers stay protected by validated label + value syntax; people and branches are unsearchable by construction', () => {
  for (const q of ['NMLS 3030', 'NMLS #3030', 'nmls id: 3030', 'LEI 549300FGXN1K3HLB1R50', 'NMLS branch 123456', 'Find NMLS 3030']) {
    const op = executeNameCandidates({ name: q }, KEYWORD_CATALOG); assert.deepEqual([op.status, op.body.resultState], [422, 'RESTRICTED_SCOPE'], q);
  }
  // malformed identifier ATTEMPTS keep the identifier handling and never touch the name catalog
  let touched = 0; const spy = () => { touched += 1; return KEYWORD_CATALOG(); };
  for (const q of ['NMLS 32.51', 'NMLS -3251', 'NMLS +3251', 'NMLS 3e3', 'NMLS 1234567890123']) { assert.equal(decideNativeNameSearch(q, parseLenderAsk(q), spy), null, q); assert.equal(executeNameCandidates({ name: q }, spy).body.resultState, 'RESTRICTED_SCOPE', q); }
  assert.equal(touched, 0);
  // a label with no valid value, a bare number and a 20-letter word are NOT identifiers: they are searched as names
  for (const q of ['NMLS Lending Corp', 'LEI Financial Group', 'Abcdefghijklmnopqrst', '3030']) assert.notEqual(executeNameCandidates({ name: q }, KEYWORD_CATALOG).body.resultState, 'RESTRICTED_SCOPE', q);
  // A person or branch request simply finds nothing: the catalog holds institutions only.
  for (const q of ['Jane Doe loan officer', 'John Smith MLO', 'Springfield branch office']) assert.equal(executeNameCandidates({ name: q }, KEYWORD_CATALOG).body.resultState, 'NO_MATCH', q);
  const real = loadCandidateCatalog().institutions;
  assert.ok(real.every((i) => !/person|mlo|branch/i.test(i.entityType) && !/^nmls-(?:person|branch)/i.test(i.institutionKey)), 'no person/branch grain exists in the real catalog');
  assert.equal(executeAskQuery({ q: 'NMLS 3030' }).nameCandidates, undefined); assert.equal(executeAskQuery({ q: 'NMLS branch 123456' }).nameCandidates, undefined);
});

// ---------------------------------------------------------------- finding 2: conditions survive every name route
test('R2 conditions are preserved on EVERY native name route: parser-entity name, candidate-only name, URL-filtered request', () => {
  // (a) the parser extracts only "Rocket Mortgage" from this text -- the Texas condition must survive
  const a = executeAskQuery({ q: 'Rocket Mortgage company in Texas' });
  assert.ok(a.nameCandidates); assert.deepEqual(a.nameCandidates!.unresolvedConditions, ['in Texas']);
  assert.ok(a.rows!.some((r) => r.nmls === '3030')); assert.ok(a.interpretation.some((l) => l.label === 'Not applied' && l.value === 'in Texas'));
  assert.ok(a.caveats!.some((c) => /NOT APPLIED: "in Texas"/.test(c))); assert.equal(a.query.geography, undefined, 'HMDA property geography is not converted into an institution location');
  assert.equal(a.query.coverageState, 'PARTIAL');
  // (b) an ordinary candidate-only name with a location
  const b = executeAskQuery({ q: 'Guild Mortgage in Texas' });
  assert.equal(b.nameCandidates?.suppliedName, 'Guild Mortgage'); assert.deepEqual(b.nameCandidates!.unresolvedConditions, ['in Texas']); assert.ok(b.rows!.every((r) => /guild/i.test(r.displayName)));
  // (c) validated URL filters are listed, not silently dropped or applied
  const c = executeAskQuery({ q: 'BMO Bank', overrides: { action: 'denial', loanType: 'FHA', geo: 'TX' } });
  assert.deepEqual(c.nameCandidates!.unresolvedConditions, ['filter action: denial', 'filter loan type: FHA', 'filter geography: TX']);
  assert.ok(c.rows!.some((r) => r.nmls === '401052')); assert.equal(c.rows!.every((r) => r.applications === null && r.denials === null), true, 'no HMDA measure is attached to a name candidate');
  // contrasts: a true HMDA cohort and a ranking question stay what they are, with their geography APPLIED
  const cohort = executeAskQuery({ q: 'mortgage lenders in Texas' });
  assert.equal(cohort.nameCandidates, undefined); assert.equal(cohort.query.geography?.state, 'TX'); assert.ok((cohort.rows?.length ?? 0) > 0); assert.ok(cohort.rows!.some((r) => r.metric > 0), 'real market rows');
  const ranking = executeAskQuery({ q: 'Which lenders originated the most mortgages in Texas' });
  assert.equal(ranking.nameCandidates, undefined); assert.equal(ranking.query.geography?.state, 'TX');
  // a place INSIDE a name is the name, not a condition
  const inside = decideNativeNameSearch('Florida Capital Bank', parseLenderAsk('Florida Capital Bank'), fx)!;
  assert.equal(inside.name, 'Florida Capital Bank'); assert.deepEqual(inside.unresolvedConditions, []);
});

test('R2b a catalog failure is never "proof" a text is not a name: the name operation is selected and ends SOURCE unavailable, with no cohort run', () => {
  let loads = 0; const boom = () => { loads += 1; throw new Error('secret'); };
  const q = 'Guild Mortgage Company LLC';
  const parsed = parseLenderAsk(q);
  assert.notEqual(parsed.failClosedKind, 'unsupported', 'precondition: the parser has an ALTERNATE (cohort) reading of this name');
  const d = decideNativeNameSearch(q, parsed, boom)!;
  assert.ok(d, 'still a name request'); assert.equal(d.basis, 'NAME_SHAPED_SOURCE_UNAVAILABLE'); assert.equal(d.name, q);
  const r = executeNativeNameCandidates({ q, page: 1, pageSize: 25, overrides: {} }, parsed, d, boom);
  assert.equal(r.terminalState, 'UNAVAILABLE'); assert.equal(r.nameCandidates?.state, 'UNAVAILABLE'); assert.match(r.headline, /Guild Mortgage Company LLC/);
  assert.equal(loads, 2, 'the failing source was consulted once to decide and once to execute -- never bypassed');
  assert.deepEqual(r.rows, []); assert.equal(r.volumeEvidence, undefined, 'no broad directory / cohort request was executed instead'); assert.doesNotMatch(JSON.stringify(r), /secret/);
  // a text with no distinctive word does not depend on the catalog, so its real cohort reading is unaffected by the outage
  assert.equal(decideNativeNameSearch('mortgage lenders in Texas', parseLenderAsk('mortgage lenders in Texas'), boom), null);
});

// ---------------------------------------------------------------- finding 3: one coherent bounded paging policy
test('R3 paging never advertises an unreachable page: window, last page, beyond-end, changed limits, native = service', () => {
  const big = catalogOf(Array.from({ length: 230 }, (_, i) => inst(`Summit Ridge ${i} Lending`)));
  const op = (body: Record<string, unknown>) => { const r = executeNameCandidates({ name: 'Summit Ridge', ...body }, () => big); return { status: r.status, p: r.body.pagination as unknown as { total: number; reachable: number; hasMore: boolean; truncated: boolean; outOfRange: boolean; pageCount: number; returned: number }, n: (r.body.candidates as unknown[]).length, limitations: r.body.limitations }; };
  // limit 1: the old defect (page 40 said hasMore, page 41 was invalid)
  assert.deepEqual([op({ limit: 1, page: 40 }).p.hasMore, op({ limit: 1, page: 41 }).status, op({ limit: 1, page: 41 }).n], [true, 200, 1]);
  const last1 = op({ limit: 1, page: 200 }); assert.deepEqual([last1.p.hasMore, last1.n, last1.p.pageCount, last1.p.truncated, last1.p.total, last1.p.reachable], [false, 1, 200, true, 230, 200]);
  assert.equal(op({ limit: 1, page: 201 }).status, 400, 'a page past the window is rejected, not silently repeated');
  assert.ok(last1.limitations.some((l) => /not exhaustive/.test(l)), 'a capped window never claims exhaustion');
  // ordinary size and 25
  assert.deepEqual([op({ limit: 10 }).p.pageCount, op({ limit: 10, page: 20 }).p.hasMore, op({ limit: 10, page: 20 }).n, op({ limit: 10, page: 21 }).status], [20, false, 10, 400]);
  assert.deepEqual([op({ limit: 25 }).p.pageCount, op({ limit: 25, page: 8 }).p.hasMore, op({ limit: 25, page: 8 }).n, op({ limit: 25, page: 9 }).status], [8, false, 25, 400]);
  // following hasMore reaches exactly the window, with distinct keys, whatever the limit
  for (const limit of [1, 7, 10, 25]) {
    const keys: string[] = []; let page = 1; let more = true;
    while (more) { const r = executeNameCandidates({ name: 'Summit Ridge', page, limit }, () => big); assert.equal(r.status, 200, `limit ${limit} page ${page} advertised by hasMore must be fetchable`); keys.push(...(r.body.candidates as Array<{ stableKey: string }>).map((c) => c.stableKey)); more = (r.body.pagination as unknown as { hasMore: boolean }).hasMore; page += 1; }
    assert.equal(keys.length, 200, `limit ${limit}`); assert.equal(new Set(keys).size, 200, `limit ${limit}: distinct stable keys`);
  }
  // a small set: exact last page and a beyond-end request (valid page number, empty, flagged -- never a repeat)
  const small = catalogOf(Array.from({ length: 74 }, (_, i) => inst(`Harbor ${i} Bank`)));
  const at = (page: number, limit: number) => { const r = executeNameCandidates({ name: 'Harbor', page, limit }, () => small); return [r.status, (r.body.candidates as unknown[]).length, (r.body.pagination as unknown as { hasMore: boolean }).hasMore, (r.body.pagination as unknown as { outOfRange: boolean }).outOfRange, (r.body.pagination as unknown as { truncated: boolean }).truncated]; };
  assert.deepEqual(at(74, 1), [200, 1, false, false, false]); assert.deepEqual(at(75, 1), [200, 0, false, true, false]); assert.deepEqual(at(3, 25), [200, 24, false, false, false]); assert.deepEqual(at(4, 25), [200, 0, false, true, false]);
  // strongest matches come first, BEFORE any cap
  const ranked = catalogOf([...Array.from({ length: 230 }, (_, i) => inst(`Anchor ${i} Pinnacle Lending`)), inst('Pinnacle')]);
  assert.equal((executeNameCandidates({ name: 'Pinnacle', limit: 1 }, () => ranked).body.candidates as Array<{ displayName: string }>)[0]!.displayName, 'Pinnacle');
  // native agrees with the service on the page count and the reachable window
  for (const pageSize of [1, 10, 25]) {
    const native = executeNativeNameCandidates({ q: 'Summit Ridge', page: 1, pageSize, overrides: {} }, parseLenderAsk('Summit Ridge'), { name: 'Summit Ridge', basis: 'ONLY_READING', unresolvedConditions: [] }, () => big);
    assert.equal(native.pageCount, op({ limit: pageSize }).p.pageCount, `pageSize ${pageSize}`); assert.equal(native.nameCandidates?.truncated, true); assert.ok(native.caveats!.some((c) => /not exhaustive/.test(c)));
  }
  const nativeLast = executeNativeNameCandidates({ q: 'Summit Ridge', page: 8, pageSize: 25, overrides: {} }, parseLenderAsk('Summit Ridge'), { name: 'Summit Ridge', basis: 'ONLY_READING', unresolvedConditions: [] }, () => big);
  assert.equal(nativeLast.rows!.length, 25); assert.equal(nativeLast.page, nativeLast.pageCount, 'the pager offers no page after the last reachable one');
});

// ---------------------------------------------------------------- finding 4: truthful source scope
test('R4 a miss is a miss WITHIN THE SEARCHED SOURCES; no per-name "restricted record" message exists', () => {
  const miss = executeNameCandidates({ name: 'Altura Credit Union' });
  assert.equal(miss.body.resultState, 'NO_MATCH'); assert.ok((miss.body.limitations as string[]).some((l) => /WITHIN THE SEARCHED SCOPE/.test(l) && /not a finding that no such institution exists/.test(l)));
  const generic = executeNameCandidates({ name: 'Zzqx Nonexistent Lending' });
  assert.deepEqual(miss.body.limitations, generic.body.limitations, 'an excluded real institution and a nonexistent one are indistinguishable: nothing about restricted rows is revealed');
  const native = executeAskQuery({ q: 'Altura Credit Union' }); assert.match(native.body, /within the searched sources/i); assert.match(native.body, /not a finding that no such institution exists/i);
});

// ---------------------------------------------------------------- finding 5: disputed LEI relationships
test('R5 a disputed profile/LEI relationship is never bridged; the independently public HMDA reporter stays findable on its own', () => {
  const real = loadCandidateCatalog().institutions;
  const held = real.filter((i) => i.publicationState === 'identity_hold');
  assert.equal(held.length, 12);
  for (const row of held) {
    assert.equal(row.profilePath, null, `${row.displayName}: no profile is attached through the disputed LEI`); assert.equal(row.nmls, null, 'no identifier is borrowed from the differently named profile');
    assert.ok(row.lei && row.institutionKey === `hmda-lei:${row.lei}`, 'the HMDA reporter keeps its OWN LEI and its own key');
    assert.ok(!real.some((p) => p.publicationState === 'public_profile' && p.lei === row.lei), 'no published profile card repeats the disputed LEI');
  }
  // Guild Mortgage's LEI sits on the Freedom Mortgage profile in the index: searching one must never return the other.
  const guild = searchNameCandidates(real, 'Guild Mortgage', { limit: 25 }).candidates;
  assert.ok(guild.length >= 1 && guild.every((c) => /guild/i.test(c.institution.displayName)) && !guild.some((c) => /freedom/i.test(c.institution.displayName)));
  assert.equal(guild[0]!.institution.publicationState, 'identity_hold'); assert.equal(guild[0]!.institution.profilePath, null);
  const freedom = searchNameCandidates(real, 'Freedom Mortgage', { limit: 25 }).candidates;
  assert.ok(freedom.some((c) => c.institution.publicationState === 'public_profile' && c.institution.profilePath), 'the published profile itself is still discoverable');
  assert.ok(freedom.every((c) => !/guild/i.test(c.institution.displayName)) && freedom.every((c) => c.institution.lei !== guild[0]!.institution.lei), 'the false bridge is not reproduced');
  // identity_hold is not blanket permission to publish: a held row offers only the official registry, never a Lender profile
  const view = (executeNameCandidates({ name: 'Guild Mortgage' }).body.candidates as Array<{ publicationState: string; action: { type: string } | null }>)[0]!;
  assert.deepEqual([view.publicationState, view.action?.type], ['identity_hold', 'OFFICIAL_IDENTIFIER_VERIFICATION']);
});

test('R6 catalog fixtures are nonproduction only: off by default, refused in production, unknown values ignored', () => {
  assert.equal(activeNameCandidateFixture({}), null);
  assert.equal(activeNameCandidateFixture({ LENDER_NAME_CANDIDATES_FIXTURE: 'large-window' }), 'large-window');
  assert.equal(activeNameCandidateFixture({ LENDER_NAME_CANDIDATES_FIXTURE: 'large-window', VERCEL_ENV: 'production' }), null);
  assert.equal(activeNameCandidateFixture({ LENDER_NAME_CANDIDATES_FIXTURE: 'https://evil.example' }), null);
  assert.equal(loadCandidateCatalog().counts.publishedProfiles, 311, 'this test process uses the real catalog');
});
