/**
 * LEND-NAT-002 — national identity graph types.
 * Compile-time catalog rows are SOURCE RECORDS, not national entities.
 */

export type EntityKind = 'institution' | 'branch' | 'person_mlo';

export type IdentityConfidence =
  | 'confirmed'
  | 'high_confidence'
  | 'review_required'
  | 'unresolved';

export type CurrentStatus = 'unknown' | 'observed' | 'active' | 'inactive';

export type IdentifierType =
  | 'NMLS_INSTITUTION'
  | 'NMLS_BRANCH'
  | 'NMLS_PERSON'
  | 'LEI'
  | 'FDIC_CERT'
  | 'NCUA_CHARTER'
  | 'RSSD'
  | 'FHA_ID'
  | 'HUD_ID'
  | 'SBA_ID'
  | 'STATE_LICENSE'
  | 'OTHER_AUTHORITATIVE';

export type NmlsSlotClass =
  | 'CONFIRMED_INSTITUTION_NMLS'
  | 'LIKELY_BRANCH_NMLS'
  | 'LIKELY_PERSON_OR_TEAM_NMLS'
  | 'COLLISION'
  | 'MISSING'
  | 'UNKNOWN';

export type GeoClass =
  | 'HEADQUARTERS_CATALOG_REPRESENTATION'
  | 'GEO_DISCOVERY_CLONE'
  | 'BRANCH_CANDIDATE'
  | 'UNKNOWN';

export type ClassificationFamily =
  | 'DEPOSITORY_BANK'
  | 'CREDIT_UNION'
  | 'INDEPENDENT_MORTGAGE_BANK'
  | 'MORTGAGE_BROKER'
  | 'SERVICER'
  | 'WHOLESALE'
  | 'CORRESPONDENT'
  | 'FINTECH_DIRECT'
  | 'COMMERCIAL'
  | 'OTHER'
  | 'UNKNOWN';

export type NameKind = 'legal' | 'display' | 'dba' | 'alternate';

export type RelationshipType =
  | 'SUBSIDIARY_OF'
  | 'PARENT_OF'
  | 'BRAND_OF'
  | 'SUCCESSOR_TO'
  | 'PREDECESSOR_OF';

/** Minimal catalog row — never a national identity key. */
export type CatalogRow = {
  id: string;
  slug: string;
  name: string;
  nmlsId: string;
  type: string;
  city: string;
  state: string;
  stateSlug: string;
  county: string;
  countySlug: string;
  nmlsVerified: boolean;
  website?: string;
};

export type LeiMapRow = {
  lei: string;
  nmlsId: string;
  slug: string;
  method: string;
  institutionName: string;
  file: string;
};

export type NationalEntity = {
  id: string;
  entityKind: EntityKind;
  stableKey: string;
  legalName: string;
  displayName: string | null;
  identityConfidence: IdentityConfidence;
  currentStatus: CurrentStatus;
  publicProjectionStatus: 'internal_only' | 'bridged' | 'projected';
  reviewStatus: string | null;
  notes: string | null;
};

export type TypedIdentifier = {
  id: string;
  entityId: string | null;
  identifierType: IdentifierType;
  identifierValue: string;
  jurisdiction: string | null;
  sourceDataset: string;
  sourceRecordId: string | null;
  observedAt: string | null;
  status: string | null;
  confidence: IdentityConfidence;
  rawMetadata: Record<string, unknown>;
};

export type SourceRecordLink = {
  id: string;
  sourceDataset: string;
  sourceRecordId: string;
  entityId: string | null;
  identifierId: string | null;
  attributionConfidence: IdentityConfidence;
  method: string;
  observedAt: string | null;
  rawMetadata: Record<string, unknown>;
};

export type LegacyBridge = {
  id: string;
  legacySource: string;
  legacyRowId: string;
  legacySlug: string;
  entityId: string | null;
  geoClass: GeoClass;
  confidence: IdentityConfidence;
};

export type IdentityConflict = {
  id: string;
  conflictClass: string;
  identifierType: IdentifierType | null;
  identifierValue: string | null;
  relatedValues: unknown;
  disposition: 'quarantined' | 'review_required' | 'unresolved' | 'recorded';
  notes: string;
};

export type EntityName = {
  entityId: string;
  nameKind: NameKind;
  name: string;
  sourceDataset: string;
};

export type EntityClassification = {
  entityId: string;
  family: ClassificationFamily;
  source: string;
  isAuthoritative: boolean;
  rawLabel: string | null;
};

export type IdentityGraph = {
  entities: NationalEntity[];
  identifiers: TypedIdentifier[];
  names: EntityName[];
  classifications: EntityClassification[];
  sourceLinks: SourceRecordLink[];
  bridges: LegacyBridge[];
  conflicts: IdentityConflict[];
  relationships: {
    fromEntityId: string;
    toEntityId: string;
    relationshipType: RelationshipType;
    confidence: IdentityConfidence;
  }[];
};

export type CatalogCensus = {
  locationRows: number;
  uniqueSlugs: number;
  duplicateSlugs: string[];
  distinctEntities: number;
  nmlsVerifiedEntities: number;
  rowsWithNumericNmls: number;
  distinctNumericNmls: number;
  nmlsSlotClasses: Record<NmlsSlotClass, number>;
};

export type LeiCensus = {
  distinctLeis: number;
  leisWithAnyNmlsMap: number;
  distinctMappedNmls: number;
  oneLeiOneNmls: number;
  oneLeiManyNmls: number;
  oneNmlsOneLei: number;
  oneNmlsManyLei: number;
  unresolvedLeis: number;
  confirmedAttachedLeis: number;
  reviewRequiredLeis: number;
  branchTeamContamination: number;
};

export type GraphManifest = {
  generatedAt: string;
  publicCatalogWrites: 0;
  slugWrites: 0;
  sitemapChanges: 0;
  census: CatalogCensus;
  lei: LeiCensus;
  counts: {
    candidatePublicCatalogRows: number;
    uniqueInstitutionNmlsIds: number;
    confirmedInstitutionEntities: number;
    ambiguousNmlsIds: number;
    geoClonesLinked: number;
    hmdaLeis: number;
    leisDeterministicallyAttached: number;
    unresolvedLeis: number;
    identifierRows: number;
    nmlsInstitutionIdentifiers: number;
    leiIdentifiers: number;
    fdicIdentifiers: number;
    sourceLinks: number;
    legacyBridges: number;
    identityConflicts: number;
  };
  fingerprints: {
    INSTITUTION_COHORT: string;
    IDENTIFIER_COHORT: string;
    SOURCE_LINK_COHORT: string;
    LEGACY_BRIDGE_COHORT: string;
  };
};
