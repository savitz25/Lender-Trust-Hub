import { STATE_NAMES } from '@/lib/home-intel/states';
import { ACTION_TERMS, DEPOSITORY_TERMS, FL_ASK_COUNTIES, LOAN_TYPE_TERMS, PURPOSE_TERMS } from './ontology';
import { ASK_GEO_NOTE, type LenderResearchQuery } from './types';
import { parseIdentityRequest } from './identifier';
import { HMDA_STATE_CONFIGS } from '@/lib/hmda/states';

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
  {
    // TH-DISCOVERY-PARITY-001A: "lender(s) FOR <borrower characteristic>" (bad credit,
    // first-time homebuyer, self-employed, veteran, low income) asks this Ask layer to
    // personally match a lender to the consumer's own situation -- a recommendation,
    // not a request to browse real HMDA-reporting institutions at a place.
    re: /\b(?:lenders?|mortgage lenders?|mortgage compan(?:y|ies)|mortgage brokers?)\s+for\s+(?:bad credit|poor credit|no credit|first.time|self.employed|veterans?|low income)\b/,
    kind: 'borrower-profile-matching',
    reason: 'This Ask layer does not match lenders to a borrower profile or qualification. Name a place to browse real reporting institutions there instead.',
  },
  { re: /\bsafest\b|\btrustworthy\b|\btrust score\b|\bis this lender (?:safe|good|legit)\b/, kind: 'safety', reason: 'There is no safety or Trust Score ranking on this hub.' },
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
    // TH-DISCOVERY-PARITY-001A: an unresolvable, personalized/deictic place
    // reference ("my county", "my area", "my state", "my zip") must not be
    // silently broadened to a national provider cohort as if it answered the
    // question -- that would present national results as if they meant the
    // consumer's own (unknown to this system) location, a false-locality
    // risk. Name an actual city, county or state instead.
    re: /\bmy (?:county|area|state|zip|zip code|neighborhood|region|address|location|city|town)\b/,
    kind: 'personalized-location',
    reason: "This Ask layer does not know your location. \"My county\"/\"my area\" cannot be resolved to an actual place -- name a specific city, county or state.",
  },
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

// TH-DISCOVERY-GEN-001: a named county anywhere in the acquired 50-state HMDA config (not just
// Florida's own FL_ASK_COUNTIES list) is a genuine [OPTIONAL GEOGRAPHY] signal that the requested
// specificity is a city/county, not a bare state -- the same signal Florida county recognition
// already uses to distinguish "mortgage companies in Florida" (an established state-level scalar-
// count ground truth) from a local browse request. Exact county-grain institution data is only
// acquired for Florida (institution-volume.ts), so a non-Florida county match is used only to
// trigger DISCOVERY mode; the existing entity geography fallback below already resolves to real
// state-level institution rows for that state when no Florida county was matched -- a genuine,
// clearly-labeled broader result, never a fabricated county-specific claim.
function detectAnyMajorCounty(q: string): { state: string } | undefined {
  for (const [code, config] of Object.entries(HMDA_STATE_CONFIGS)) {
    for (const slug of config.majorCountySlugs) {
      const phrase = slug.replace(/-/g, '[- ]');
      if (new RegExp(`\\b${phrase}\\b`, 'i').test(q)) return { state: code };
    }
  }
  return undefined;
}

function wantsEntity(q: string, metric: LenderResearchQuery['requestedMetric'], explicitAggregateWording = false): boolean {
  if (/\bwhich lenders?\b|\bwhich institutions?\b|\bwho originated\b|\bwho received\b/.test(q)) return true;
  // TH-DISCOVERY-RESET-001 (production certification fix): "mortgage broker in Monmouth County
  // New Jersey" asks for real broker institutions to browse (provider Discovery), not a scalar
  // count -- the same "companies is a plain-language synonym for lenders" reasoning already
  // applied to "companies" a few lines below applies to "broker(s)" too. Unlike bare "lenders",
  // which defaults to a count unless "most"/"which" is also present, "broker(s)" alone is
  // unambiguously an entity request here: nothing about a scalar HMDA count is phrased as
  // "broker." TH-DISCOVERY-PARITY-001A: except when EXPLICIT aggregate wording is also present
  // ("count of mortgage brokers in New Jersey") -- that combination is a real, if unusual,
  // scalar-count request and must not be overridden just because "broker" also appears.
  if (/\bbrokers?\b/.test(q) && !explicitAggregateWording) return true;
  if (/\blenders?\b/.test(q) && metric === 'most') return true;
  if (/\bhmda reporting institutions\b|\bleis?\b/.test(q) && metric === 'most') return true;
  return false;
}

// TH-SEARCH-R1-015: exact caveat text attached (never used to block execution) when a
// question names New Jersey plus licensing/lender/roster language. Shared by
// scalar-count.ts and execute-query.ts's institution ranking so both real-answer paths
// carry the same fact instead of two independently-drifting copies.
export const NJ_RMLA_COVERAGE_NOTE =
  "New Jersey's complete RMLA-licensed lender roster is not acquired as a bulk universe. This is real reported HMDA mortgage activity, not a state licensing census. Missing roster records are not zero lenders.";

