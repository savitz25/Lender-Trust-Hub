import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv } from '@/lib/hmda/parse-csv';
import { DISCOVERY_RECORDS, nationalPresentationName, normalizeName } from '@/lib/national-profile/discovery';
import { nationalProfilePath } from '@/lib/national-profile/cohort';
import { isNationalRenderSlug } from '@/lib/national-profile/publication';
import type { AskIdentityStatus } from './types';

export type LeiIdentity = {
  lei: string;
  hmdaName: string | null;
  nmls: string | null;
  mappingMethod: string | null;
  publicSlug: string | null;
  publicName: string | null;
  institutionId: string | null;
  identityStatus: AskIdentityStatus;
  identityNote: string;
};

type MappingRow = {
  lei: string;
  name: string;
  nmls: string;
  method: string;
};

const STOP = new Set([
  'llc',
  'inc',
  'incorporated',
  'corporation',
  'corp',
  'company',
  'co',
  'the',
  'of',
  'national',
  'association',
  'bank',
  'mortgage',
  'services',
  'service',
  'group',
  'na',
  'fsb',
  'and',
]);

let cached: {
  byLei: Map<string, LeiIdentity>;
  mappingCount: number;
  gleifCount: number;
  publicLeiCount: number;
  conflictCount: number;
} | null = null;

function tokens(name: string): Set<string> {
  return new Set(
    normalizeName(name)
      .split(' ')
      .filter((t) => t.length > 2 && !STOP.has(t)),
  );
}

export function namesCompatible(hmdaName: string | null, profileName: string, historical: string[] = []): boolean {
  if (!hmdaName) return true;
  const a = normalizeName(hmdaName);
  const b = normalizeName(profileName);
  if (!a || !b) return true;
  if (a === b) return true;
  if (historical.some((h) => normalizeName(h) === a)) return true;
  const A = tokens(hmdaName);
  const B = tokens(profileName);
  if (A.size === 0 || B.size === 0) return a.includes(b) || b.includes(a);
  const inter = [...A].filter((x) => B.has(x));
  const denom = Math.min(A.size, B.size);
  return denom > 0 && inter.length / denom >= 0.5;
}

function loadGleif(): Record<string, string> {
  const path = join(process.cwd(), 'data', 'hmda', 'florida', '_gleif_name_cache.json');
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, string>;
}

function loadMappings(): MappingRow[] {
  const path = join(process.cwd(), 'data', 'hmda', 'florida', 'lei_to_nmls_mapping.csv');
  if (!existsSync(path)) return [];
  return parseCsv(readFileSync(path, 'utf8')).map((r) => ({
    lei: (r.lei || '').trim(),
    name: (r.institution_name_hmda || r.legal_name || r.institution_name || '').trim(),
    nmls: (r.nmls_id || '').trim(),
    method: (r.match_method || '').trim(),
  }));
}

export function loadLeiIdentityIndex(): {
  byLei: Map<string, LeiIdentity>;
  mappingCount: number;
  gleifCount: number;
  publicLeiCount: number;
  conflictCount: number;
} {
  if (cached) return cached;
  const gleif = loadGleif();
  const mappings = loadMappings();
  const mapByLei = new Map(mappings.filter((m) => m.lei).map((m) => [m.lei, m]));
  const publicByLei = new Map(
    DISCOVERY_RECORDS.filter((r) => r.lei).map((r) => [r.lei as string, r]),
  );

  const byLei = new Map<string, LeiIdentity>();
  const allLeis = new Set<string>([...mapByLei.keys(), ...publicByLei.keys(), ...Object.keys(gleif)]);
  let conflictCount = 0;

  for (const lei of allLeis) {
    const mapping = mapByLei.get(lei);
    const profile = publicByLei.get(lei);
    const hmdaName = mapping?.name || gleif[lei] || null;
    const publicName = profile
      ? nationalPresentationName(profile.canonical_name, profile.display_name) || profile.canonical_name
      : null;
    const renderOk = Boolean(profile && isNationalRenderSlug(profile.slug));
    let identityStatus: AskIdentityStatus = hmdaName ? 'unpublished_research_identity' : 'lei_only';
    let identityNote = hmdaName
      ? 'HMDA reporting institution. Not a public LenderTrustHub research profile.'
      : 'HMDA reporting LEI without a resolved legal name in the committed identity files.';
    let publicSlug: string | null = null;

    if (profile && renderOk) {
      if (namesCompatible(hmdaName, publicName || profile.canonical_name, profile.historical_names)) {
        identityStatus = 'public_profile';
        publicSlug = profile.slug;
        identityNote = 'Confirmed LEI match to a published national research profile. Publication is a gate, not a quality score.';
      } else {
        identityStatus = 'identity_hold';
        identityNote =
          'This HMDA LEI also appears on a published profile, but the HMDA/mapping name conflicts with that profile name. No public-profile link is attached.';
        conflictCount += 1;
      }
    }

    byLei.set(lei, {
      lei,
      hmdaName,
      nmls: mapping?.nmls || profile?.nmls || null,
      mappingMethod: mapping?.method || null,
      publicSlug,
      publicName: publicSlug ? publicName : null,
      institutionId: publicSlug ? profile?.institution_id ?? null : null,
      identityStatus,
      identityNote,
    });
  }

  cached = {
    byLei,
    mappingCount: mappings.length,
    gleifCount: Object.keys(gleif).length,
    publicLeiCount: publicByLei.size,
    conflictCount,
  };
  return cached;
}

export function resolveLeiIdentity(lei: string): LeiIdentity {
  const idx = loadLeiIdentityIndex();
  const hit = idx.byLei.get(lei);
  if (hit) return hit;
  return {
    lei,
    hmdaName: null,
    nmls: null,
    mappingMethod: null,
    publicSlug: null,
    publicName: null,
    institutionId: null,
    identityStatus: 'lei_only',
    identityNote: 'HMDA reporting LEI without a resolved legal name in the committed identity files.',
  };
}

export function displayNameForLei(lei: string): string {
  const id = resolveLeiIdentity(lei);
  if (id.identityStatus === 'public_profile' && id.publicName) return id.publicName;
  if (id.hmdaName) return id.hmdaName;
  return `HMDA reporting institution ${lei.slice(0, 8)}…`;
}

export function profileHref(slug: string | null): string | undefined {
  return slug ? nationalProfilePath(slug) : undefined;
}

export function identityStats() {
  return loadLeiIdentityIndex();
}
