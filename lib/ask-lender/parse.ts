import { ACTION_TERMS, DEPOSITORY_TERMS, FL_ASK_COUNTIES, LOAN_TYPE_TERMS, PURPOSE_TERMS } from './ontology';
import { ASK_GEO_NOTE, type LenderResearchQuery } from './types';

const FAIL: Array<{ re: RegExp; kind: string; reason: string }> = [
  {
    re: /\bdenial reasons?\b|\bwhy (?:was|were|they|lenders?) den|\bdti\b|\bdebt-to-income\b/,
    kind: 'denial-reason',
    reason:
      'Denial-reason taxonomy (DTI, credit, collateral) is not stored on current HMDA observation rows. Denial counts are not reasons.',
  },
  {
    re: /\bservice (?:area|territory)\b|\bwhere (?:do|does) they (?:lend|operate|serve)\b|\blicensed to lend\b/,
    kind: 'service-territory',
    reason:
      'HMDA geography is mortgage-property location, not a lender service territory or license footprint. Those families are not interchangeable.',
  },
  {
    re: /\bheadquartered\b|\bbased in\b|\blocated in\b|\bflorida lenders\b|\blenders in florida\b/,
    kind: 'lender-location',
    reason:
      'This Ask layer does not rank lenders by headquarters, branch location, or “Florida lenders.” Property-geography questions must say originated/applied for properties in that place.',
  },
  { re: /\bbest\b|\btop lender|\brecommended\b/, kind: 'ranking', reason: 'LenderTrustHub does not rank “best” lenders. Most is a volume count, not a recommendation.' },
  { re: /\bsafest\b|\bmost trustworthy\b|\btrust score\b/, kind: 'safety', reason: 'There is no safety or Trust Score ranking on this hub.' },
  { re: /\bdiscriminat/, kind: 'discrimination', reason: 'Denial counts are not a finding of discrimination.' },
  { re: /\bwrongdoing\b|\bviolat|\bfraud\b|\bscam\b|\billegal\b/, kind: 'wrongdoing', reason: 'A complaint or HMDA outcome is not a finding of wrongdoing.' },
  { re: /\bjunk fee|\bgouging|\bripoff\b/, kind: 'pricing-rhetoric', reason: 'Inflammatory fee labels are not used. Reported origination charges are not in this query layer.' },
  {
    re: /\b(?:current|today|lowest|live).{0,24}(?:rate|apr)s?\b|\b(?:rate|apr)s?.{0,24}(?:today|current|now)\b|\bbest mortgage rate\b|\binterest rates?\b|\brate spread\b|\bpoints and fees\b/,
    kind: 'live-rate',
    reason: 'HMDA is a 2025 reporting vintage, not today’s advertised rate sheet. Historical HMDA is not a live mortgage-rate feed.',
  },
  { re: /\bnear me\b|\bnearby\b|\bclosest\b/, kind: 'proximity', reason: 'HMDA geography is property/census location, not branch proximity.' },
  {
    re: /\bhighest denial rate\b|\bdenial rates?\b/,
    kind: 'denial-rate',
    reason: 'Comparable lender-level denial rates are not shipped without a controlled denominator methodology.',
  },
];

function includesAny(q: string, terms: string[]): boolean {
  return terms.some((t) => q.includes(t));
}

function detectCounties(q: string): Array<{ name: string; fips: string }> {
  const found: Array<{ name: string; fips: string }> = [];
  const seen = new Set<string>();
  for (const [term, meta] of Object.entries(FL_ASK_COUNTIES)) {
    if (q.includes(term) && !seen.has(meta.fips)) {
      seen.add(meta.fips);
      found.push(meta);
    }
  }
  return found;
}

function wantsEntity(q: string, metric: LenderResearchQuery['requestedMetric']): boolean {
  if (/\bwhich lenders?\b|\bwhich institutions?\b|\bwho originated\b|\bwho received\b/.test(q)) return true;
  if (/\blenders?\b/.test(q) && metric === 'most') return true;
  if (/\bhmda reporting institutions\b|\bleis?\b/.test(q) && metric === 'most') return true;
  return false;
}

