import { CFPB_COMPANY_MAPPINGS } from '@/lib/cfpb/mappings';
import { getCompanySnapshotMap, loadCfpbSnapshot } from '@/lib/cfpb/load';
import { CFPB_SOURCE_NOTE, CFPB_SOURCE_URL } from '@/lib/cfpb/types';
import {
  SEARCH_POOL,
  nationalPresentationName,
  normalizeName,
  type DiscoveryRecord,
} from '@/lib/national-profile/discovery';
import { nationalProfilePath } from '@/lib/national-profile/cohort';
import {
  SPECIALIST_CONTRACT,
  SPECIALIST_CONTRACT_FINGERPRINT,
  SPECIALIST_CONTRACT_VERSION,
  SPECIALIST_SCHEMA_FINGERPRINT,
  type SpecialistResultState,
} from './contract';
import {
  canonicalExactIdentityStore,
  type ExactIdentityRecord,
  type ExactIdentityStore,
} from './identity-store';

export type IdentityExecutionRequest = {
  query?: string;
  queryType?: 'identifier' | 'identity' | 'evidence';
  identifier?: { type?: 'NMLS' | 'LEI'; value?: string };
  identityName?: string;
  requestedEvidence?: string[];
  page?: number;
  limit?: number;
};

export type IdentityExecutionDependencies = {
  store: ExactIdentityStore;
  nameMatches?: (name: string) => DiscoveryRecord[];
};

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;

function envelope(
  resultState: SpecialistResultState,
  status: number,
  interpretation: Record<string, unknown>,
  extra: Record<string, unknown>,
) {
  return {
    status,
    body: {
      contract: SPECIALIST_CONTRACT,
      contractVersion: SPECIALIST_CONTRACT_VERSION,
      schemaFingerprint: SPECIALIST_SCHEMA_FINGERPRINT,
      contractFingerprint: SPECIALIST_CONTRACT_FINGERPRINT,
      queryInterpretation: interpretation,
      appliedFilters: {},
      resultState,
      identity: null,
      evidenceState: null,
      rows: [],
      total: 0,
      pagination: null,
      availableRefinements: [],
      provenance: {},
      limitations: [],
      destinations: [],
      diagnostics: { executionEngine: 'lender-specialist-identity-v2', dbWrites: 0 },
      ...extra,
    },
  };
}

function publicRecordFor(record: ExactIdentityRecord): DiscoveryRecord | null {
  const matches = SEARCH_POOL.filter((candidate) =>
    (record.relatedNmls && candidate.nmls === record.relatedNmls) ||
    (record.relatedLei && candidate.lei === record.relatedLei),
  );
  return matches.length === 1 ? matches[0]! : null;
}

function destinationFor(record: ExactIdentityRecord) {
  const publicRecord = publicRecordFor(record);
  if (!publicRecord) return { type: 'RESEARCH_IDENTITY_ONLY', url: null };
  return {
    type: publicRecord.publication_source?.startsWith('florida')
      ? 'FLORIDA_STATE_PROFILE'
      : 'PUBLIC_LENDER_PROFILE',
    url: nationalProfilePath(publicRecord.slug),
  };
}

function publicInstitutionIdentity(record: ExactIdentityRecord) {
  const publicRecord = publicRecordFor(record);
  const destination = destinationFor(record);
  return {
    entityClass: 'institution',
    displayName: publicRecord
      ? nationalPresentationName(publicRecord.canonical_name, publicRecord.display_name)
      : record.displayName || record.legalName,
    nmls: record.relatedNmls,
    lei: record.relatedLei,
    currentStatus: record.currentStatus,
    publicationState: publicRecord ? 'public_profile' : 'unpublished_research_identity',
    destination,
  };
}

function exactNameMatches(raw: string): DiscoveryRecord[] {
  const query = normalizeName(raw);
  if (!query) return [];
  const seen = new Set<string>();
  return SEARCH_POOL.filter((record) => {
    const names = [record.canonical_name, record.presentation_name, ...record.historical_names, record.slug.replace(/-/g, ' ')];
    const match = names.some((name) => normalizeName(name) === query);
    if (!match || seen.has(record.institution_id)) return false;
    seen.add(record.institution_id);
    return true;
  });
}

function nameFromQuery(input: IdentityExecutionRequest): string {
  if (input.identityName?.trim()) return input.identityName.trim();
  return (input.query ?? '').replace(/^.*?complaints?\s+about\s+/i, '').trim();
}

function validPage(input: IdentityExecutionRequest): string | null {
  if (input.page != null && (!Number.isInteger(input.page) || input.page < 1)) return 'page must be a positive integer.';
  if (input.limit != null && (!Number.isInteger(input.limit) || input.limit < 1)) return 'limit must be a positive integer.';
  return null;
}