function parseLenderAskCore(raw: string): LenderResearchQuery {
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

  // New Jersey has no acquired complete RMLA-licensed lender roster, but real federal
  // HMDA institution/scalar data for NJ IS acquired (see scalar-count.ts, institution-volume.ts).
  // TH-SEARCH-R1-015: a missing roster must degrade to a caveat on that real data, never a
  // blanket refusal of the whole question. See NJ_RMLA_COVERAGE_NOTE / parseLenderAsk below.
  // TH-DISCOVERY-PARITY-001A: these state-specific "no bulk roster acquired" guards
  // originally treated a bare "lenders?"/"brokers?"/"bankers?" mention as equally
  // roster-requesting as "licensed"/"roster" itself, so an ordinary discovery query
  // ("lenders in Illinois", "mortgage broker in Pennsylvania") hard fail-closed with
  // zero results instead of falling through to the real HMDA-institution entity
  // results every other state already gets. Now requires an EXPLICIT roster/licensing
  // signal word (licensed, registered, roster, or the state's own regulator acronym) --
  // matching this file's existing "aggregate wording" vs "bare provider term" distinction.
  if (/\bcalifornia\b|\bcrmla\b/i.test(q) && /\blicensed\b|\bregistered\b|\broster\b|\bcrmla\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'ca-crmla-not-acquired', failReason: "California's complete current CRMLA roster is not acquired as a bulk universe. CalHFA directory rows must not be counted as all California lenders.", coverageState: 'NOT_ACQUIRED' };
  }
  if (/\barizona\b/i.test(q) && /\blicensed\b|\bregistered\b|\broster\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'az-open-search-partial', failReason: 'Arizona DIFI evidence is source/open-search limited; it is not a complete acquired institution universe and cannot support a zero or complete-population claim.', coverageState: 'PARTIAL' };
  }
  if (/\bcolorado\b/i.test(q) && /\blicensed\b|\bregistered\b|\broster\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'co-company-roster-not-acquired', failReason: "Colorado's mortgage-company registration roster is search-only and was not acquired as a bulk universe. DRE MLO rows are people, not lender companies, and are not returned as public lender-company search results. Missing is not zero lenders.", coverageState: 'NOT_ACQUIRED' };
  }
  if (/\bvirginia\b/i.test(q) && /\b(first[- ]time|down payment|virginia housing|closing cost|plus second)\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'va-housing-programs', failReason: 'Virginia Housing homebuyer programs are consumer assistance products, not SCC licenses. Program availability is not lender licensing. Confirm current product status on official Virginia Housing pages and the /virginia research page.', coverageState: 'PARTIAL' };
  }
  if (/\bvirginia\b/i.test(q) && /\bcomplaint/i.test(q) && !/\brocket mortgage\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'va-cfpb-observations', failReason: 'CFPB Virginia mortgage complaints are statewide observations. A complaint is not a violation, not SCC enforcement, and not a company ranking. Company-specific complaint research requires an exact institution identity.', coverageState: 'PARTIAL' };
  }
  if (/\bvirginia\b/i.test(q) && /\b(licensed|registered|roster|scc|how many)\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'va-scc-dated-roster', failReason: "Virginia SCC reported mortgage brokers, lenders, and lender-and-brokers separately as of 2025-12-31. That dated roster is not current 2026 license status. NMLS Consumer Access is the current verification path. Do not answer with the 24,222 MLO person count or with HMDA application rows.", coverageState: 'PARTIAL' };
  }
  if (/\bnew york\b/i.test(q) && /\b(loan officers?|mlos?|mortgage loan originat)/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'ny-mlo-person-grain', failReason: 'New York MLOs are a person grain. The 9,769 end-of-2024 DFS MLO aggregate is not a lender-company count and is not a current 2026 person directory. NMLS Consumer Access is the current verification path.', coverageState: 'PARTIAL' };
  }
  if (/\bnew york\b/i.test(q) && /\bhow many lenders\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'ny-no-combined-lenders', failReason: 'Do not add 151 licensed mortgage bankers and 439 registered mortgage brokers into one New York lender count. Those are dated end-of-2024 DFS class aggregates, not a current roster.', coverageState: 'PARTIAL' };
  }
  if (/\bnew york\b/i.test(q) && /\bbrokers?\b/i.test(q) && /\blicensed\b|\bregistered\b|\broster\b|\bnydfs\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'ny-broker-class', failReason: 'New York mortgage brokers are a separate NYDFS class from mortgage bankers. Current broker registration is NMLS/NYDFS search-only. The 439 end-of-2024 aggregate is not current 2026 status.', coverageState: 'PARTIAL' };
  }
  if (/\bnew york\b/i.test(q) && /\bservicers?\b/i.test(q) && !/\bhmda|\bapplication|\boriginat/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'ny-servicer-class', failReason: 'New York mortgage loan servicers are a separate NYDFS class from mortgage bankers. Current servicer registration is search-only. The 36 end-of-2024 aggregate is not current 2026 status.', coverageState: 'PARTIAL' };
  }
  if (/\bnew york\b/i.test(q) && /\bcomplaint/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'ny-cfpb-observations', failReason: 'CFPB New York mortgage complaints are statewide observations. A complaint is not a violation, not NYDFS enforcement, and not a company ranking. Company-specific complaint research requires an exact institution identity.', coverageState: 'PARTIAL' };
  }
  if (/\bnew york\b/i.test(q) && /\b(licensed|registered|roster|nydfs|how many)\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty|\bbest|\bsafest|\bvetted|\brecommended\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'ny-dfs-dated-aggregates', failReason: 'NYDFS 2024 annual-report counts (151 mortgage bankers, 439 brokers) are dated aggregates, not current September 2026 licensees. Current verification is NYDFS + NMLS Consumer Access. Do not answer with 9,769 MLOs or with HMDA application rows.', coverageState: 'PARTIAL' };
  }
  if (/\billinois\b|\bidfpr\b/i.test(q) && /\bhow many lenders\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'il-no-combined-lenders', failReason: 'Illinois does not have an acquired current mortgage-company census. Do not answer with HMDA application rows or FDIC depository counts as Illinois lenders. Current verification is IDFPR + NMLS Consumer Access.', coverageState: 'NOT_ACQUIRED' };
  }
  if (/\billinois\b|\bidfpr\b/i.test(q) && /\bcomplaint/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'il-cfpb-observations', failReason: 'CFPB Illinois mortgage complaints were not acquired as a bulk count. Missing is not zero. A complaint is not a violation. Company-specific research requires an exact institution identity.', coverageState: 'NOT_ACQUIRED' };
  }
  if (/\billinois\b|\bidfpr\b/i.test(q) && /\b(licensed|registered|roster|how many)\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty|\bbest|\bsafest|\bvetted|\brecommended\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'il-idfpr-nmls-search-only', failReason: 'Current Illinois mortgage-company licensing is IDFPR/NMLS search-only. No bulk roster was acquired. Search-only is not zero lenders. HMDA applications and FDIC banks are not that census.', coverageState: 'NOT_ACQUIRED' };
  }
  // TH-DISCOVERY-PARITY-001A: previously fired on the bare mention of "Chicago"/"Cook
  // County" alone, hard-refusing an ordinary discovery query ("lenders in Chicago
  // Illinois") that should broaden to real Illinois state-grain institution results
  // (like every other city/state combination already does) instead of dead-ending.
  // Now requires the actual service-territory CLAIM language ("serving"), not just the
  // city name -- an explicit "who is serving Chicago" question stays correctly refused.
  if (/\billinois\b/i.test(q) && /\bserving\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'il-mailing-ne-service', failReason: 'Illinois HMDA geography is property location, not service territory, headquarters, or a Chicago/Cook license census. This statewide page does not publish local Illinois lender routes.', coverageState: 'UNSUPPORTED' };
  }
  if (/\boregon\b|\bodfr\b|\bdfr\b/i.test(q) && /\bhow many lenders\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'or-no-combined-lenders', failReason: 'Oregon does not have an acquired current mortgage-company census. Do not answer with HMDA applications, HMDA LEIs, FDIC banks, or OHCS Flex Lending participants as Oregon lenders. Current verification is DFR + NMLS Consumer Access.', coverageState: 'NOT_ACQUIRED' };
  }
  if ((/\boregon\b/i.test(q) || /\bdfr\b/i.test(q)) && /\bcomplaints?\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'or-complaints-not-acquired', failReason: 'Oregon DFR/NMLS mortgage complaints were not acquired as a bulk count. Missing is not zero. A complaint is not a violation and is not a DFR administrative order. Company-specific research requires an exact NMLS identity.', coverageState: 'NOT_ACQUIRED' };
  }
  if ((/\boregon\b/i.test(q) || /\bdfr\b/i.test(q)) && /\b(enforcement|administrative order|notices and orders|dfr case|m-\d{2}-\d{4})\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'or-dfr-mortgage-orders', failReason: 'Oregon DFR Mortgage-classified administrative orders are mixed mortgage matters. A document is not a unique case. Name-only attachment is unsafe. This is not a company quality score. Confirm the official Notices and orders system and /oregon.', coverageState: 'PARTIAL' };
  }
  if (/\boregon\b/i.test(q) && /\b(loan originators?|mlos?)\b/i.test(q) && !/\bhmda|\bapplication|\boriginat(?:ion|ions|ed)\b|\bdenial|\bproperty/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'or-mlo-search-only', failReason: 'Oregon mortgage loan originators are a person grain. No bulk MLO roster was acquired. Search-only is not zero. An MLO is not a mortgage company. Verify on NMLS Consumer Access.', coverageState: 'NOT_ACQUIRED' };
  }
  if (/\boregon\b/i.test(q) && /\bservicers?\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'or-servicer-search-only', failReason: 'Oregon mortgage servicer licensing is a separate DFR license from origination. No bulk servicer roster was acquired. Search-only is not zero. Do not add servicers to the mortgage-company denominator.', coverageState: 'NOT_ACQUIRED' };
  }
  if (/\b(ohcs|flex lending|firsthome|nextstep)\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'or-ohcs-program', failReason: 'OHCS Flex Lending approved lenders are program participants, not the Oregon DFR/NMLS mortgage-license universe. Featured or top-producing OHCS labels are not LenderTrustHub rankings. Names were not merged onto NMLS identities.', coverageState: 'PARTIAL' };
  }
  // TH-DISCOVERY-PARITY-001A: removed the bare "Portland"/"Multnomah" mention trigger --
  // it hard-refused ordinary discovery ("mortgage broker in Portland Oregon") instead of
  // broadening to real Oregon state-grain institution results. A genuine service-
  // territory CLAIM ("who is serving Portland") is still caught by the general
  // service-territory FAIL pattern above.
  if ((/\boregon\b/i.test(q) || /\bdfr\b/i.test(q)) && /\b(licensed|registered|roster|how many)\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty|\bbest|\bsafest|\bvetted|\brecommended|\bohcs|\bflex\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'or-nmls-search-only', failReason: 'Current Oregon mortgage-company licensing is DFR/NMLS search-only. No bulk roster was acquired. Search-only is not zero lenders. HMDA applications, HMDA LEIs, FDIC banks, and OHCS Flex lenders are not that census.', coverageState: 'NOT_ACQUIRED' };
  }
  if (/\bpennsylvania\b|\bdobs\b|\bpa dobs\b/i.test(q) && /\bhow many lenders\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'pa-no-combined-lenders', failReason: 'Pennsylvania does not have an acquired current NMLS mortgage-company census. Do not answer with HMDA applications, HMDA LEIs, FDIC banks, PHFA participants, Open Data class rows, or the mixed DoBS ~28,450 non-bank figure as Pennsylvania lenders.', coverageState: 'NOT_ACQUIRED' };
  }
  if ((/\bpennsylvania\b/i.test(q) || /\bdobs\b/i.test(q)) && /\bcomplaints?\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'pa-cfpb-observations', failReason: 'CFPB 2025 Pennsylvania mortgage complaints are consumer submissions (849 distinct IDs), not findings and not DoBS orders. DoBS bulk mortgage complaints are intake-only / not public. Company name is not an NMLS identity.', coverageState: 'PARTIAL' };
  }
  if ((/\bpennsylvania\b/i.test(q) || /\bdobs\b/i.test(q)) && /\b(enforcement|consent (?:agreement|order)|order to show cause|cease and desist)\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'pa-dobs-orders', failReason: 'DoBS enforcement orders are a mixed Department-wide catalog. A mortgage-specific census was not acquired. A document is not a unique matter. Order to Show Cause is not a final finding. Confirm official DoBS Enforcement Orders and /pennsylvania.', coverageState: 'PARTIAL' };
  }
  if (/\bnchfa\b/i.test(q) || (/\bnorth carolina\b|\bnccob\b/i.test(q) && /\b(participating lenders?|housing finance|preferred loan officer)\b/i.test(q))) {
    return { mode: 'fail_closed', failClosedKind: 'nc-nchfa-program', failReason: 'NCHFA participating lenders are a housing-program network, not the NCCOB mortgage-license universe. The public finder is a radius search, not a bulk census. NCHFA “preferred loan officer” and “top lender” awards are Agency program language, not LenderTrustHub rankings. Names were not attached to NMLS by name alone.', coverageState: 'PARTIAL' };
  }
  if (/\bphfa\b/i.test(q) || (/\bpennsylvania\b/i.test(q) && /\b(participating lenders?|housing finance)\b/i.test(q))) {
    return { mode: 'fail_closed', failClosedKind: 'pa-phfa-program', failReason: 'PHFA participating lenders are a housing-program network, not the DoBS/NMLS mortgage-license universe. County physical presence is not county-only eligibility. PHFA Top designations are not LenderTrustHub rankings.', coverageState: 'PARTIAL' };
  }
  if (/\bpennsylvania\b/i.test(q) && /\b(loan originators?|mlos?|mortgage originator)\b/i.test(q) && !/\bhmda|\bapplication|\boriginat(?:ion|ions|ed)\b|\bdenial|\bproperty/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'pa-mlo-search-only', failReason: 'Pennsylvania mortgage loan originators are a person grain. Current NMLS MLO verification is search-only. An MLO is not a mortgage company. Open Data originator rows are not an NMLS ID census.', coverageState: 'NOT_ACQUIRED' };
  }
  if (/\bpennsylvania\b/i.test(q) && /\bservicers?\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'pa-servicer-search-only', failReason: 'Pennsylvania mortgage servicers are a separate DoBS class from mortgage lenders. Current NMLS servicer verification is search-only. Do not add servicers to the lender denominator.', coverageState: 'NOT_ACQUIRED' };
  }
  if (/\bpennsylvania\b/i.test(q) && /\bbrokers?\b/i.test(q) && /\blicensed\b|\bregistered\b|\broster\b|\bdobs\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'pa-broker-search-only', failReason: 'Pennsylvania mortgage brokers are a separate DoBS class from mortgage lenders. Current NMLS broker verification is search-only. Search-only is not zero brokers.', coverageState: 'NOT_ACQUIRED' };
  }
  // TH-DISCOVERY-PARITY-001A: removed the bare Philadelphia/Pittsburgh/Allegheny/
  // Montgomery mention trigger -- it hard-refused ordinary discovery ("home lender near
  // Philadelphia") instead of broadening to real Pennsylvania state-grain institution
  // results. A genuine service-territory CLAIM is still caught by the general
  // service-territory FAIL pattern above; PHFA-specific questions are still caught by
  // the PHFA program guard above.
  if ((/\bpennsylvania\b/i.test(q) || /\bdobs\b/i.test(q)) && /\b(licensed|registered|roster|how many)\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty|\bbest|\bsafest|\bvetted|\brecommended|\bphfa\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'pa-nmls-search-only', failReason: 'Current Pennsylvania mortgage-company licensing is DoBS/NMLS search-only. No bulk NMLS roster was acquired. Search-only is not zero lenders. HMDA applications, Open Data class rows, FDIC banks, and PHFA participants are not that census.', coverageState: 'NOT_ACQUIRED' };
  }
  if (/\bnccob\s+license\b/i.test(q) || (/\b[LBR]-\d{4,}\b/.test(q) && /\b(nccob|north carolina)\b/i.test(q))) {
    return { mode: 'fail_closed', failClosedKind: 'nc-nccob-license-identity', failReason: 'An exact NCCOB license number is distinct from an NMLS Unique ID and outranks geography. This page does not mint public lender profiles from the Show All roster. Verify current status on NCCOB Licensee Search; do not treat the number as an NMLS ID or as a Charlotte/Raleigh local census.', coverageState: 'PARTIAL' };
  }
  if (/\bnorth carolina\b|\bnccob\b/i.test(q) && /\bhow many lenders\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'nc-no-combined-lenders', failReason: 'Do not add 640 current NCCOB Mortgage Lender licenses, 574 brokers, 62 servicers, and 104 MOSR rows into one North Carolina lenders count. The mixed 1,380 current licensed entities are not mortgage companies. HMDA applications, HMDA LEIs, FDIC banks, CFPB complaints, reverse-mortgage certificates, and NCHFA participants are not that census.', coverageState: 'PARTIAL' };
  }
  if ((/\bnorth carolina\b/i.test(q) || /\bnccob\b/i.test(q)) && /\bcomplaints?\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'nc-cfpb-observations', failReason: 'CFPB 2025 North Carolina mortgage complaints are consumer submissions (920 distinct IDs), not findings and not NCCOB orders. NCCOB bulk mortgage complaints are intake-only / not public. Company name is not an NMLS identity.', coverageState: 'PARTIAL' };
  }
  if ((/\bnorth carolina\b/i.test(q) || /\bnccob\b/i.test(q)) && /\b(enforcement|consent order|cease and desist|revocation|suspension)\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'nc-nccob-orders', failReason: 'NCCOB Mortgage Enforcement Actions listed 723 documents across 693 distinct docket numbers. A document is not a unique matter. A consent order is not a criminal conviction. Person respondents are not company-lender matters. The grid did not publish NCCOB license or NMLS IDs, so name-only attachment is unsafe. Confirm official NCCOB Mortgage Enforcement Actions and /north-carolina.', coverageState: 'PARTIAL' };
  }
  if (/\bnorth carolina\b/i.test(q) && /\b(loan originators?|mlos?|mortgage originator)\b/i.test(q) && !/\bhmda|\bapplication|\boriginat(?:ion|ions|ed)\b|\bdenial|\bproperty/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'nc-mlo-matching', failReason: 'North Carolina mortgage loan originators are a person grain. NCCOB Show All reports 24,612 official matching records; distinct NCCOB/NMLS person IDs were not fully paged. An MLO is not a mortgage company and is not added to the 1,380 current company entities.', coverageState: 'PARTIAL' };
  }
  if (/\bnorth carolina\b/i.test(q) && /\bservicers?\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'nc-servicer-class', failReason: 'North Carolina mortgage servicers are a separate NCCOB class. Current Show All lists 62 Mortgage Servicer licenses. A Services Loan flag is not the servicer census. Do not add servicers to the 640 lender denominator.', coverageState: 'PARTIAL' };
  }
  if (/\bnorth carolina\b/i.test(q) && /\bbrokers?\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'nc-broker-class', failReason: 'North Carolina mortgage brokers are a separate NCCOB class. Current Show All lists 574 Mortgage Broker licenses. Do not add brokers to the 640 lender denominator.', coverageState: 'PARTIAL' };
  }
  if (/\bnorth carolina\b|\bnccob\b/i.test(q) && /\bmosr\b|origination support/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'nc-mosr-class', failReason: 'Mortgage Origination Support Registration is a separate NCCOB class (104 current rows). MOSR is not a mortgage lender and is not an MLO person.', coverageState: 'PARTIAL' };
  }
  if ((/\bnorth carolina\b/i.test(q) || /\bnccob\b/i.test(q)) && /\breverse mortgage\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'nc-reverse-class', failReason: 'North Carolina reverse-mortgage certificates are a separate NCCOB list (112 RM numbers). Reverse authorization is not a generic Mortgage Lender license and is not added to the 640 current lender class.', coverageState: 'PARTIAL' };
  }
  if (/\b(charlotte|raleigh|durham|greensboro|wake|mecklenburg)\b/i.test(q) && /\b(mortgage|lender|broker|nchfa|nccob)\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'nc-no-local', failReason: 'North Carolina HMDA geography is property location, not service territory, headquarters, or a Charlotte/Raleigh license census. This statewide page does not publish local North Carolina lender routes.', coverageState: 'UNSUPPORTED' };
  }
  if ((/\bnorth carolina\b/i.test(q) || /\bnccob\b/i.test(q)) && /\b(licensed|lenders?|roster|bankers?)\b/i.test(q) && !/\bhmda|\bapplication|\boriginat|\bdenial|\bproperty|\bbest|\bsafest|\bvetted|\brecommended|\bnchfa\b/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'nc-nccob-lender-class', failReason: 'Current NCCOB Show All lists 640 Mortgage Lender licenses as a separate class. That is not 574 brokers, 62 servicers, 104 MOSR rows, 24,612 MLO matching records, 112 reverse-mortgage certificates, HMDA applications, FDIC banks, or NCHFA participants, and it is not a combined North Carolina lenders census.', coverageState: 'PARTIAL' };
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
  // TH-DISCOVERY-PARITY-001A: "how do I check/verify if a lender/mortgage company is
  // licensed" asks about a verification PROCESS, not a request to browse companies --
  // it must stay a how-to guidance question, not fall into the new, broader provider-
  // discovery default below just because it names "mortgage company"/"lender".
  if (/\bhow (?:do|can) i (?:check|verify)\b.{0,30}\b(?:lender|mortgage compan(?:y|ies))\b.{0,20}\b(?:licens|regist)/i.test(q)) {
    return { mode: 'fail_closed', failClosedKind: 'verification-howto', failReason: 'Use the labeled NMLS institution ID with NMLS Consumer Access to verify current license status. This Ask layer does not itself certify licensing.', coverageState: 'PARTIAL' };
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
    const preceded = new RegExp(`\\b(?:in|within|state of)\\s+${code}\\b`);
    const precededCi = new RegExp(`\\b(?:in|within|state of)\\s+${code}\\b`, 'i');
    const bare = new RegExp(`\\b${code}\\b`);
    // IN/OR/VA as English or loan-type tokens are not jurisdictions. Require the
    // two-letter code itself; full names were already consumed above.
    const hit = ['IN', 'OR', 'VA'].includes(code)
      ? preceded.test(unnamed) || preceded.test(raw)
      : precededCi.test(unnamed) || bare.test(unnamed);
    if (hit && !states.includes(code)) states.push(code);
  }
  // TH-DISCOVERY-RESET-001 (production certification fix): "mortgage companies in Miami" named
  // no state at all -- this parser only recognizes state names/codes, not cities -- and so
  // resolved to no geography and fell through to the generic fail-closed at the bottom, even
  // though real HMDA property-geography activity for Miami-Dade, FL is one query away. Miami is
  // not genuinely ambiguous with any other jurisdiction this source would apply to.
  const bareCityRecognized = !states.length && /\bmiami\b/.test(q);
  if (bareCityRecognized) states.push('FL');
  const state = states.length === 1 ? states[0] : undefined;
  // TH-DISCOVERY-GEN-001: generalizes the Miami-only bare-city recognition above to every state's
  // own acquired major-county list (see detectAnyMajorCounty) -- "lender in Dallas Texas" names a
  // real county-level place. Only used as a DISCOVERY-mode trigger, and only when the state is
  // ALSO already explicitly resolved (unlike the Miami case, which infers the state from no
  // mention at all): a bare city/place name alone is not used to guess a state, because a county
  // name can genuinely exist in more than one state (e.g. a real Houston County, Georgia would
  // otherwise get silently substituted for Houston, Texas from "lenders in Houston" alone --
  // exactly the false-locality outcome this doctrine forbids). Exact county-grain institution
  // data is Florida-only, so the existing entity geography fallback further below resolves this
  // to real, broader state-level institution rows for the state the consumer actually named.
  const nonFloridaCounty = state && state !== 'FL' ? detectAnyMajorCounty(q) : undefined;
  const florida = state === 'FL';
  const reportingYears = [...new Set(raw.match(/\b(?:19|20)\d{2}\b/g) ?? [])];
  const scopeIssues: string[] = [];
  // TH-DISCOVERY-RESET-001 (production certification fix): a preliminary, metric-independent
  // version of the entity check below -- the scopeIssues pushes immediately following this were
  // designed for the scalar-count path ("this place/county isn't a supported *count* scope") and
  // otherwise fed straight into selectInstitutionVolume's `conditions.length` check, hard-blocking
  // the real institution rows that entity mode already correctly falls back to state grain for.
  // Only guards the two new entity triggers (broker(s), and Miami's bare-city companies/lenders);
  // every other scopeIssues push and the scalar-count path itself stay exactly as strict as before.
  // TH-DISCOVERY-PARITY-001A: ordinary provider-category vocabulary ("lender(s)",
  // "mortgage lender(s)", "mortgage compan(y|ies)", "home loan compan(y|ies)", "home
  // lender(s)", "mortgage broker(s)") is a consumer DISCOVERY request by default -- a
  // request to browse real HMDA-reporting institutions -- regardless of whether a
  // city/county was also named. This supersedes TH-SEARCH-R1-015's narrower default
  // (bare "[provider term] in <state>" fell through to a scalar HMDA count unless a
  // Miami/major-county match, "which"/"most" wording, or "broker(s)" was also present):
  // "home loan company in Texas" and "mortgage company in California" had no county
  // match and no "most"/"which", so they fell through to the count branch below and
  // dead-ended with zero providers whenever the extra wrapper words ("looking for",
  // "I need a") also tripped the count path's unsupported-remainder guard. Aggregate/
  // count mode now requires EXPLICIT aggregate wording (how many, number of, count,
  // applications, originations, denials, market share, compare) -- the mere existence
  // of HMDA count data for a state must not turn an ordinary provider query into one.
  const explicitAggregateWording =
    q.includes('how many') ||
    q.includes('number of') ||
    /\bcounts?\b/.test(q) ||
    /\bapplications?\b/.test(q) ||
    /\borigina(?:tions?|ted|ting)\b/.test(q) ||
    /\bdenials?\b|\bdenied\b/.test(q) ||
    q.includes('market share') ||
    q.includes('compare');
  const providerCategoryPresent =
    /\b(?:lenders?|mortgage lenders?|mortgage compan(?:y|ies)|home loan compan(?:y|ies)|home lenders?|mortgage brokers?|home loans?|refinanc(?:e|ing) compan(?:y|ies)|refinanc(?:e|ing) lenders?|loan specialists?|banks? for (?:a )?home loans?|home financing compan(?:y|ies)|home financing|financing compan(?:y|ies))\b/.test(q);
  const entityLikely =
    (/\bbrokers?\b/.test(q) && !explicitAggregateWording) ||
    ((bareCityRecognized || Boolean(nonFloridaCounty)) && /\b(?:companies|company|lenders?|brokers?)\b/.test(q)) ||
    (providerCategoryPresent && !explicitAggregateWording);
  if (states.length > 1) scopeIssues.push('More than one jurisdiction was requested. Select one state for a scalar count.');
  // A place phrase must be resolved; national is only the explicit/default scope.
  const place = q.match(/\b(?:in|within|for properties in)\s+(.+?)(?:[?]|$)/)?.[1];
  if (place && !entityLikely) {
    let remainder = place;
    for (const [code, name] of Object.entries(STATE_NAMES).sort((a,b) => b[1].length - a[1].length)) remainder = remainder.replace(new RegExp(`\\b${name.replaceAll('.', '[.]')}\\b|\\b${code}\\b`, 'gi'), '');
    remainder = remainder.replace(/\b(?:the|united states|u\.s\.?|usa|nation|nationally|nationwide|hmda|reporting|vintage|year|current|research|universe|in|and|or|applications?|originations?|denials?|mortgages?|properties|202\d)\b/g, '').replace(/[^a-z]/g, '');
    if (remainder && !detectCounties(q).length) scopeIssues.push(`The requested place or condition "${place}" is not resolved by this count source. Select a supported state or county.`);
  }
  if (states.length && /\b(?:nationally|nationwide|united states|usa)\b/.test(q) && !/\bcompare\b/.test(q)) scopeIssues.push('Both state and national scope were requested. Select one scope for a scalar count.');
  const counties = detectCounties(q);
  if (!counties.length && !entityLikely && /\b(?:county|city|zip|radius)\b/.test(q)) scopeIssues.push('The requested local geography is not available in this count source.');
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

  // TH-DISCOVERY-PARITY-001A-REVIEW: "refinance lender", "refinance company", and
  // "bank for a home loan" name ordinary DISCOVERY vocabulary -- "refinance"/"bank"
  // here describe why the consumer wants a lender, not a deliberate request to see
  // the institution file broken down by loan PURPOSE or lender CLASS (a breakdown
  // institution-volume.ts's file genuinely does not support -- see its own
  // `loanPurpose?.length || lenderType?.length` UNSUPPORTED guard). Only a genuine
  // pre-existing ranking trigger (brokers, Miami/major-county + companies/lenders,
  // or explicit "which"/"most" wording) legitimately asks for that breakdown; the
  // new bare provider-category default must not carry it, or an ordinary discovery
  // query silently inherits an unsupported filter and dead-ends at execution.
  // NOTE: deliberately NOT reusing entityLikely's bareCityRecognized/nonFloridaCounty
  // or bare-"brokers" clauses here -- those answer "should this trigger entity/
  // discovery mode at all" (a geography-grain question), which is orthogonal to "did
  // the consumer ask for a purpose/lender-class BREAKDOWN" (an intent question). A
  // county being recognized (e.g. "refinance lenders near Denver Colorado") must not
  // by itself flip "refinance" from vocabulary into a preserved filter. Only explicit
  // ranking wording (which/most) or a loanType (FHA/VA/conventional/USDA -- itself a
  // supported institution-level filter, so combining it with a purpose/depository
  // word signals deliberate structured filtering, e.g. "FHA purchase mortgage
  // companies") count as genuine intent to see that breakdown (see
  // r15-behavior.test.ts's "'companies' synonym fix does not swallow a real
  // unsupported condition").
  const genuineRankingIntent =
    wantsEntity(q, metric, explicitAggregateWording) ||
    Boolean(loanType?.length);

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
  // TH-SEARCH-R1-015: "companies" is a plain-language synonym for "lenders" here (see
  // the addendum's "mortgage companies in Florida" ground-truth case). Without it, this
  // scalar-count remainder check treated "companies" as an unsupported condition and
  // fail-closed a question the homepage's own FL branch already answers correctly --
  // exactly the two-surfaces divergence this ticket exists to close.
  countRemainder = countRemainder.replace(/\b(?:which|lenders?|companies|company|institutions?|most|highest|volume|how|many|what|is|are|was|were|the|a|an|of|for|in|within|and|or|by|from|during|to|show|me|give|report|reported|total|number|count|counts|mortgage|mortgages|loan|loans|applications?|originations?|originated|denials?|denied|properties|property|census|location|geography|state|county|market|activity|hmda|reporting|vintage|year|national|nationally|nationwide|united|states|us|usa|current|research|universe|received|filed|all|taken)\b|\b(?:19|20)\d{2}\b/g, ' ').replace(/[^a-z0-9$]/g, '').trim();
  if (countRemainder && !entityLikely) scopeIssues.push('Some requested geography or count conditions are not supported by this source. Edit the request or select a supported state/action; no broader count was substituted.');


  if (q.includes('what does') || q.includes('what does originated') || q.includes('mean in hmda')) {
    return { mode: 'definition', definitionId: 'origination', requestedMetric: null };
  }

  // TH-DISCOVERY-RESET-001 (production certification fix): a bare-city query ("mortgage companies
  // in Miami") is inherently a request to browse real institutions at that specific place, unlike
  // "mortgage companies in Florida" -- a genuine, already-established scalar-count ground truth
  // (489,025 originations, not a 1,794-institution list) that must stay unaffected. Gated on the
  // city recognition above, not a blanket "companies" keyword match, so it never reinterprets the
  // existing state-level case.
  const entity = wantsEntity(q, metric, explicitAggregateWording) || entityLikely;

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
      reportingYears, scopeIssues,
      // Dropped (not merely deprioritized) unless a genuine ranking trigger asked
      // for this breakdown -- institution-volume.ts hard-UNSUPPORTEDs the whole
      // institution list the moment either is present, so carrying them through
      // for the bare discovery default silently turns "refinance lender" into a
      // zero-result execution failure instead of an ordinary browseable list.
      loanPurpose: genuineRankingIntent ? loanPurpose : undefined,
      lenderType: genuineRankingIntent ? lenderType : undefined,
      actionTaken: action,
      loanType,
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

