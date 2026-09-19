// TH-SEARCH-R1-019C: evaluate the FROZEN holdout once. Diagnostic only; every miss is listed.
// Expected identity is the record's own source key (LEI / NMLS / stable key) -- independent of the matcher.
// Both callers are measured for the same input: the network operation and native Ask.
import { readFileSync, writeFileSync } from 'node:fs';
import { executeNameCandidates } from '../lib/name-candidates/operation';
import { executeAskQuery } from '../lib/ask-lender/execute-query';
import { candidateTokens, distinctiveTokens } from '../lib/name-candidates/normalize';

type Rec = { key: string; name: string; expect?: { nmls?: string | null; lei?: string | null; slug?: string }; source?: string };
const frozen = JSON.parse(readFileSync('docs/qa/th-search-r1-019c/holdout-frozen.json', 'utf8'));
const OUT = process.argv[2] ?? 'docs/qa/th-search-r1-019c/holdout-results.run1.json';

const SUFFIX = new RegExp('[\\s,]+(?:l\\.?l\\.?c\\.?|inc\\.?|incorporated|corp\\.?|corporation|l\\.?p\\.?|l\\.?l\\.?p\\.?|ltd\\.?|co\\.?|n\\.?a\\.?|national association)[\\s,.]*$', 'i');
const suffixRemoved = (name: string) => { let v = name.trim(); for (let i = 0; i < 2; i++) v = v.replace(SUFFIX, '').trim(); return v.replace(/[\s,]+$/, ''); };
const punctuationVariant = (name: string) => name.replace(/[.,'’]/g, '').replace(/-/g, ' ').replace(/&/g, 'and').replace(/\s+/g, ' ').trim();
const fcuVariant = (name: string) => (/federal credit union/i.test(name) ? name.replace(/federal credit union/i, 'FCU') : null);

type Candidate = { stableKey: string; displayName: string; identifiers: Array<{ label: string; value: string }>; match: { method: string } };
const isExpected = (rec: Rec, c: Candidate) => {
  const lei = rec.key.startsWith('lei:') ? rec.key.slice(4) : rec.expect?.lei ?? null;
  const nmls = rec.key.startsWith('nmls-inst:') ? rec.key.slice(10) : rec.expect?.nmls ?? null;
  if (c.stableKey === `lender:${rec.key}` || c.stableKey === `lender:hmda-${rec.key}`) return true;
  return c.identifiers.some((i) => (i.label === 'LEI' && lei && i.value === lei) || (i.label === 'NMLS' && nmls && i.value === nmls));
};
const irrelevant = (input: string, c: Candidate) => {
  const want = new Set(distinctiveTokens(candidateTokens(input)));
  if (!want.size) return false;
  return !candidateTokens(c.displayName).some((t) => want.has(t) || [...want].some((w) => w.length >= 3 && t.startsWith(w)));
};

function evaluate(rec: Rec, variant: string, input: string) {
  let found = false, firstPage = false, rank: number | null = null, total = 0, state = '', irrelevantCount = 0, returned = 0;
  for (let page = 1; page <= 5 && !found; page++) {
    const r = executeNameCandidates({ name: input, page, limit: 10 }).body as unknown as { resultState: string; candidates: Candidate[]; pagination: { total: number; hasMore: boolean } | null };
    state = r.resultState; total = r.pagination?.total ?? 0;
    if (page === 1) { returned = r.candidates.length; irrelevantCount = r.candidates.filter((c) => irrelevant(input, c)).length; }
    const index = r.candidates.findIndex((c) => isExpected(rec, c));
    if (index >= 0) { found = true; firstPage = page === 1; rank = (page - 1) * 10 + index + 1; }
    if (!r.pagination?.hasMore) break;
  }
  const native = executeAskQuery({ q: input, pageSize: 25 });
  const nativeIsName = Boolean(native.nameCandidates);
  const nativeFound = nativeIsName && (native.rows ?? []).some((row) => (rec.key.startsWith('lei:') && row.lei === rec.key.slice(4)) || row.institutionKey === rec.key || row.institutionKey === `hmda-${rec.key}` || (rec.expect?.nmls && row.nmls === rec.expect.nmls) || (rec.expect?.lei && row.lei === rec.expect.lei));
  return { key: rec.key, name: rec.name, variant, input, state, total, returnedFirstPage: returned, irrelevantFirstPage: irrelevantCount, found, foundOnFirstPage: firstPage, rank, nativeTreatedAsNameSearch: nativeIsName, nativeFound, nativeServiceAgree: !nativeIsName ? null : nativeFound === (found && (rank ?? 99) <= 25), nativeParserMode: native.query.mode };
}

function runSample(records: Rec[]) {
  const rows = [];
  for (const rec of records) {
    const variants: Array<[string, string | null]> = [['displayed', rec.name], ['lowercase', rec.name.toLowerCase()], ['suffix_removed', suffixRemoved(rec.name) !== rec.name.trim() ? suffixRemoved(rec.name) : null], ['punctuation', punctuationVariant(rec.name) !== rec.name ? punctuationVariant(rec.name) : null], ['fcu_abbreviation', fcuVariant(rec.name)]];
    for (const [variant, input] of variants) rows.push(input ? evaluate(rec, variant, input) : { key: rec.key, name: rec.name, variant, skipped: 'variant identical to displayed name or not applicable' });
  }
  return rows;
}
const summarize = (rows: ReturnType<typeof runSample>) => {
  const out: Record<string, unknown> = {};
  for (const variant of ['displayed', 'lowercase', 'suffix_removed', 'punctuation', 'fcu_abbreviation']) {
    const r = rows.filter((x) => x.variant === variant && !('skipped' in x)) as Array<ReturnType<typeof evaluate>>;
    const returned = r.reduce((n, x) => n + x.returnedFirstPage, 0);
    out[variant] = { n: r.length, expectedRecordFound: r.filter((x) => x.found).length, foundOnFirstPage: r.filter((x) => x.foundOnFirstPage).length, reachableOnlyAfterPaging: r.filter((x) => x.found && !x.foundOnFirstPage).length, sourceFailures: r.filter((x) => x.state === 'SOURCE_UNAVAILABLE').length, nativeNotTreatedAsNameSearch: r.filter((x) => !x.nativeTreatedAsNameSearch).length, nativeFound: r.filter((x) => x.nativeFound).length, nativeServiceDisagreements: r.filter((x) => x.nativeServiceAgree === false).length, firstPageCandidates: returned, irrelevantFirstPageCandidates: r.reduce((n, x) => n + x.irrelevantFirstPage, 0), misses: r.filter((x) => !x.found).map((x) => x.input) };
  }
  return out;
};

const r19a = runSample(frozen.r19aLenderSample.records); const additional = runSample(frozen.additional.records);
const report = { evaluatedAt: new Date().toISOString(), note: 'Single bounded run against the committed catalog (no network, no live hub). Diagnostic; no statistical claim.', r19aLenderSample: { summary: summarize(r19a), rows: r19a }, additional: { summary: summarize(additional), rows: additional } };
writeFileSync(OUT, JSON.stringify(report, null, 1));
for (const [label, s] of [['R1-019A frozen Lender sample', report.r19aLenderSample.summary], ['additional position-drawn sample', report.additional.summary]] as const) {
  console.log(`\n== ${label}`);
  for (const [variant, v] of Object.entries(s as Record<string, { n: number; expectedRecordFound: number; foundOnFirstPage: number; nativeNotTreatedAsNameSearch: number; nativeFound: number; nativeServiceDisagreements: number; firstPageCandidates: number; irrelevantFirstPageCandidates: number; misses: string[] }>)) console.log(`  ${variant.padEnd(17)} found ${v.expectedRecordFound}/${v.n} (first page ${v.foundOnFirstPage}) | native: name-search ${v.n - v.nativeNotTreatedAsNameSearch}/${v.n}, found ${v.nativeFound}, disagreements ${v.nativeServiceDisagreements} | irrelevant ${v.irrelevantFirstPageCandidates}/${v.firstPageCandidates}${v.misses.length ? ' | MISSES: ' + v.misses.join(' ; ') : ''}`);
}
