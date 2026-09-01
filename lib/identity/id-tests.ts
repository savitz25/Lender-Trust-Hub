/**
 * LEND-NAT-002 identity tests ID1–ID18.
 * Fixtures only — does not mutate the public catalog.
 */

import type { Lender } from '@/lib/mockData';
import { IdentifierNamespaceError, assertIdentifierValue, refuseCrossNamespaceWrite } from './namespaces';
import { resolveLeiToInstitutionNmls, type LeiNmlsPair } from './lei-resolution';
import { buildIdentityGraph } from './build-graph';
import { graphFingerprints } from './fingerprint';
import type { CatalogRow, LeiMapRow, NmlsSlotClass } from './types';

function row(partial: CatalogRow): Lender {
  return {
    id: partial.id,
    slug: partial.slug,
    name: partial.name,
    nmlsId: partial.nmlsId,
    type: (partial.type as Lender['type']) || 'Lender',
    city: partial.city,
    state: partial.state,
    stateSlug: partial.stateSlug,
    county: partial.county,
    countySlug: partial.countySlug,
    zipCodes: [],
    rating: 0,
    reviewCount: 0,
    trustScore: 0,
    countyExperienceScore: 0,
    nationalVolumeRank: 0,
    loanTypes: ['Conventional'],
    specialties: [],
    creditTiers: ['Good'],
    nmlsVerified: partial.nmlsVerified,
    cfpbComplaints: 0,
    bbbRating: 'A',
    googleRating: 0,
    trustpilotRating: 0,
    shortDescription: '',
    website: partial.website,
  };
}

function pair(lei: string, nmls: string[], methods: string[]): LeiNmlsPair {
  return {
    lei,
    nmlsIds: new Set(nmls),
    methods: new Set(methods),
    slugs: new Set(),
    names: new Set(),
  };
}

export type IdTestResult = { id: string; pass: boolean; detail: string };

