/**
 * ASK-SEARCH-LENDER-001 focused publisher tests.
 */
import { publishLenderDiscoveryPilot, PILOT_ARTIFACT } from '../lib/network-discovery/publish';
import { contentFingerprint } from '../lib/network-discovery/fingerprint';
import { evaluateLenderPilotEligibility } from '../lib/network-discovery/eligibility';
import {
  buildLenderNetworkId,
  mapLenderEntityType,
  mapLenderToDiscovery,
  hmdaProductCategories,
  buildCanonicalProfileUrl,
} from '../lib/network-discovery/map-lender';
import { validateDiscoveryEntity, validateDiscoveryExport } from '../lib/network-discovery/validate';
import type { Lender } from '../lib/mockData';

let failed = 0;
function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg);
    failed++;
  } else console.log('PASS:', msg);
}

const sample: Lender = {
  id: 't1',
  slug: 'sample-mortgage-co',
  name: 'Sample Mortgage Co',
  nmlsId: '1234567',
  type: 'Lender',
  city: 'Tampa',
  state: 'Florida',
  stateSlug: 'florida',
  county: 'Hillsborough',
  countySlug: 'hillsborough',
  zipCodes: ['33602'],
  rating: 0,
  reviewCount: 0,
  trustScore: 0,
  countyExperienceScore: 0,
  nationalVolumeRank: 0,
  loanTypes: ['FHA', 'VA'],
  specialties: [],
  creditTiers: ['Good'],
  nmlsVerified: true,
  cfpbComplaints: 0,
  bbbRating: 'A',
  googleRating: 0,
  trustpilotRating: 0,
  shortDescription: 'Test',
};

assert(buildLenderNetworkId('1234567') === 'lender:nmls-1234567', 'nmls network id');
assert(mapLenderEntityType('Broker') === 'mortgage_broker', 'broker≠company');
assert(mapLenderEntityType('Lender') === 'mortgage_company', 'lender→mortgage_company');
assert(mapLenderEntityType('Bank') === 'bank', 'bank type');
assert(mapLenderEntityType('Credit Union') === 'bank', 'CU→bank');
assert(
  buildCanonicalProfileUrl('sample-mortgage-co') ===
    'https://www.lendertrusthub.com/lenders/sample-mortgage-co',
  'canonical url host'
);

{
  const ent = mapLenderToDiscovery(sample, {
    sourceVersion: 'test',
    updatedAt: '2026-01-01T00:00:00.000Z',
    hmda: {
      lei: 'X',
      institutionName: 'Sample',
      nmlsId: '1234567',
      slug: 'sample-mortgage-co',
      year: 2025,
      state: 'FL',
      stateName: 'Florida',
      stateSlug: 'florida',
      stateOriginations: 100,
      stateApplications: 120,
      floridaOriginations: 100,
      floridaApplications: 120,
      countiesWithActivity: 1,
      topCounties: [],
      loanTypeMix: {
        conventionalPct: 50,
        fhaPct: 30,
        vaPct: 20,
        usdaPct: 0,
        conventionalOrig: 50,
        fhaOrig: 30,
        vaOrig: 20,
        usdaOrig: 0,
      },
      countyShares: [
        {
          countyName: 'Hillsborough',
          countySlug: 'hillsborough',
          originations: 40,
          marketSharePct: 1,
        },
      ],
      otherStates: [{ stateCode: 'TX', stateName: 'Texas', originations: 10 }],
      source: 'test',
      sourceNote: 'test',
    },
  });
  assert(ent.hub === 'lender', 'hub lender');
  assert(ent.state === 'FL', 'physical FL');
  assert(ent.city === 'Tampa', 'physical city');
  assert(
    (ent.service_areas || []).some((a) => a.kind === 'state' && a.state === 'TX' && a.label === 'hmda_activity'),
    'HMDA TX service state ≠ inventing office'
  );
  assert(ent.categories?.includes('fha') && ent.categories?.includes('va'), 'HMDA categories');
  assert(!ent.categories?.includes('jumbo'), 'no jumbo without HMDA');
  assert(validateDiscoveryEntity(ent).length === 0, 'sample validates');
  assert(
    hmdaProductCategories(null).length === 0,
    'no categories without HMDA'
  );
}

