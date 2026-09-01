import { executeAskQuery } from '@/lib/ask-lender/execute-query';
import { ASK_GEO_NOTE, type AskAction, type AskLoanType, type LenderResearchQuery } from '@/lib/ask-lender/types';
import {
  SPECIALIST_CONTRACT,
  SPECIALIST_CONTRACT_FINGERPRINT,
  SPECIALIST_CONTRACT_VERSION,
  SPECIALIST_SCHEMA_FINGERPRINT,
  type SpecialistResultState,
} from './contract';

type GeographyIntent = 'PROPERTY_MARKET' | 'HEADQUARTERS' | 'BRANCH_LOCATION' | 'SERVICE_TERRITORY';
type SpecialistRequest = {
  contract?: string;
  query?: string;
  queryType?: 'market_cohort' | 'aggregate' | 'comparison' | 'identifier' | 'identity' | 'evidence';
  entityClass?: 'hmda_reporting_institution';
  geography?: { intent?: GeographyIntent; stateCode?: string; stateName?: string; county?: string; countyFips?: string };
  action?: AskAction;
  loanType?: AskLoanType;
  loanPurpose?: 'purchase' | 'refinance';
  requestedMetric?: 'count' | 'share' | 'rate' | 'median';
  identifier?: { type?: 'NMLS' | 'LEI'; value?: string };
  identityName?: string;
  requestedEvidence?: string[];
  page?: number;
  limit?: number;
};

const STATES: Record<string, string> = {
  alabama:'AL',alaska:'AK',arizona:'AZ',arkansas:'AR',california:'CA',colorado:'CO',connecticut:'CT',delaware:'DE',florida:'FL',georgia:'GA',hawaii:'HI',idaho:'ID',illinois:'IL',indiana:'IN',iowa:'IA',kansas:'KS',kentucky:'KY',louisiana:'LA',maine:'ME',maryland:'MD',massachusetts:'MA',michigan:'MI',minnesota:'MN',mississippi:'MS',missouri:'MO',montana:'MT',nebraska:'NE',nevada:'NV','new hampshire':'NH','new jersey':'NJ','new mexico':'NM','new york':'NY','north carolina':'NC','north dakota':'ND',ohio:'OH',oklahoma:'OK',oregon:'OR',pennsylvania:'PA','rhode island':'RI','south carolina':'SC','south dakota':'SD',tennessee:'TN',texas:'TX',utah:'UT',vermont:'VT',virginia:'VA',washington:'WA','west virginia':'WV',wisconsin:'WI',wyoming:'WY',
};
const STATE_NAMES = Object.fromEntries(Object.entries(STATES).map(([name, code]) => [code, name.replace(/\b\w/g, (c) => c.toUpperCase())]));
const COUNTY = {
  broward: { county: 'Broward', countyFips: '12011', stateCode: 'FL' },
  'palm beach': { county: 'Palm Beach', countyFips: '12099', stateCode: 'FL' },
} as const;

function base(state: SpecialistResultState, status: number, interpretation: Record<string, unknown>, message: string) {
  return {
    status,
    body: {
      contract: SPECIALIST_CONTRACT,
      contractVersion: SPECIALIST_CONTRACT_VERSION,
      schemaFingerprint: SPECIALIST_SCHEMA_FINGERPRINT,
      contractFingerprint: SPECIALIST_CONTRACT_FINGERPRINT,
      queryInterpretation: interpretation,
      appliedFilters: {},
      resultState: state,
      rows: [],
      total: 0,
      pagination: null,
      availableRefinements: [],
      provenance: { sourceFamily: 'HMDA', sourceDataset: 'HMDA 2025 committed lender market catalogs', reportingPeriod: '2025', queryGrain: null, geographyMeaning: null, publicationSemantics: 'Research rows do not create public profiles.' },
      limitations: [message],
      destinations: [],
      diagnostics: { executionEngine: 'lender-ask-v1', dbWrites: 0 },
    },
  };
}

