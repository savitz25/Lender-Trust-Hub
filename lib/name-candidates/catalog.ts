/**
 * TH-SEARCH-R1-019C: the institution catalog the candidate engine searches.
 *
 * Scope = the widest EXISTING approved institution-name scope, and nothing beyond it:
 *   A. published lender profiles that pass the existing render/publication gate
 *      (the same `lenderIdentitySource` seam native identifier lookup already uses);
 *   B. HMDA reporting institutions whose names LenderTrustHub ALREADY publishes by name in its own
 *      HMDA results and cohort operation (committed GLEIF / curated mapping files). A row with no
 *      standalone profile is an inline research identity with no profile link -- none is invented.
 *
 * NOT in scope, by construction: the service-role exact-identifier store (exact-ID access is not
 * permission to enumerate it by name), NMLS person/MLO and branch records, held or unpublished
 * projections, claim/account data. No database or network call is made here.
 */
import { createHash } from 'node:crypto';
import { lenderIdentitySource } from '@/lib/ask-lender/identity-lookup';
import { loadLeiIdentityIndex } from '@/lib/ask-lender/identity';
import { nationalPresentationName, typeLabel } from '@/lib/national-profile/discovery';
import { nationalProfilePath } from '@/lib/national-profile/cohort';
import type { CatalogInstitution, CatalogName } from './engine';

/** Official LEI registry record. The only action offered for an institution that has no LenderTrustHub profile. */
export const GLEIF_RECORD_URL = 'https://search.gleif.org/#/record/' as const;

export const CATALOG_SCOPE = {
  searched: [
    { code: 'published_profiles', meaning: 'Published lender institution profiles (national research cohort and permitted Florida OFR-licensed companies).' },
    { code: 'hmda_reporting_institutions', meaning: 'HMDA reporting institutions named in the committed GLEIF / curated identity files. Most have no standalone profile.' },
  ],
  excluded: ['NMLS person/MLO records', 'NMLS branch records', 'held or unpublished profile projections', 'institutions known only to the exact-identifier research store', 'claim and account data'],
  meaning: 'Institution grain only. A candidate is a name match, not a verified identity relationship or a regulatory finding.',
} as const;

export type CandidateCatalog = {
  institutions: CatalogInstitution[];
  sourceVersion: { profiles: string; hmdaIdentity: string; fingerprint: string };
  counts: { publishedProfiles: number; hmdaOnly: number; identityHold: number };
};

let cached: CandidateCatalog | null = null;

/** Throws when an approved source fails its own contract. Callers report UNAVAILABLE -- never a miss. */
export function loadCandidateCatalog(): CandidateCatalog {
  if (cached) return cached;
  const snapshot = lenderIdentitySource.load();
  if (!snapshot || !Array.isArray(snapshot.entries) || snapshot.expectedCount < 1 || snapshot.entries.length !== snapshot.expectedCount) throw new Error('candidate_catalog_profile_source');
  const hmda = loadLeiIdentityIndex();
  if (!hmda?.byLei || hmda.byLei.size < 1) throw new Error('candidate_catalog_hmda_source');

  // LEIs the existing identity logic already holds: the HMDA/GLEIF legal name for that LEI conflicts with
  // the published profile that carries it. A profile card must not repeat an identifier the hub itself disputes.
  const heldLeis = new Set([...hmda.byLei.values()].filter((i) => i.identityStatus === 'identity_hold').map((i) => i.lei));

  const institutions: CatalogInstitution[] = [];
  const bySlug = new Map<string, CatalogInstitution>();
  let sourceRef = '';
  for (const { record, permitted, sourceReference } of snapshot.entries) {
    if (!permitted) continue; // the existing publication gate; never widened here
    if (!record?.institution_id || !record.stable_key || !record.slug || !record.canonical_name) throw new Error('candidate_catalog_profile_row');
    const displayName = nationalPresentationName(record.canonical_name, record.display_name);
    const names: CatalogName[] = [];
    const add = (value: string | null | undefined, field: CatalogName['field'], sourceLabel: string) => {
      const text = (value ?? '').trim();
      if (text && !names.some((n) => n.value === text && n.field === field)) names.push({ value: text, field, sourceLabel });
    };
    add(record.canonical_name, 'canonical_name', 'published profile canonical name');
    add(record.presentation_name, 'presentation_name', 'published profile display name');
    add(displayName, 'presentation_name', 'published profile display name');
    for (const historical of record.historical_names ?? []) add(historical, 'historical_name', 'historical name recorded on the published profile');
    add(record.slug.replace(/-/g, ' '), 'derived_slug_form', 'search form derived from the profile URL slug');
    const entry: CatalogInstitution = {
      institutionKey: record.stable_key, displayName, entityType: typeLabel(record), names,
      nmls: record.nmls ?? null, lei: record.lei && !heldLeis.has(record.lei) ? record.lei : null,
      publicationState: 'public_profile', profilePath: nationalProfilePath(record.slug), sourceReference,
    };
    institutions.push(entry); bySlug.set(record.slug, entry); sourceRef = sourceRef || sourceReference;
  }
  const publishedProfiles = institutions.length;

  let hmdaOnly = 0, identityHold = 0;
  for (const identity of [...hmda.byLei.values()].sort((a, b) => a.lei.localeCompare(b.lei))) {
    if (!identity.hmdaName) continue; // an unnamed LEI has nothing to match; it is never given an invented name
    const hmdaName: CatalogName = { value: identity.hmdaName, field: 'hmda_reporter_name', sourceLabel: 'HMDA reporter legal name (GLEIF / curated HMDA identity file)' };
    // The ONLY merge: the existing, already-verified LEI bridge to a published profile.
    const profile = identity.identityStatus === 'public_profile' && identity.publicSlug ? bySlug.get(identity.publicSlug) : undefined;
    if (profile) {
      if (!profile.names.some((n) => n.value === hmdaName.value)) profile.names.push(hmdaName);
      if (!profile.lei) profile.lei = identity.lei;
      continue;
    }
    const hold = identity.identityStatus === 'identity_hold';
    if (hold) identityHold++; else hmdaOnly++;
    institutions.push({
      institutionKey: `hmda-lei:${identity.lei}`, displayName: identity.hmdaName,
      entityType: 'HMDA reporting institution', names: [hmdaName],
      // Only a curated HMDA mapping supplies an NMLS here; one is never borrowed from a profile.
      nmls: hold || !identity.mappingMethod ? null : identity.nmls, lei: identity.lei,
      // identity_hold: the HMDA name conflicts with the profile that carries this LEI, so -- exactly as
      // the native HMDA tables do -- no profile link and no borrowed identifier is attached.
      publicationState: hold ? 'identity_hold' : 'unpublished_research_identity', profilePath: null,
      sourceReference: 'lib/ask-lender/generated/gleif.json; lib/ask-lender/generated/mappings.csv.json',
    });
  }

  const fingerprint = createHash('sha256').update(JSON.stringify(institutions.map((i) => [i.institutionKey, i.names.map((n) => n.value)]))).digest('hex');
  cached = {
    institutions,
    sourceVersion: { profiles: sourceRef || 'published profile search indexes', hmdaIdentity: `gleif:${hmda.gleifCount}; curated-mappings:${hmda.mappingCount}`, fingerprint },
    counts: { publishedProfiles, hmdaOnly, identityHold },
  };
  return cached;
}

export function resetCandidateCatalogForTests(): void { cached = null; }