assert(evaluateLenderPilotEligibility(sample).ok, 'eligible sample');
assert(
  !evaluateLenderPilotEligibility({ ...sample, nmlsId: '', nmlsVerified: false }).ok,
  'missing nmls ineligible'
);
assert(
  !evaluateLenderPilotEligibility({ ...sample, nmlsVerified: false }).ok,
  'unverified ineligible'
);

const a = publishLenderDiscoveryPilot();
const b = publishLenderDiscoveryPilot();
assert(a.validationOk && b.validationOk, 'validation ok both runs');
assert(a.manifest.content_fingerprint === b.manifest.content_fingerprint, 'fingerprint stable');
assert(a.manifest.entity_count === b.manifest.entity_count, 'count stable');
assert(
  contentFingerprint(a.manifest.entities) === contentFingerprint(b.manifest.entities),
  'entity fingerprint helper'
);
assert(a.manifest.schema_version === 'ask-network-discovery-v1', 'schema');
assert(a.manifest.hub === 'lender', 'hub');
assert(a.manifest.pilot_artifact === PILOT_ARTIFACT, 'artifact name');
assert(a.manifest.entity_count >= 100, `pilot >=100 (got ${a.manifest.entity_count})`);
assert(a.manifest.entity_count <= 250, `pilot <=250 (got ${a.manifest.entity_count})`);
assert(
  a.manifest.entities.every((e) => !('premium' in e) && !('trust_score' in e) && !('phone' in e)),
  'no paid/premium/phone fields'
);
assert(validateDiscoveryExport(a.manifest.entities).ok, 'export validates');
assert(a.manifest.deferred.loan_officer === 'UNSUPPORTED', 'LO unsupported');
assert(a.manifest.deferred.auto_loan_company === 'SOFT_SEED_DEFERRED', 'auto deferred');

{
  const qr = a.manifest.query_readiness as Record<string, Record<string, unknown>>;
  assert(!!qr['mortgage companies in Florida'], 'query FL present');
  assert(!!qr['FHA lenders Tampa'], 'query FHA Tampa present');
  assert(!!qr['mortgage broker in New Jersey'], 'query NJ broker present');
  assert(
    (qr['refinance companies near Austin TX']?.refinance_category as number) === 0,
    'refinance fail-closed'
  );
}

{
  const sampleEnt = a.manifest.entities[0];
  assert(
    sampleEnt.canonical_profile_url.startsWith('https://www.lendertrusthub.com/lenders/'),
    'profile handoff'
  );
  assert(sampleEnt.network_entity_id.startsWith('lender:nmls-'), 'nmls identity prefix');
}

console.log(
  JSON.stringify(
    {
      considered: a.manifest.eligibility.considered,
      eligible: a.manifest.eligibility.eligible,
      ineligible: a.manifest.eligibility.ineligible,
      ineligible_reasons: a.manifest.eligibility.ineligible_reasons,
      pilot_selected: a.manifest.eligibility.pilot_selected,
      fingerprint: a.manifest.content_fingerprint,
      entity_type_breakdown: a.manifest.entity_type_breakdown,
      geography: a.manifest.geography,
      deferred: a.manifest.deferred,
      query_readiness: a.manifest.query_readiness,
      timings_ms: a.timings_ms,
    },
    null,
    2
  )
);

if (failed) {
  console.error(`ASK-SEARCH-LENDER-001 FAILED (${failed})`);
  process.exit(1);
}
console.log('ASK-SEARCH-LENDER-001 Lender discovery publisher assertions passed.');
