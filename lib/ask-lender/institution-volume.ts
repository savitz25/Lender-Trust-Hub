import { createHash } from 'node:crypto';
import stateRows from './generated/state.csv.json';
import countyRows from './generated/county.csv.json';
import { STATE_NAMES } from '@/lib/home-intel/states';
import type { LenderResearchQuery } from './types';

// Bounded committed artifacts. Tests replace these loaders in memory, never in Production.
export const volumeSources = { state: (): unknown => stateRows, county: (): unknown => countyRows };
type Raw = Record<string, unknown>;
export type VolumeRow = { lei: string; metric: number; applications: number | null; originations: number | null; denials: number | null };
export type VolumeEvidence = {
  availability: 'AVAILABLE' | 'UNSUPPORTED' | 'UNAVAILABLE' | 'NEEDS_CLARIFICATION';
  scope: string; action: string; loanType: string | null; purpose: string[];
  field: string | null; sourceFile: string | null; sourceFingerprint: string | null;
  sourceGrain: string | null; outputGrain: string; reportingYear: string | null;
  retrievedAt: null; generatedAt: null; coverage: string[];
  completeWithinSource: boolean; eligibleInstitutions: number | null; positiveReporters: number | null;
  observedSum: number | null; calculation: string; conditions: string[];
};
class SourceError extends Error {}
function numeric(value: unknown): number | null {
  const n = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  return typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 ? n : null;
}
function add(a: number, b: number): number {
  const n = a + b;
  if (!Number.isSafeInteger(n)) throw new SourceError('The selected source counts exceed the supported integer range.');
  return n;
}
function secondary(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null;
  return Number.isSafeInteger(a + b) ? a + b : null;
}

