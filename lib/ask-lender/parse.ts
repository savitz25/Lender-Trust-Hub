import { ACTION_TERMS, DEPOSITORY_TERMS, LOAN_TYPE_TERMS, PURPOSE_TERMS } from './ontology';
import type { LenderResearchQuery } from './types';

const FAIL: Array<{ re: RegExp; kind: string; reason: string }> = [
  { re: /\bbest\b|\btop lender|\brecommended\b/, kind: 'ranking', reason: 'LenderTrustHub does not rank “best” lenders. Most is a volume count, not a recommendation.' },
  { re: /\bsafest\b|\bmost trustworthy\b|\btrust score\b/, kind: 'safety', reason: 'There is no safety or Trust Score ranking on this hub.' },
  { re: /\bdiscriminat/, kind: 'discrimination', reason: 'Denial counts are not a finding of discrimination.' },
  { re: /\bjunk fee|\bgouging|\bripoff\b/, kind: 'pricing-rhetoric', reason: 'Inflammatory fee labels are not used. Reported origination charges are not in the homepage snapshot.' },
  { re: /\b(current|today).{0,20}(rate|apr)\b|\bbest mortgage rate\b/, kind: 'live-rate', reason: 'HMDA is a reporting vintage, not today’s advertised rate sheet.' },
  { re: /\bnear me\b|\bnearby\b|\bclosest\b/, kind: 'proximity', reason: 'HMDA geography is property/census location, not branch proximity.' },
  { re: /\bhighest denial rate\b|\bdenial rates?\b/, kind: 'denial-rate', reason: 'Comparable lender-level denial rates are not shipped without a controlled denominator methodology.' },
];

function includesAny(q: string, terms: string[]): boolean {
  return terms.some((t) => q.includes(t));
}

export function parseLenderAsk(raw: string): LenderResearchQuery {
  const q = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!q) {
    return { mode: 'fail_closed', failClosedKind: 'empty', failReason: 'Enter a research question.' };
  }
  for (const row of FAIL) {
    if (row.re.test(q)) {
      return { mode: 'fail_closed', failClosedKind: row.kind, failReason: row.reason, requestedMetric: null };
    }
  }

  const geoNote =
    'HMDA geography is the property/census location tied to the application — not lender headquarters, branch location, or service territory.';
  const florida = /\bflorida\b|\bfl\b/.test(q);
  const broward = /\bbroward\b/;
  const palm = /\bpalm beach\b/;
  const hasBroward = broward.test(q);
  const hasPalm = palm.test(q);

  let loanType: string[] | undefined;
  for (const [term, value] of Object.entries(LOAN_TYPE_TERMS)) {
    if (q.includes(term)) loanType = [value];
  }
  let loanPurpose: string[] | undefined;
  for (const [term, value] of Object.entries(PURPOSE_TERMS)) {
    if (q.includes(term)) loanPurpose = [value];
  }
  let lenderType: string[] | undefined;
  for (const [term, value] of Object.entries(DEPOSITORY_TERMS)) {
    if (new RegExp(`\\b${term}\\b`).test(q)) lenderType = [value];
  }

  let metric: LenderResearchQuery['requestedMetric'] = includesAny(q, ['most', 'highest volume', 'originated the most'])
    ? 'most'
    : 'count';
  if (q.includes('share') || q.includes('percent')) metric = 'share';

  if (q.includes('what does') || q.includes('what is an nmls') || q.includes('what does originated') || q.includes('mean in hmda')) {
    return { mode: 'definition', requestedMetric: null };
  }

  if ((hasBroward || hasPalm) && (q.includes('compare') || (hasBroward && hasPalm))) {
    return {
      mode: 'fail_closed',
      failClosedKind: 'county-snapshot',
      failReason:
        'Broward and Palm Beach property-geography counts are not in the national homepage snapshot. County HMDA lives on Florida research pages, not as a homepage ranking.',
      geography: { grain: 'county', state: 'FL', county: hasBroward && hasPalm ? 'Broward and Palm Beach' : hasBroward ? 'Broward' : 'Palm Beach', note: geoNote },
      requestedMetric: metric,
    };
  }

  if (hasBroward || hasPalm) {
    return {
      mode: 'fail_closed',
      failClosedKind: 'county-snapshot',
      failReason:
        'County property-geography questions are not executed from the national homepage snapshot. We did not treat this as lenders located in that county.',
      geography: { grain: 'property', state: 'FL', county: hasBroward ? 'Broward' : 'Palm Beach', note: geoNote },
      requestedMetric: metric,
    };
  }

  if (loanType || loanPurpose || q.includes('loan type') || q.includes('loan types')) {
    return {
      mode: 'fail_closed',
      failClosedKind: 'product-split',
      failReason:
        'FHA/VA/conventional and purchase/refinance originations exist on HMDA observation rows for some grains, but purchase originations are null in the 2025 LEI summaries and loan-type splits are not in this homepage snapshot. No invented product ranking.',
      geography: florida ? { grain: 'state', state: 'FL', note: geoNote } : { grain: 'national', note: geoNote },
      loanType,
      loanPurpose,
      requestedMetric: metric,
    };
  }

  if (q.includes('which lender') || q.includes('which lenders') || (q.includes('lenders') && metric === 'most')) {
    if (q.includes('complaint')) {
      return {
        mode: 'fail_closed',
        failClosedKind: 'entity-complaints',
        failReason:
          'Entity-level “most indexed complaints” is not a homepage ranking. Indexed CFPB mortgage complaints appear on published profiles only after confirmed attribution. Raw complaint count is not a quality score.',
        evidenceFamilies: ['cfpb'],
        requestedMetric: 'most',
      };
    }
    return {
      mode: 'fail_closed',
      failClosedKind: 'entity-volume',
      failReason:
        'Institution-level origination rankings are not computed from the homepage snapshot. Open Florida intelligence or the controlled lender research corpus instead of inventing a top-lender list.',
      geography: florida ? { grain: 'state', state: 'FL', note: geoNote } : { grain: 'national', note: geoNote },
      requestedMetric: 'most',
    };
  }

  if (q.includes('complaint')) {
    return {
      mode: 'evidence',
      evidenceFamilies: ['cfpb'],
      requestedMetric: 'count',
    };
  }

  if (q.includes('compare') && florida) {
    return {
      mode: 'comparison',
      geography: { grain: 'state', state: 'FL', note: geoNote },
      requestedMetric: 'count',
    };
  }

  const wantsOrig = Object.keys(ACTION_TERMS).some((t) => ACTION_TERMS[t] === 'origination' && q.includes(t));
  const wantsDenial = /\bdenial|\bdenied/.test(q);
  if (florida || q.includes('application') || wantsOrig || wantsDenial || q.includes('how many') || q.includes('research universe')) {
    return {
      mode: 'count',
      geography: florida ? { grain: 'state', state: 'FL', note: geoNote } : { grain: 'national', note: geoNote },
      actionTaken: wantsOrig ? ['origination'] : wantsDenial ? ['denial'] : ['application'],
      requestedMetric: 'count',
    };
  }

  return {
    mode: 'fail_closed',
    failClosedKind: 'unsupported',
    failReason: 'That question is not a supported deterministic homepage query. Try a count, Florida geography, complaint coverage, or a definition.',
  };
}
