import { readFileSync } from 'node:fs';
import { executeIdentityOrEvidence } from '../lib/specialist-execution/identity-execution';
import { executeSpecialistV2, executeSpecialistV2Request } from '../lib/specialist-execution/v2';
import type { ExactIdentityRecord, ExactIdentityStore } from '../lib/specialist-execution/identity-store';
import { SEARCH_POOL } from '../lib/national-profile/discovery';

const checks: Array<[string, boolean, string]> = [];
const check = (id: string, pass: boolean, detail = '') => checks.push([id, pass, detail]);

const rocket: ExactIdentityRecord = {
  entityId: 'rocket', identifierType: 'NMLS_INSTITUTION', identifierValue: '3030', entityKind: 'institution',
  legalName: 'Rocket Mortgage, LLC', displayName: 'Rocket Mortgage', currentStatus: 'observed',
  publicProjectionStatus: 'internal_only', reviewStatus: null, sourceDataset: 'public_catalog', observedAt: '2026-08-27',
  relatedNmls: '3030', relatedLei: '549300FGXN1K3HLB1R50',
};
const unpublished: ExactIdentityRecord = {
  ...rocket, entityId: 'unpublished', identifierValue: '971307', legalName: 'TRADITIONAL MORTGAGE ACCEPTANCE CORPORATION',
  displayName: 'TRADITIONAL MORTGAGE ACCEPTANCE CORPORATION', relatedNmls: '971307', relatedLei: null,
};
const branch: ExactIdentityRecord = {
  ...rocket, entityId: 'branch', identifierType: 'NMLS_BRANCH', identifierValue: '1001618', entityKind: 'branch',
  relatedNmls: null, relatedLei: null,
};
const person: ExactIdentityRecord = {
  ...rocket, entityId: 'person', identifierType: 'NMLS_PERSON', identifierValue: '170008', entityKind: 'person_mlo',
  legalName: null, displayName: null, relatedNmls: null, relatedLei: null,
};
const leiRocket: ExactIdentityRecord = { ...rocket, identifierType: 'LEI', identifierValue: rocket.relatedLei! };

const store: ExactIdentityStore = {
  async lookupNmls(value) {
    if (value === '3030') return [rocket];
    if (value === '971307') return [unpublished];
    if (value === '1001618') return [branch];
    if (value === '170008') return [person];
    if (value === '136890') return [
      { ...rocket, identifierValue: value, relatedNmls: value },
      { ...person, identifierValue: value },
    ];
    return [];
  },
  async lookupLei(value) {
    return value === rocket.relatedLei ? [leiRocket] : [];
  },
};

const run = (request: Parameters<typeof executeIdentityOrEvidence>[0]) => executeIdentityOrEvidence(request, { store });

const exactNmls = (await run({ identifier: { type: 'NMLS', value: '3030' } })).body;
const unpublishedNmls = (await run({ identifier: { type: 'NMLS', value: '971307' } })).body;
const branchNmls = (await run({ identifier: { type: 'NMLS', value: '1001618' } })).body;
const personNmls = (await run({ identifier: { type: 'NMLS', value: '170008' } })).body;
const collision = (await run({ identifier: { type: 'NMLS', value: '136890' } })).body;
const noNmls = (await run({ identifier: { type: 'NMLS', value: '999999999999' } })).body;
const malformedNmls = (await run({ identifier: { type: 'NMLS', value: 'ABC' } })).body;
const exactLei = (await run({ identifier: { type: 'LEI', value: rocket.relatedLei! } })).body;
const noLei = (await run({ identifier: { type: 'LEI', value: '529900T8BM49AURSDO55' } })).body;
const malformedLei = (await run({ identifier: { type: 'LEI', value: 'SHORT' } })).body;
const rocketEvidence = (await executeSpecialistV2Request('complaints about Rocket Mortgage')).body;
const zeroEvidence = (await executeSpecialistV2Request('complaints about 1 STOP MORTGAGE LLC')).body;
const affiliateEvidence = (await executeSpecialistV2Request('complaints about Newrez')).body;
const unknownEvidence = (await executeSpecialistV2Request('complaints about Definitely Unknown Lender')).body;
const typoEvidence = (await executeSpecialistV2Request('complaints about R0cket Mortgag')).body;
const rankingBait = (await executeSpecialistV2Request('worst lenders by complaints')).body;
const identifierEvidence = (await run({ identifier: { type: 'NMLS', value: '3030' }, requestedEvidence: ['CFPB_COMPLAINTS'] })).body;
const complaintPage2 = (await executeSpecialistV2Request({ queryType: 'evidence', identityName: 'Rocket Mortgage', page: 2, limit: 1 })).body;
const hmda = executeSpecialistV2('FHA lenders in Broward County').body;

const twoCandidates = SEARCH_POOL.filter((row) => row.slug === 'rocket-mortgage' || row.slug === 'united-wholesale-mortgage');
const ambiguous = (await executeIdentityOrEvidence(
  { queryType: 'evidence', identityName: 'fixture ambiguity' },
  { store, nameMatches: () => twoCandidates },
)).body;

