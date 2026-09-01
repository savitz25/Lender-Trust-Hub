import { cleanNmlsId } from '@/lib/verification/nmls';
import { countLenderCatalog } from '@/lib/verification/counts';
import type { Lender } from '@/lib/mockData';
import type {
  CatalogCensus,
  CatalogRow,
  EntityClassification,
  EntityName,
  GraphManifest,
  IdentityConflict,
  IdentityGraph,
  LegacyBridge,
  LeiMapRow,
  NationalEntity,
  SourceRecordLink,
  TypedIdentifier,
} from './types';
import {
  assertIdentifierValue,
  identifierKey,
  nmlsTypeForSlot,
  normalizeLeiValue,
  refuseCrossNamespaceWrite,
} from './namespaces';
import {
  FIRST_TECH_DUPLICATE_SLUG,
  NAMED_LEI_COLLISIONS,
  NAMED_NMLS_COLLISIONS,
} from './quarantine';
import {
  classifyGeoRow,
  classifyNmlsSlot,
  classifyNmlsValue,
  collidingNmlsIds,
  pickCanonicalCatalogRow,
} from './classify';
import { indexLeiMaps, resolveLeiToInstitutionNmls } from './lei-resolution';
import { graphFingerprints } from './fingerprint';

function asCatalog(row: Lender): CatalogRow {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nmlsId: row.nmlsId,
    type: row.type,
    city: row.city,
    state: row.state,
    stateSlug: row.stateSlug,
    county: row.county,
    countySlug: row.countySlug,
    nmlsVerified: row.nmlsVerified,
    website: row.website,
  };
}

function stableId(prefix: string, key: string): string {
  return `${prefix}:${key}`;
}

export function censusCatalog(lenders: Lender[]): CatalogCensus {
  const rows = lenders.map(asCatalog);
  const counts = countLenderCatalog(lenders);
  const collision = collidingNmlsIds(rows);
  const slotCounts: CatalogCensus['nmlsSlotClasses'] = {
    CONFIRMED_INSTITUTION_NMLS: 0,
    LIKELY_BRANCH_NMLS: 0,
    LIKELY_PERSON_OR_TEAM_NMLS: 0,
    COLLISION: 0,
    MISSING: 0,
    UNKNOWN: 0,
  };
  for (const row of rows) {
    slotCounts[classifyNmlsSlot(row, collision)] += 1;
  }
  const slugCounts = new Map<string, number>();
  for (const r of rows) slugCounts.set(r.slug, (slugCounts.get(r.slug) ?? 0) + 1);
  const duplicateSlugs = [...slugCounts.entries()].filter(([, n]) => n > 1).map(([s]) => s);
  const numeric = rows.map((r) => cleanNmlsId(r.nmlsId)).filter((n): n is string => Boolean(n));

  return {
    locationRows: counts.branchListings,
    uniqueSlugs: new Set(rows.map((r) => r.slug)).size,
    duplicateSlugs,
    distinctEntities: counts.distinctEntities,
    nmlsVerifiedEntities: counts.verifiedEntities,
    rowsWithNumericNmls: numeric.length,
    distinctNumericNmls: new Set(numeric).size,
    nmlsSlotClasses: slotCounts,
  };
}