export function selectInstitutionVolume(query: LenderResearchQuery): { evidence: VolumeEvidence; rows: VolumeRow[]; message: string } {
  const geo = query.geography;
  const scope = geo?.countyFips ?? geo?.state ?? 'US';
  const action = query.actionTaken?.[0] ?? 'origination', loan = query.loanType?.[0];
  const e: VolumeEvidence = {
    availability: 'UNAVAILABLE', scope, action, loanType: loan ?? null, purpose: query.loanPurpose ?? [],
    field: null, sourceFile: null, sourceFingerprint: null, sourceGrain: null,
    outputGrain: `institution LEI by ${geo?.grain ?? 'unresolved'} property geography`, reportingYear: null,
    retrievedAt: null, generatedAt: null, coverage: [], completeWithinSource: false,
    eligibleInstitutions: null, positiveReporters: null, observedSum: null, calculation: '', conditions: [...(query.scopeIssues ?? [])],
  };
  const stop = (availability: VolumeEvidence['availability'], message: string) => {
    e.availability = availability; e.calculation = `Capability decision: ${message} No ordering or cohort total was executed.`;
    return { evidence: e, rows: [], message };
  };
  try {
    if (e.conditions.length) return stop('NEEDS_CLARIFICATION', e.conditions.join(' '));
    if (!geo || !['state', 'county', 'national'].includes(geo.grain) || (geo.grain === 'state' && !STATE_NAMES[scope]) || (geo.grain === 'county' && (!geo.countyFips || geo.state !== 'FL')) || (geo.grain === 'national' && geo.state)) return stop('NEEDS_CLARIFICATION', 'Select one supported property-geography state or Florida county. No national scope was substituted.');
    if ((query.actionTaken?.length ?? 1) !== 1 || !['application', 'origination', 'denial'].includes(action) || (query.loanType?.length ?? 0) > 1) return stop('NEEDS_CLARIFICATION', 'Select one action and one loan type for this institution table.');
    if (query.loanPurpose?.length || query.lenderType?.length || (query.requestedMetric && !['most', 'count'].includes(query.requestedMetric))) return stop('UNSUPPORTED', 'This institution file does not provide the requested purpose, lender-class, or derived-measure breakdown. No broader table was substituted.');
    const county = geo.grain === 'county' || (geo.state === 'FL' && (action === 'denial' || (loan && action === 'application')));
    e.sourceFile = `lib/ask-lender/generated/${county ? 'county' : 'state'}.csv.json`;
    e.sourceGrain = county ? 'county-LEI-year' : 'state-LEI-year';
    const source = county ? volumeSources.county() : volumeSources.state();
    if (!Array.isArray(source) || !source.length || source.length > 100000) throw new SourceError('The required institution source artifact is missing, empty, or incompatible.');
    e.sourceFingerprint = createHash('sha256').update(JSON.stringify(source)).digest('hex');
    const raw: Raw[] = source.map(v => {
      if (!v || typeof v !== 'object' || Array.isArray(v)) throw new SourceError('The institution source contains an invalid row.');
      return v as Raw;
    });
    // These committed generators produce one release, partitioned by state/county and LEI.
    // Do not infer row geography/year from the request or coerce missing metadata to FL/2025.
    const years = new Set<string>(), coverage = new Set<string>();
    const keys = new Set<string>();
    for (const r of raw) {
      if (typeof r.year !== 'string' || !/^\d{4}$/.test(r.year) || typeof r.state !== 'string' || !STATE_NAMES[r.state] || typeof r.lei !== 'string' || !/^[A-Z0-9]{20}$/.test(r.lei)) throw new SourceError('Source observation year, state, or LEI is missing or incompatible.');
      if (county ? typeof r.county_fips !== 'string' || !/^\d{5}$/.test(r.county_fips) || (r.state === 'FL' && !r.county_fips.startsWith('12')) : r.county_fips != null) throw new SourceError('Source grains overlap or county observation keys are incompatible.');
      const key = JSON.stringify([r.year, r.state, county ? r.county_fips : null, r.lei]);
      if (keys.has(key)) throw new SourceError('Duplicate institution observation keys prevent a complete ordering.');
      keys.add(key); years.add(r.year); coverage.add(r.state);
    }
    if (years.size !== 1) throw new SourceError('The institution artifact contains mixed reporting vintages.');
    e.reportingYear = [...years][0]; e.coverage = [...coverage].sort();
    if (query.reportingYears?.length && (query.reportingYears.length !== 1 || query.reportingYears[0] !== e.reportingYear)) return stop('UNSUPPORTED', `Requested year ${query.reportingYears.join(', ')} is unavailable in this ${e.reportingYear} institution file. No different vintage was substituted.`);
    const selected = raw.filter(r => county ? r.state === 'FL' && (geo.grain !== 'county' || r.county_fips === geo.countyFips) : geo.grain === 'national' || r.state === geo.state);
    if (!selected.length) return stop('UNAVAILABLE', 'The requested geography has no acquired institution rows in this source. This does not establish zero activity.');
    const productFields: Record<string, string> = { conventional: 'conventional', FHA: 'fha', VA: 'va', USDA: 'usda_other', other: 'other_loan_type' };
    if (loan && !productFields[loan]) return stop('UNSUPPORTED', 'The requested loan-type field is not supported.');
    // process_hmda[_national].py maps loan_type=4 alone to *_usda_other;
    // unknown codes go to *_other_loan_type, not to this field.
    if ((action === 'denial' && (!county || loan)) || (action === 'application' && loan && !county)) {
      return stop('UNSUPPORTED', `The current ${STATE_NAMES[geo.state ?? ''] ?? 'acquired'} institution-level file does not contain ${loan ? loan + ' ' : ''}${action === 'denial' ? 'denial' : 'application'} counts at this grain, so we cannot order lenders by that measure. This is not a finding of zero ${action === 'denial' ? 'denials' : 'applications'}.`);
    }
    e.field = loan ? `${action === 'application' ? 'apps' : 'orig'}_${productFields[loan]}` : action === 'denial' ? 'denials' : `${county ? '' : 'total_'}${action === 'application' ? 'applications' : 'originations'}`;
    // Validate the selected measure for EVERY required row before filtering positives or summing.
    if (selected.some(r => numeric(r[e.field!]) === null)) throw new SourceError('Some required institution values for the selected measure are missing, suppressed, or invalid. A complete ordering and cohort total cannot be established.');
    const byLei = new Map<string, VolumeRow>();
    for (const r of selected) {
      const row: VolumeRow = { lei: r.lei as string, metric: numeric(r[e.field])!, applications: numeric(r[county ? 'applications' : 'total_applications']), originations: numeric(r[county ? 'originations' : 'total_originations']), denials: county ? numeric(r.denials) : null };
      const previous = byLei.get(row.lei);
      if (!previous) byLei.set(row.lei, row);
      else {
        previous.metric = add(previous.metric, row.metric);
        previous.applications = secondary(previous.applications, row.applications);
        previous.originations = secondary(previous.originations, row.originations);
        previous.denials = secondary(previous.denials, row.denials);
      }
    }
    const rows = [...byLei.values()].filter(r => r.metric > 0).sort((a,b) => b.metric - a.metric || a.lei.localeCompare(b.lei));
    e.observedSum = [...byLei.values()].reduce((sum, r) => add(sum, r.metric), 0);
    e.eligibleInstitutions = byLei.size; e.positiveReporters = rows.length; e.completeWithinSource = true; e.availability = 'AVAILABLE';
    e.calculation = `Select ${e.sourceFile}; ${e.reportingYear}; ${scope}; field ${e.field}. Validate every selected observation, group disjoint ${e.sourceGrain} keys by LEI, sum within the acquired cohort, retain positive values, order descending (LEI tie-break). Totals precede pagination. No county and state rows are combined.`;
    return { evidence: e, rows, message: rows.length ? 'Ordered by reported raw counts within the acquired institution cohort. Most is volume, not a recommendation.' : 'The complete acquired cohort has no positive observations for this measure. Valid source zeroes were retained; this does not mean the jurisdiction has no lenders.' };
  } catch (error) {
    return stop('UNAVAILABLE', error instanceof SourceError ? error.message : 'The institution source could not be loaded or validated. Retry this request; no zero or fallback table was substituted.');
  }
}
