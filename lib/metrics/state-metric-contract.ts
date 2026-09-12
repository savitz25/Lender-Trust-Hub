/** Additive v1 revision. State source populations never change the national spine. */
export type CapabilityStatus = 'STATE_SOURCE_LIVE' | 'STATE_SOURCE_ACQUIRED' | 'SEARCH_ONLY' | 'REQUEST_ONLY' | 'FEDERAL_BASELINE' | 'NOT_ACQUIRED' | 'UNKNOWN' | 'SPECIALIST_COMPLETE';
export type AcceptedStateMetric = {
  key: string;
  state: string;
  value: number | null;
  grain: string;
  sourceArtifact: string;
  sourceField: string;
  sourceAsOf: string | null;
  snapshotAsOf: string | null;
  retrievedAt: string | null;
  generatedAt: string | null;
  capabilityStatus: CapabilityStatus;
  aggregation: 'SEPARATE_SOURCE_POPULATION_DO_NOT_ADD_TO_NATIONAL';
};
export type ReconciliationContract = {
  stateSourceAcquiredDefinition: string;
  servicerEvidence: { value: number | null; tableAcquired: boolean; grain: string; publicationStatus: "INTERNAL" };
  acceptedSources: Array<{ path: string; sha256: string }>;
  stateMetrics: AcceptedStateMetric[];
  stateCapabilities: Array<{
    state: string; route: string | null; routeExists: boolean;
    stateSourceAcquired: boolean; specialistComplete: null;
    currentCompanyRoster: { grain: string; status: CapabilityStatus; count: number | null };
    metricKeys: string[];
  }>;
  florida: {
    sameGrain: true; historicalApproved: number; currentApproved: number;
    removedFromExactApproved: number; addedToExactApproved: number;
    unexplainedDelta: number;
    predicate: string;
    sourceRows: number; approvedRows: number; explicitOtherStatusRows: number;
    transitions: Array<Record<string, string>>;
    statusPartition: Array<{ license_class: string; ofr_status: string | null; rows: number }>;
    sourceClocks: Array<Record<string, unknown>>;
  };
  nationalCensus: { path: string; retrievedAt: string; sourceAsOf: null };
  hmdaPopulationRule: string;
};
