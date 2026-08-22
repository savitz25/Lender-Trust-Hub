/**
 * Read-only Lender discovery publisher (ASK-SEARCH-LENDER-001).
 * Source: finalized offline TS catalog + HMDA overlays.
 * Deferred: auto seeds, FDIC (no per-entity profile), loan officers.
 */

import { lenders } from '@/lib/mockData';
import { catalogDistinctEntities } from '@/lib/verification/sanitize-lender';
import { cleanNmlsId } from '@/lib/verification/nmls';
import { getHmdaLenderEvidenceBySlug } from '@/lib/hmda';
import { selectPilotCohort } from './cohort';
import { evaluateLenderPilotEligibility } from './eligibility';
import { contentFingerprint } from './fingerprint';
import { mapLenderToDiscovery } from './map-lender';
import type {
  EligibilityFailureReason,
  NetworkDiscoveryEntity,
  PilotExportManifest,
} from './types';
import { validateDiscoveryExport } from './validate';

export const PILOT_ARTIFACT = 'lender-discovery-pilot.v1.json';

export type PublishResult = {
  manifest: PilotExportManifest;
  validationOk: boolean;
  validationIssues: { path: string; message: string }[];
  timings_ms: Record<string, number>;
};

function auditQueryReadiness(entities: NetworkDiscoveryEntity[]) {
  const hasServiceState = (state: string) =>
    entities.filter((e) =>
      (e.service_areas || []).some((a) => a.kind === 'state' && a.state === state)
    ).length;

  const hasPhysicalState = (state: string) =>
    entities.filter((e) => e.state === state).length;

  const hasCity = (city: string, state?: string) =>
    entities.filter((e) => {
      const hit =
        e.city?.toLowerCase().includes(city.toLowerCase()) ||
        (e.service_areas || []).some(
          (a) => a.kind === 'city' && a.city.toLowerCase().includes(city.toLowerCase())
        ) ||
        (e.search_terms || []).some((t) => t.includes(city.toLowerCase()));
      if (!hit) return false;
      if (!state) return true;
      return (
        e.state === state ||
        (e.service_areas || []).some((a) => 'state' in a && a.state === state)
      );
    }).length;

  const hasCategory = (cat: string) =>
    entities.filter((e) => e.categories?.includes(cat)).length;

  const hasType = (t: string) => entities.filter((e) => e.entity_type === t).length;

  const flCompanies = entities.filter(
    (e) =>
      (e.entity_type === 'mortgage_company' || e.entity_type === 'mortgage_broker') &&
      (e.state === 'FL' ||
        (e.service_areas || []).some((a) => a.kind === 'state' && a.state === 'FL'))
  ).length;

  const fhaTampa = entities.filter((e) => {
    const fha = e.categories?.includes('fha');
    const tampa =
      e.city?.toLowerCase().includes('tampa') ||
      (e.search_terms || []).some((t) => t.includes('tampa')) ||
      (e.service_areas || []).some(
        (a) => a.kind === 'county' && /hillsborough/i.test(a.county) && a.state === 'FL'
      );
    return Boolean(fha && tampa);
  }).length;

  const vaTexas = entities.filter(
    (e) =>
      e.categories?.includes('va') &&
      (e.state === 'TX' ||
        (e.service_areas || []).some((a) => a.kind === 'state' && a.state === 'TX'))
  ).length;

  const austin = hasCity('Austin', 'TX');
  const refinanceCat = hasCategory('refinance');

  const njBrokers = entities.filter(
    (e) =>
      e.entity_type === 'mortgage_broker' &&
      (e.state === 'NJ' ||
        (e.service_areas || []).some((a) => a.kind === 'state' && a.state === 'NJ'))
  ).length;

  const miami = hasCity('Miami', 'FL');

  return {
    'mortgage companies in Florida': {
      entity_type_or_broker_with_fl: flCompanies,
      physical_state_match_fl: hasPhysicalState('FL'),
      hmda_or_service_state_fl: hasServiceState('FL'),
      note: 'Match = mortgage_company|mortgage_broker + FL physical or HMDA/service state. Not office-only.',
    },
    'FHA lenders Tampa': {
      product_category_fha: hasCategory('fha'),
      city_tampa_and_fha: fhaTampa,
      hillsborough_county_hmda_fha: entities.filter(
        (e) =>
          e.categories?.includes('fha') &&
          (e.service_areas || []).some(
            (a) => a.kind === 'county' && /hillsborough/i.test(a.county) && a.state === 'FL'
          )
      ).length,
      note: 'FHA only when HMDA fhaOrig>0. Tampa city may be 0; Hillsborough HMDA county is the grounded locality.',
    },
    'VA lenders Texas': {
      product_category_va_and_tx: vaTexas,
      va_total: hasCategory('va'),
      tx_service_state: hasServiceState('TX'),
    },
    'refinance companies near Austin TX': {
      refinance_category: refinanceCat,
      austin_tx_locality: austin,
      tx_service_state: hasServiceState('TX'),
      note: 'Lender-level HMDA evidence has no refinanceOrig — refinance category fail-closed (0). TX/Austin locality still countable.',
    },
    'mortgage broker in New Jersey': {
      mortgage_broker_with_nj: njBrokers,
      broker_total: hasType('mortgage_broker'),
      note: 'Broker ≠ mortgage_company.',
    },
    'lenders in Miami': {
      miami_city_or_terms: miami,
      fl_service_state: hasServiceState('FL'),
      miami_dade_county_hmda: entities.filter((e) =>
        (e.service_areas || []).some(
          (a) => a.kind === 'county' && /miami/i.test(a.county) && a.state === 'FL'
        )
      ).length,
    },
    type_totals: {
      mortgage_company: hasType('mortgage_company'),
      mortgage_broker: hasType('mortgage_broker'),
      bank: hasType('bank'),
      auto_loan_company: hasType('auto_loan_company'),
    },
  };
}

