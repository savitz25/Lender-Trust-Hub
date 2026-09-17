import { createHash } from 'node:crypto';
import snapshot from '@/lib/home-intel/accepted-snapshot.json';
import { ILLINOIS_SNAPSHOT } from '@/lib/illinois-intelligence/snapshot';
import { OREGON_SNAPSHOT } from '@/lib/oregon-intelligence/snapshot';
import stateRows from './generated/state.csv.json';
import countyRows from './generated/county.csv.json';
import markets from './generated/markets.csv.json';
import { STATE_NAMES } from '@/lib/home-intel/states';
import { interpretationLines } from './execute';
import { NJ_RMLA_COVERAGE_NOTE } from './parse';
import { ASK_GEO_NOTE, LENDER_ASK_CONTRACT, type AskExecution, type LenderResearchQuery } from './types';

export type PublishedStateHmda = {
  contract: string;
  applications: number;
  originations: number;
  denials: number;
  fingerprint: string;
  generatedAt: string | null;
  retrievedAt: string | null;
  sourceFile: string;
  sourceGrain: string;
};

function illinoisPublishedHmda(): PublishedStateHmda {
  return {
    contract: ILLINOIS_SNAPSHOT.contract_name,
    applications: ILLINOIS_SNAPSHOT.hmda.applications,
    originations: ILLINOIS_SNAPSHOT.hmda.originations,
    denials: ILLINOIS_SNAPSHOT.hmda.denials,
    fingerprint: ILLINOIS_SNAPSHOT.fingerprint,
    generatedAt: ILLINOIS_SNAPSHOT.generated_at,
    retrievedAt: ILLINOIS_SNAPSHOT.hmda.retrieved_at,
    sourceFile: 'lib/illinois-intelligence/accepted-snapshot.json',
    sourceGrain: 'county_market_summary county totals for Illinois property geography',
  };
}

function oregonPublishedHmda(): PublishedStateHmda {
  return {
    contract: OREGON_SNAPSHOT.contract_name,
    applications: OREGON_SNAPSHOT.hmda.applications,
    originations: OREGON_SNAPSHOT.hmda.originations,
    denials: OREGON_SNAPSHOT.hmda.denials,
    fingerprint: OREGON_SNAPSHOT.fingerprint,
    generatedAt: OREGON_SNAPSHOT.generated_at,
    retrievedAt: OREGON_SNAPSHOT.hmda.retrieved_at,
    sourceFile: 'lib/oregon-intelligence/accepted-snapshot.json',
    sourceGrain: 'county_market_summary county totals for Oregon property geography',
  };
}

// Static, bounded source seam. Tests replace it in memory; no I/O or production writes.
export const countSources = {
  snapshot: (): unknown => snapshot,
  state: (): unknown => stateRows,
  county: (): unknown => countyRows,
  markets: (): unknown => markets,
  publishedStateHmda: (state: string): PublishedStateHmda | null =>
    state === 'IL' ? illinoisPublishedHmda() : state === 'OR' ? oregonPublishedHmda() : null,
};
class CountSourceError extends Error {}
type RecordRow = Record<string, unknown>;
function object(v: unknown): RecordRow { if (!v || typeof v !== 'object' || Array.isArray(v)) throw new CountSourceError('Required source metadata is unavailable.'); return v as RecordRow; }
function rows(v: unknown): RecordRow[] { if (!Array.isArray(v) || !v.length) throw new CountSourceError('Required source rows are unavailable.'); return v.map(object); }
function count(v: unknown, strings = false): number {
  const n = strings && typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isSafeInteger(n) || n < 0) throw new CountSourceError('The requested measure is missing or invalid in the source.');
  return n;
}
function fingerprint(v: unknown): string { return createHash('sha256').update(JSON.stringify(v)).digest('hex'); }

