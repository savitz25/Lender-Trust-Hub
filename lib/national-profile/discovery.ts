/**
 * LEND-NAT-016 + FL-LEND-011 — bounded discovery over published profiles only.
 * National index: 181-row JSON. Florida: 130-row publication-manifest projection.
 * No CFPB/HMDA/state-profile table scans.
 */

import searchFile from '@/docs/lend-nat-016-search-index.json';
import floridaSearchFile from '@/docs/fl-lend-011-florida-search-index.json';
import { nationalProfilePath } from './cohort';

export const DISCOVERY_SEARCHABLE_COUNT = 181;
export const DISCOVERY_INDEXABLE_COUNT = 180;
export const FLORIDA_SEARCHABLE_COUNT = 130;
export const COMBINED_SEARCHABLE_COUNT = 311;

export type DiscoveryEvidence = {
  hmda: boolean;
  cfpb: boolean;
  enforcement: boolean;
  servicer: boolean;
};

export type DiscoveryRecord = {
  institution_id: string;
  slug: string;
  canonical_name: string;
  display_name: string | null;
  presentation_name: string;
  stable_key: string;
  historical_names: string[];
  nmls: string | null;
  fdic: string | null;
  ncua: string | null;
  lei: string | null;
  hq_city: string | null;
  hq_state: string | null;
  depository: string;
  browse_types: string[];
  servicer_role: string;
  evidence: DiscoveryEvidence;
  indexable: boolean;
  publication_source?: 'national' | 'florida_phase1' | 'florida_phase2';
  florida_classes?: string[];
};

type SearchFile = {
  cohort_version: string;
  count: number;
  indexable_count: number;
  hold_count: number;
  rows: DiscoveryRecord[];
};

const INDEX = searchFile as SearchFile;

export const DISCOVERY_RECORDS: DiscoveryRecord[] = INDEX.rows;
export const DISCOVERY_COHORT_VERSION = INDEX.cohort_version;

type FloridaSearchFile = { contract: string; count: number; fingerprint: string; rows: DiscoveryRecord[] };
const FLORIDA_INDEX = floridaSearchFile as FloridaSearchFile;
export const FLORIDA_DISCOVERY_RECORDS: DiscoveryRecord[] = FLORIDA_INDEX.rows;
export const FLORIDA_SEARCH_FINGERPRINT = FLORIDA_INDEX.fingerprint;
export const SEARCH_POOL: DiscoveryRecord[] = [...DISCOVERY_RECORDS, ...FLORIDA_DISCOVERY_RECORDS];

export const BROWSE_TYPES = [
  { id: 'bank', label: 'Banks', meaning: 'FDIC-insured depository institutions in this research set.' },
  { id: 'credit_union', label: 'Credit unions', meaning: 'NCUA-classified credit unions in this research set.' },
  { id: 'nonbank', label: 'Nonbank mortgage companies', meaning: 'Non-depository lenders in this research set.' },
  {
    id: 'servicer',
    label: 'Mortgage servicers',
    meaning: 'Institutions with confirmed or historical servicer-role evidence. Not established is not a filter.',
  },
] as const;

export type BrowseTypeId = (typeof BROWSE_TYPES)[number]['id'];

