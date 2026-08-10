/** HMDA product states with cleaned slices under data/hmda/{folder}/ */

export type HmdaStateCode = 'FL' | 'TX';

export type HmdaStateConfig = {
  code: HmdaStateCode;
  /** Directory / URL state slug */
  stateSlug: string;
  name: string;
  /** data/hmda/{dataFolder}/ */
  dataFolder: string;
  /** File name suffixes (e.g. _fl, _tx) for summary CSVs */
  fileSuffix: string;
  /** Mapping CSV column for state originations */
  originationsColumn: 'florida_originations' | 'texas_originations';
  /** Major county slugs for market intelligence panels */
  majorCountySlugs: ReadonlySet<string>;
};

export const HMDA_STATE_CONFIGS: Record<HmdaStateCode, HmdaStateConfig> = {
  FL: {
    code: 'FL',
    stateSlug: 'florida',
    name: 'Florida',
    dataFolder: 'florida',
    fileSuffix: '_fl',
    originationsColumn: 'florida_originations',
    majorCountySlugs: new Set([
      'miami-dade',
      'broward',
      'palm-beach',
      'hillsborough',
      'orange',
      'duval',
      'pinellas',
      'lee',
      'polk',
      'brevard',
      'volusia',
      'pasco',
      'seminole',
      'sarasota',
      'manatee',
      'collier',
      'osceola',
      'lake',
      'marion',
      'st-johns',
      'st-lucie',
    ]),
  },
  TX: {
    code: 'TX',
    stateSlug: 'texas',
    name: 'Texas',
    dataFolder: 'texas',
    fileSuffix: '_tx',
    originationsColumn: 'texas_originations',
    majorCountySlugs: new Set([
      'harris',
      'dallas',
      'tarrant',
      'bexar',
      'collin',
      'travis',
      'denton',
      'montgomery',
      'fort-bend',
      'williamson',
      'el-paso',
      'bell',
      'hidalgo',
      'brazoria',
      'galveston',
      'hays',
      'lubbock',
      'nueces',
      'cameron',
      'webb',
    ]),
  },
};

export const HMDA_ACTIVE_STATE_CODES: HmdaStateCode[] = ['FL', 'TX'];

export function hmdaStateFromSlug(stateSlug: string): HmdaStateConfig | null {
  const s = stateSlug.toLowerCase();
  for (const cfg of Object.values(HMDA_STATE_CONFIGS)) {
    if (cfg.stateSlug === s || cfg.code.toLowerCase() === s) return cfg;
  }
  return null;
}
