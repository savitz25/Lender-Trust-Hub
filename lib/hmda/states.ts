/** HMDA product states with cleaned slices under data/hmda/{folder}/ */

export type HmdaStateCode = 'FL' | 'TX' | 'GA' | 'CA';

export type HmdaStateConfig = {
  code: HmdaStateCode;
  /** Directory / URL state slug */
  stateSlug: string;
  name: string;
  /** data/hmda/{dataFolder}/ */
  dataFolder: string;
  /** File name suffixes (e.g. _fl, _tx, _ga, _ca) for summary CSVs */
  fileSuffix: string;
  /** Mapping CSV column for state originations */
  originationsColumn:
    | 'florida_originations'
    | 'texas_originations'
    | 'georgia_originations'
    | 'california_originations';
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
  GA: {
    code: 'GA',
    stateSlug: 'georgia',
    name: 'Georgia',
    dataFolder: 'georgia',
    fileSuffix: '_ga',
    originationsColumn: 'georgia_originations',
    majorCountySlugs: new Set([
      // Core metro Atlanta
      'fulton',
      'gwinnett',
      'cobb',
      'dekalb',
      'cherokee',
      'forsyth',
      'henry',
      'paulding',
      'clayton',
      'douglas',
      'coweta',
      'fayette',
      'bartow',
      'jackson',
      'carroll',
      'barrow',
      'newton',
      'walton',
      'rockdale',
      // Secondary / regional metros
      'chatham',
      'effingham',
      'bryan',
      'glynn',
      'hall',
      'houston',
      'columbia',
      'richmond',
      'muscogee',
      'bibb',
      'lowndes',
      'floyd',
      'clarke',
      'catoosa',
      'whitfield',
      'spalding',
    ]),
  },
  CA: {
    code: 'CA',
    stateSlug: 'california',
    name: 'California',
    dataFolder: 'california',
    fileSuffix: '_ca',
    originationsColumn: 'california_originations',
    majorCountySlugs: new Set([
      // Wave 1 metros
      'los-angeles',
      'san-diego',
      'riverside',
      'orange',
      'san-bernardino',
      'sacramento',
      'santa-clara',
      'alameda',
      'contra-costa',
      'kern',
      'fresno',
      'san-joaquin',
      'ventura',
      'placer',
      'san-mateo',
      'solano',
      'san-francisco',
      'sonoma',
      'stanislaus',
      'tulare',
      'santa-barbara',
      'san-luis-obispo',
      'monterey',
      'marin',
      // Deepen — SoCal spillover, Central Valley, NorCal growth
      'el-dorado',
      'merced',
      'shasta',
      'butte',
      'madera',
      'santa-cruz',
      'yolo',
      'nevada',
      'kings',
      'napa',
      'imperial',
      'humboldt',
    ]),
  },
};

export const HMDA_ACTIVE_STATE_CODES: HmdaStateCode[] = ['FL', 'TX', 'GA', 'CA'];

export function hmdaStateFromSlug(stateSlug: string): HmdaStateConfig | null {
  const s = stateSlug.toLowerCase();
  for (const cfg of Object.values(HMDA_STATE_CONFIGS)) {
    if (cfg.stateSlug === s || cfg.code.toLowerCase() === s) return cfg;
  }
  return null;
}
