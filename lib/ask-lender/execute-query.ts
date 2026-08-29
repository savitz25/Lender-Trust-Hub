import { CFPB_COMPANY_MAPPINGS } from '@/lib/cfpb/mappings';
import { loadCfpbSnapshot } from '@/lib/cfpb/load';
import { buildLenderHomeIntel } from '@/lib/home-intel/build';
import { DISCOVERY_RECORDS, nationalPresentationName } from '@/lib/national-profile/discovery';
import { isNationalRenderSlug } from '@/lib/national-profile/publication';
import { nationalProfilePath } from '@/lib/national-profile/cohort';
import { ASK_SOURCE_FILES, loadAskCatalog, metricFromCounty, metricFromState, type CountyLeiRow, type StateLeiRow } from './catalog';
import { executeLenderAsk, interpretationLines } from './execute';
import { displayNameForLei, identityStats, profileHref, resolveLeiIdentity } from './identity';
import { applyAskOverrides, parseLenderAsk, type AskUrlOverrides } from './parse';
import {
  ASK_GEO_NOTE,
  ASK_PAGE_SIZE,
  type AskAction,
  type AskExecution,
  type AskFilterChip,
  type AskInstitutionRow,
  type AskLoanType,
  type AskTrace,
  type LenderResearchQuery,
} from './types';

export type AskQueryInput = {
  q: string;
  page?: number;
  pageSize?: number;
  overrides?: AskUrlOverrides;
};

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

function asAction(query: LenderResearchQuery): AskAction {
  const a = query.actionTaken?.[0];
  if (a === 'application' || a === 'denial' || a === 'origination') return a;
  return 'origination';
}

function asLoanType(query: LenderResearchQuery): AskLoanType | undefined {
  const t = query.loanType?.[0];
  if (t === 'conventional' || t === 'FHA' || t === 'VA' || t === 'USDA' || t === 'other') return t;
  return undefined;
}

function metricLabel(action: AskAction, loanType?: AskLoanType): string {
  const type = loanType ? `${loanType} ` : '';
  if (action === 'origination') return `${type}originations`.trim();
  if (action === 'denial') return `${type}denials`.trim();
  return `${type}applications`.trim();
}

function sharePath(q: string, page: number, overrides: AskUrlOverrides): string {
  const params = new URLSearchParams();
  params.set('q', q);
  if (page > 1) params.set('page', String(page));
  if (overrides.action) params.set('action', overrides.action);
  if (overrides.loanType) params.set('loanType', overrides.loanType);
  if (overrides.geo) params.set('geo', overrides.geo);
  return `/ask?${params.toString()}`;
}

function filterChips(q: string, query: LenderResearchQuery, overrides: AskUrlOverrides): AskFilterChip[] {
  const action = asAction(query);
  const geo = query.geography?.countyFips === '12011' ? 'broward' : query.geography?.countyFips === '12099' ? 'palm-beach' : query.geography?.state === 'FL' ? 'FL' : '';
  const loan = asLoanType(query) ?? 'all';
  const chip = (id: string, label: string, next: AskUrlOverrides, active: boolean): AskFilterChip => ({
    id,
    label,
    active,
    href: sharePath(q, 1, { action: overrides.action ?? action, loanType: overrides.loanType ?? (loan === 'all' ? 'all' : loan), geo: overrides.geo ?? geo, ...next }),
  });
  return [
    chip('orig', 'Originations', { action: 'origination' }, action === 'origination'),
    chip('apps', 'Applications', { action: 'application' }, action === 'application'),
    chip('den', 'Denials', { action: 'denial' }, action === 'denial'),
    chip('all-type', 'All loan types', { loanType: 'all' }, loan === 'all'),
    chip('conv', 'Conventional', { loanType: 'conventional' }, loan === 'conventional'),
    chip('fha', 'FHA', { loanType: 'FHA' }, loan === 'FHA'),
    chip('va', 'VA', { loanType: 'VA' }, loan === 'VA'),
    chip('fl', 'Florida', { geo: 'FL' }, geo === 'FL'),
    chip('br', 'Broward', { geo: 'broward' }, geo === 'broward'),
    chip('pb', 'Palm Beach', { geo: 'palm-beach' }, geo === 'palm-beach'),
  ];
}

