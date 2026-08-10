export {
  HMDA_VINTAGE_YEAR,
  HMDA_SOURCE_LABEL,
  HMDA_SOURCE_NOTE,
  type HmdaLenderEvidence,
  type HmdaCountyEvidence,
  type HmdaLoanTypeMix,
  type HmdaLeiMapping,
  type HmdaLenderStateSummary,
  type HmdaLenderCountyActivity,
  type HmdaCountyMarketSummary,
  type HmdaLenderStateSlice,
} from './types';

export {
  hmdaDataAvailable,
  loadHmdaFloridaData,
  loadHmdaStateData,
  loadAllHmdaStateData,
  countyNameToSlug,
  type HmdaStateBundle,
} from './load';

export {
  HMDA_STATE_CONFIGS,
  HMDA_ACTIVE_STATE_CODES,
  hmdaStateFromSlug,
  type HmdaStateCode,
  type HmdaStateConfig,
} from './states';

export {
  getHmdaLenderEvidenceBySlug,
  getHmdaCountyEvidence,
  getMatchedHmdaSlugs,
  getHmdaCountySlugsForState,
  getHmdaProductStates,
  MAJOR_FLORIDA_COUNTY_SLUGS,
  MAJOR_TEXAS_COUNTY_SLUGS,
  MAJOR_GEORGIA_COUNTY_SLUGS,
  MAJOR_CALIFORNIA_COUNTY_SLUGS,
  MAJOR_NORTH_CAROLINA_COUNTY_SLUGS,
  MAJOR_SOUTH_CAROLINA_COUNTY_SLUGS,
} from './queries';