function identifierInterpretation(input: IdentityExecutionRequest) {
  return {
    queryType: 'identifier',
    entityClass: 'institution',
    identifier: input.identifier,
    identityFallback: 'none',
  };
}

async function executeIdentifier(input: IdentityExecutionRequest, dependencies: IdentityExecutionDependencies) {
  const interpretation = identifierInterpretation(input);
  const scheme = input.identifier?.type;
  const value = (input.identifier?.value ?? '').trim().toUpperCase();
  if (!scheme || !value) {
    return envelope('INVALID_QUERY', 400, interpretation, {
      limitations: ['A labeled NMLS or LEI value is required. Bare digits are not guessed.'],
    });
  }
  if (scheme === 'NMLS' && !/^\d{3,12}$/.test(value)) {
    return envelope('INVALID_QUERY', 400, interpretation, {
      limitations: ['NMLS must contain 3–12 digits after an explicit NMLS label.'],
    });
  }
  if (scheme === 'LEI' && !/^[A-Z0-9]{20}$/.test(value)) {
    return envelope('INVALID_QUERY', 400, interpretation, {
      limitations: ['LEI must contain exactly 20 alphanumeric characters after an explicit LEI label.'],
    });
  }

  let records: ExactIdentityRecord[];
  try {
    records = scheme === 'NMLS'
      ? await dependencies.store.lookupNmls(value)
      : await dependencies.store.lookupLei(value);
  } catch {
    return envelope('BACKEND_UNAVAILABLE', 503, interpretation, {
      limitations: ['The canonical exact-identity store is unavailable. No fuzzy or cohort fallback was used.'],
    });
  }
  if (records.length === 0) {
    return envelope('NO_CONFIDENT_MATCH', 200, interpretation, {
      limitations: [`No exact ${scheme} identity match was found. This is not a fuzzy name result.`],
      provenance: { identifierScheme: scheme, matchMethod: 'exact_key', publicationSemantics: 'No profile was created.' },
    });
  }

  const classes = [...new Set(records.map((record) => record.identifierType))];
  const entities = [...new Set(records.map((record) => record.entityId))];
  if (classes.length > 1 || entities.length > 1) {
    return envelope('IDENTITY_COLLISION', 422, interpretation, {
      limitations: ['This value exists in multiple incompatible identifier classes or identities. It was not resolved arbitrarily.'],
      diagnostics: { executionEngine: 'lender-specialist-identity-v2', identifierClasses: classes, identityCount: entities.length, dbWrites: 0 },
    });
  }

  const record = records[0]!;
  const provenance = {
    sourceFamily: scheme === 'LEI' ? 'HMDA / canonical lender identity graph' : 'NMLS / canonical lender identity graph',
    sourceDataset: record.sourceDataset,
    sourceObservedOn: record.observedAt,
    matchMethod: 'exact_key',
    identityGrain: record.identifierType,
    publicationSemantics: 'Exact research identity does not create or imply a public profile.',
  };
  if (record.identifierType === 'NMLS_BRANCH') {
    return envelope('PUBLICATION_RESTRICTED', 422, interpretation, {
      identity: { entityClass: 'branch', nmls: value, publicationState: 'restricted', destination: null },
      provenance,
      limitations: ['This exact NMLS is branch-grain. Branch public execution is not enabled, and no institution was substituted.'],
    });
  }
  if (record.identifierType === 'NMLS_PERSON') {
    return envelope('PUBLICATION_RESTRICTED', 422, interpretation, {
      identity: { entityClass: 'person_mlo', nmls: value, publicationState: 'restricted', destination: null },
      provenance,
      limitations: ['This exact NMLS is person/MLO-grain. Person publication is restricted; no name, contact data, or institution substitute was returned.'],
    });
  }
  if (record.entityKind !== 'institution') {
    return envelope('PUBLICATION_RESTRICTED', 422, interpretation, {
      provenance,
      limitations: ['The exact identifier class is unresolved for public institution execution. No fallback was used.'],
    });
  }

  const identity = publicInstitutionIdentity(record);
  if (input.requestedEvidence?.includes('CFPB_COMPLAINTS')) {
    const publicRecord = publicRecordFor(record);
    if (publicRecord) {
      return executeComplaintEvidence({
        ...input,
        queryType: 'evidence',
        identityName: publicRecord.presentation_name,
      }, dependencies.nameMatches);
    }
    return envelope('ZERO_MATCHING_ROWS', 200, interpretation, {
      identity,
      evidenceState: 'ZERO_MATCHING_ROWS',
      evidenceSummary: { attachedObservationCount: 0, sourceLabelCount: 0 },
      provenance,
      limitations: [
        'The institution identity resolved exactly, but it has no accepted public exact/DBA complaint bridge.',
        'Zero attached observations is not a clean record.',
      ],
    });
  }
  return envelope('EXACT_IDENTITY', 200, interpretation, {
    identity,
    total: 1,
    destinations: identity.destination.url ? [identity.destination] : [],
    provenance,
    limitations: [
      'Exact identity is regulatory research, not a recommendation.',
      identity.publicationState === 'public_profile'
        ? 'The destination already existed under the accepted publication gate.'
        : 'This institution is a research identity without a public profile destination.',
    ],
  });
}