function baseTrace(method: string, grain: string): AskTrace {
  return {
    sourceFiles: ASK_SOURCE_FILES,
    method,
    indexes: ['in-memory LEI map', 'in-memory county FIPS map', 'lend-nat-016 LEI→public slug'],
    identityPolicy:
      'LEI is the HMDA grain. Public-profile links require an exact LEI match to the national publication cohort and a compatible legal name. Name-only matching is not used.',
    publicationGate: '181 national render / 180 index / 130 Florida public. Unpublished identities stay unpublished.',
    cache: 'module-level CSV/JSON catalogs (no new ingest, no Production write)',
    grain,
    period: 'HMDA 2025 reporting vintage',
  };
}

function toRow(lei: string, rank: number, metric: number, label: string, extras: { applications: number | null; originations: number | null; denials: number | null }): AskInstitutionRow {
  const id = resolveLeiIdentity(lei);
  const href = profileHref(id.publicSlug);
  const why = [
    `HMDA 2025 ${label} for the requested property geography.`,
    `Ranked by raw ${label} count. Most is volume, not a recommendation.`,
    id.identityNote,
  ];
  if (id.nmls) why.push(`NMLS institution credential ${id.nmls} is shown only when the LEI identity file carries it.`);
  return {
    rank,
    lei,
    displayName: displayNameForLei(lei),
    metric,
    metricLabel: label,
    applications: extras.applications,
    originations: extras.originations,
    denials: extras.denials,
    identityStatus: id.identityStatus,
    identityNote: id.identityNote,
    href,
    hrefLabel: href ? 'Public research profile' : undefined,
    whyMatched: why,
    nmls: id.nmls,
  };
}

function paginate<T>(rows: T[], page: number, pageSize: number): { slice: T[]; page: number; pageCount: number } {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return { slice: rows.slice(start, start + pageSize), page: safePage, pageCount };
}

function rankState(
  rows: StateLeiRow[],
  action: AskAction,
  loanType: AskLoanType | undefined,
): Array<{ lei: string; metric: number; applications: number; originations: number }> {
  const out: Array<{ lei: string; metric: number; applications: number; originations: number }> = [];
  for (const row of rows) {
    const metric = metricFromState(row, action, loanType);
    if (metric == null || metric <= 0) continue;
    out.push({ lei: row.lei, metric, applications: row.applications, originations: row.originations });
  }
  out.sort((a, b) => b.metric - a.metric || a.lei.localeCompare(b.lei));
  return out;
}

function rankCounty(
  rows: CountyLeiRow[],
  action: AskAction,
  loanType: AskLoanType | undefined,
): Array<{ lei: string; metric: number; applications: number; originations: number; denials: number }> {
  const out: Array<{ lei: string; metric: number; applications: number; originations: number; denials: number }> = [];
  for (const row of rows) {
    const metric = metricFromCounty(row, action, loanType);
    if (metric <= 0) continue;
    out.push({
      lei: row.lei,
      metric,
      applications: row.applications,
      originations: row.originations,
      denials: row.denials,
    });
  }
  out.sort((a, b) => b.metric - a.metric || a.lei.localeCompare(b.lei));
  return out;
}

