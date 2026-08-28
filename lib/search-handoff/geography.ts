/**
 * Conservative city/ZIP → county using existing Lender geo tables.
 * No geocoding. No Places.
 */

import { lookupCountyByCity } from '@/lib/geo/city-county-lookup';
import { ZIP_TO_COUNTY } from '@/lib/geo/zip-to-county';
import { normalizeState } from '@/lib/network/journey-context';

export type LenderGeoMatchClass =
  | 'exact_physical_zip'
  | 'exact_physical_city'
  | 'physical_county'
  | 'hmda_activity_county'
  | 'physical_state'
  | 'hmda_activity_state';

export type ResolvedLenderGeography = {
  stateCode: string;
  stateSlug: string;
  stateName: string;
  countySlug?: string;
  countyName?: string;
  city?: string;
  zip?: string;
  /** Query-level classification (not per-listing). */
  matchClass: LenderGeoMatchClass;
  cityCoveredByCountyOnly: boolean;
};

export const GEOGRAPHY_PRECISION_ORDER: LenderGeoMatchClass[] = [
  'exact_physical_zip',
  'exact_physical_city',
  'physical_county',
  'hmda_activity_county',
  'physical_state',
  'hmda_activity_state',
];

export function resolveLenderHandoffGeography(input: {
  state?: string;
  county?: string;
  city?: string;
  zip?: string;
}): ResolvedLenderGeography | null {
  const zipHit = input.zip ? ZIP_TO_COUNTY[input.zip] : undefined;
  const st = normalizeState(input.state || zipHit?.state || zipHit?.stateSlug);
  if (!st) return null;

  if (zipHit && zipHit.stateSlug === st.stateSlug) {
    return {
      stateCode: st.stateCode,
      stateSlug: st.stateSlug,
      stateName: st.stateName,
      countySlug: zipHit.countySlug,
      countyName: zipHit.county,
      city: input.city,
      zip: input.zip,
      matchClass: 'physical_county',
      cityCoveredByCountyOnly: true,
    };
  }

  const cityHit = input.city
    ? lookupCountyByCity(input.city, st.stateSlug)
    : null;
  if (cityHit) {
    return {
      stateCode: st.stateCode,
      stateSlug: st.stateSlug,
      stateName: st.stateName,
      countySlug: cityHit.countySlug,
      countyName: cityHit.county,
      city: input.city,
      zip: input.zip,
      matchClass: 'hmda_activity_county',
      cityCoveredByCountyOnly: true,
    };
  }

  if (input.county) {
    return {
      stateCode: st.stateCode,
      stateSlug: st.stateSlug,
      stateName: st.stateName,
      countySlug: input.county,
      countyName: input.county
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      city: input.city,
      zip: input.zip,
      matchClass: input.city ? 'hmda_activity_county' : 'physical_county',
      cityCoveredByCountyOnly: Boolean(input.city),
    };
  }

  return {
    stateCode: st.stateCode,
    stateSlug: st.stateSlug,
    stateName: st.stateName,
    city: input.city,
    zip: input.zip,
    matchClass: 'physical_state',
    cityCoveredByCountyOnly: false,
  };
}
