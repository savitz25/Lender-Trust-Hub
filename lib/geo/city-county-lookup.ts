/**
 * Phase 1 — city / place → county derivation from licensed locality names.
 * Prefer this over generated market labels when city is known.
 * Incomplete map → fall through to ZIP / listed county (never invent).
 */

import { normalizeCountyName, slugifyCountyName } from '@/lib/geo/normalize';

export type PlaceLocality = {
  county: string;
  countySlug: string;
  stateSlug: string;
};

/**
 * Known city → county for markets where seed rows mis-assign market labels.
 * Keys: lowercase city name (no state).
 */
const CITY_TO_COUNTY: Record<string, PlaceLocality> = {
  // Florida — South Florida
  'fort lauderdale': { county: 'Broward', countySlug: 'broward', stateSlug: 'florida' },
  davie: { county: 'Broward', countySlug: 'broward', stateSlug: 'florida' },
  weston: { county: 'Broward', countySlug: 'broward', stateSlug: 'florida' },
  'cooper city': { county: 'Broward', countySlug: 'broward', stateSlug: 'florida' },
  hollywood: { county: 'Broward', countySlug: 'broward', stateSlug: 'florida' },
  pembroke: { county: 'Broward', countySlug: 'broward', stateSlug: 'florida' },
  'pembroke pines': { county: 'Broward', countySlug: 'broward', stateSlug: 'florida' },
  plantation: { county: 'Broward', countySlug: 'broward', stateSlug: 'florida' },
  'coral springs': { county: 'Broward', countySlug: 'broward', stateSlug: 'florida' },
  miami: { county: 'Miami-Dade', countySlug: 'miami-dade', stateSlug: 'florida' },
  'miami beach': { county: 'Miami-Dade', countySlug: 'miami-dade', stateSlug: 'florida' },
  'north miami': { county: 'Miami-Dade', countySlug: 'miami-dade', stateSlug: 'florida' },
  'coral gables': { county: 'Miami-Dade', countySlug: 'miami-dade', stateSlug: 'florida' },
  hialeah: { county: 'Miami-Dade', countySlug: 'miami-dade', stateSlug: 'florida' },
  doral: { county: 'Miami-Dade', countySlug: 'miami-dade', stateSlug: 'florida' },
  'boca raton': { county: 'Palm Beach', countySlug: 'palm-beach', stateSlug: 'florida' },
  'west palm beach': { county: 'Palm Beach', countySlug: 'palm-beach', stateSlug: 'florida' },
  'delray beach': { county: 'Palm Beach', countySlug: 'palm-beach', stateSlug: 'florida' },
  // Central / Tampa / NE
  orlando: { county: 'Orange', countySlug: 'orange', stateSlug: 'florida' },
  tampa: { county: 'Hillsborough', countySlug: 'hillsborough', stateSlug: 'florida' },
  jacksonville: { county: 'Duval', countySlug: 'duval', stateSlug: 'florida' },
  // Panhandle — regression targets
  'panama city': { county: 'Bay', countySlug: 'bay', stateSlug: 'florida' },
  'panama city beach': { county: 'Bay', countySlug: 'bay', stateSlug: 'florida' },
  pensacola: { county: 'Escambia', countySlug: 'escambia', stateSlug: 'florida' },
  'fort walton beach': { county: 'Okaloosa', countySlug: 'okaloosa', stateSlug: 'florida' },
  destin: { county: 'Okaloosa', countySlug: 'okaloosa', stateSlug: 'florida' },
  niceville: { county: 'Okaloosa', countySlug: 'okaloosa', stateSlug: 'florida' },
  eglin: { county: 'Okaloosa', countySlug: 'okaloosa', stateSlug: 'florida' },
};

function normalizeCityKey(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/,.*$/, '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .trim();
}

/** Lookup county from licensed city name when known. */
export function lookupCountyByCity(
  city: string | null | undefined,
  stateSlug?: string | null
): PlaceLocality | null {
  if (!city?.trim()) return null;
  const key = normalizeCityKey(city);
  const hit = CITY_TO_COUNTY[key];
  if (!hit) return null;
  if (stateSlug && hit.stateSlug !== stateSlug) return null;
  return hit;
}

export function placeFromCountyFields(
  county: string,
  countySlug: string,
  stateSlug: string
): PlaceLocality {
  return {
    county: county.trim() || titleFromSlug(countySlug),
    countySlug: countySlug || slugifyCountyName(county),
    stateSlug,
  };
}

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export function countyNamesMatch(a: string, b: string): boolean {
  const na = normalizeCountyName(a);
  const nb = normalizeCountyName(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}
