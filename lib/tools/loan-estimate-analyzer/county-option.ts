/** Parse analyzer county dropdown value → directory state + county slug. */

export function parseAnalyzerCountyOption(optionSlug: string): {
  stateSlug: string;
  countySlug: string;
} | null {
  if (!optionSlug?.trim()) return null;
  if (optionSlug.startsWith('tx:')) {
    return { stateSlug: 'texas', countySlug: optionSlug.slice(3) };
  }
  if (optionSlug.startsWith('ga:')) {
    return { stateSlug: 'georgia', countySlug: optionSlug.slice(3) };
  }
  if (optionSlug.startsWith('ca:')) {
    return { stateSlug: 'california', countySlug: optionSlug.slice(3) };
  }
  // Bare slug = Florida major county (legacy + default)
  return { stateSlug: 'florida', countySlug: optionSlug };
}