export function buildIdentityGraph(input: {
  lenders: Lender[];
  leiMaps: LeiMapRow[];
  nationalLeis: string[];
}): IdentityGraph {
  const rows = input.lenders.map(asCatalog);
  const collision = collidingNmlsIds(rows);

  const entities: NationalEntity[] = [];
  const identifiers: TypedIdentifier[] = [];
  const names: EntityName[] = [];
  const classifications: EntityClassification[] = [];
  const sourceLinks: SourceRecordLink[] = [];
  const bridges: LegacyBridge[] = [];
  const conflicts: IdentityConflict[] = [];

  const identIndex = new Map<string, TypedIdentifier>();
  const entityByStable = new Map<string, NationalEntity>();
  const entityByNmls = new Map<string, NationalEntity>();

  function putIdentifier(row: Omit<TypedIdentifier, 'id'>): TypedIdentifier {
    const key = identifierKey(row.identifierType, row.identifierValue);
    const existing = identIndex.get(key);
    if (existing) {
      if (!existing.entityId && row.entityId) existing.entityId = row.entityId;
      return existing;
    }
    const created: TypedIdentifier = { id: stableId('id', key), ...row };
    identIndex.set(key, created);
    identifiers.push(created);
    return created;
  }

  function addConflict(c: Omit<IdentityConflict, 'id'>): void {
    const key = `${c.conflictClass}:${c.identifierType ?? ''}:${c.identifierValue ?? ''}`;
    if (conflicts.some((x) => `${x.conflictClass}:${x.identifierType ?? ''}:${x.identifierValue ?? ''}` === key)) {
      return;
    }
    conflicts.push({ id: stableId('conflict', key), ...c });
  }

  for (const [nmls, named] of Object.entries(NAMED_NMLS_COLLISIONS)) {
    addConflict({
      conflictClass: named,
      identifierType: nmlsTypeForSlot(
        nmls === '2909'
          ? 'LIKELY_BRANCH_NMLS'
          : nmls === '2458338'
            ? 'LIKELY_PERSON_OR_TEAM_NMLS'
            : 'CONFIRMED_INSTITUTION_NMLS'
      ),
      identifierValue: nmls,
      relatedValues: { nmls },
      disposition: 'quarantined',
      notes: `Named LEND-NAT-001 collision: ${named}`,
    });
  }

  for (const lei of Object.keys(NAMED_LEI_COLLISIONS)) {
    addConflict({
      conflictClass: NAMED_LEI_COLLISIONS[lei]!.join('+'),
      identifierType: 'LEI',
      identifierValue: lei,
      relatedValues: { cases: NAMED_LEI_COLLISIONS[lei] },
      disposition: 'quarantined',
      notes: 'Named LEI collision family — no auto-merge',
    });
  }

  const slugCounts = new Map<string, number>();
  for (const r of rows) slugCounts.set(r.slug, (slugCounts.get(r.slug) ?? 0) + 1);
  if ((slugCounts.get(FIRST_TECH_DUPLICATE_SLUG) ?? 0) > 1) {
    addConflict({
      conflictClass: 'first_tech_duplicate_slug',
      identifierType: null,
      identifierValue: FIRST_TECH_DUPLICATE_SLUG,
      relatedValues: { slug: FIRST_TECH_DUPLICATE_SLUG },
      disposition: 'recorded',
      notes: 'Duplicate catalog slug — slug is not an identity key',
    });
  }

  const confirmedByNmls = new Map<string, CatalogRow[]>();
  for (const row of rows) {
    const nmls = cleanNmlsId(row.nmlsId);
    const slot = classifyNmlsSlot(row, collision);
    if (slot === 'CONFIRMED_INSTITUTION_NMLS' && nmls) {
      const list = confirmedByNmls.get(nmls) ?? [];
      list.push(row);
      confirmedByNmls.set(nmls, list);
    }
  }

  for (const [nmls, group] of confirmedByNmls) {
    const canonical = pickCanonicalCatalogRow(group);
    const stableKey = `nmls-inst:${nmls}`;
    const entity: NationalEntity = {
      id: stableId('ent', stableKey),
      entityKind: 'institution',
      stableKey,
      legalName: canonical.name.replace(/\s*[\(（].*$/, '').trim() || canonical.name,
      displayName: canonical.name,
      identityConfidence: 'confirmed',
      currentStatus: 'unknown',
      publicProjectionStatus: 'internal_only',
      reviewStatus: null,
      notes: `${group.length} catalog geo rows attached; HQ state is not identity`,
    };
    entities.push(entity);
    entityByStable.set(stableKey, entity);
    entityByNmls.set(nmls, entity);

    names.push({
      entityId: entity.id,
      nameKind: 'legal',
      name: entity.legalName,
      sourceDataset: 'public_catalog',
    });
    if (entity.displayName && entity.displayName !== entity.legalName) {
      names.push({
        entityId: entity.id,
        nameKind: 'display',
        name: entity.displayName,
        sourceDataset: 'public_catalog',
      });
    }

    classifications.push({
      entityId: entity.id,
      family: 'UNKNOWN',
      source: 'lend-nat-002-default',
      isAuthoritative: false,
      rawLabel: canonical.type,
    });
    classifications.push({
      entityId: entity.id,
      family: 'UNKNOWN',
      source: 'catalog_editorial_type',
      isAuthoritative: false,
      rawLabel: canonical.type,
    });

    const instId = putIdentifier({
      entityId: entity.id,
      identifierType: 'NMLS_INSTITUTION',
      identifierValue: assertIdentifierValue('NMLS_INSTITUTION', nmls),
      jurisdiction: null,
      sourceDataset: 'public_catalog',
      sourceRecordId: canonical.id,
      observedAt: null,
      status: null,
      confidence: 'confirmed',
      rawMetadata: { nmlsVerified: canonical.nmlsVerified, catalogType: canonical.type },
    });

    const canonicalSlug = canonical.slug;
    for (const row of group) {
      const geo = classifyGeoRow(row, 'CONFIRMED_INSTITUTION_NMLS', canonicalSlug);
      sourceLinks.push({
        id: stableId('src', `public_catalog:${row.id}`),
        sourceDataset: 'public_catalog',
        sourceRecordId: row.id,
        entityId: entity.id,
        identifierId: instId.id,
        attributionConfidence: 'confirmed',
        method: 'confirmed_institution_nmls',
        observedAt: null,
        rawMetadata: { slug: row.slug, stateSlug: row.stateSlug, geoClass: geo },
      });
      bridges.push({
        id: stableId('br', `public_catalog:${row.id}`),
        legacySource: 'public_catalog',
        legacyRowId: row.id,
        legacySlug: row.slug,
        entityId: entity.id,
        geoClass: geo,
        confidence: 'confirmed',
      });
    }
  }

  for (const row of rows) {
    const nmls = cleanNmlsId(row.nmlsId);
    const slot = classifyNmlsSlot(row, collision);
    if (slot === 'CONFIRMED_INSTITUTION_NMLS') continue;

    if (
      nmls &&
      (slot === 'LIKELY_BRANCH_NMLS' || slot === 'LIKELY_PERSON_OR_TEAM_NMLS')
    ) {
      const type = nmlsTypeForSlot(slot);
      putIdentifier({
        entityId: null,
        identifierType: type,
        identifierValue: assertIdentifierValue(type, nmls),
        jurisdiction: null,
        sourceDataset: 'public_catalog',
        sourceRecordId: row.id,
        observedAt: null,
        status: null,
        confidence: 'review_required',
        rawMetadata: { slug: row.slug, name: row.name, slot },
      });
    }

    const alreadyBridged = bridges.some(
      (b) => b.legacySource === 'public_catalog' && b.legacyRowId === row.id
    );
    if (alreadyBridged) continue;

    const geo = classifyGeoRow(row, slot, null);
    sourceLinks.push({
      id: stableId('src', `public_catalog:${row.id}`),
      sourceDataset: 'public_catalog',
      sourceRecordId: row.id,
      entityId: null,
      identifierId: null,
      attributionConfidence: slot === 'MISSING' ? 'unresolved' : 'review_required',
      method: `catalog_row_${slot.toLowerCase()}`,
      observedAt: null,
      rawMetadata: { slug: row.slug, nmls, slot },
    });
    bridges.push({
      id: stableId('br', `public_catalog:${row.id}`),
      legacySource: 'public_catalog',
      legacyRowId: row.id,
      legacySlug: row.slug,
      entityId: null,
      geoClass: geo,
      confidence: slot === 'MISSING' ? 'unresolved' : 'review_required',
    });

    if (slot === 'COLLISION' && nmls) {
      addConflict({
        conflictClass: 'shared_nmls_unrelated_cores',
        identifierType: 'NMLS_INSTITUTION',
        identifierValue: nmls,
        relatedValues: { slug: row.slug, name: row.name },
        disposition: 'review_required',
        notes: 'Same NMLS on unrelated core names after catalog sanitize',
      });
    }
  }

  const leiIndex = indexLeiMaps(input.leiMaps);
  const nmlsClassFn = (nmls: string) => {
    const group = confirmedByNmls.get(nmls);
    return classifyNmlsValue(nmls, collision, Boolean(group?.some((r) => r.nmlsVerified)));
  };

  const allLeis = new Set<string>();
  for (const lei of input.nationalLeis) {
    const n = normalizeLeiValue(lei);
    if (n) allLeis.add(n);
  }
  for (const lei of leiIndex.keys()) allLeis.add(lei);

  for (const lei of allLeis) {
    const pair = leiIndex.get(lei);
    let resolution = pair
      ? resolveLeiToInstitutionNmls(pair, nmlsClassFn)
      : {
          lei,
          nmlsId: null,
          confidence: 'unresolved' as const,
          reason: 'HMDA LEI with no NMLS mapping',
        };

    const nmlsLeiCount = resolution.nmlsId
      ? [...leiIndex.values()].filter((p) => p.nmlsIds.has(resolution.nmlsId!)).length
      : 0;
    if (resolution.confidence === 'confirmed' && nmlsLeiCount > 1) {
      resolution = {
        ...resolution,
        nmlsId: null,
        confidence: 'review_required',
        reason: `one NMLS → ${nmlsLeiCount} LEIs; preserve separate LEIs until relationship is explained`,
      };
    }

    const entity = resolution.nmlsId ? entityByNmls.get(resolution.nmlsId) ?? null : null;
    const attach = resolution.confidence === 'confirmed' && entity;

    if (resolution.confidence === 'review_required') {
      addConflict({
        conflictClass: 'lei_nmls_resolution',
        identifierType: 'LEI',
        identifierValue: lei,
        relatedValues: {
          nmlsIds: pair ? [...pair.nmlsIds] : [],
          reason: resolution.reason,
        },
        disposition: 'review_required',
        notes: resolution.reason,
      });
    }

    const ident = putIdentifier({
      entityId: attach ? entity.id : null,
      identifierType: 'LEI',
      identifierValue: assertIdentifierValue('LEI', lei),
      jurisdiction: null,
      sourceDataset: 'hmda_2025',
      sourceRecordId: lei,
      observedAt: '2025-01-01',
      status: null,
      confidence: attach ? 'confirmed' : resolution.confidence,
      rawMetadata: { reason: resolution.reason, methods: pair ? [...pair.methods] : [] },
    });

    sourceLinks.push({
      id: stableId('src', `hmda_lei:${lei}`),
      sourceDataset: 'hmda_2025_lei',
      sourceRecordId: lei,
      entityId: attach ? entity.id : null,
      identifierId: ident.id,
      attributionConfidence: attach ? 'confirmed' : resolution.confidence,
      method: attach ? 'deterministic_lei_to_confirmed_institution_nmls' : resolution.reason,
      observedAt: '2025-01-01',
      rawMetadata: { nmlsId: resolution.nmlsId },
    });
  }

  for (const ident of identifiers) {
    if (ident.identifierType === 'NMLS_INSTITUTION') {
      const asLei = ident.identifierValue.length === 20 && /[A-Z]/i.test(ident.identifierValue);
      if (asLei) {
        refuseCrossNamespaceWrite({
          intendedType: 'NMLS_INSTITUTION',
          candidateType: 'LEI',
          value: ident.identifierValue,
        });
      }
    }
  }

  return {
    entities,
    identifiers,
    names,
    classifications,
    sourceLinks,
    bridges,
    conflicts,
    relationships: [],
  };
}

export function buildManifest(
  lenders: Lender[],
  graph: IdentityGraph,
  nationalLeiCount: number
): GraphManifest {
  const census = censusCatalog(lenders);
  const leiIds = graph.identifiers.filter((i) => i.identifierType === 'LEI');
  const attachedLei = leiIds.filter((i) => i.entityId && i.confidence === 'confirmed');
  const nmlsInst = graph.identifiers.filter((i) => i.identifierType === 'NMLS_INSTITUTION');
  const oneLeiMany = graph.conflicts.filter(
    (c) => c.conflictClass === 'lei_nmls_resolution' && String(c.notes).includes('one LEI →')
  );

  const leiMapsAttached = attachedLei.length;
  const unresolvedLeis = leiIds.filter((i) => !i.entityId).length;

  const leiCensus = {
    distinctLeis: leiIds.length,
    leisWithAnyNmlsMap: leiIds.filter((i) => {
      const meta = i.rawMetadata as { reason?: string };
      return meta.reason !== 'HMDA LEI with no NMLS mapping' && meta.reason !== 'no NMLS on mapping row';
    }).length,
    distinctMappedNmls: new Set(
      graph.sourceLinks
        .filter((s) => s.sourceDataset === 'hmda_2025_lei' && s.rawMetadata?.nmlsId)
        .map((s) => String(s.rawMetadata.nmlsId))
    ).size,
    oneLeiOneNmls: 0,
    oneLeiManyNmls: oneLeiMany.length,
    oneNmlsOneLei: 0,
    oneNmlsManyLei: 0,
    unresolvedLeis,
    confirmedAttachedLeis: leiMapsAttached,
    reviewRequiredLeis: leiIds.filter((i) => i.confidence === 'review_required').length,
    branchTeamContamination: graph.identifiers.filter(
      (i) => i.identifierType === 'NMLS_BRANCH' || i.identifierType === 'NMLS_PERSON'
    ).length,
  };

  return {
    generatedAt: new Date().toISOString(),
    publicCatalogWrites: 0,
    slugWrites: 0,
    sitemapChanges: 0,
    census,
    lei: leiCensus,
    counts: {
      candidatePublicCatalogRows: census.locationRows,
      uniqueInstitutionNmlsIds: nmlsInst.length,
      confirmedInstitutionEntities: graph.entities.filter((e) => e.entityKind === 'institution')
        .length,
      ambiguousNmlsIds:
        census.nmlsSlotClasses.COLLISION +
        census.nmlsSlotClasses.LIKELY_BRANCH_NMLS +
        census.nmlsSlotClasses.LIKELY_PERSON_OR_TEAM_NMLS +
        census.nmlsSlotClasses.UNKNOWN,
      geoClonesLinked: graph.bridges.filter((b) => b.geoClass === 'GEO_DISCOVERY_CLONE' && b.entityId)
        .length,
      hmdaLeis: nationalLeiCount,
      leisDeterministicallyAttached: leiMapsAttached,
      unresolvedLeis,
      identifierRows: graph.identifiers.length,
      nmlsInstitutionIdentifiers: nmlsInst.length,
      leiIdentifiers: leiIds.length,
      fdicIdentifiers: graph.identifiers.filter((i) => i.identifierType === 'FDIC_CERT').length,
      sourceLinks: graph.sourceLinks.length,
      legacyBridges: graph.bridges.length,
      identityConflicts: graph.conflicts.length,
    },
    fingerprints: graphFingerprints(graph),
  };
}

export { asCatalog };