function executeCfpbEntity(q: string, query: LenderResearchQuery, page: number, pageSize: number, overrides: AskUrlOverrides): AskExecution {
  const snap = loadCfpbSnapshot();
  const byCompany = new Map((snap?.companies ?? []).map((c) => [c.company, c.totalComplaints]));
  const allowed = new Set(['curated-exact', 'curated-dba']);
  const ranked: AskInstitutionRow[] = [];
  const seen = new Set<string>();
  for (const mapping of CFPB_COMPANY_MAPPINGS) {
    if (!allowed.has(mapping.matchMethod)) continue;
    let total = 0;
    const used: string[] = [];
    for (const name of mapping.cfpbCompanyNames) {
      const n = byCompany.get(name);
      if (n != null) {
        total += n;
        used.push(name);
      }
    }
    if (total <= 0) continue;
    const nmls = mapping.nmlsIds?.[0] ?? null;
    const profile = DISCOVERY_RECORDS.find((r) => (nmls && r.nmls === nmls) || r.slug === mapping.ourLenderSlug);
    const renderOk = Boolean(profile && isNationalRenderSlug(profile.slug));
    const key = profile?.institution_id || mapping.ourLenderSlug;
    if (seen.has(key)) continue;
    seen.add(key);
    const name = profile
      ? nationalPresentationName(profile.canonical_name, profile.display_name) || profile.canonical_name
      : mapping.cfpbCompanyNames[0]!;
    const href = renderOk && profile ? nationalProfilePath(profile.slug) : undefined;
    ranked.push({
      rank: 0,
      lei: profile?.lei || '',
      displayName: name,
      metric: total,
      metricLabel: 'attached CFPB mortgage observations (curated exact/DBA bridge)',
      applications: null,
      originations: null,
      denials: null,
      identityStatus: href ? 'public_profile' : 'unpublished_research_identity',
      identityNote: mapping.matchNote,
      href,
      hrefLabel: href ? 'Public research profile' : undefined,
      whyMatched: [
        'Counted only when a curated exact or DBA CFPB company-name bridge exists.',
        'Unattached CFPB observations are excluded.',
        'A complaint is a consumer-submitted observation, not a finding of wrongdoing.',
        'Raw complaint count is not size-normalized and is not a quality score.',
        mapping.matchNote,
      ],
      nmls,
    });
  }
  ranked.sort((a, b) => b.metric - a.metric);
  ranked.forEach((row, i) => {
    row.rank = i + 1;
  });
  const { slice, page: safePage, pageCount } = paginate(ranked, page, pageSize);
  const intel = buildLenderHomeIntel();
  const attached = intel.stateOfRecord.find((m) => m.id === 'cfpb-mortgage');
  return {
    query,
    interpretation: interpretationLines(query),
    geographyWarning: ASK_GEO_NOTE,
    headline: 'Indexed CFPB mortgage complaints on confirmed company bridges',
    body: 'Only curated exact/DBA company-name bridges are ranked. Affiliate mappings and unattached observations are excluded. Complaint count is not wrongdoing and is not adjusted for lender size.',
    rows: slice,
    totalRows: ranked.length,
    page: safePage,
    pageSize,
    pageCount,
    facts: attached
      ? [
          { label: 'Mortgage observations in homepage snapshot', value: attached.display },
          ...attached.components.map((c) => ({ label: c.label, value: c.value })),
          { label: 'Rows in this ranking', value: fmt(ranked.length) },
        ]
      : [{ label: 'Rows in this ranking', value: fmt(ranked.length) }],
    caveats: [
      'Unattached CFPB rows (262,778 in the homepage snapshot) are excluded.',
      'Confirmed source-company bridges on the graph are a small label set (74 of 2,499).',
      'This ranking uses the committed CFPB company snapshot plus curated mappings, not a live CFPB search.',
    ],
    filters: filterChips(q, query, overrides),
    trace: baseTrace('CFPB snapshot companies ⋈ curated exact/DBA mappings. Affiliate mappings omitted.', 'CFPB company label (confirmed bridge only)'),
    sharePath: sharePath(q, safePage, overrides),
    period: 'CFPB mortgage product snapshot (committed file)',
    grain: 'confirmed CFPB company-name bridge',
    denominator: { label: 'Bridged companies with snapshot rows', value: ranked.length },
  };
}

function entityCaveats(action: AskAction, loanType: AskLoanType | undefined, grain: string): string[] {
  const extra: string[] = [
    'Most is a raw count, not best, safest, or recommended.',
    'HMDA is a 2025 reporting vintage, not current 2026 lending.',
    'Property geography is not headquarters, branch location, or service territory.',
    'Public-profile links are a publication gate. Unpublished HMDA LEIs stay unpublished.',
  ];
  if (grain.includes('county') && action === 'denial') extra.push('Denial counts are not denial reasons and are not a discrimination finding.');
  if (loanType) extra.push(`${loanType} splits use the corresponding orig_* / apps_* columns on the same observation grain.`);
  extra.push('Purchase/refinance originations are not populated at LEI grain and are not reconstructed.');
  return extra;
}