async function executeComplaintEvidence(
  input: IdentityExecutionRequest,
  matchNames: (name: string) => DiscoveryRecord[] = exactNameMatches,
) {
  const requestedName = nameFromQuery(input);
  const interpretation = {
    queryType: 'evidence',
    entityClass: 'institution',
    identityName: requestedName,
    requestedEvidence: ['CFPB_COMPLAINTS'],
    identityMatchMethod: 'exact_public_or_historical_name',
  };
  if (!requestedName) {
    return envelope('INVALID_QUERY', 400, interpretation, {
      limitations: ['A specific lender name is required for identity-bound complaint evidence.'],
    });
  }
  if (/\b(best|worst|top|rank|ranking|most complaints?)\b/i.test(input.query ?? '')) {
    return envelope('UNSUPPORTED_CAPABILITY', 422, interpretation, {
      limitations: ['Complaint volume is not a quality score or recommendation. LenderTrustHub does not rank lenders by complaints.'],
    });
  }
  const matches = matchNames(requestedName);
  if (matches.length === 0) {
    return envelope('NO_CONFIDENT_MATCH', 200, interpretation, {
      limitations: ['No exact accepted lender identity matched this name. Typo, fuzzy, and affiliate-like names receive no complaint evidence.'],
    });
  }
  if (matches.length > 1) {
    return envelope('AMBIGUOUS_IDENTITIES', 422, interpretation, {
      limitations: ['More than one accepted lender identity matched exactly. Choose a specific NMLS or LEI; no complaint rows were attached.'],
      diagnostics: { executionEngine: 'lender-specialist-identity-v2', candidateCount: matches.length, dbWrites: 0 },
    });
  }

  const identityRecord = matches[0]!;
  const identity = {
    entityClass: 'institution',
    displayName: nationalPresentationName(identityRecord.canonical_name, identityRecord.display_name),
    nmls: identityRecord.nmls,
    lei: identityRecord.lei,
    publicationState: 'public_profile',
    destination: { type: identityRecord.publication_source?.startsWith('florida') ? 'FLORIDA_STATE_PROFILE' : 'PUBLIC_LENDER_PROFILE', url: nationalProfilePath(identityRecord.slug) },
  };
  const mapping = CFPB_COMPANY_MAPPINGS.find((candidate) =>
    candidate.ourLenderSlug === identityRecord.slug &&
    (candidate.matchMethod === 'curated-exact' || candidate.matchMethod === 'curated-dba'),
  );
  const snapshot = loadCfpbSnapshot();
  if (!snapshot) {
    return envelope('BACKEND_UNAVAILABLE', 503, interpretation, {
      identity,
      limitations: ['The committed CFPB evidence snapshot is unavailable. No generic complaint rows were substituted.'],
    });
  }
  const byCompany = getCompanySnapshotMap();
  const attached = mapping
    ? mapping.cfpbCompanyNames.map((name) => byCompany.get(name)).filter((row) => Boolean(row))
    : [];
  const page = input.page ?? 1;
  const limit = Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const start = (page - 1) * limit;
  const rows = attached.slice(start, start + limit).map((row) => ({
    sourceCompanyLabel: row!.company,
    product: row!.product,
    attachedObservationCount: row!.totalComplaints,
    observationsInRecentWindow: row!.complaintsLast24Months,
    recentWindowStart: snapshot.recentWindowStart,
    topIssues: row!.topIssues,
    companyResponses: row!.companyResponses,
    timelyResponse: { yes: row!.timelyYes, no: row!.timelyNo },
    sourceFetchedAt: row!.fetchedAt,
    bridgeMethod: mapping?.matchMethod ?? null,
    whyThisResultAppears: mapping?.matchNote ?? null,
  }));
  const attachedObservationCount = attached.reduce((sum, row) => sum + (row?.totalComplaints ?? 0), 0);
  const total = attached.length;
  const resultState: SpecialistResultState = total > 0 ? 'SUPPORTED_RESULTS' : 'ZERO_MATCHING_ROWS';
  return envelope(resultState, 200, interpretation, {
    identity,
    evidenceState: resultState,
    rows,
    total,
    pagination: { page, limit, pageCount: total === 0 ? 0 : Math.ceil(total / limit), outOfRange: total > 0 && start >= total },
    evidenceSummary: { attachedObservationCount, sourceLabelCount: total },
    availableRefinements: [{ field: 'identifier', values: ['NMLS', 'LEI'] }],
    provenance: {
      sourceFamily: 'CFPB Consumer Complaint Database',
      sourceDataset: snapshot.source,
      product: snapshot.product,
      generatedAt: snapshot.generatedAt,
      recentWindowStart: snapshot.recentWindowStart,
      sourceUrl: CFPB_SOURCE_URL,
      identityBridge: mapping?.matchMethod ?? 'none',
      excludedBridgeMethods: ['curated-affiliate', 'curated-multi', 'name-only'],
      publicationSemantics: 'Evidence is attached only to the confirmed public institution identity; no profile was created.',
    },
    limitations: [
      CFPB_SOURCE_NOTE,
      'A complaint is consumer-submitted evidence, not a finding of wrongdoing.',
      'Raw complaint count is not adjusted for lender size and is not a quality score.',
      'Zero attached observations is not a clean record; bridge exclusions and source reporting lag apply.',
      'Affiliate and lineage labels are excluded unless an exact/DBA bridge is explicitly accepted.',
      'The committed source contains company-label aggregate evidence, not public narrative rows.',
    ],
    destinations: [identity.destination, { type: 'OFFICIAL_IDENTIFIER_VERIFICATION', url: CFPB_SOURCE_URL }],
    diagnostics: { executionEngine: 'lender-specialist-cfpb-v2', orderingField: 'sourceCompanyLabel', orderingMeaning: 'Deterministic source label; no complaint ranking.', dbWrites: 0 },
  });
}

