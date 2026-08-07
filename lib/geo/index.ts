export {
  normalizeCountyName,
  slugifyCountyName,
  titleCaseSlug,
  countiesEqual,
} from '@/lib/geo/normalize';

export {
  lookupCountyByCity,
  placeFromCountyFields,
  countyNamesMatch,
  type PlaceLocality,
} from '@/lib/geo/city-county-lookup';

export {
  MIN_MEANINGFUL_IN_COUNTY,
  LENDER_LOCALITY_POLICY,
  deriveLenderHomeLocality,
  classifyLenderLocality,
  segmentLendersForCountyPage,
  presenceLineForCounty,
  homeLocalityLine,
  type LenderLocalityClass,
  type LenderPresenceLabel,
  type LenderLocalityVerdict,
  type DerivedHomeLocality,
  type LenderWithLocality,
  type CountyLenderSegments,
} from '@/lib/geo/locality-rules';
