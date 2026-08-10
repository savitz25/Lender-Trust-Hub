/** Parse / build analyzer county dropdown values across product states. */

const STATE_BY_PREFIX: Record<string, string> = {
  tx: 'texas',
  ga: 'georgia',
  ca: 'california',
  nc: 'north-carolina',
  sc: 'south-carolina',
  nj: 'new-jersey',
  ny: 'new-york',
  pa: 'pennsylvania',
  ma: 'massachusetts',
  ri: 'rhode-island',
  vt: 'vermont',
  me: 'maine',
};

const PREFIX_BY_STATE: Record<string, string | null> = {
  florida: null, // bare slug (legacy + default)
  texas: 'tx',
  georgia: 'ga',
  california: 'ca',
  'north-carolina': 'nc',
  'south-carolina': 'sc',
  'new-jersey': 'nj',
  'new-york': 'ny',
  pennsylvania: 'pa',
  massachusetts: 'ma',
  'rhode-island': 'ri',
  vermont: 'vt',
  maine: 'me',
};

const STATE_NAME_BY_SLUG: Record<string, string> = {
  florida: 'Florida',
  texas: 'Texas',
  georgia: 'Georgia',
  california: 'California',
  'north-carolina': 'North Carolina',
  'south-carolina': 'South Carolina',
  'new-jersey': 'New Jersey',
  'new-york': 'New York',
  pennsylvania: 'Pennsylvania',
  massachusetts: 'Massachusetts',
  'rhode-island': 'Rhode Island',
  vermont: 'Vermont',
  maine: 'Maine',
};

/** Human label for a directory state slug (product states). */
export function hmdaStateDisplayName(stateSlug: string): string {
  return STATE_NAME_BY_SLUG[stateSlug] || stateSlug;
}

/**
 * Build analyzer/compare `county` query value for a county page.
 * Returns undefined when the state is not a product HMDA state.
 */
export function analyzerCountyOptionSlug(
  stateSlug: string,
  countySlug: string
): string | undefined {
  if (!stateSlug || !countySlug) return undefined;
  if (!(stateSlug in PREFIX_BY_STATE)) return undefined;
  const prefix = PREFIX_BY_STATE[stateSlug];
  return prefix ? `${prefix}:${countySlug}` : countySlug;
}

/** Parse analyzer county dropdown value → directory state + county slug. */
export function parseAnalyzerCountyOption(optionSlug: string): {
  stateSlug: string;
  countySlug: string;
} | null {
  if (!optionSlug?.trim()) return null;
  const colon = optionSlug.indexOf(':');
  if (colon > 0) {
    const prefix = optionSlug.slice(0, colon).toLowerCase();
    const stateSlug = STATE_BY_PREFIX[prefix];
    if (stateSlug) {
      return { stateSlug, countySlug: optionSlug.slice(colon + 1) };
    }
  }
  // Bare slug = Florida major county (legacy + default)
  return { stateSlug: 'florida', countySlug: optionSlug };
}
