import { STATE_NAMES } from '@/lib/home-intel/states';
import { ACTION_TERMS, DEPOSITORY_TERMS, FL_ASK_COUNTIES, LOAN_TYPE_TERMS, PURPOSE_TERMS } from './ontology';
import { ASK_GEO_NOTE, type LenderResearchQuery } from './types';
import { parseIdentityRequest } from './identifier';

const FAIL: Array<{ re: RegExp; kind: string; reason: string }> = [
  {
    re: /\bdenial reasons?\b|\bwhy .{0,40}den(?:y|ies|ial)|\bdti\b|\bdebt-to-income\b/,
    kind: 'denial-reason',
    reason:
      'Denial-reason taxonomy (DTI, credit, collateral) is not stored on current HMDA observation rows. Denial counts are not reasons.',
  },
  {
    re: /\bservice (?:area|territory)\b|\bwhere (?:do|does) they (?:lend|operate|serve)\b|\blicensed to lend\b|\bserv(?:e|es|ing)\b|\bdoing business in\b|\blend in (?:my )?(?:zip|address|county|state)\b|\bwho serves\b/,
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
  { re: /\bjunk fee|\bgouging|\bripoff\b|\bcheapest\b|\bmost affordable\b/, kind: 'pricing-rhetoric', reason: 'There is no consumer pricing dataset on this Ask layer. Cheapest is not inferred from HMDA volume.' },
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

  if (raw.length > 180 || /<\/?(?:script|iframe|object|style)\b|(?:'|%27)\s*(?:or|and)\s+\d+\s*=\s*\d+|--\s*$|;\s*(?:drop|select|insert|delete)\b/i.test(raw)) {
    return { mode: 'fail_closed', failClosedKind: 'malformed', failReason: 'The research question is malformed or exceeds the 180-character limit.' };
  }

  const identityRequest = parseIdentityRequest(raw);
  if (identityRequest) {
    const first = identityRequest.identifiers[0];
    return {
      mode: identityRequest.problem ? 'fail_closed' : 'entity', identityRequest,
      identifier: first ? { type: first.type, value: first.value } : undefined,
      identityQuery: first ? `${first.type === 'LEI' ? 'LEI' : 'NMLS'} ${first.value}` : undefined,
      failClosedKind: identityRequest.problem ? identityRequest.problem.state === 'UNSUPPORTED' ? 'unsupported-identity-grain' : 'identifier-input' : undefined,
      failReason: identityRequest.problem?.message, requestedMetric: null,
      coverageState: identityRequest.problem ? 'UNSUPPORTED' : identityRequest.remainingText ? 'PARTIAL' : 'KNOWN',
    };
  }

  if (/\b(?:mortgage loan officer|mlo|nmls person|branch nmls)\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'unsupported-identity-grain', failReason: 'This public research experience covers lender institutions. NMLS person/MLO and branch identifiers are separate identity grains and are not silently treated as institutions.', coverageState: 'UNSUPPORTED' };
  }

  if (/\bnew jersey\b|\brmla\b/i.test(q) && /\blicensed|\blenders?|\broster\b|\brmla\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'nj-rmla-request-only', failReason: "New Jersey's complete RMLA lender roster is available through an official request/search process rather than a complete acquired bulk universe. Missing records are not zero lenders.", coverageState: 'REQUEST_ONLY' };
  }
  if (/\bcalifornia\b|\bcrmla\b/i.test(q) && /\blicensed|\blenders?|\broster\b|\bcrmla\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'ca-crmla-not-acquired', failReason: "California's complete current CRMLA roster is not acquired as a bulk universe. CalHFA directory rows must not be counted as all California lenders.", coverageState: 'NOT_ACQUIRED' };
  }
  if (/\barizona\b/i.test(q) && /\blicensed|\blenders?|\broster\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'az-open-search-partial', failReason: 'Arizona DIFI evidence is source/open-search limited; it is not a complete acquired institution universe and cannot support a zero or complete-population claim.', coverageState: 'PARTIAL' };
  }
  if (/\bcolorado\b/i.test(q) && /\blicensed|\blenders?|\broster\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'co-company-roster-not-acquired', failReason: "Colorado's mortgage-company registration roster is search-only and was not acquired as a bulk universe. DRE MLO rows are people, not lender companies, and are not returned as public lender-company search results. Missing is not zero lenders.", coverageState: 'NOT_ACQUIRED' };
  }
  if (/\bvirginia\b/i.test(q) && /\b(first[- ]time|down payment|virginia housing|closing cost|plus second)\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'va-housing-programs', failReason: 'Virginia Housing homebuyer programs are consumer assistance products, not SCC licenses. Program availability is not lender licensing. Confirm current product status on official Virginia Housing pages and the /virginia research page.', coverageState: 'PARTIAL' };
  }
  if (/\bvirginia\b/i.test(q) && /\bcomplaint/i.test(q) && !/\brocket mortgage\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'va-cfpb-observations', failReason: 'CFPB Virginia mortgage complaints are statewide observations. A complaint is not a violation, not SCC enforcement, and not a company ranking. Company-specific complaint research requires an exact institution identity.', coverageState: 'PARTIAL' };
  }
  if (/\bvirginia\b/i.test(q) && /\b(licensed|lenders?|roster|brokers?|scc)\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'va-scc-dated-roster', failReason: "Virginia SCC reported mortgage brokers, lenders, and lender-and-brokers separately as of 2025-12-31. That dated roster is not current 2026 license status. NMLS Consumer Access is the current verification path. Do not answer with the 24,222 MLO person count or with HMDA application rows.", coverageState: 'PARTIAL' };
  }
  if (/\bnew york\b/i.test(q) && /\b(loan officers?|mlos?|mortgage loan originat)/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'ny-mlo-person-grain', failReason: 'New York MLOs are a person grain. The 9,769 end-of-2024 DFS MLO aggregate is not a lender-company count and is not a current 2026 person directory. NMLS Consumer Access is the current verification path.', coverageState: 'PARTIAL' };
  }
  if (/\bnew york\b/i.test(q) && /\bhow many lenders\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'ny-no-combined-lenders', failReason: 'Do not add 151 licensed mortgage bankers and 439 registered mortgage brokers into one New York lender count. Those are dated end-of-2024 DFS class aggregates, not a current roster.', coverageState: 'PARTIAL' };
  }
  if (/\bnew york\b/i.test(q) && /\bbrokers?\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'ny-broker-class', failReason: 'New York mortgage brokers are a separate NYDFS class from mortgage bankers. Current broker registration is NMLS/NYDFS search-only. The 439 end-of-2024 aggregate is not current 2026 status.', coverageState: 'PARTIAL' };
  }
  if (/\bnew york\b/i.test(q) && /\bservicers?\b/i.test(q) && !/\bhmda|\bapplication|\boriginat/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'ny-servicer-class', failReason: 'New York mortgage loan servicers are a separate NYDFS class from mortgage bankers. Current servicer registration is search-only. The 36 end-of-2024 aggregate is not current 2026 status.', coverageState: 'PARTIAL' };
  }
  if (/\bnew york\b/i.test(q) && /\bcomplaint/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'ny-cfpb-observations', failReason: 'CFPB New York mortgage complaints are statewide observations. A complaint is not a violation, not NYDFS enforcement, and not a company ranking. Company-specific complaint research requires an exact institution identity.', coverageState: 'PARTIAL' };
  }
  if (/\bnew york\b/i.test(q) && /\b(licensed|bankers?|lenders?|roster|nydfs)\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty|\bbest|\bsafest|\bvetted|\brecommended\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'ny-dfs-dated-aggregates', failReason: 'NYDFS 2024 annual-report counts (151 mortgage bankers, 439 brokers) are dated aggregates, not current September 2026 licensees. Current verification is NYDFS + NMLS Consumer Access. Do not answer with 9,769 MLOs or with HMDA application rows.', coverageState: 'PARTIAL' };
  }
  if (/\billinois\b|\bidfpr\b/i.test(q) && /\bhow many lenders\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'il-no-combined-lenders', failReason: 'Illinois does not have an acquired current mortgage-company census. Do not answer with HMDA application rows or FDIC depository counts as Illinois lenders. Current verification is IDFPR + NMLS Consumer Access.', coverageState: 'NOT_ACQUIRED' };
  }
  if (/\billinois\b|\bidfpr\b/i.test(q) && /\bcomplaint/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'il-cfpb-observations', failReason: 'CFPB Illinois mortgage complaints were not acquired as a bulk count. Missing is not zero. A complaint is not a violation. Company-specific research requires an exact institution identity.', coverageState: 'NOT_ACQUIRED' };
  }
  if (/\billinois\b|\bidfpr\b/i.test(q) && /\b(licensed|lenders?|roster|bankers?|brokers?)\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty|\bbest|\bsafest|\bvetted|\brecommended\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'il-idfpr-nmls-search-only', failReason: 'Current Illinois mortgage-company licensing is IDFPR/NMLS search-only. No bulk roster was acquired. Search-only is not zero lenders. HMDA applications and FDIC banks are not that census.', coverageState: 'NOT_ACQUIRED' };
  }
  if (/\billinois\b/i.test(q) && /\b(chicago|cook county|serving)\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'il-mailing-ne-service', failReason: 'Illinois HMDA geography is property location, not service territory, headquarters, or a Chicago/Cook license census. This statewide page does not publish local Illinois lender routes.', coverageState: 'UNSUPPORTED' };
  }

  if (/\bwhat is (?:an? )?nmls(?: institution)? id\b|\bhow do i (?:check|verify).*nmls/i.test(q)) return { mode: 'definition', definitionId: 'nmls', requestedMetric: null };
  if (/\bwhat is (?:an? )?lei\b/i.test(q)) return { mode: 'definition', definitionId: 'lei', requestedMetric: null };
  if (/\bwhat is hmda\b/i.test(q)) return { mode: 'definition', definitionId: 'hmda', requestedMetric: null };
  if (/\bwhat is (?:an? )?application(?: in hmda)?\b/i.test(q)) return { mode: 'definition', definitionId: 'application', requestedMetric: null };
  if (/\bwhat is (?:an? )?origination(?: in hmda)?\b/i.test(q)) return { mode: 'definition', definitionId: 'origination', requestedMetric: null };
  if (/\bwhat is (?:a )?denial(?: in hmda)?\b/i.test(q)) return { mode: 'definition', definitionId: 'denial', requestedMetric: null };
  if (/\bwhat is (?:a )?cfpb complaint/i.test(q)) return { mode: 'definition', definitionId: 'cfpb', requestedMetric: null, coverageState: 'PARTIAL' };
  if (/\bbank vs mortgage company\b|\bmortgage lender vs mortgage broker\b/i.test(q)) return { mode: 'definition', definitionId: 'institution_types', requestedMetric: null };
  if (/\bwho approves the most|\bbest approval odds|\bhighest approval rate|\blowest denial rate|\bcan this lender approve me\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'personalized-approval', failReason: 'HMDA outcomes cannot establish a future applicant’s approval probability. Applications, originations, and denials are observed reporting grains, not personalized underwriting predictions.', coverageState: 'UNSUPPORTED' };
  }
  if (/\bno complaints|\bno enforcement/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'absence-as-clean', failReason: 'Incomplete evidence coverage cannot establish a clean complaint or enforcement history. Missing source records are unknown, not zero.', coverageState: 'UNKNOWN' };
  }

  if (/\bcompare\b.*\bflorida\b.*\bnew jersey\b|\bcompare\b.*\bnew jersey\b.*\bflorida\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'state-comparison-partial', failReason: 'Florida and New Jersey HMDA property-geography observations can be researched on the same 2025 state grain, but this V1 view does not manufacture a direct comparison from unlike licensing universes.', coverageState: 'PARTIAL' };
  }
  if (/\bcompare applications? and originations?\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'action-comparison-partial', failReason: 'Applications and originations are distinct HMDA actions. Both can be reported on the same geography and period, but V1 does not turn their ratio into approval odds.', coverageState: 'PARTIAL' };
  }
  if (/\bcompare\b.*\bfha\b.*\bconventional\b|\bcompare\b.*\bconventional\b.*\bfha\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'loan-type-comparison-partial', failReason: 'FHA and conventional activity are separate HMDA loan-type observations. V1 preserves the same geography and action grain but does not present the comparison as product quality.', coverageState: 'PARTIAL' };
  }
  if (/\bi am buying a house\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'consumer-market-question-partial', failReason: 'HMDA can show historical mortgage activity tied to the property geography, not which lender is available, suitable, or likely to approve a future borrower. Add an explicit action such as applications or originations to research the market.', coverageState: 'PARTIAL' };
  }
  if (/\bfederal enforcement|\bstate enforcement|\benforcement records?\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'enforcement-partial', failReason: 'Regulatory-event evidence is source-specific and only attributable through confirmed institution links. An event is not a complaint, company count, current license status, or finding of wrongdoing.', evidenceFamilies: ['enforcement'], coverageState: 'PARTIAL' };
  }
  if (/\bflorida ofr\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'florida-ofr-partial', failReason: 'Florida OFR credentials are a distinct source grain. Only confirmed institution links are public; held or unresolved NMLS values are not silently attached.', evidenceFamilies: ['florida-ofr'], coverageState: 'PARTIAL' };
  }
  if (/\b(?:verify|check).*(?:lender|mortgage company).*(?:quote|loan estimate)|\blender that gave me (?:a|this) loan estimate/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'specific-identity-required', failReason: 'A quote or Loan Estimate does not establish institution identity. Find the labeled NMLS institution ID, then research that exact identifier.', coverageState: 'PARTIAL' };
  }

  if (/\brocket mortgage\b/i.test(q) && /\bcomplaint/i.test(q)) {
    return { mode: 'entity', identityQuery: 'Rocket Mortgage', evidenceFamilies: ['cfpb'], requestedMetric: null, coverageState: 'PARTIAL' };
  }
  if (/\brocket mortgage\b/i.test(q) && /\b(?:bank|nmls|institution|company)\b/i.test(q)) {
    return { mode: 'entity', identityQuery: 'Rocket Mortgage', requestedMetric: null, coverageState: 'KNOWN' };
  }

  const identityPrompt = q.replace(/^find\s+/, '').trim();
  if (identityPrompt === 'rocket mortg') return { mode: 'entity', identityQuery: identityPrompt, requestedMetric: null, coverageState: 'KNOWN' };
  if (/^(rocket mortgage|bank of america|united wholesale mortgage|loandepot|navy federal credit union)$/i.test(identityPrompt)) {
    return { mode: 'entity', identityQuery: identityPrompt, requestedMetric: null, coverageState: 'KNOWN' };
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

  const states: string[] = [];
  let unnamed = raw;
  // Consume longest full names first: West Virginia is not also Virginia.
  for (const [code, name] of Object.entries(STATE_NAMES).sort((a,b) => b[1].length - a[1].length)) {
    const pattern = new RegExp(`\\b${name.replaceAll('.', '[.]')}\\b`, 'gi');
    if (pattern.test(unnamed)) { states.push(code); unnamed = unnamed.replace(pattern, ' '); }
  }
  for (const code of Object.keys(STATE_NAMES)) {
    if (new RegExp(`\\b(?:in|within|state of)\\s+${code}\\b`, 'i').test(unnamed) ||
      (!['IN', 'OR', 'VA'].includes(code) && new RegExp(`\\b${code}\\b`).test(unnamed))) {
      if (!states.includes(code)) states.push(code);
    }
  }
  const state = states.length === 1 ? states[0] : undefined;
  const florida = state === 'FL';
  const reportingYears = [...new Set(raw.match(/\b(?:19|20)\d{2}\b/g) ?? [])];
  const scopeIssues: string[] = [];
  if (states.length > 1) scopeIssues.push('More than one jurisdiction was requested. Select one state for a scalar count.');
  // A place phrase must be resolved; national is only the explicit/default scope.
  const place = q.match(/\b(?:in|within|for properties in)\s+(.+?)(?:[?]|$)/)?.[1];
  if (place) {
    let remainder = place;
    for (const [code, name] of Object.entries(STATE_NAMES).sort((a,b) => b[1].length - a[1].length)) remainder = remainder.replace(new RegExp(`\\b${name.replaceAll('.', '[.]')}\\b|\\b${code}\\b`, 'gi'), '');
    remainder = remainder.replace(/\b(?:the|united states|u\.s\.?|usa|nation|nationally|nationwide|hmda|reporting|vintage|year|current|research|universe|in|and|or|applications?|originations?|denials?|mortgages?|properties|202\d)\b/g, '').replace(/[^a-z]/g, '');
    if (remainder && !detectCounties(q).length) scopeIssues.push(`The requested place or condition "${place}" is not resolved by this count source. Select a supported state or county.`);
  }
  if (states.length && /\b(?:nationally|nationwide|united states|usa)\b/.test(q) && !/\bcompare\b/.test(q)) scopeIssues.push('Both state and national scope were requested. Select one scope for a scalar count.');
  const counties = detectCounties(q);
  if (!counties.length && /\b(?:county|city|zip|radius)\b/.test(q)) scopeIssues.push('The requested local geography is not available in this count source.');
  if (/[$]|\b(?:under|over|above|below)\s+\d|\b(?:loan amount|income|credit score|first.time|owner.occupied|investment propert)\b/.test(q)) scopeIssues.push('The requested amount, borrower or occupancy dimension is not supplied by this count source.');
  if (counties.length && states.some(code => code !== 'FL')) scopeIssues.push('The named county is only available in the Florida county catalog; the requested state conflicts with that scope.');
  const hasBroward = counties.some((c) => c.fips === '12011');
  const hasPalm = counties.some((c) => c.fips === '12099');

  let loanType: string[] | undefined;
  for (const [term, value] of Object.entries(LOAN_TYPE_TERMS)) {
    const hit = term.length <= 3 ? new RegExp(`\\b${term}\\b`).test(q) : q.includes(term);
    if (hit && !(term === 'va' && /\b(?:in|within|state of)\s+va\b/.test(q) && !/\bva\s+(?:loans?|mortgages?|applications?|originations?)\b/.test(q))) loanType = [...new Set([...(loanType ?? []), value])];
  }
  let loanPurpose: string[] | undefined;
  for (const [term, value] of Object.entries(PURPOSE_TERMS)) {
    if (q.includes(term)) loanPurpose = [...new Set([...(loanPurpose ?? []), value])];
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
  if ([wantsOrig, wantsDenial, /\bapplications?\b/.test(q)].filter(Boolean).length > 1) scopeIssues.push('More than one HMDA action was requested. Select a single action for a scalar count.');
  const action: string[] = wantsOrig ? ['origination'] : wantsDenial ? ['denial'] : wantsApps ? ['application'] : ['origination'];
  // Scalar counts must not silently discard an unrecognized place or dimension.
  let countRemainder = q;
  const phrases = [...Object.values(STATE_NAMES), ...Object.keys(FL_ASK_COUNTIES), ...Object.keys(LOAN_TYPE_TERMS), ...Object.keys(PURPOSE_TERMS), ...Object.keys(DEPOSITORY_TERMS)];
  for (const phrase of phrases.sort((a,b) => b.length - a.length)) countRemainder = countRemainder.replace(new RegExp(`\\b${phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), ' ');
  countRemainder = countRemainder.replace(/\b[A-Z]{2}\b/gi, word => states.includes(word.toUpperCase()) ? ' ' : word);
  countRemainder = countRemainder.replace(/\b(?:which|lenders?|institutions?|most|highest|volume|how|many|what|is|are|was|were|the|a|an|of|for|in|within|and|or|by|from|during|to|show|me|give|report|reported|total|number|count|counts|mortgage|mortgages|loan|loans|applications?|originations?|originated|denials?|denied|properties|property|census|location|geography|state|county|market|activity|hmda|reporting|vintage|year|national|nationally|nationwide|united|states|us|usa|current|research|universe|received|filed|all|taken)\b|\b(?:19|20)\d{2}\b/g, ' ').replace(/[^a-z0-9$]/g, '').trim();
  if (countRemainder) scopeIssues.push('Some requested geography or count conditions are not supported by this source. Edit the request or select a supported state/action; no broader count was substituted.');


  if (q.includes('what does') || q.includes('what does originated') || q.includes('mean in hmda')) {
    return { mode: 'definition', definitionId: 'origination', requestedMetric: null };
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
    if (counties.length > 1) scopeIssues.push('Select one county for an institution ordering; no multi-county comparison was executed.');
    const geo =
      counties[0] != null
        ? {
            grain: 'county' as const,
            state: 'FL',
            county: counties[0].name,
            countyFips: counties[0].fips,
            note: ASK_GEO_NOTE,
          }
        : state
          ? { grain: 'state' as const, state, note: ASK_GEO_NOTE }
          : { grain: 'national' as const, note: ASK_GEO_NOTE };
    return {
      mode: 'entity',
      geography: geo,
      reportingYears, scopeIssues, loanPurpose,
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
      lenderType, reportingYears, scopeIssues,
      requestedMetric: 'count',
    };
  }

  if (state || q.includes('application') || wantsOrig || wantsDenial || q.includes('how many') || q.includes('research universe')) {
    return {
      mode: loanType ? 'aggregate' : 'count',
      loanPurpose, lenderType, reportingYears, scopeIssues,
      geography: state ? { grain: 'state', state, note: ASK_GEO_NOTE } : { grain: 'national', note: ASK_GEO_NOTE },
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
  if (overrides.geo && STATE_NAMES[overrides.geo]) {
    next.geography = { grain: 'state', state: overrides.geo, note: ASK_GEO_NOTE };
  }
  if (overrides.geo === 'US') next.geography = { grain: 'national', note: ASK_GEO_NOTE };
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
