export const LENDER_HOME_INTEL_VERSION = 'lender-home-intel-v1' as const;
export const LENDER_HOME_PUBLICATION_VERSION = 'intel-004-v1' as const;

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
};