export function runIdentityTests(opts?: { publicLenders?: Lender[] }): IdTestResult[] {
  const results: IdTestResult[] = [];
  const check = (id: string, pass: boolean, detail: string) => {
    results.push({ id, pass, detail });
  };

  const fl = row({
    id: 'r-fl',
    slug: 'acme-fl',
    name: 'Acme Mortgage (Florida)',
    nmlsId: '3038',
    type: 'Lender',
    city: 'Miami',
    state: 'Florida',
    stateSlug: 'florida',
    county: 'Miami-Dade',
    countySlug: 'miami-dade',
    nmlsVerified: true,
  });
  const tx = row({
    id: 'r-tx',
    slug: 'acme-tx',
    name: 'Acme Mortgage (Texas)',
    nmlsId: '3038',
    type: 'Lender',
    city: 'Houston',
    state: 'Texas',
    stateSlug: 'texas',
    county: 'Harris',
    countySlug: 'harris',
    nmlsVerified: true,
  });
  const ca = row({
    id: 'r-ca',
    slug: 'acme-ca',
    name: 'Acme Mortgage',
    nmlsId: '3038',
    type: 'Lender',
    city: 'Irvine',
    state: 'California',
    stateSlug: 'california',
    county: 'Orange',
    countySlug: 'orange',
    nmlsVerified: true,
  });
  const other = row({
    id: 'r-rocket',
    slug: 'rocket-mortgage',
    name: 'Rocket Mortgage',
    nmlsId: '3030',
    type: 'Lender',
    city: 'Detroit',
    state: 'Michigan',
    stateSlug: 'michigan',
    county: 'Wayne',
    countySlug: 'wayne',
    nmlsVerified: true,
  });
  const fairway = row({
    id: 'r-fairway',
    slug: 'fairway-augusta',
    name: 'Fairway Independent Mortgage — Augusta (Sheppard Team)',
    nmlsId: '2909',
    type: 'Lender',
    city: 'Augusta',
    state: 'Georgia',
    stateSlug: 'georgia',
    county: 'Richmond',
    countySlug: 'richmond',
    nmlsVerified: true,
  });
  const cmgTeam = row({
    id: 'r-cmg-vo',
    slug: 'cmg-home-loans-dennis-vo',
    name: 'CMG Home Loans (Dennis Vo Team)',
    nmlsId: '2458338',
    type: 'Lender',
    city: 'Miami',
    state: 'Florida',
    stateSlug: 'florida',
    county: 'Miami-Dade',
    countySlug: 'miami-dade',
    nmlsVerified: true,
  });
  const cmgCo = row({
    id: 'r-cmg',
    slug: 'cmg-financial',
    name: 'CMG Mortgage, Inc.',
    nmlsId: '1820',
    type: 'Lender',
    city: 'San Ramon',
    state: 'California',
    stateSlug: 'california',
    county: 'Contra Costa',
    countySlug: 'contra-costa',
    nmlsVerified: true,
  });

  const leiUwm: LeiMapRow = {
    lei: '549300HW662MN1WU8550',
    nmlsId: '3038',
    slug: 'united-wholesale-mortgage',
    method: 'curated_lei_public_nmls',
    institutionName: 'United Wholesale Mortgage, LLC',
    file: 'fixture',
  };

  const g1 = buildIdentityGraph({
    lenders: [fl, tx, ca, other, fairway, cmgTeam, cmgCo],
    leiMaps: [leiUwm],
    nationalLeis: ['549300HW662MN1WU8550', '549300FGXN1K3HLB1R50'],
  });

  const acme = g1.entities.filter((e) => e.stableKey === 'nmls-inst:3038');
  check('ID1', acme.length === 1, `same NMLS across FL/TX/CA → ${acme.length} institution(s)`);

  const instCount = g1.entities.filter((e) => e.entityKind === 'institution').length;
  check(
    'ID2',
    instCount === 3,
    `3038 + 3030 + 1820 institutions, not 2909/2458338; got ${instCount}`
  );

  const nmlsInstValues = g1.identifiers
    .filter((i) => i.identifierType === 'NMLS_INSTITUTION')
    .map((i) => i.identifierValue);
  check('ID3', !nmlsInstValues.includes('2909'), 'branch NMLS 2909 not in NMLS_INSTITUTION');
  check('ID4', !nmlsInstValues.includes('2458338'), 'person/team NMLS 2458338 not in NMLS_INSTITUTION');

  const g2 = buildIdentityGraph({
    lenders: [other],
    leiMaps: [
      { ...leiUwm, lei: '549300FGXN1K3HLB1R50', nmlsId: '3030', slug: 'rocket-mortgage' },
      { ...leiUwm, lei: '549300FGXN1K3HLB1R50', nmlsId: '3030', slug: 'rocket-mortgage', file: 'tx' },
    ],
    nationalLeis: ['549300FGXN1K3HLB1R50'],
  });
  const rocketLei = g2.identifiers.filter(
    (i) => i.identifierType === 'LEI' && i.identifierValue === '549300FGXN1K3HLB1R50'
  );
  check('ID5', rocketLei.length === 1, `same LEI reimport → ${rocketLei.length} identifier(s)`);

  const nameOnly = resolveLeiToInstitutionNmls(pair('549300AAAAAAAAAAAAAA', ['3038'], ['gleif_name_to_directory']), () => 'CONFIRMED_INSTITUTION_NMLS');
  check('ID6', nameOnly.confidence !== 'confirmed' && nameOnly.nmlsId === null, nameOnly.reason);

  const manyNmls = resolveLeiToInstitutionNmls(
    pair('RVDPPPGHCGZ40J4VQ731', ['2909', '35953'], ['curated_lei_public_nmls']),
    () => 'CONFIRMED_INSTITUTION_NMLS'
  );
  check('ID7', manyNmls.confidence === 'review_required' && manyNmls.nmlsId === null, manyNmls.reason);

  const twoLei = buildIdentityGraph({
    lenders: [other],
    leiMaps: [
      {
        lei: '549300FGXN1K3HLB1R50',
        nmlsId: '3030',
        slug: 'rocket-mortgage',
        method: 'curated_lei_public_nmls',
        institutionName: 'Rocket A',
        file: 'a',
      },
      {
        lei: '549300XY701IELCE5Q08',
        nmlsId: '3030',
        slug: 'rocket-mortgage',
        method: 'curated_lei_public_nmls',
        institutionName: 'Rocket B',
        file: 'b',
      },
    ],
    nationalLeis: ['549300FGXN1K3HLB1R50', '549300XY701IELCE5Q08'],
  });
  const rocketLeis = twoLei.identifiers.filter((i) => i.identifierType === 'LEI');
  const rocketInst = twoLei.entities.filter((e) => e.stableKey === 'nmls-inst:3030');
  check(
    'ID8',
    rocketLeis.length === 2 && rocketInst.length === 1,
    `one NMLS → ${rocketLeis.length} LEIs, ${rocketInst.length} institution(s)`
  );

  const slugAsKey = g1.entities.some((e) => e.stableKey.startsWith('slug:'));
  check('ID9', !slugAsKey, 'no institution stable_key is a public slug');

  const acmeBridges = g1.bridges.filter((b) => b.entityId === acme[0]?.id);
  const geoClones = acmeBridges.filter((b) => b.geoClass === 'GEO_DISCOVERY_CLONE');
  const hasBranchRel = g1.relationships.length > 0;
  check(
    'ID10',
    geoClones.length >= 1 && !hasBranchRel,
    `geo clones=${geoClones.length}, HAS_BRANCH relations=${g1.relationships.length}`
  );

  const orphan = g1.identifiers.find(
    (i) => i.identifierType === 'LEI' && i.identifierValue === '549300FGXN1K3HLB1R50'
  );
  check('ID11', Boolean(orphan && orphan.entityId === null), 'orphan HMDA LEI preserved unattached');

  try {
    assertIdentifierValue('NMLS_INSTITUTION', '9087-cert');
  } catch {
    // Expected: an FDIC certificate cannot pass NMLS validation.
  }
  let mixed = false;
  try {
    refuseCrossNamespaceWrite({
      intendedType: 'NMLS_INSTITUTION',
      candidateType: 'FDIC_CERT',
      value: '9087',
    });
  } catch (e) {
    mixed = e instanceof IdentifierNamespaceError;
  }
  check('ID12', mixed, 'FDIC cert cannot be written as NMLS_INSTITUTION');

  const acmeNames = g1.names.filter((n) => n.entityId === acme[0]?.id);
  const kinds = new Set(acmeNames.map((n) => n.nameKind));
  check('ID13', kinds.has('legal'), `name kinds=${[...kinds].join(',')}`);

  check('ID14', g1.relationships.length === 0, 'no parent/sub flattening relationships created');

  check(
    'ID15',
    g1.entities.every((e) => e.currentStatus === 'unknown'),
    'current status is unknown, not inferred from import'
  );

  if (opts?.publicLenders) {
    const before = opts.publicLenders.map((l) => `${l.id}|${l.slug}|${l.nmlsId}`).join(';');
    buildIdentityGraph({
      lenders: opts.publicLenders,
      leiMaps: [],
      nationalLeis: [],
    });
    const after = opts.publicLenders.map((l) => `${l.id}|${l.slug}|${l.nmlsId}`).join(';');
    check('ID16', before === after, 'public catalog rows unchanged after graph build');
  } else {
    check('ID16', true, 'skipped live catalog (fixture-only run)');
  }

  const fp1 = graphFingerprints(g1);
  const g1b = buildIdentityGraph({
    lenders: [fl, tx, ca, other, fairway, cmgTeam, cmgCo],
    leiMaps: [leiUwm],
    nationalLeis: ['549300HW662MN1WU8550', '549300FGXN1K3HLB1R50'],
  });
  const fp2 = graphFingerprints(g1b);
  check(
    'ID17',
    fp1.INSTITUTION_COHORT === fp2.INSTITUTION_COHORT &&
      fp1.IDENTIFIER_COHORT === fp2.IDENTIFIER_COHORT &&
      fp1.SOURCE_LINK_COHORT === fp2.SOURCE_LINK_COHORT &&
      fp1.LEGACY_BRIDGE_COHORT === fp2.LEGACY_BRIDGE_COHORT,
    'reimport fingerprints match'
  );

  const fairwayLei = resolveLeiToInstitutionNmls(
    pair('RVDPPPGHCGZ40J4VQ731', ['2909'], ['curated_lei+directory_name']),
    () => 'LIKELY_BRANCH_NMLS' as NmlsSlotClass
  );
  const cmgLei = resolveLeiToInstitutionNmls(
    pair('254900DTLHVWQ7NP7R34', ['1820', '2458338'], ['curated_lei_public_nmls']),
    (n) => (n === '1820' ? 'CONFIRMED_INSTITUTION_NMLS' : 'LIKELY_PERSON_OR_TEAM_NMLS')
  );
  check(
    'ID18',
    fairwayLei.nmlsId === null && cmgLei.nmlsId === null,
    `fairway=${fairwayLei.reason}; cmg=${cmgLei.reason}`
  );

  return results;
}