export function parseLenderAsk(raw: string): LenderResearchQuery {
  const q = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!q) {
    return { mode: 'fail_closed', failClosedKind: 'empty', failReason: 'Enter a research question.' };
  }

  // "lenders in Florida" / "Florida lenders" is a location fail unless the question is clearly HMDA volume.
  const locationOnly = FAIL.find((row) => row.kind === 'lender-location');
  const hmdaVolume =
    /\boriginat|\bapplication|\bapplied|\bmortgages for\b|\bproperties in\b|\bproperty geography\b|\bhmda\b/.test(q);
  for (const row of FAIL) {
    if (row.kind === 'lender-location' && hmdaVolume) continue;
    if (row.re.test(q)) {
      return { mode: 'fail_closed', failClosedKind: row.kind, failReason: row.reason, requestedMetric: null };
    }
  }
  if (locationOnly && locationOnly.re.test(q) && !hmdaVolume) {
    return {
      mode: 'fail_closed',
      failClosedKind: 'lender-location',
      failReason: locationOnly.reason,
      requestedMetric: null,
    };
  }

  const florida = /\bflorida\b|\bfl\b/.test(q);
  const counties = detectCounties(q);
  const hasBroward = counties.some((c) => c.fips === '12011');
  const hasPalm = counties.some((c) => c.fips === '12099');

  let loanType: string[] | undefined;
  for (const [term, value] of Object.entries(LOAN_TYPE_TERMS)) {
    const hit = term.length <= 3 ? new RegExp(`\\b${term}\\b`).test(q) : q.includes(term);
    if (hit) loanType = [value];
  }
  let loanPurpose: string[] | undefined;
  for (const [term, value] of Object.entries(PURPOSE_TERMS)) {
    if (q.includes(term)) loanPurpose = [value];
  }
  let lenderType: string[] | undefined;
  for (const [term, value] of Object.entries(DEPOSITORY_TERMS)) {
    if (new RegExp(`\\b${term}\\b`).test(q)) lenderType = [value];
  }

  let metric: LenderResearchQuery['requestedMetric'] = includesAny(q, ['most', 'highest volume', 'originated the most', 'received the most'])
    ? 'most'
    : 'count';
  if (q.includes('share') || q.includes('percent')) metric = 'share';

  const wantsOrig = Object.keys(ACTION_TERMS).some((t) => ACTION_TERMS[t] === 'origination' && q.includes(t));
  const wantsDenial = /\bdenial|\bdenied/.test(q);
  const wantsApps = /\bapplication|\breceived the most/.test(q) && !wantsOrig;
  const action: string[] = wantsOrig ? ['origination'] : wantsDenial ? ['denial'] : wantsApps ? ['application'] : ['origination'];

  if (q.includes('what does') || q.includes('what is an nmls') || q.includes('what does originated') || q.includes('mean in hmda')) {
    return { mode: 'definition', requestedMetric: null };
  }

  // Purchase/refi originations are NULL at LEI grain.
  if (loanPurpose?.length && (wantsOrig || wantsEntity(q, metric) || metric === 'most')) {
    return {
      mode: 'fail_closed',
      failClosedKind: 'loan-purpose-origination',
      failReason:
        'Purchase and refinance originations are not populated on 2025 LEI-grain HMDA summaries. County-market purchase_count is application purpose, not an origination ranking. No reconstructed product ranking.',
      geography: counties[0]
        ? { grain: 'county', state: 'FL', county: counties[0].name, countyFips: counties[0].fips, note: ASK_GEO_NOTE }
        : florida
          ? { grain: 'state', state: 'FL', note: ASK_GEO_NOTE }
          : { grain: 'national', note: ASK_GEO_NOTE },
      loanPurpose,
      loanType,
      requestedMetric: metric,
    };
  }

  const entity = wantsEntity(q, metric);

  if (q.includes('complaint')) {
    if (entity || metric === 'most') {
      return {
        mode: 'entity',
        evidenceFamilies: ['cfpb'],
        requestedMetric: 'most',
        sort: { field: 'attached_complaints', direction: 'desc' },
      };
    }
    return {
      mode: 'evidence',
      evidenceFamilies: ['cfpb'],
      requestedMetric: 'count',
    };
  }

  if ((hasBroward || hasPalm || counties.length >= 2) && (q.includes('compare') || counties.length >= 2) && !entity) {
    const a = counties[0] ?? { name: 'Broward', fips: '12011' };
    const b = counties[1] ?? (hasPalm && hasBroward ? { name: 'Palm Beach', fips: '12099' } : counties[0]);
    return {
      mode: 'comparison',
      geography: {
        grain: 'county',
        state: 'FL',
        county: a.name,
        countyFips: a.fips,
        compareCounty: b?.name,
        compareCountyFips: b?.fips,
        note: ASK_GEO_NOTE,
      },
      actionTaken: action,
      loanType,
      loanPurpose,
      requestedMetric: 'count',
    };
  }

  if (entity) {
    const geo =
      counties[0] != null
        ? {
            grain: 'county' as const,
            state: 'FL',
            county: counties[0].name,
            countyFips: counties[0].fips,
            note: ASK_GEO_NOTE,
          }
        : florida
          ? { grain: 'state' as const, state: 'FL', note: ASK_GEO_NOTE }
          : { grain: 'national' as const, note: ASK_GEO_NOTE };
    return {
      mode: 'entity',
      geography: geo,
      actionTaken: action,
      loanType,
      lenderType,
      requestedMetric: 'most',
      sort: { field: action[0] ?? 'origination', direction: 'desc' },
    };
  }

  if (q.includes('compare') && florida) {
    return {
      mode: 'comparison',
      geography: { grain: 'state', state: 'FL', note: ASK_GEO_NOTE },
      requestedMetric: 'count',
      actionTaken: action,
    };
  }

  if (counties[0]) {
    return {
      mode: 'count',
      geography: {
        grain: 'county',
        state: 'FL',
        county: counties[0].name,
        countyFips: counties[0].fips,
        note: ASK_GEO_NOTE,
      },
      actionTaken: action,
      loanType,
      loanPurpose,
      requestedMetric: 'count',
    };
  }

  if (florida || q.includes('application') || wantsOrig || wantsDenial || q.includes('how many') || q.includes('research universe')) {
    return {
      mode: loanType ? 'aggregate' : 'count',
      geography: florida ? { grain: 'state', state: 'FL', note: ASK_GEO_NOTE } : { grain: 'national', note: ASK_GEO_NOTE },
      actionTaken: action,
      loanType,
      requestedMetric: 'count',
    };
  }

  return {
    mode: 'fail_closed',
    failClosedKind: 'unsupported',
    failReason: 'That question is not a supported deterministic Ask query. Try a count, Florida or county property geography, an origination ranking, complaint coverage, or a definition.',
  };
}