export function executeScalarCount(query: LenderResearchQuery): AskExecution {
  const geo = query.geography;
  const scope = geo?.countyFips ?? geo?.state ?? 'US';
  const name = geo?.county ? `${geo.county} County, ${STATE_NAMES[geo.state ?? ''] ?? geo.state}` : STATE_NAMES[scope] ?? (scope === 'US' ? 'United States' : scope);
  const action = query.actionTaken?.[0] ?? 'origination';
  const loan = query.loanType?.[0], purpose = query.loanPurpose?.[0];
  const label = `${name} ${[loan, purpose, action + 's'].filter(Boolean).join(' ')}`;
  const evidence: NonNullable<AskExecution['countEvidence']> = {
    availability: 'UNAVAILABLE', value: null, scope, action, field: null, sourceFile: null, sourceFingerprint: null,
    sourceGrain: null, outputGrain: geo?.grain ?? 'national', reportingYear: null, retrievedAt: null, generatedAt: null,
    calculation: '', conditions: [...(query.scopeIssues ?? [])],
  };
  const finish = (message: string): AskExecution => {
    const available = evidence.availability === 'AVAILABLE';
    const period = evidence.reportingYear ? `HMDA ${evidence.reportingYear} reporting vintage` : 'Reporting vintage unavailable';
    const calculation = evidence.calculation || message;
    return {
      query, interpretation: [...interpretationLines(query).map(line => line.label === 'Entity grain' ? { label: 'Counted observations', value: `${action}s, not institutions. Source grain: ${evidence.sourceGrain ?? 'not selected'}; output: ${evidence.outputGrain} property geography.` } : line), { label: 'Reporting year', value: query.reportingYears?.join(', ') || evidence.reportingYear || 'unavailable' }], geographyWarning: ASK_GEO_NOTE,
      headline: available ? `${label} - ${period}` : `Count ${evidence.availability === 'NEEDS_CLARIFICATION' ? 'needs clarification' : 'unavailable'}: ${label}`,
      body: message, countEvidence: evidence, failClosed: !available,
      terminalState: evidence.availability === 'AVAILABLE' ? 'FOUND' : evidence.availability,
      facts: available ? [{ label, value: evidence.value!.toLocaleString('en-US') }] : [],
      grain: `${evidence.sourceGrain ?? 'No source selected'}; output: ${evidence.outputGrain} property geography`, period,
      caveats: [
        'These are mortgage observations, not numbers of institutions, lender headquarters, licensing, or service territory.',
        ...(query.coverageState === 'REQUEST_ONLY' && geo?.state === 'NJ' ? [NJ_RMLA_COVERAGE_NOTE] : []),
        ...evidence.conditions,
      ],
      trace: { contract: LENDER_ASK_CONTRACT, sourceFiles: evidence.sourceFile ? [evidence.sourceFile] : [], method: calculation,
        indexes: [`Scope ${scope}; action ${action}; field ${evidence.field ?? 'unavailable'}; availability ${evidence.availability}`],
        identityPolicy: 'Market totals are independent of profile publication and result pagination.', publicationGate: 'No institution publication changes.',
        cache: 'Committed bounded source artifacts; no live regulator lookup.', grain: `${evidence.sourceGrain ?? 'unavailable'} -> ${evidence.outputGrain}`, period },
    };
  };
  const unsupported = (message: string, clarification = false) => { evidence.availability = clarification ? 'NEEDS_CLARIFICATION' : 'UNSUPPORTED'; evidence.conditions.push(message); return finish(message); };
  try {
    if (evidence.conditions.length) return unsupported(evidence.conditions.join(' '), true);
    if (!geo || !['state', 'national', 'county'].includes(geo.grain) || (geo.grain === 'state' && !STATE_NAMES[scope]) || (geo.grain === 'county' && !geo.countyFips)) return unsupported('Select one supported property-geography state or county.', true);
    if (query.actionTaken?.length !== 1 || !['application', 'origination', 'denial'].includes(action)) return unsupported('Select one HMDA action for this count.', true);
    if ((query.loanType?.length ?? 0) > 1 || (query.loanPurpose?.length ?? 0) > 1 || query.lenderType?.length) return unsupported('The requested combined product or lender-class dimension is not available for this scalar count.');
    const accepted = object(countSources.snapshot());
    if (accepted.snapshotVersion !== 'lender-home-intel-snapshot-v2' || accepted.hmdaGrain !== 'county' || typeof accepted.hmdaOfficialAsOf !== 'string' || !/^\d{4}$/.test(accepted.hmdaOfficialAsOf) || accepted.hmdaSourceVintage !== `HMDA ${accepted.hmdaOfficialAsOf} reporting vintage` || typeof accepted.fingerprint !== 'string' || !accepted.fingerprint) throw new CountSourceError('Required aggregate source metadata is incompatible.');
    evidence.reportingYear = accepted.hmdaOfficialAsOf;
    if (query.reportingYears?.length && (query.reportingYears.length !== 1 || query.reportingYears[0] !== evidence.reportingYear)) return unsupported(`Requested reporting year ${query.reportingYears.join(', ')} is not available. This source supports ${evidence.reportingYear}; no other year was substituted.`);
    let value: number;
    if (!loan && !purpose && geo.grain !== 'county') {
      const published = geo.grain === 'state' ? countSources.publishedStateHmda(scope) : null;
      if (published) {
        evidence.sourceFile = published.sourceFile;
        evidence.sourceFingerprint = published.fingerprint;
        evidence.sourceGrain = published.sourceGrain;
        evidence.retrievedAt = published.retrievedAt;
        evidence.generatedAt = published.generatedAt;
        evidence.field = `${action}s`;
        value = count(published[evidence.field as 'applications' | 'originations' | 'denials']);
        evidence.calculation = `Select ${published.contract} hmda.${evidence.field} for ${name} property geography. Same measure as the published specialist state page. Not the home-intel material LEI-county cell rollup.`;
      } else {
      evidence.sourceFile = 'lib/home-intel/accepted-snapshot.json'; evidence.sourceFingerprint = fingerprint(accepted);
      evidence.sourceGrain = 'county observations aggregated by jurisdiction';
      evidence.retrievedAt = typeof accepted.retrievedAt === 'string' ? accepted.retrievedAt : null;
      evidence.generatedAt = typeof accepted.generated_at === 'string' ? accepted.generated_at : null;
      const all = rows(accepted.geography), seen = new Set<string>();
      for (const row of all) {
        if (typeof row.state !== 'string' || !STATE_NAMES[row.state] || seen.has(row.state) || 'county' in row || 'countyFips' in row || 'county_fips' in row || ('year' in row && String(row.year) !== evidence.reportingYear)) throw new CountSourceError('Aggregate jurisdiction keys or grain are invalid or duplicated.');
        seen.add(row.state);
      }
      const selected = geo.grain === 'state' ? all.find(row => row.state === scope) : accepted;
      if (!selected) throw new CountSourceError('The requested jurisdiction is absent from the accepted aggregate.');
      evidence.field = `${action}s`;
      value = count(selected[evidence.field]);
      evidence.calculation = geo.grain === 'state' ? `Select the unique geography[state=${scope}].${evidence.field}. Accepted county observations already aggregated to ${name}; no additional summation.` : `Select the separate national ${evidence.field} aggregate. Do not add jurisdiction subtotals to it.`;
      }
    } else {
      if (loan && !['conventional','FHA','VA','USDA','other'].includes(loan)) return unsupported('This loan-type dimension is unavailable.');
      if (purpose && (!['purchase','refinance'].includes(purpose) || action !== 'application' || loan)) return unsupported('Only uncombined purchase/refinance application-purpose counts are available; purpose originations and combined splits are not supplied.');
      if (loan && action === 'denial') return unsupported('Loan-type denial counts are not supplied. The unfiltered denial total is not an answer to this request.');
      const county = geo.grain === 'county';
      const useMarkets = county || Boolean(purpose);
      const useCounty = !useMarkets && action === 'application';
      if ((useMarkets || useCounty) && geo.state !== 'FL') return unsupported('This requested dimension is available only in the acquired Florida county catalog. No Florida or national total was substituted.');
      const source = useMarkets ? countSources.markets() : useCounty ? countSources.county() : countSources.state();
      evidence.sourceFile = `lib/ask-lender/generated/${useMarkets ? 'markets' : useCounty ? 'county' : 'state'}.csv.json`;
      evidence.sourceFingerprint = fingerprint(source);
      evidence.sourceGrain = useMarkets ? 'county market' : useCounty ? 'county LEI' : 'state LEI';
      // Catalogs carry reporting year only: do not borrow the snapshot retrieval clock.
      const suffix = loan ? ({conventional:'conventional',FHA:'fha',VA:'va',USDA:'usda_other',other:'other_loan_type'} as Record<string,string>)[loan] : '';
      evidence.field = purpose ? `${purpose}_count` : loan ? `${action === 'origination' ? 'orig' : 'apps'}_${suffix}` : action === 'denial' ? 'denial_count' : `total_${action}s`;
      const all = rows(source);
      const selected = all.filter(row => (geo.grain === 'national' || row.state === geo.state) && (!county || row.county_fips === geo.countyFips));
      if (!selected.length) throw new CountSourceError('No source rows cover the requested geography and dimension.');
      const seen = new Set<string>(); value = 0;
      for (const row of selected) {
        if (String(row.year) !== evidence.reportingYear || typeof row.state !== 'string' || !STATE_NAMES[row.state]) throw new CountSourceError('Selected rows have an incompatible reporting year or jurisdiction.');
        const parts = useMarkets ? [row.state,row.county_fips] : useCounty ? [row.state,row.county_fips,row.lei] : [row.state,row.lei];
        if (parts.some(v => typeof v !== 'string' || !v)) throw new CountSourceError('Selected source aggregation keys are missing.');
        const key = parts.join('|'); if (seen.has(key)) throw new CountSourceError('Selected source aggregation keys are duplicated.'); seen.add(key);
        value += count(row[evidence.field], true); count(value);
      }
      evidence.calculation = `Sum ${evidence.field} across ${selected.length} unique ${evidence.sourceGrain} rows for ${scope}, reporting year ${evidence.reportingYear}. No publication or pagination filter; no other source grain added.`;
    }
    evidence.value = value; evidence.availability = 'AVAILABLE';
    if (evidence.sourceFile === 'lib/illinois-intelligence/accepted-snapshot.json') {
      evidence.conditions.push('Same HMDA 2025 Illinois-property measure as /illinois. Material LEI-county cells are a smaller subset and are not this answer.');
    }
    if (evidence.sourceFile === 'lib/oregon-intelligence/accepted-snapshot.json') {
      evidence.conditions.push('Same HMDA 2025 Oregon-property measure as /oregon. Material LEI-county cells are a smaller subset and are not this answer.');
    }
    return finish(`Reported ${action}s for mortgage properties in ${name}. The source grain is ${evidence.sourceGrain}; the displayed total uses ${evidence.outputGrain} scope. Not lenders headquartered here and not a service-territory or licensing map. This is historical activity, not an approval rate or recommendation.`);
  } catch (error) {
    evidence.value = null; evidence.availability = 'UNAVAILABLE';
    return finish(error instanceof CountSourceError ? error.message : 'The requested source could not be checked. Retry later; no count was substituted.');
  }
}