export function publishLenderDiscoveryPilot(): PublishResult {
  const timings: Record<string, number> = {};
  const t0 = performance.now();

  const tLoad = performance.now();
  const distinct = catalogDistinctEntities(lenders);
  const sourceVersion = `lenders-catalog#branch=${lenders.length};distinct=${distinct.length}`;
  timings.load_ms = performance.now() - tLoad;

  const ineligibleReasons: Record<string, number> = {};
  const eligibleEntities: NetworkDiscoveryEntity[] = [];

  const tElig = performance.now();
  const generatedAt = new Date().toISOString();

  for (const row of distinct) {
    const hmda = cleanNmlsId(row.nmlsId) ? getHmdaLenderEvidenceBySlug(row.slug) : null;
    const ev = evaluateLenderPilotEligibility(row, hmda);
    if (!ev.ok) {
      ineligibleReasons[ev.reason] = (ineligibleReasons[ev.reason] || 0) + 1;
      continue;
    }
    eligibleEntities.push(
      mapLenderToDiscovery(row, { sourceVersion, updatedAt: generatedAt, hmda })
    );
  }
  timings.eligibility_ms = performance.now() - tElig;
  // normalize folded into loop
  timings.normalize_ms = timings.eligibility_ms;

  const tCohort = performance.now();
  const pilot = selectPilotCohort(eligibleEntities);
  timings.cohort_ms = performance.now() - tCohort;

  const tVal = performance.now();
  const validation = validateDiscoveryExport(pilot);
  timings.validate_ms = performance.now() - tVal;

  const entity_type_breakdown: Record<string, number> = {};
  const physical_states: Record<string, number> = {};
  let with_city = 0;
  let with_zip = 0;
  let with_county = 0;
  let with_hmda_service_state = 0;
  let with_hmda_service_county = 0;
  for (const e of pilot) {
    entity_type_breakdown[e.entity_type] = (entity_type_breakdown[e.entity_type] || 0) + 1;
    if (e.state) physical_states[e.state] = (physical_states[e.state] || 0) + 1;
    if (e.city) with_city++;
    if (e.zip) with_zip++;
    if (e.county) with_county++;
    if ((e.service_areas || []).some((a) => a.kind === 'state' && a.label === 'hmda_activity')) {
      with_hmda_service_state++;
    }
    if ((e.service_areas || []).some((a) => a.kind === 'county')) with_hmda_service_county++;
  }

  const fingerprint = contentFingerprint(pilot);
  const query_readiness = auditQueryReadiness(pilot);
  timings.total_ms = performance.now() - t0;
  timings.export_ms = 0; // filled by script when writing

  const manifest: PilotExportManifest = {
    schema_version: 'ask-network-discovery-v1',
    hub: 'lender',
    generated_at: generatedAt,
    source_version: sourceVersion,
    source_path: 'lib/mockData.ts → finalizeLenderCatalog(RAW_LENDERS)',
    pilot_label: 'PILOT / NOT YET CONSUMED BY ASK PRODUCTION',
    pilot_artifact: PILOT_ARTIFACT,
    task: 'ASK-SEARCH-LENDER-001',
    entity_count: pilot.length,
    content_fingerprint: fingerprint,
    eligibility: {
      considered: distinct.length,
      eligible: eligibleEntities.length,
      ineligible: distinct.length - eligibleEntities.length,
      ineligible_reasons: ineligibleReasons as Record<EligibilityFailureReason, number>,
      pilot_selected: pilot.length,
    },
    entity_type_breakdown,
    geography: {
      physical_states,
      with_city,
      with_zip,
      with_county,
      with_hmda_service_state,
      with_hmda_service_county,
    },
    deferred: {
      loan_officer: 'UNSUPPORTED',
      auto_loan_company: 'SOFT_SEED_DEFERRED',
      fdic_bank_vertical: 'NO_PER_ENTITY_PROFILE_DEFERRED',
    },
    query_readiness,
    entities: pilot,
  };

  return {
    manifest,
    validationOk: validation.ok,
    validationIssues: validation.issues,
    timings_ms: Object.fromEntries(
      Object.entries(timings).map(([k, v]) => [k, Number(v.toFixed(3))])
    ),
  };
}