const LOCALITY_RE = /\s[\(\u2014\u2013\-]| team\b/i;

export function hasCatalogLocalityArtifact(name: string | null | undefined): boolean {
  return Boolean(name && LOCALITY_RE.test(name));
}

/** Presentation-only. Does not mutate identity. */
export function nationalPresentationName(canonical: string | null | undefined, display: string | null | undefined): string {
  const can = (canonical || '').trim();
  const disp = (display || '').trim();
  if (disp && hasCatalogLocalityArtifact(disp) && can && !hasCatalogLocalityArtifact(can)) {
    return can;
  }
  return disp || can;
}

export function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function digitsOnly(raw: string): string {
  return (raw || '').replace(/\D/g, '');
}

export type IdentifierKind = 'nmls' | 'fdic' | 'ncua' | 'lei';

export type ParsedDiscoveryQuery = {
  raw: string;
  name: string;
  normalized: string;
  identifierKind: IdentifierKind | null;
  identifierValue: string | null;
};

const ID_PREFIX: Array<{ re: RegExp; kind: IdentifierKind }> = [
  { re: /^(?:nmls(?:\s+institution(?:\s+id)?)?|nmls-inst)\s*[:#]?\s*/i, kind: 'nmls' },
  { re: /^(?:fdic(?:\s+cert(?:ificate)?)?|cert)\s*[:#]?\s*/i, kind: 'fdic' },
  { re: /^(?:ncua(?:\s+charter)?|charter)\s*[:#]?\s*/i, kind: 'ncua' },
  { re: /^(?:lei)\s*[:#]?\s*/i, kind: 'lei' },
];

export function parseDiscoveryQuery(raw: string): ParsedDiscoveryQuery {
  const trimmed = (raw || '').trim();
  let rest = trimmed;
  let identifierKind: IdentifierKind | null = null;
  for (const p of ID_PREFIX) {
    if (p.re.test(rest)) {
      identifierKind = p.kind;
      rest = rest.replace(p.re, '').trim();
      break;
    }
  }
  const compact = rest.replace(/\s+/g, '');
  let identifierValue: string | null = null;
  if (identifierKind === 'lei' || (!identifierKind && /^[A-Za-z0-9]{20}$/.test(compact))) {
    identifierKind = 'lei';
    identifierValue = compact.toUpperCase();
  } else if (identifierKind === 'nmls' || identifierKind === 'fdic' || identifierKind === 'ncua') {
    identifierValue = digitsOnly(rest);
  } else if (!identifierKind && /^\d{3,12}$/.test(compact)) {
    identifierValue = compact;
  }
  return {
    raw: trimmed,
    name: rest,
    normalized: normalizeName(rest || trimmed),
    identifierKind,
    identifierValue: identifierValue || null,
  };
}

export type DiscoveryHit = {
  record: DiscoveryRecord;
  href: string;
  rank: number;
  match: 'identifier' | 'canonical_exact' | 'historical_exact' | 'prefix' | 'partial';
  matchedIdentifier?: IdentifierKind;
};

function identifierHit(record: DiscoveryRecord, kind: IdentifierKind, value: string): boolean {
  if (kind === 'nmls') return record.nmls === value;
  if (kind === 'fdic') return record.fdic === value;
  if (kind === 'ncua') return record.ncua === value;
  if (kind === 'lei') return (record.lei || '') === value;
  return false;
}

export function searchDiscovery(rawQuery: string, type?: string | null): DiscoveryHit[] {
  const parsed = parseDiscoveryQuery(rawQuery);
  const typeId = type && BROWSE_TYPES.some((t) => t.id === type) ? type : null;
  const pool = typeId ? SEARCH_POOL.filter((r) => r.browse_types.includes(typeId)) : SEARCH_POOL;

  const hits: DiscoveryHit[] = [];
  const seen = new Set<string>();
  const push = (record: DiscoveryRecord, rank: number, match: DiscoveryHit['match'], matchedIdentifier?: IdentifierKind) => {
    if (seen.has(record.institution_id)) return;
    seen.add(record.institution_id);
    hits.push({
      record,
      href: nationalProfilePath(record.slug),
      rank,
      match,
      matchedIdentifier,
    });
  };

  if (parsed.identifierValue) {
    if (parsed.identifierKind) {
      for (const record of pool) {
        if (identifierHit(record, parsed.identifierKind, parsed.identifierValue)) {
          push(record, 0, 'identifier', parsed.identifierKind);
        }
      }
    } else {
      const kinds: IdentifierKind[] = ['nmls', 'fdic', 'ncua'];
      for (const kind of kinds) {
        for (const record of pool) {
          if (identifierHit(record, kind, parsed.identifierValue)) {
            push(record, 0, 'identifier', kind);
          }
        }
      }
    }
  }

  const q = parsed.normalized;
  if (q && parsed.identifierKind == null) {
    for (const record of pool) {
      const canon = normalizeName(record.canonical_name);
      const pres = normalizeName(record.presentation_name);
      const hist = record.historical_names.map(normalizeName);
      if (canon === q || pres === q) push(record, 1, 'canonical_exact');
      else if (hist.includes(q)) push(record, 2, 'historical_exact');
      else if (canon.startsWith(q) || pres.startsWith(q) || hist.some((h) => h.startsWith(q))) {
        push(record, 4, 'prefix');
      } else if (q.length >= 3 && (canon.includes(q) || pres.includes(q) || hist.some((h) => h.includes(q)))) {
        push(record, 6, 'partial');
      }
    }
  }

  hits.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.record.presentation_name.localeCompare(b.record.presentation_name, 'en');
  });
  return hits;
}

export function browseDiscovery(type: string): DiscoveryHit[] {
  const typeId = BROWSE_TYPES.some((t) => t.id === type) ? type : null;
  if (!typeId) return [];
  return SEARCH_POOL.filter((r) => r.browse_types.includes(typeId))
    .sort((a, b) => a.presentation_name.localeCompare(b.presentation_name, 'en'))
    .map((record) => ({
      record,
      href: nationalProfilePath(record.slug),
      rank: 8,
      match: 'partial' as const,
    }));
}

export function browseCounts(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of BROWSE_TYPES) {
    out[t.id] = SEARCH_POOL.filter((r) => r.browse_types.includes(t.id)).length;
  }
  return out;
}

export function typeLabel(record: DiscoveryRecord): string {
  if (record.publication_source === 'florida_phase1' || record.publication_source === 'florida_phase2') {
    return 'Florida OFR-licensed company';
  }
  if (record.depository === 'FDIC') return 'FDIC-insured bank';
  if (record.depository === 'NCUA') return 'Credit union';
  if (record.browse_types.includes('servicer') && record.depository === 'NONBANK') {
    return record.servicer_role === 'HISTORICAL' ? 'Nonbank · historical servicer evidence' : 'Nonbank · servicer evidence';
  }
  if (record.depository === 'NONBANK') return 'Nonbank mortgage company';
  return 'Institution';
}
