import snapshot from './snapshot.json';
import { fingerprintLenderHomeIntel } from './fingerprint';
import { STATE_NAMES } from './states';
import {
  LENDER_HOME_INTEL_VERSION,
  LENDER_HOME_PUBLICATION_VERSION,
  type CoverageRow,
  type FeaturedStory,
  type LenderHomeIntel,
  type TraceMetric,
} from './types';

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((1000 * part) / whole) / 10;
}

const depository = snapshot.depository as { FDIC: number; NCUA: number; NONBANK: number; UNKNOWN: number };
const OTHER_ACTIONS = snapshot.applications - snapshot.originations - snapshot.denials;

export function buildLenderHomeIntel(generatedAt = '2026-08-27T00:00:00.000Z'): LenderHomeIntel {
  const maxApps = Math.max(...snapshot.geography.map((row) => row.applications));
  const stateOfRecord: TraceMetric[] = [
    {
      id: 'institutions',
      label: 'Canonical institution identities',
      display: fmt(snapshot.institutions),
      value: snapshot.institutions,
      unit: 'count',
      numerator: snapshot.institutions,
      denominator: null,
      grain: 'canonical institution entity',
      definition:
        'Count of lender_national_entities rows with entity_kind institution in the dedicated Lender graph.',
      components: [
        { label: 'Entity kind', value: 'institution', payloadKey: 'identity.institutions.kind' },
        { label: 'LPI snapshots (different grain)', value: fmt(snapshot.lpiSnapshots), payloadKey: 'identity.lpi' },
        { label: 'NMLS institution IDs (credentials, not entities)', value: fmt(snapshot.nmlsInstitution), payloadKey: 'identity.nmlsInstitution' },
      ],
      sourceIds: ['identity-graph'],
      officialAsOf: snapshot.retrievedAt,
      retrievedAt: snapshot.retrievedAt,
      method: 'select count(*) from lender_national_entities where entity_kind = institution',
      payloadKey: 'identity.institutions',
      limitations: [
        'An identity is not an NMLS credential, branch, MLO, or public profile.',
        `${fmt(snapshot.publicRender)} public national renders are not this denominator.`,
      ],
    },
    {
      id: 'public-national',
      label: 'Publicly researchable national profiles',
      display: `${fmt(snapshot.publicRender)} render / ${fmt(snapshot.publicIndex)} index`,
      value: snapshot.publicRender,
      unit: 'count',
      numerator: snapshot.publicIndex,
      denominator: snapshot.publicRender,
      grain: 'controlled national publication cohort',
      definition:
        'National render cohort (181) and index cohort (180). Not the 14,623 identity universe and not the 311 combined search union.',
      components: [
        { label: 'National render', value: fmt(snapshot.publicRender), payloadKey: 'publication.nationalRender' },
        { label: 'National index', value: fmt(snapshot.publicIndex), payloadKey: 'publication.nationalIndex' },
        { label: 'Florida public (separate cohort)', value: fmt(snapshot.floridaPublic), payloadKey: 'publication.floridaPublic' },
      ],
      sourceIds: ['publication-014', 'publication-florida'],
      officialAsOf: snapshot.retrievedAt,
      retrievedAt: snapshot.retrievedAt,
      method: 'Frozen lend-nat-014 render/index JSON plus Florida Phase 1+2 publication manifests.',
      payloadKey: 'publication.nationalRender',
      limitations: [
        '311 combined public search is 181 national-searchable plus 130 Florida-public with zero overlap. It is not a national lender total.',
      ],
    },
    {
      id: 'hmda-apps',
      label: 'HMDA 2025 county-grain applications',
      display: fmt(snapshot.applications),
      value: snapshot.applications,
      unit: 'count',
      numerator: snapshot.applications,
      denominator: null,
      grain: 'HMDA 2025 county-grain LEI observation, summed to national',
      definition:
        'Sum of applications on lender_hmda_observations where data_year=2025 and geo_grain=county. State-grain rows are excluded.',
      components: [
        { label: 'Year', value: String(snapshot.hmdaOfficialAsOf), payloadKey: 'hmda.year' },
        { label: 'Grain', value: snapshot.hmdaGrain, payloadKey: 'hmda.grain' },
        { label: 'Source vintage', value: snapshot.hmdaSourceVintage, payloadKey: 'hmda.vintage' },
      ],
      sourceIds: ['hmda-2025'],
      officialAsOf: snapshot.hmdaOfficialAsOf,
      retrievedAt: snapshot.retrievedAt,
      method: 'SUM(applications) county grain only. Do not add state-grain rows.',
      payloadKey: 'hmda.county.applications',
      limitations: [
        'HMDA is not every mortgage. County and state grains cannot be summed.',
        'LEI-keyed observations; institution attribution is incomplete.',
      ],
    },
    {
      id: 'hmda-orig',
      label: 'HMDA 2025 originations',
      display: fmt(snapshot.originations),
      value: snapshot.originations,
      unit: 'count',
      numerator: snapshot.originations,
      denominator: snapshot.applications,
      grain: 'HMDA 2025 county-grain LEI observation',
      definition: 'Sum of originations on the same county-grain 2025 rows as applications.',
      components: [
        { label: 'Originations', value: fmt(snapshot.originations), payloadKey: 'hmda.county.originations' },
        { label: 'Applications (same grain)', value: fmt(snapshot.applications), payloadKey: 'hmda.county.applications' },
      ],
      sourceIds: ['hmda-2025'],
      officialAsOf: snapshot.hmdaOfficialAsOf,
      retrievedAt: snapshot.retrievedAt,
      method: 'SUM(originations) county grain 2025.',
      payloadKey: 'hmda.county.originations',
      limitations: [
        'Originations / applications is not an approval rate or a consumer odds estimate.',
        'Other HMDA actions exist besides origination and denial.',
      ],
    },
    {
      id: 'cfpb-mortgage',
      label: 'CFPB mortgage complaint observations',
      display: fmt(snapshot.complaints),
      value: snapshot.complaints,
      unit: 'count',
      numerator: snapshot.complaints,
      denominator: null,
      grain: 'consumer-submitted CFPB mortgage product complaint observation',
      definition: 'Count of lender_cfpb_complaints rows in the mortgage product universe on this hub.',
      components: [
        { label: 'Attached to canonical institution', value: fmt(snapshot.complaintsAttached), payloadKey: 'cfpb.attached' },
        { label: 'Unattached', value: fmt(snapshot.complaintsUnattached), payloadKey: 'cfpb.unattached' },
        { label: 'Confirmed source-company bridges', value: String(snapshot.cfpbConfirmedBridges), payloadKey: 'cfpb.confirmedBridges' },
      ],
      sourceIds: ['cfpb-complaints'],
      officialAsOf: snapshot.retrievedAt,
      retrievedAt: snapshot.retrievedAt,
      method: 'count(*) from lender_cfpb_complaints (mortgage observations stored on this hub).',
      payloadKey: 'cfpb.mortgageObservations',
      limitations: [
        'A complaint is an observation, not a violation.',
        'Do not divide complaints by HMDA applications.',
      ],
    },
  ];

  const findings: FeaturedStory[] = [
    {
      storyId: 'institution-structure',
      storyType: 'BENCHMARK',
      title: 'Mortgage lending is not one kind of institution',
      summary: `Among ${fmt(snapshot.lpiSnapshots)} national intelligence snapshots, exclusive depository structure splits into FDIC-insured banks, NCUA credit unions, nonbank mortgage companies, and snapshots where depository identity is still unknown. These are different institutional and regulatory models — not a ranking.`,
      chartType: 'composition',
      chart: {
        caption: `Exclusive depository structure in ${fmt(snapshot.lpiSnapshots)} lender_profile_intelligence snapshots. Not the 14,623 identity universe and not the 181 public profiles.`,
        series: [
          { label: 'FDIC-insured banks', value: depository.FDIC, shareOf: snapshot.lpiSnapshots },
          { label: 'NCUA credit unions', value: depository.NCUA, shareOf: snapshot.lpiSnapshots },
          { label: 'Nonbank mortgage companies', value: depository.NONBANK, shareOf: snapshot.lpiSnapshots },
          { label: 'Depository unknown in snapshot', value: depository.UNKNOWN, shareOf: snapshot.lpiSnapshots },
        ],
        unit: 'count',
        max: snapshot.lpiSnapshots,
      },
      whyItMatters:
        'A bank, a credit union, and a nonbank mortgage company are licensed and supervised differently. Reading public evidence starts with knowing which structure you are looking at.',
      doesNotMean: [
        'One type is better, safer, or recommended.',
        'These four buckets partition all 14,623 canonical identities.',
        'Overlapping broker / holding-company / servicer classifications can be added into this pie.',
        'The 181 public national profiles are the national market.',
      ],
      sourceIds: ['lpi-011'],
      officialAsOf: snapshot.retrievedAt,
      retrievedAt: snapshot.retrievedAt,
      payloadKeys: ['lpi.depository.FDIC', 'lpi.depository.NCUA', 'lpi.depository.NONBANK', 'lpi.depository.UNKNOWN'],
    },
    {
      storyId: 'hmda-outcomes',
      storyType: 'BENCHMARK',
      title: 'What HMDA 2025 county-grain records show after application',
      summary: `On county-grain HMDA 2025 observations, lenders reported ${fmt(snapshot.applications)} applications, ${fmt(snapshot.originations)} originations, and ${fmt(snapshot.denials)} denials. ${fmt(OTHER_ACTIONS)} application records have other reported action outcomes. This is not a closed funnel.`,
      chartType: 'counts',
      chart: {
        caption:
          'Reported HMDA 2025 county-grain activity. Originations plus denials do not equal applications. Remaining records are other action outcomes, not hidden denials.',
        series: [
          { label: 'Reported applications', value: snapshot.applications, note: 'denominator for shares below' },
          {
            label: 'Reported originations',
            value: snapshot.originations,
            shareOf: snapshot.applications,
            note: `${pct(snapshot.originations, snapshot.applications).toFixed(1)}% of applications — not an approval rate`,
          },
          {
            label: 'Reported denials',
            value: snapshot.denials,
            shareOf: snapshot.applications,
            note: `${pct(snapshot.denials, snapshot.applications).toFixed(1)}% of applications — not your odds`,
          },
          {
            label: 'Other reported action outcomes',
            value: OTHER_ACTIONS,
            shareOf: snapshot.applications,
            note: `${pct(OTHER_ACTIONS, snapshot.applications).toFixed(1)}% of applications`,
          },
        ],
        unit: 'count',
        max: snapshot.applications,
      },
      whyItMatters:
        'Application, origination, and denial are related HMDA action families. Seeing all three plus the remainder helps you read market activity without treating the file as a personal underwriting model.',
      doesNotMean: [
        'An approval rate or a prediction of whether you will be approved.',
        'A closed funnel from application to origination to denial.',
        'State-grain rows added to county-grain rows.',
        'Denial-reason composition (DTI, credit, collateral) — that taxonomy is not in this payload.',
      ],
      sourceIds: ['hmda-2025'],
      officialAsOf: snapshot.hmdaOfficialAsOf,
      retrievedAt: snapshot.retrievedAt,
      payloadKeys: [
        'hmda.county.applications',
        'hmda.county.originations',
        'hmda.county.denials',
        'hmda.county.otherActions',
      ],
    },
    {
      storyId: 'complaint-coverage',
      storyType: 'GAP',
      title: 'Complaint evidence is extensive, but institution linkage is incomplete',
      summary: `This hub holds ${fmt(snapshot.complaints)} CFPB mortgage complaint observations. ${fmt(snapshot.complaintsAttached)} are attached to a canonical institution; ${fmt(snapshot.complaintsUnattached)} are unattached. Confirmed source-company bridges: ${snapshot.cfpbConfirmedBridges} of ${fmt(snapshot.cfpbLabels)} labels. This is evidence coverage, not a quality ranking.`,
      chartType: 'composition',
      chart: {
        caption: 'Attachment coverage of CFPB mortgage complaint observations. Unattached is not invalid. Attached is not a violation.',
        series: [
          {
            label: 'Attached to a canonical institution',
            value: snapshot.complaintsAttached,
            shareOf: snapshot.complaints,
            note: `${pct(snapshot.complaintsAttached, snapshot.complaints).toFixed(1)}% of observations`,
          },
          {
            label: 'Unattached observations',
            value: snapshot.complaintsUnattached,
            shareOf: snapshot.complaints,
            note: `${pct(snapshot.complaintsUnattached, snapshot.complaints).toFixed(1)}% of observations`,
          },
        ],
        unit: 'count',
        max: snapshot.complaints,
      },
      whyItMatters:
        'A large complaint file can still be only partly joinable to the institution graph. Coverage gaps are incompleteness, not a clean bill of health and not a finding against a company.',
      doesNotMean: [
        'Which lenders receive the most complaints, or who is worst.',
        'Violations, risk scores, or fairness scores.',
        'Unattached complaints are invalid.',
        'No complaint found means a clean history.',
        'Complaints per 10,000 HMDA applications — those universes are not compatible here.',
      ],
      sourceIds: ['cfpb-complaints'],
      officialAsOf: snapshot.retrievedAt,
      retrievedAt: snapshot.retrievedAt,
      payloadKeys: ['cfpb.mortgageObservations', 'cfpb.attached', 'cfpb.unattached', 'cfpb.confirmedBridges'],
    },
  ];

  const coverage: CoverageRow[] = [
    {
      family: 'Institution identity',
      display: `${fmt(snapshot.institutions)} canonical institution identities`,
      status: 'strong',
      method: 'National entity spine on the dedicated Lender database.',
      limitations: ['Identity is not a public profile.'],
    },
    {
      family: 'NMLS / registration',
      display: `${fmt(snapshot.nmlsInstitution)} NMLS institution identifiers`,
      status: 'partial',
      method: 'NMLS_INSTITUTION identifier slots. Not MLO or branch publication.',
      limitations: ['A credential is not an institution count.'],
    },
    {
      family: 'Depository identity',
      display: `Exclusive LPI depository on ${fmt(snapshot.lpiSnapshots)} snapshots`,
      status: 'partial',
      method: 'coverage.depository in lender_profile_intelligence: FDIC, NCUA, NONBANK, UNKNOWN.',
      limitations: [`${fmt(depository.UNKNOWN)} snapshots remain UNKNOWN.`],
    },
    {
      family: 'HMDA activity',
      display: `${fmt(snapshot.applications)} county-grain 2025 applications`,
      status: 'partial',
      method: 'LEI-keyed county-grain observations. No national-grain rows.',
      limitations: ['Not the entire mortgage universe. Attribution is incomplete.'],
    },
    {
      family: 'Originations',
      display: `${fmt(snapshot.originations)} county-grain 2025 originations`,
      status: 'partial',
      method: 'Same county-grain 2025 rows as applications.',
      limitations: ['Not an approval rate.'],
    },
    {
      family: 'Denial evidence',
      display: `${fmt(snapshot.denials)} county-grain denial counts`,
      status: 'limited',
      method: 'Denial counts exist. Denial-reason taxonomy is not in this payload.',
      limitations: ['Reason codes (DTI, credit, collateral) are deferred.'],
    },
    {
      family: 'Pricing',
      display: 'Homepage V1 deferred',
      status: 'not_yet_researched',
      method: 'Rate spread / charges require borrower, product, and timing controls that are not mature.',
      limitations: ['No pricing benchmark on this homepage.'],
    },
    {
      family: 'CFPB complaints',
      display: `${fmt(snapshot.complaints)} mortgage observations; ${fmt(snapshot.complaintsAttached)} attached`,
      status: 'partial',
      method: 'Stored mortgage complaint observations plus confirmed identity bridges.',
      limitations: ['Complaint ≠ violation. Linkage is incomplete.'],
    },
    {
      family: 'Federal enforcement',
      display: 'Federal enforcement observations exist on the graph',
      status: 'partial',
      method: 'lender_federal_enforcement_events (FDIC, OCC, Federal Reserve, CFPB).',
      limitations: ['An observation is not a flattened violation count. None observed is not a clean history.'],
    },
    {
      family: 'State enforcement',
      display: 'Florida OFR regulatory events on /florida; other states vary',
      status: 'limited',
      method: 'Florida state regulatory event graph. Not a 50-state enforcement encyclopedia.',
      limitations: ['State licensing and enforcement coverage differs.'],
    },
    {
      family: 'Servicer identity',
      display: 'Servicer-role evidence remains limited',
      status: 'limited',
      method: 'lender_servicer_role_evidence. Confirmed servicer classifications are sparse.',
      limitations: ['Incomplete servicer identity is not independence from servicing.'],
    },
  ];

  const draft: Omit<LenderHomeIntel, 'payloadFingerprint'> = {
    contractVersion: LENDER_HOME_INTEL_VERSION,
    homepagePublicationVersion: LENDER_HOME_PUBLICATION_VERSION,
    generatedAt,
    score: null,
    ranking: null,
    pricingHomepageV1: 'DEFERRED',
    changeModule: {
      status: 'UNSUPPORTED',
      reason:
        'Only one approved HMDA vintage (2025) is available for this homepage contract. Historical comparisons will become available as snapshots accumulate.',
    },
    stateOfRecord,
    findings,
    coverage,
    gaps: [
      'HMDA is not the entire mortgage universe and does not predict whether a particular consumer will be approved.',
      'County-grain and state-grain HMDA rows cannot be summed; this page uses county grain only.',
      'Pricing benchmarking is not ready for homepage V1.',
      'Complaints are consumer-submitted observations. Complaint ≠ violation. Unattached ≠ invalid. No complaint found ≠ clean history.',
      'Institution linkage for complaints is incomplete (confirmed bridges are a small label set).',
      'Servicer identity remains limited.',
      'State licensing coverage varies. Branch address does not define service area.',
      'No enforcement event found is not a clean history.',
      'The OFR MLO/branch employer-parent relationship public-record request remains pending. BELONGS_TO is not inferred.',
    ],
    verifyDirectly: [
      'Confirm the NMLS institution identity on Consumer Access and on the lender’s own disclosures.',
      'Read the actual Loan Estimate — public HMDA activity is not a substitute for offer economics.',
      'Ask who currently originates versus who will service the loan.',
      'If you need a state license, check that state’s regulator — not only this national page.',
    ],
    geography: snapshot.geography.map((row) => ({
      state: row.state,
      name: STATE_NAMES[row.state] ?? row.state,
      applications: row.applications,
      originations: row.originations,
      denials: row.denials,
      volumeShare: pct(row.applications, maxApps),
      intelligenceHref: row.state === 'FL' ? '/florida' : null,
      searchHref: '/lender',
    })),
    floridaPreview: {
      href: '/florida',
      applications: snapshot.geography.find((row) => row.state === 'FL')?.applications ?? 0,
      originations: snapshot.geography.find((row) => row.state === 'FL')?.originations ?? 0,
      publicProfiles: snapshot.floridaPublic,
      internalProfiles: snapshot.floridaInternal,
      note: 'Florida is the enhanced state intelligence page. It is not a ranking. MLO and branch profiles remain unpublished.',
    },
    askMarket: [
      {
        id: 'how-many-apps',
        question: 'How many mortgage applications are represented?',
        answer: `County-grain HMDA 2025 observations on this hub sum to ${fmt(snapshot.applications)} reported applications. That is a snapshot of reported activity, not a live market feed.`,
        href: '#record',
        hrefLabel: 'State of the record',
      },
      {
        id: 'how-many-orig',
        question: 'How many resulted in originations?',
        answer: `${fmt(snapshot.originations)} originations are reported on the same county-grain 2025 rows. That share of applications is not an approval rate.`,
        href: '#findings',
        hrefLabel: 'HMDA outcomes story',
      },
      {
        id: 'what-outcomes-mean',
        question: 'What do HMDA application outcomes mean?',
        answer:
          'HMDA records an action taken on a reported application. Origination and denial are two families. Other actions exist, so originations plus denials do not equal applications.',
        href: '#findings',
        hrefLabel: 'Explain the HMDA chart',
      },
      {
        id: 'bank-vs-nonbank',
        question: 'What is the difference between a bank, credit union and nonbank lender?',
        answer: `They are different institutional and regulatory models. This page shows exclusive depository structure in ${fmt(snapshot.lpiSnapshots)} intelligence snapshots (FDIC ${fmt(depository.FDIC)}, NCUA ${fmt(depository.NCUA)}, nonbank ${fmt(depository.NONBANK)}, unknown ${fmt(depository.UNKNOWN)}). Structure is not a quality score.`,
        href: '#findings',
        hrefLabel: 'Institution structure story',
      },
      {
        id: 'what-nmls',
        question: 'What does an NMLS ID tell me?',
        answer:
          'An NMLS institution identifier is a credential slot on a company identity. It is not a person (MLO) ID, not a branch ID, and not a recommendation.',
        href: '#record',
        hrefLabel: 'Trace identities',
      },
      {
        id: 'what-complaint',
        question: 'What does a CFPB complaint mean?',
        answer:
          'A complaint is a consumer-submitted observation. It is not a violation, not a TrustHub finding, and not proof of a clean record when absent. Many observations are not yet attached to a canonical institution.',
        href: '#findings',
        hrefLabel: 'Complaint coverage story',
      },
      {
        id: 'research-lender',
        question: 'How can I research a lender?',
        answer:
          `Use the controlled /lender discovery over ${fmt(snapshot.publicRender + snapshot.floridaPublic)} public company profiles (${fmt(snapshot.publicRender)} national-searchable plus ${fmt(snapshot.floridaPublic)} Florida-public). Then compare an actual Loan Estimate. Public evidence and offer economics are different questions.`,
        href: '/lender',
        hrefLabel: 'Research a lender',
      },
    ],
    tools: [
      { id: 'lender', label: 'Research a lender', href: '/lender', note: 'Controlled public discovery. Not a ranking.' },
      { id: 'le', label: 'Loan Estimate Analyzer', href: '/tools/loan-estimate-analyzer', note: 'Actual offer figures. Not a HMDA benchmark of your LE unless methodology matches.' },
      { id: 'le-compare', label: 'Compare Loan Estimates', href: '/tools/compare-loan-estimates', note: 'Compare offers, not a lender winner.' },
      { id: 'calculators', label: 'Mortgage calculators', href: '/calculators', note: 'Educational estimates.' },
      { id: 'florida', label: 'Florida Mortgage Intelligence', href: '/florida', note: 'Existing state intelligence. Unchanged in this task.' },
      { id: 'my-lending', label: 'Save research', href: '/my-lending', note: 'Workspace for your notes. Not a lender score.' },
    ],
    journey: [
      { step: 'NMLS / canonical identity', status: 'connected' },
      { step: 'State licensing / registration', status: 'partial' },
      { step: 'Depository / institution identity', status: 'partial' },
      { step: 'HMDA activity', status: 'partial' },
      { step: 'CFPB complaints', status: 'partial' },
      { step: 'Regulatory actions', status: 'partial' },
      { step: 'Public lender profile', status: 'partial' },
    ],
    sources: [
      {
        id: 'hmda-2025',
        dataset: 'HMDA LAR / institution activity summaries',
        agency: 'FFIEC / CFPB (HMDA)',
        officialAsOf: snapshot.hmdaOfficialAsOf,
        retrievedAt: snapshot.retrievedAt,
        usedFor: 'County-grain applications, originations, denials, state explorer volume',
        limitation: '2025 reporting vintage. Not live. Not a closed action-taken taxonomy dump.',
      },
      {
        id: 'cfpb-complaints',
        dataset: 'Consumer Complaint Database, mortgage product',
        agency: 'CFPB',
        officialAsOf: snapshot.retrievedAt,
        retrievedAt: snapshot.retrievedAt,
        usedFor: 'Complaint observation counts and attachment coverage',
        limitation: 'Consumer-submitted. Not findings. Attachment is incomplete.',
      },
      {
        id: 'identity-graph',
        dataset: 'lender_national_entities / lender_identifiers',
        agency: 'NMLS, FDIC, NCUA, GLEIF as joined on this hub',
        officialAsOf: snapshot.retrievedAt,
        retrievedAt: snapshot.retrievedAt,
        usedFor: 'Institution identity and identifier grains',
        limitation: 'Identity ≠ credential ≠ MLO ≠ branch.',
      },
      {
        id: 'lpi-011',
        dataset: 'lender_profile_intelligence',
        agency: 'SeniorTrustHub/LenderTrustHub derived snapshots',
        officialAsOf: snapshot.retrievedAt,
        retrievedAt: snapshot.retrievedAt,
        usedFor: 'Exclusive depository composition on 8,447 snapshots',
        limitation: 'Snapshot grain, not all 14,623 identities.',
      },
      {
        id: 'publication-014',
        dataset: 'lend-nat-014 render/index cohorts',
        agency: 'LenderTrustHub publication policy',
        officialAsOf: snapshot.retrievedAt,
        retrievedAt: snapshot.retrievedAt,
        usedFor: '181/180 public national cohort',
        limitation: 'Publication freeze. Not a market census.',
      },
      {
        id: 'publication-florida',
        dataset: 'Florida Phase 1+2 public company manifests',
        agency: 'Florida OFR + LenderTrustHub publication policy',
        officialAsOf: snapshot.retrievedAt,
        retrievedAt: snapshot.retrievedAt,
        usedFor: 'Florida preview counts and /florida link',
        limitation: 'OFR parent export pending. No MLO/branch pages.',
      },
    ],
    limitations: [
      'This page is not live HMDA, not a rate marketplace, and not a lender ranking.',
      'Public institution evidence is not the economics of a specific Loan Estimate.',
    ],
    doesNotInfer: [
      'No Trust Score, Research Score, or County Experience Score.',
      'No best/top/recommended lender.',
      'No consumer approval prediction.',
      'No complaint-to-violation flattening.',
      'No HMDA county+state double count.',
    ],
  };

  const payloadFingerprint = fingerprintLenderHomeIntel(draft);
  return { ...draft, payloadFingerprint };
}

export function getLenderHomeIntel(): LenderHomeIntel {
  return buildLenderHomeIntel();
}

export const HMDA_OTHER_ACTIONS = OTHER_ACTIONS;