function executeNameIdentity(
  input: IdentityExecutionRequest,
  matchNames: (name: string) => DiscoveryRecord[] = exactNameMatches,
) {
  const requestedName = nameFromQuery(input);
  const interpretation = {
    queryType: 'identity',
    entityClass: 'institution',
    identityName: requestedName,
    matchMethod: 'exact_public_or_historical_name',
  };
  if (!requestedName) {
    return envelope('INVALID_QUERY', 400, interpretation, {
      limitations: ['A specific institution name is required.'],
    });
  }
  const matches = matchNames(requestedName);
  if (matches.length === 0) {
    return envelope('NO_CONFIDENT_MATCH', 200, interpretation, {
      limitations: ['No exact accepted public institution name matched. No fuzzy or cohort fallback was used.'],
    });
  }
  if (matches.length > 1) {
    return envelope('AMBIGUOUS_IDENTITIES', 422, interpretation, {
      limitations: ['More than one exact accepted identity matched. Use a labeled NMLS or LEI.'],
    });
  }
  const record = matches[0]!;
  const destination = {
    type: record.publication_source?.startsWith('florida') ? 'FLORIDA_STATE_PROFILE' : 'PUBLIC_LENDER_PROFILE',
    url: nationalProfilePath(record.slug),
  };
  const identity = {
    entityClass: 'institution',
    displayName: nationalPresentationName(record.canonical_name, record.display_name),
    nmls: record.nmls,
    lei: record.lei,
    publicationState: 'public_profile',
    destination,
  };
  return envelope('EXACT_IDENTITY', 200, interpretation, {
    identity,
    total: 1,
    destinations: [destination],
    provenance: { sourceFamily: 'accepted LenderTrustHub publication manifest', matchMethod: 'exact_public_or_historical_name' },
    limitations: ['Exact identity research is not a recommendation.'],
  });
}

export async function executeIdentityOrEvidence(
  input: IdentityExecutionRequest,
  dependencies: IdentityExecutionDependencies = { store: canonicalExactIdentityStore },
) {
  const invalidPage = validPage(input);
  if (invalidPage) {
    return envelope('INVALID_QUERY', 400, { queryType: input.queryType }, { limitations: [invalidPage] });
  }
  if (input.identifier) return executeIdentifier(input, dependencies);
  if (input.queryType === 'evidence' || input.requestedEvidence?.includes('CFPB_COMPLAINTS')) {
    return executeComplaintEvidence(input, dependencies.nameMatches);
  }
  if (input.queryType === 'identity') return executeNameIdentity(input, dependencies.nameMatches);
  return envelope('INVALID_QUERY', 400, { queryType: input.queryType }, {
    limitations: ['This request is not an exact identifier or supported named CFPB evidence request.'],
  });
}
