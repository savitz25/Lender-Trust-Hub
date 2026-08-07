/**
 * Leaf geo module — derive HQ locality without importing research, verification barrels, or mockData.
 * Breaks: mockData → sanitize → research-signals → geo → locality-rules → research-signals
 */

import { ZIP_TO_COUNTY } from '@/lib/geo/zip-to-county';
import { normalizeCountyName, titleCaseSlug } from '@/lib/geo/normalize';
import {
  lookupCountyByCity,
  placeFromCountyFields,
  type PlaceLocality,
} from '@/lib/geo/city-county-lookup';

export type DerivedHomeLocality = PlaceLocality & {
  /** city | zip | listed_county | unknown */
  source: 'city' | 'zip' | 'listed_county' | 'unknown';
};

export type LenderLocalityFields = {
  city?: string | null;
  state?: string | null;
  stateSlug: string;
  county?: string | null;
  countySlug?: string | null;
  zipCodes?: string[] | null;
};

/**
 * Derive true home county from licensed city / ZIP before listed market label.
 * City and ZIP beat a conflicting market countySlug (e.g. Jacksonville ≠ Miami-Dade).
 */
export function deriveLenderHomeLocality(
  lender: LenderLocalityFields
): DerivedHomeLocality {
  const stateSlug = lender.stateSlug;

  const byCity = lookupCountyByCity(lender.city, stateSlug);
  if (byCity) {
    return { ...byCity, source: 'city' };
  }

  for (const zip of lender.zipCodes ?? []) {
    const z = ZIP_TO_COUNTY[zip.trim()];
    if (z && z.stateSlug === stateSlug) {
      return {
        county: z.county,
        countySlug: z.countySlug,
        stateSlug: z.stateSlug,
        source: 'zip',
      };
    }
  }

  if (lender.county?.trim() || lender.countySlug?.trim()) {
    return {
      ...placeFromCountyFields(
        lender.county || titleCaseSlug(lender.countySlug || ''),
        lender.countySlug ||
          normalizeCountyName(lender.county || '').replace(/\s+/g, '-'),
        stateSlug
      ),
      source: 'listed_county',
    };
  }

  return {
    county: '',
    countySlug: '',
    stateSlug,
    source: 'unknown',
  };
}