function stateFromText(q: string): { code?: string; name?: string } {
  for (const [name, code] of Object.entries(STATES).sort((a, b) => b[0].length - a[0].length)) {
    if (new RegExp(`\\b${name.replace(' ', '\\s+')}\\b`, 'i').test(q)) return { code, name: STATE_NAMES[code] };
  }
  const match = q.match(/\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/i);
  return match ? { code: match[1]!.toUpperCase(), name: STATE_NAMES[match[1]!.toUpperCase()] } : {};
}

function naturalRequest(query: string): SpecialistRequest {
  const q = query.trim();
  const lower = q.toLowerCase();
  const state = stateFromText(q);
  const county = Object.entries(COUNTY).find(([name]) => lower.includes(name))?.[1];
  const loanType: AskLoanType | undefined = /\bfha\b/i.test(q) ? 'FHA' : /\bva\b/i.test(q) ? 'VA' : /\busda\b/i.test(q) ? 'USDA' : /\bconventional\b/i.test(q) ? 'conventional' : /\bother loan/i.test(q) ? 'other' : undefined;
  const action: AskAction = /\bdenial|denied\b/i.test(q) ? 'denial' : /\bapplication|applied\b/i.test(q) ? 'application' : 'origination';
  const identifier = q.match(/\b(NMLS|LEI)\s*[:#]?\s*([A-Z0-9]+)\b/i);
  return {
    query: q,
    queryType: identifier ? 'identifier' : /complaints?\s+about/i.test(q) ? 'evidence' : 'market_cohort',
    entityClass: 'hmda_reporting_institution',
    identifier: identifier ? { type: identifier[1]!.toUpperCase() as 'NMLS' | 'LEI', value: identifier[2] } : undefined,
    identityName: /complaints?\s+about/i.test(q) ? q.replace(/^.*?complaints?\s+about\s+/i, '') : undefined,
    geography: county
      ? { intent: 'PROPERTY_MARKET', ...county }
      : state.code
        ? { intent: /headquarter|based in/i.test(q) ? 'HEADQUARTERS' : /branch/i.test(q) ? 'BRANCH_LOCATION' : /serv|available|licensed|near me/i.test(q) ? 'SERVICE_TERRITORY' : 'PROPERTY_MARKET', stateCode: state.code, stateName: state.name }
        : /serv|available|near me/i.test(q)
          ? { intent: 'SERVICE_TERRITORY' }
          : undefined,
    action,
    loanType,
    loanPurpose: /purchase/i.test(q) ? 'purchase' : /refinan/i.test(q) ? 'refinance' : undefined,
    requestedMetric: /\brate|share|median/i.test(q) ? (lower.includes('share') ? 'share' : lower.includes('median') ? 'median' : 'rate') : 'count',
  };
}

function validate(input: SpecialistRequest): string | null {
  if (input.contract && input.contract !== SPECIALIST_CONTRACT) return 'Unsupported contract.';
  if (input.entityClass && input.entityClass !== 'hmda_reporting_institution') return 'Only HMDA reporting institutions are supported.';
  if (input.page != null && (!Number.isInteger(input.page) || input.page < 1)) return 'page must be a positive integer.';
  if (input.limit != null && (!Number.isInteger(input.limit) || input.limit < 1)) return 'limit must be a positive integer.';
  if (input.geography?.stateCode && !STATE_NAMES[input.geography.stateCode.toUpperCase()]) return 'stateCode must be a U.S. postal code.';
  return null;
}

export function executeSpecialistV2(raw: SpecialistRequest | string) {
  const input = typeof raw === 'string'
    ? naturalRequest(raw)
    : raw.query && !raw.geography && !raw.identifier && !raw.identityName
      ? { ...naturalRequest(raw.query), page: raw.page, limit: raw.limit, contract: raw.contract }
      : raw;
  const invalid = validate(input);
  const interpretation = { queryType: input.queryType, entityClass: input.entityClass, geography: input.geography, action: input.action, loanType: input.loanType, loanPurpose: input.loanPurpose, requestedMetric: input.requestedMetric, identifier: input.identifier, identityName: input.identityName };
  if (invalid) return base('INVALID_QUERY', 400, interpretation, invalid);
  if (input.identifier) return base('UNSUPPORTED_CAPABILITY', 422, interpretation, `Exact ${input.identifier.type} was understood but identity execution is deferred to LEND-CAP-002. No fuzzy or cohort fallback was used.`);
  if (input.queryType === 'evidence' && input.identityName) return base('UNSUPPORTED_CAPABILITY', 422, interpretation, 'The named lender was understood, but identity-bound CFPB complaint execution is deferred to LEND-CAP-002. General complaint coverage is not attached to this lender.');
  if (input.loanPurpose) return base('UNSUPPORTED_CAPABILITY', 422, interpretation, 'Purchase/refinance splits are not supported at the requested LEI grain and were not reconstructed.');
  if (input.requestedMetric && input.requestedMetric !== 'count') return base('UNSUPPORTED_CAPABILITY', 422, interpretation, `${input.requestedMetric} requires a compatible numerator and denominator and was not fabricated from raw counts.`);
  if (input.geography?.intent === 'BRANCH_LOCATION') return base('PUBLICATION_RESTRICTED', 422, interpretation, 'Branch cohorts are not public in this contract. Branch is not institution and was not inferred from HMDA property geography.');
  if (input.geography?.intent && input.geography.intent !== 'PROPERTY_MARKET') return base('UNSUPPORTED_CAPABILITY', 422, interpretation, `HMDA property geography cannot prove ${input.geography.intent.toLowerCase().replace('_', ' ')}.`);
  if (/\b(best|top|recommended|safest|cheapest|lowest rate)\b/i.test(input.query ?? '')) return base('UNSUPPORTED_CAPABILITY', 422, interpretation, 'LenderTrustHub does not rank lender quality. Raw HMDA activity is not a recommendation.');
  if (/\b(mlo|loan officers?|mortgage brokers?|people|persons?)\b/i.test(input.query ?? '')) return base('PUBLICATION_RESTRICTED', 422, interpretation, 'Mass MLO/person execution is not public. No person rows or routes were exposed.');
  const geo = input.geography;
  if (!geo?.stateCode && !geo?.countyFips) return base('CLARIFICATION_REQUIRED', 422, interpretation, 'Choose HMDA property-market activity for a supported state/county, headquarters, branch location, service territory, or a specific identifier. Only the property-market option is supported in LEND-CAP-001.');
  const generic = /^\s*lenders?\s+in\s+/i.test(input.query ?? '') && !input.loanType && !/application|originat|denial|hmda|property/i.test(input.query ?? '');
  if (generic) return base('CLARIFICATION_REQUIRED', 422, interpretation, '“Lenders in” is ambiguous. Choose property-market HMDA activity, headquarters, branches, service territory, or a specific lender/identifier.');
  const action = input.action ?? 'origination';
  if (geo.stateCode && geo.stateCode !== 'FL' && action === 'denial') return base('UNSUPPORTED_CAPABILITY', 422, interpretation, 'State-grain denial columns are not present in the accepted catalog; no denial count was fabricated.');
  if (geo.stateCode && geo.stateCode !== 'FL' && input.loanType && action === 'application') return base('UNSUPPORTED_CAPABILITY', 422, interpretation, 'State-grain loan-type application columns are not present in the accepted catalog; no split was fabricated.');
  const structuredQuery: LenderResearchQuery = {
    mode: 'entity',
    geography: geo.countyFips
      ? { grain: 'county', state: geo.stateCode ?? 'FL', county: geo.county, countyFips: geo.countyFips, note: ASK_GEO_NOTE }
      : { grain: 'state', state: geo.stateCode!.toUpperCase(), note: ASK_GEO_NOTE },
    actionTaken: [action],
    loanType: input.loanType ? [input.loanType] : undefined,
    requestedMetric: 'most',
    sort: { field: action, direction: 'desc' },
  };
  try {
    const result = executeAskQuery({ q: input.query ?? 'structured HMDA property-market query', page: input.page ?? 1, pageSize: Math.min(input.limit ?? 25, 50), structuredQuery });
    const rows = (result.rows ?? []).map((row) => ({
      displayName: row.displayName,
      lei: row.lei,
      nmls: row.nmls ?? null,
      action,
      loanType: input.loanType ?? null,
      metricValue: row.metric,
      metricLabel: row.metricLabel,
      applications: row.applications,
      originations: row.originations,
      denials: row.denials,
      propertyGeography: geo.county ? { grain: 'county', stateCode: geo.stateCode, county: geo.county, countyFips: geo.countyFips } : { grain: 'state', stateCode: geo.stateCode },
      identityStatus: row.identityStatus,
      identityLimitation: row.identityNote,
      whyThisResultAppears: row.whyMatched,
      destination: row.href ? { type: 'PUBLIC_LENDER_PROFILE', url: row.href } : null,
      sourcePeriod: result.period,
    }));
    const total = result.totalRows ?? 0;
    const resultState: SpecialistResultState = total > 0 ? 'SUPPORTED_RESULTS' : 'ZERO_MATCHING_ROWS';
    return {
      status: 200,
      body: {
        contract: SPECIALIST_CONTRACT,
        contractVersion: SPECIALIST_CONTRACT_VERSION,
        schemaFingerprint: SPECIALIST_SCHEMA_FINGERPRINT,
        contractFingerprint: SPECIALIST_CONTRACT_FINGERPRINT,
        queryInterpretation: { ...interpretation, geographyIntent: 'PROPERTY_MARKET', geographyMeaning: 'Property/census geography associated with the reported HMDA application; not institution headquarters, branch location or service territory.', rowGrain: `HMDA reporting institution LEI × ${geo.countyFips ? 'county' : 'state'} property geography × ${action} × ${input.loanType ?? 'all loan types'} × 2025 vintage` },
        appliedFilters: { geography: geo, action, loanType: input.loanType ?? null },
        resultState,
        rows,
        total,
        pagination: { page: result.page ?? 1, limit: result.pageSize ?? 25, pageCount: result.pageCount ?? 1, outOfRangeNormalized: (input.page ?? 1) !== (result.page ?? 1) },
        availableRefinements: [
          { field: 'action', values: ['application', 'origination', 'denial'] },
          { field: 'loanType', values: ['conventional', 'FHA', 'VA', 'USDA', 'other'] },
          { field: 'geography', values: ['supported state', 'supported Florida county'] },
        ],
        provenance: { sourceFamily: 'HMDA', sourceDataset: result.trace?.sourceFiles ?? [], reportingPeriod: result.period, queryGrain: result.grain, method: result.trace?.method, identityPolicy: result.trace?.identityPolicy, publicationSemantics: result.trace?.publicationGate, cache: result.trace?.cache },
        limitations: [...(result.caveats ?? [ASK_GEO_NOTE]), 'Raw HMDA activity volume is not a recommendation, quality measure, or proof of current product availability.'],
        destinations: rows.map((row) => row.destination).filter(Boolean),
        diagnostics: { executionEngine: 'lender-ask-v1', elapsedMs: result.elapsedMs, orderingField: result.rows?.[0]?.metricLabel ?? null, orderingDirection: 'descending', orderingMeaning: 'Raw reported HMDA activity volume, not recommendation.', dbWrites: 0 },
      },
    };
  } catch {
    return base('BACKEND_UNAVAILABLE', 503, interpretation, 'The committed lender market catalog could not be executed. No fallback rows were returned.');
  }
}

export type { SpecialistRequest };