export function executeAskQuery(input: AskQueryInput): AskExecution {
  const started = Date.now();
  const raw = input.q ?? '';
  const pageSize = input.pageSize && input.pageSize > 0 ? Math.min(25, input.pageSize) : ASK_PAGE_SIZE;
  const overrides = input.overrides ?? {};
  const parsed = applyAskOverrides(parseLenderAsk(raw), overrides);
  const intel = buildLenderHomeIntel();

  if (parsed.mode === 'fail_closed' || parsed.mode === 'definition' || parsed.mode === 'evidence' || (parsed.mode === 'count' && !parsed.geography?.countyFips && !parsed.loanType) || (parsed.mode === 'comparison' && parsed.geography?.grain === 'state')) {
    const snap = executeLenderAsk(raw, intel);
    // Re-parse after overrides for fail_closed kinds that URL cannot lift.
    if (parsed.mode === 'fail_closed') {
      const fail = executeLenderAsk(raw, intel);
      return { ...fail, query: parsed, interpretation: interpretationLines(parsed), failClosed: true, sharePath: sharePath(raw, 1, overrides), elapsedMs: Date.now() - started, period: 'HMDA 2025', grain: parsed.geography?.grain, caveats: [parsed.failReason ?? fail.body] };
    }
    if (parsed.mode === 'definition' || parsed.mode === 'evidence' || (parsed.mode === 'comparison' && parsed.geography?.grain === 'state') || (parsed.mode === 'count' && parsed.geography?.grain !== 'county' && !parsed.loanType)) {
      return {
        ...snap,
        query: parsed,
        interpretation: interpretationLines(parsed),
        sharePath: sharePath(raw, 1, overrides),
        elapsedMs: Date.now() - started,
        period: 'HMDA 2025 reporting vintage',
        grain: snap.query.geography?.grain,
        filters: filterChips(raw, parsed, overrides),
        trace: baseTrace('Homepage intelligence snapshot (no institution ranking).', snap.query.geography?.grain ?? 'snapshot'),
      };
    }
  }

  if (parsed.mode === 'entity' && parsed.evidenceFamilies?.includes('cfpb')) {
    const result = executeCfpbEntity(raw, parsed, input.page ?? 1, pageSize, overrides);
    result.elapsedMs = Date.now() - started;
    return result;
  }

  const catalog = loadAskCatalog();
  const action = asAction(parsed);
  const loanType = asLoanType(parsed);
  const label = metricLabel(action, loanType);

  if (parsed.mode === 'comparison' && parsed.geography?.grain === 'county') {
    const a = catalog.countyMarkets.find((m) => m.countyFips === parsed.geography?.countyFips);
    const b = catalog.countyMarkets.find((m) => m.countyFips === parsed.geography?.compareCountyFips);
    const facts: Array<{ label: string; value: string }> = [];
    const pushMarket = (tag: string, row?: (typeof catalog.countyMarkets)[number]) => {
      if (!row) return;
      facts.push({ label: `${tag} applications`, value: fmt(row.applications) });
      facts.push({ label: `${tag} originations`, value: fmt(row.originations) });
      facts.push({ label: `${tag} denials`, value: fmt(row.denials) });
      if (row.purchaseApps != null) facts.push({ label: `${tag} purchase-purpose applications (not originations)`, value: fmt(row.purchaseApps) });
      if (row.refinanceApps != null) facts.push({ label: `${tag} refinance-purpose applications (not originations)`, value: fmt(row.refinanceApps) });
    };
    pushMarket(parsed.geography?.county ?? 'County A', a);
    pushMarket(parsed.geography?.compareCounty ?? 'County B', b);
    return {
      query: parsed,
      interpretation: interpretationLines(parsed),
      geographyWarning: ASK_GEO_NOTE,
      headline: `${parsed.geography?.county} vs ${parsed.geography?.compareCounty} — HMDA 2025 county-grain property geography`,
      body: 'Same vintage and county grain. This is not which county is better. Volume reflects reporting and housing activity, not lender quality. Purchase/refinance figures are application purpose, not originations.',
      facts,
      filters: filterChips(raw, parsed, overrides),
      trace: baseTrace('county_market_summary.csv county totals. Not LEI ranking.', 'HMDA 2025 county market'),
      sharePath: sharePath(raw, 1, overrides),
      period: 'HMDA 2025 reporting vintage',
      grain: 'county market (property geography)',
      caveats: entityCaveats(action, loanType, 'county market'),
      elapsedMs: Date.now() - started,
    };
  }

  if ((parsed.mode === 'count' || parsed.mode === 'aggregate') && parsed.geography?.grain === 'county') {
    const market = catalog.countyMarkets.find((m) => m.countyFips === parsed.geography?.countyFips);
    const value = action === 'origination' ? market?.originations : action === 'denial' ? market?.denials : market?.applications;
    const facts = [
      { label: `${parsed.geography?.county} ${label}`, value: market ? fmt(value ?? 0) : 'unavailable' },
      { label: 'Grain', value: 'HMDA 2025 county market (property geography)' },
    ];
    if (loanType && market) {
      const typeOrig = loanType === 'FHA' ? market.origFha : loanType === 'VA' ? market.origVa : loanType === 'conventional' ? market.origConventional : loanType === 'USDA' ? market.origUsda : null;
      if (typeOrig != null && action === 'origination') facts[0] = { label: `${parsed.geography?.county} ${label}`, value: fmt(typeOrig) };
    }
    if (parsed.loanPurpose?.includes('purchase') && market?.purchaseApps != null) {
      facts.push({ label: 'Purchase-purpose applications (not originations)', value: fmt(market.purchaseApps) });
    }
    return {
      query: parsed,
      interpretation: interpretationLines(parsed),
      geographyWarning: ASK_GEO_NOTE,
      headline: `Reported HMDA 2025 ${label} for properties in ${parsed.geography?.county} County, Florida`,
      body: 'County-grain market totals. Not lenders located in the county and not a service-territory map.',
      facts,
      href: '/florida',
      hrefLabel: 'Florida mortgage intelligence',
      filters: filterChips(raw, parsed, overrides),
      trace: baseTrace('county_market_summary.csv', 'HMDA 2025 county market'),
      sharePath: sharePath(raw, 1, overrides),
      period: 'HMDA 2025 reporting vintage',
      grain: 'county market (property geography)',
      caveats: entityCaveats(action, loanType, 'county market'),
      elapsedMs: Date.now() - started,
    };
  }

  if ((parsed.mode === 'count' || parsed.mode === 'aggregate') && parsed.loanType && parsed.geography?.state === 'FL') {
    const fl = catalog.stateRows.filter((r) => r.state === 'FL');
    let total = 0;
    for (const row of fl) {
      const v = metricFromState(row, action, loanType);
      if (v != null) total += v;
    }
    if (action === 'application' || action === 'denial') {
      total = 0;
      for (const row of catalog.flCountyByLei.values()) total += metricFromCounty(row, action, loanType);
    }
    return {
      query: parsed,
      interpretation: interpretationLines(parsed),
      geographyWarning: ASK_GEO_NOTE,
      headline: `Reported HMDA 2025 ${label} for properties in Florida`,
      body: action === 'origination' && loanType
        ? `Sum of ${loanType} origination splits on Florida state-grain LEI rows. Not a ranking of “best” ${loanType} lenders.`
        : 'Florida property-geography total from committed HMDA observations.',
      facts: [
        { label: `Florida ${label}`, value: fmt(total) },
        { label: 'LEI rows', value: fmt(fl.length) },
      ],
      href: '/florida',
      hrefLabel: 'Florida mortgage intelligence',
      filters: filterChips(raw, parsed, overrides),
      trace: baseTrace('lender_state_summary.csv FL rows (origination splits) or county-sum for applications/denials.', action === 'origination' ? 'state LEI' : 'county LEI summed to Florida'),
      sharePath: sharePath(raw, 1, overrides),
      period: 'HMDA 2025 reporting vintage',
      grain: action === 'origination' ? 'state LEI' : 'county LEI summed to Florida',
      caveats: entityCaveats(action, loanType, 'state'),
      elapsedMs: Date.now() - started,
    };
  }

  if (parsed.mode !== 'entity') {
    const snap = executeLenderAsk(raw, intel);
    return { ...snap, query: parsed, interpretation: interpretationLines(parsed), sharePath: sharePath(raw, 1, overrides), elapsedMs: Date.now() - started };
  }

  const stats = identityStats();
  let ranked: AskInstitutionRow[] = [];
  let grain = 'HMDA 2025 state LEI (property geography)';
  let method = 'Sort state-grain LEI rows by raw count.';
  let denominatorValue = 0;
  let denominatorLabel = `Florida ${label}`;

  if (parsed.geography?.grain === 'county' && parsed.geography.countyFips) {
    const rows = catalog.countyRows.filter((r) => r.countyFips === parsed.geography!.countyFips);
    const rankedRaw = rankCounty(rows, action, loanType);
    ranked = rankedRaw.map((r, i) =>
      toRow(r.lei, i + 1, r.metric, label, { applications: r.applications, originations: r.originations, denials: r.denials }),
    );
    denominatorValue = rankedRaw.reduce((s, r) => s + r.metric, 0);
    denominatorLabel = `${parsed.geography.county} County ${label}`;
    grain = `HMDA 2025 county LEI · ${parsed.geography.county} County, FL (property geography)`;
    method = `Filter lender_activity_by_county.csv to county_fips=${parsed.geography.countyFips}; sort by ${label}.`;
  } else if (parsed.geography?.state === 'FL' && (action === 'denial' || (loanType && action === 'application'))) {
    const rankedRaw = rankCounty([...catalog.flCountyByLei.values()], action, loanType);
    ranked = rankedRaw.map((r, i) =>
      toRow(r.lei, i + 1, r.metric, label, { applications: r.applications, originations: r.originations, denials: r.denials }),
    );
    denominatorValue = rankedRaw.reduce((s, r) => s + r.metric, 0);
    grain = 'HMDA 2025 county LEI summed to Florida (property geography)';
    method = `Sum Florida county-grain rows per LEI; sort by ${label}. State-grain files do not carry this split.`;
  } else if (parsed.geography?.state === 'FL') {
    const fl = catalog.stateRows.filter((r) => r.state === 'FL');
    const rankedRaw = rankState(fl, action, loanType);
    ranked = rankedRaw.map((r, i) =>
      toRow(r.lei, i + 1, r.metric, label, { applications: r.applications, originations: r.originations, denials: null }),
    );
    denominatorValue = rankedRaw.reduce((s, r) => s + r.metric, 0);
    grain = 'HMDA 2025 state LEI · Florida (property geography)';
    method = `Filter lender_state_summary.csv to state=FL; sort by ${label}.`;
  } else {
    const byLei = new Map<string, { lei: string; metric: number; applications: number; originations: number }>();
    for (const row of catalog.stateRows) {
      const metric = metricFromState(row, action, loanType);
      if (metric == null) continue;
      const cur = byLei.get(row.lei);
      if (!cur) byLei.set(row.lei, { lei: row.lei, metric, applications: row.applications, originations: row.originations });
      else {
        cur.metric += metric;
        cur.applications += row.applications;
        cur.originations += row.originations;
      }
    }
    const rankedRaw = [...byLei.values()].filter((r) => r.metric > 0).sort((a, b) => b.metric - a.metric || a.lei.localeCompare(b.lei));
    ranked = rankedRaw.map((r, i) =>
      toRow(r.lei, i + 1, r.metric, label, { applications: r.applications, originations: r.originations, denials: null }),
    );
    denominatorValue = rankedRaw.reduce((s, r) => s + r.metric, 0);
    denominatorLabel = `U.S. state-grain ${label} (sum of jurisdictions)`;
    grain = 'HMDA 2025 state LEI summed across jurisdictions';
    method = `Sum lender_state_summary.csv across states per LEI; sort by ${label}. Do not add county-grain rows.`;
  }

  const { slice, page: safePage, pageCount } = paginate(ranked, input.page ?? 1, pageSize);
  const publicCount = ranked.filter((r) => r.identityStatus === 'public_profile').length;
  const holdCount = ranked.filter((r) => r.identityStatus === 'identity_hold').length;
  const unnamed = ranked.filter((r) => r.identityStatus === 'lei_only').length;

  const place =
    parsed.geography?.county != null
      ? `${parsed.geography.county} County, Florida`
      : parsed.geography?.state === 'FL'
        ? 'Florida'
        : 'the United States';

  return {
    query: parsed,
    interpretation: interpretationLines(parsed),
    geographyWarning: ASK_GEO_NOTE,
    headline: `HMDA reporting institutions with the most ${label} for properties in ${place}`,
    body: `Ranked by raw ${label} in the 2025 HMDA vintage. Most is a volume count, not a recommendation. Unpublished research identities are shown at LEI grain and are not mass-published.`,
    rows: slice,
    totalRows: ranked.length,
    page: safePage,
    pageSize,
    pageCount,
    facts: [
      { label: 'Reporting LEIs with this metric > 0', value: fmt(ranked.length) },
      { label: denominatorLabel, value: fmt(denominatorValue) },
      { label: 'Public-profile matches on this result set', value: fmt(publicCount) },
      { label: 'Identity holds (LEI/name conflict)', value: fmt(holdCount) },
      { label: 'LEI-only (no committed legal name)', value: fmt(unnamed) },
      { label: 'Committed GLEIF names (Florida cache)', value: fmt(stats.gleifCount) },
    ],
    denominator: { label: denominatorLabel, value: denominatorValue },
    filters: filterChips(raw, parsed, overrides),
    trace: baseTrace(method, grain),
    sharePath: sharePath(raw, safePage, overrides),
    period: 'HMDA 2025 reporting vintage',
    grain,
    caveats: entityCaveats(action, loanType, grain),
    elapsedMs: Date.now() - started,
  };
}