// TH-SEARCH-R1-015: New Jersey previously hard-refused any question naming NJ plus
// licensed/lender(s)/roster/RMLA language, even though real acquired HMDA institution
// and scalar data for NJ answers most of those questions (parseLenderAskCore already
// resolves such a question to a real 'entity' or 'count' plan once nothing upstream of
// this point short-circuits it). Rather than reintroducing an early hard block, this
// wrapper lets the real question execute and attaches the roster limitation as a
// non-blocking coverage caveat on the real result -- see NJ_RMLA_COVERAGE_NOTE and its
// use in scalar-count.ts / execute-query.ts. Only fires when the resolved geography is
// NJ (not merely because "new jersey" appears in the text) and the mode is a real,
// executable result (never overrides an existing fail_closed for some other reason).
export function parseLenderAsk(raw: string): LenderResearchQuery {
  const result = parseLenderAskCore(raw);
  if (result.mode === 'fail_closed' || result.coverageState) return result;
  const q = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  const mentionsNjRoster = /\bnew jersey\b|\brmla\b/i.test(q) && /\blicensed\b|\blenders?\b|\broster\b|\brmla\b/i.test(q);
  if (mentionsNjRoster && result.geography?.state === 'NJ') {
    return { ...result, coverageState: 'REQUEST_ONLY' };
  }
  return result;
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