export type AskUrlOverrides = {
  action?: string | null;
  loanType?: string | null;
  geo?: string | null;
};

export function applyAskOverrides(query: LenderResearchQuery, overrides: AskUrlOverrides): LenderResearchQuery {
  if (query.mode === 'fail_closed') return query;
  const next: LenderResearchQuery = { ...query, geography: query.geography ? { ...query.geography } : undefined };
  if (overrides.action === 'application' || overrides.action === 'origination' || overrides.action === 'denial') {
    next.actionTaken = [overrides.action];
    if (next.sort) next.sort = { field: overrides.action, direction: 'desc' };
  }
  if (overrides.loanType === 'conventional' || overrides.loanType === 'FHA' || overrides.loanType === 'VA' || overrides.loanType === 'USDA') {
    next.loanType = [overrides.loanType];
  }
  if (overrides.loanType === 'all') {
    next.loanType = undefined;
  }
  if (overrides.geo === 'FL') {
    next.geography = { grain: 'state', state: 'FL', note: ASK_GEO_NOTE };
  }
  if (overrides.geo === 'broward') {
    next.geography = { grain: 'county', state: 'FL', county: 'Broward', countyFips: '12011', note: ASK_GEO_NOTE };
  }
  if (overrides.geo === 'palm-beach') {
    next.geography = { grain: 'county', state: 'FL', county: 'Palm Beach', countyFips: '12099', note: ASK_GEO_NOTE };
  }
  if (overrides.geo && next.mode === 'count' && (overrides.geo === 'broward' || overrides.geo === 'palm-beach' || overrides.geo === 'FL')) {
    if (query.mode === 'entity' || next.requestedMetric === 'most') next.mode = 'entity';
  }
  return next;
}
