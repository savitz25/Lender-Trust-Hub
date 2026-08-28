import { PROFILE_METRIC_DICTIONARY } from '@/lib/identity/profile-metrics';
import type { CoverageCard } from '@/lib/identity/profile-intelligence';

const USPS: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DC: 'District of Columbia', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  PR: 'Puerto Rico', GU: 'Guam', VI: 'U.S. Virgin Islands',
};

export function formatInt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return 'Not available';
  return n.toLocaleString('en-US');
}

export function formatRate(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return 'Not available';
  return `${(n * 100).toFixed(1)}%`;
}

export function stateName(code: string | null | undefined): string {
  if (!code) return '';
  return USPS[code.toUpperCase()] || code;
}

export function metricDef(key: string) {
  return PROFILE_METRIC_DICTIONARY.find((m) => m.metric_key === key);
}

export function identifierLabel(type: string): string {
  switch (type) {
    case 'NMLS_INSTITUTION':
      return 'NMLS Institution ID';
    case 'NMLS_BRANCH':
      return 'NMLS Branch ID';
    case 'NMLS_PERSON':
      return 'NMLS Person ID';
    case 'LEI':
      return 'LEI';
    case 'FDIC_CERT':
      return 'FDIC Certificate';
    case 'NCUA_CHARTER':
      return 'NCUA Charter';
    case 'RSSD':
      return 'Federal Reserve RSSD';
    default:
      return type.replace(/_/g, ' ');
  }
}

export function nameKindLabel(kind: string): string {
  switch (kind) {
    case 'legal':
      return 'Legal name';
    case 'display':
      return 'Display name';
    case 'dba':
      return 'Trade name / DBA';
    case 'historical':
      return 'Historical name';
    case 'brand':
      return 'Brand name';
    case 'alternate':
      return 'Alternate name';
    default:
      return kind;
  }
}

export function familyLabel(family: string): string {
  switch (family) {
    case 'NONBANK_MORTGAGE_COMPANY':
      return 'Nonbank mortgage company';
    case 'DEPOSITORY_BANK':
      return 'FDIC-insured bank';
    case 'CREDIT_UNION':
      return 'Credit union';
    case 'MORTGAGE_SERVICER':
      return 'Mortgage servicer';
    case 'INDEPENDENT_MORTGAGE_BANK':
      return 'Independent mortgage bank';
    default:
      return family.replace(/_/g, ' ').toLowerCase();
  }
}

export function primaryClassification(
  rows: { family: string; authoritative: boolean }[]
): string | null {
  const prefer = [
    'MORTGAGE_SERVICER',
    'CREDIT_UNION',
    'DEPOSITORY_BANK',
    'NONBANK_MORTGAGE_COMPANY',
    'INDEPENDENT_MORTGAGE_BANK',
  ];
  const auth = rows.filter((r) => r.authoritative && r.family !== 'UNKNOWN');
  for (const fam of prefer) {
    if (auth.some((r) => r.family === fam) || rows.some((r) => r.family === fam)) {
      return familyLabel(fam);
    }
  }
  return null;
}

export type CoverageCopy = { label: string; meaning: string };

export function coverageCopy(card: CoverageCard): Record<string, CoverageCopy> {
  return {
    identity: {
      label: card.identity === 'COMPLETE' ? 'Complete' : 'Partial',
      meaning:
        card.identity === 'COMPLETE'
          ? 'Official identifiers are attached to this institution.'
          : 'Some expected identifiers are missing. Partial means the evidence layer is incomplete.',
    },
    hmda: {
      label: card.hmda === 'AVAILABLE' ? 'Available' : 'Not available',
      meaning:
        card.hmda === 'AVAILABLE'
          ? 'HMDA 2025 reporting vintage activity is attached.'
          : 'No HMDA observations are attached to this institution in the current evidence layer.',
    },
    cfpb: {
      label:
        card.cfpb === 'AVAILABLE'
          ? 'Available'
          : card.cfpb === 'PARTIAL'
            ? 'Partial'
            : card.cfpb === 'UNRESOLVED'
              ? 'Unresolved nearby labels'
              : 'None observed',
      meaning:
        card.cfpb === 'AVAILABLE'
          ? 'Confirmed CFPB complaint attribution is attached.'
          : card.cfpb === 'PARTIAL'
            ? 'Some complaints are attributed; related source labels remain unresolved. Partial means the evidence layer is incomplete.'
            : card.cfpb === 'UNRESOLVED'
              ? 'A related CFPB company label could not be deterministically attached and is not counted here.'
              : 'No confirmed CFPB complaints are attached in connected sources. This is not proof that no complaints exist.',
    },
    enforcement: {
      label: card.enforcement === 'AVAILABLE' ? 'Available' : 'None observed',
      meaning:
        card.enforcement === 'AVAILABLE'
          ? 'Confirmed attributable federal enforcement events are attached.'
          : 'No attributable enforcement events were observed in the currently connected sources. This is not proof that no history exists.',
    },
    servicer_role: {
      label:
        card.servicer_role === 'CONFIRMED'
          ? 'Confirmed mortgage servicer'
          : card.servicer_role === 'HISTORICAL'
            ? 'Historical mortgage servicer'
            : 'Not established',
      meaning: 'Servicer status comes only from official role evidence, not from names or complaint volume.',
    },
    nmls: {
      label:
        card.nmls === 'AVAILABLE'
          ? 'Available'
          : card.nmls === 'HUMAN_GATED'
            ? 'Human-gated'
            : 'Not found',
      meaning:
        card.nmls === 'AVAILABLE'
          ? 'An NMLS Institution ID is attached.'
          : card.nmls === 'HUMAN_GATED'
            ? 'Company NMLS was not ingested (NMLS Consumer Access is official and human-gated).'
            : 'No NMLS Institution ID is attached in this evidence layer.',
    },
    depository: {
      label:
        card.depository === 'FDIC'
          ? 'FDIC-insured bank'
          : card.depository === 'NCUA'
            ? 'Credit union (NCUA)'
            : card.depository === 'NONBANK'
              ? 'Nonbank'
              : 'Unknown',
      meaning: 'Depository type is taken from official FDIC/NCUA identifiers when present.',
    },
  };
}

export function topEntries(
  dist: Record<string, number> | undefined,
  limit = 8
): { label: string; count: number }[] {
  if (!dist) return [];
  return Object.entries(dist)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