check('contract-version', exactNmls.contractVersion === '2.1.0');
check('exact-nmls', exactNmls.resultState === 'EXACT_IDENTITY' && exactNmls.identity.nmls === '3030');
check('exact-nmls-public-destination', exactNmls.identity.destination.url === '/lender/rocket-mortgage');
check('unpublished-identity', unpublishedNmls.resultState === 'EXACT_IDENTITY' && unpublishedNmls.identity.publicationState === 'unpublished_research_identity');
check('unpublished-no-route', unpublishedNmls.identity.destination.url === null);
check('branch-restricted', branchNmls.resultState === 'PUBLICATION_RESTRICTED' && branchNmls.identity.entityClass === 'branch');
check('branch-not-institution', branchNmls.identity.displayName == null);
check('person-restricted', personNmls.resultState === 'PUBLICATION_RESTRICTED' && personNmls.identity.entityClass === 'person_mlo');
check('person-private-absent', !/MURPHY|email|phone/i.test(JSON.stringify(personNmls)));
check('collision', collision.resultState === 'IDENTITY_COLLISION');
check('no-nmls', noNmls.resultState === 'NO_CONFIDENT_MATCH');
check('malformed-nmls', malformedNmls.resultState === 'INVALID_QUERY');
check('no-fuzzy-identifier', noNmls.rows.length === 0 && noNmls.identity == null);
check('exact-lei', exactLei.resultState === 'EXACT_IDENTITY' && exactLei.identity.lei === rocket.relatedLei);
check('lei-nmls-bridge', exactLei.identity.nmls === '3030');
check('no-lei', noLei.resultState === 'NO_CONFIDENT_MATCH');
check('malformed-lei', malformedLei.resultState === 'INVALID_QUERY');
check('rocket-bound', rocketEvidence.resultState === 'SUPPORTED_RESULTS' && rocketEvidence.identity.nmls === '3030');
check('rocket-exact-bridge', rocketEvidence.rows.every((row: { bridgeMethod: string }) => row.bridgeMethod === 'curated-exact'));
check('rocket-count', rocketEvidence.evidenceSummary.attachedObservationCount === 7302, String(rocketEvidence.evidenceSummary.attachedObservationCount));
check('zero-keeps-identity', zeroEvidence.resultState === 'ZERO_MATCHING_ROWS' && zeroEvidence.identity != null);
check('zero-not-clean', zeroEvidence.limitations.some((text: string) => /not a clean record/i.test(text)));
check('affiliate-firewall', affiliateEvidence.resultState === 'ZERO_MATCHING_ROWS');
check('unknown-no-evidence', unknownEvidence.resultState === 'NO_CONFIDENT_MATCH' && unknownEvidence.rows.length === 0);
check('typo-no-evidence', typoEvidence.resultState === 'NO_CONFIDENT_MATCH');
check('ambiguous', ambiguous.resultState === 'AMBIGUOUS_IDENTITIES' && ambiguous.rows.length === 0);
check('ranking-refused', rankingBait.resultState === 'UNSUPPORTED_CAPABILITY');
check('complaint-not-wrongdoing', rocketEvidence.limitations.some((text: string) => /not a finding of wrongdoing/i.test(text)));
check('not-size-adjusted', rocketEvidence.limitations.some((text: string) => /not adjusted for lender size/i.test(text)));
check('identifier-evidence', identifierEvidence.resultState === 'SUPPORTED_RESULTS' && identifierEvidence.identity.nmls === '3030');
check('bounded-pagination', rocketEvidence.pagination.limit <= 50);
check('page2-out-of-range', complaintPage2.pagination.outOfRange === true && complaintPage2.rows.length === 0);
check('pagination-no-overlap', !complaintPage2.rows.some((row: { sourceCompanyLabel: string }) => rocketEvidence.rows.some((first: { sourceCompanyLabel: string }) => first.sourceCompanyLabel === row.sourceCompanyLabel)));
check('hmda-unchanged', hmda.resultState === 'SUPPORTED_RESULTS' && hmda.total === 214);
check('hmda-2025', String(hmda.provenance.reportingPeriod).includes('2025'));
check('no-db-writes', exactNmls.diagnostics.dbWrites === 0 && rocketEvidence.diagnostics.dbWrites === 0);
check('no-profile-minting', !readFileSync('lib/specialist-execution/identity-store.ts', 'utf8').match(/\.insert\(|\.upsert\(|\.update\(|\.delete\(/));
check('publication-delta-zero', !readFileSync('app/sitemap.ts', 'utf8').includes('specialist-execution'));
check('no-trust-score', !/trust score|complaint score/i.test(JSON.stringify(rocketEvidence)));
check('no-paid-order', !/paid ordering/i.test(JSON.stringify(rocketEvidence)));

for (const [id, pass, detail] of checks) {
  if (!pass) throw new Error(`FAIL ${id}${detail ? `: ${detail}` : ''}`);
  console.log(`PASS ${id}${detail ? ` ${detail}` : ''}`);
}
console.log(`PASS LEND-CAP-002 ${checks.length} checks`);
