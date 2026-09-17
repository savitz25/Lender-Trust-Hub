export const LENDER_HOME_INTEL_VERSION = 'lender-home-intel-v1' as const;
export const LENDER_HOME_PUBLICATION_VERSION = 'intel-004-v1' as const;
export const LENDER_HOME_SNAPSHOT_CONTRACT = 'lender-home-intel-snapshot-v2' as const;

export type HomeIntelSnapshotV2 = {
  snapshotVersion: typeof LENDER_HOME_SNAPSHOT_CONTRACT | string;
  homepagePublicationVersion: string;
  generated_at: string;
  retrievedAt: string;
  hmdaOfficialAsOf: string;
  hmdaSourceVintage: string;
  hmdaGrain: string;
  institutions: number;
  lpiSnapshots: number;
  nmlsInstitution: number;
  publicRender: number;
  publicIndex: number;
  floridaPublic: number;
  floridaInternal: number;
  applications: number;
  originations: number;
  denials: number;
  complaints: number;
  complaintsAttached: number;
  complaintsUnattached: number;
  cfpbLabels: number;
  cfpbConfirmedBridges: number;
  depository: { FDIC: number; NCUA: number; NONBANK: number; UNKNOWN: number };
  geography: Array<{ state: string; applications: number; originations: number; denials: number }>;
  graph: {
    branch_entities: number;
    person_mlo_entities: number;
    nmls_branch: number;
    nmls_person: number;
    person_public_candidate: number;
  };
  grains: Record<string, string>;
  source_as_of: Record<string, string>;
  fingerprint: string;
};

export type HomeStoryType = 'BENCHMARK' | 'CHANGE' | 'GAP';
export type CoverageStatus = 'strong' | 'partial' | 'limited' | 'unavailable' | 'not_yet_researched';

export type TraceMetric = {
  id: string;
  label: string;
  display: string;
  value: number;
  unit: 'count' | 'label';
  numerator: number | null;
  denominator: number | null;
  grain: string;
  definition: string;
  components: Array<{ label: string; value: string; payloadKey: string }>;
  sourceIds: string[];
  officialAsOf: string;
  retrievedAt: string;
  method: string;
  payloadKey: string;
  limitations: string[];
};

export type FeaturedStory = {
  storyId: string;
  storyType: HomeStoryType;
  title: string;
  summary: string;
  chartType: 'composition' | 'counts';
  chart: {
    caption: string;
    series: Array<{ label: string; value: number; shareOf?: number; note?: string }>;
    unit: 'count';
    max: number;
  };
  whyItMatters: string;
  doesNotMean: string[];
  sourceIds: string[];
  officialAsOf: string;
  retrievedAt: string;
  payloadKeys: string[];
};

export type CoverageRow = {
  family: string;
  display: string;
  status: CoverageStatus;
  method: string;
  limitations: string[];
};

export type GeoRow = {
  state: string;
  name: string;
  applications: number;
  originations: number;
  denials: number;
  volumeShare: number;
  intelligenceHref: string | null;
  searchHref: string;
};

export type AskItem = {
  id: string;
  question: string;
  answer: string;
  href: string;
  hrefLabel: string;
};

export type SourceRow = {
  id: string;
  dataset: string;
  agency: string;
  officialAsOf: string;
  retrievedAt: string;
  usedFor: string;
  limitation: string;
};

export type ToolLink = {
  id: string;
  label: string;
  href: string;
  note: string;
};

export type LenderEvidenceFamily =
  | 'INSTITUTION_IDENTITY_LICENSING'
  | 'MORTGAGE_MARKET_ACTIVITY'
  | 'CONSUMER_COMPLAINTS'
  | 'REGULATORY_ENFORCEMENT'
  | 'DEPOSITORY_BANK'
  | 'HOMEBUYER_PROGRAMS'
  | 'BUSINESS_RELATIONSHIPS'
  | 'PUBLIC_RESEARCH_SURFACES';

export type HomepageEvidenceMeasure = {
  key: string;
  label: string;
  value: number | null;
  display: string;
  family: LenderEvidenceFamily;
  grain: string;
  entityClass: string;
  geography: string;
  sourceSystem: string;
  acceptedArtifact: string;
  sourceClockLabel: 'Source as of' | 'Source clock' | 'Vintage';
  sourceClock: string;
  retrievedAt: string | null;
  generatedAt: string | null;
  definition: string;
  counts: string;
  doesNotCount: string;
  publicationStatus: 'PUBLIC' | 'PUBLIC_LIMITATION';
  researchDestination: string;
  identityRule: string | null;
};

export type HomepageStateCard = {
  code: 'FL' | 'NJ' | 'CA' | 'TX' | 'WA' | 'AZ' | 'CO' | 'VA' | 'NY' | 'IL' | 'OR' | 'PA';
  name: string;
  href: string;
  regulators: string;
  sourceClocks: Array<{
    label: string;
    sourceAsOf: string | null;
    sourceClock?: string | null;
    retrievedAt: string | null;
  }>;
  evidence: string[];
  identityNote: string;
  limitation: string;
  highlights: Array<{ label: string; value: string; grain: string }>;
};

export type LenderHomeIntel = {
  contractVersion: typeof LENDER_HOME_INTEL_VERSION;
  homepagePublicationVersion: typeof LENDER_HOME_PUBLICATION_VERSION;
  generatedAt: string;
  payloadFingerprint: string;
  score: null;
  ranking: null;
  pricingHomepageV1: 'DEFERRED';
  changeModule: { status: 'UNSUPPORTED'; reason: string };
  stateOfRecord: TraceMetric[];
  findings: FeaturedStory[];
  coverage: CoverageRow[];
  gaps: string[];
  verifyDirectly: string[];
  geography: GeoRow[];
  floridaPreview: {
    href: '/florida';
    applications: number;
    originations: number;
    publicProfiles: number;
    internalProfiles: number;
    note: string;
  };
  askMarket: AskItem[];
  tools: ToolLink[];
  journey: Array<{ step: string; status: 'connected' | 'partial' | 'unavailable' }>;
  sources: SourceRow[];
  limitations: string[];
  doesNotInfer: string[];
  evidenceInventory: HomepageEvidenceMeasure[];
  stateCards: HomepageStateCard[];
  freshnessClocks?: {
    generatedAt: string;
    newestDocumentedSourceAsOf: string | null;
    note: string;
  };
};
