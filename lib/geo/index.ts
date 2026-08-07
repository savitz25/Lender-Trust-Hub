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

export { ZIP_TO_COUNTY } from '@/lib/geo/zip-to-county';

export {
  deriveLenderHomeLocality,
  type DerivedHomeLocality,
  type LenderLocalityFields,
} from '@/lib/geo/home-locality';

export {
  MIN_MEANINGFUL_IN_COUNTY,
  LENDER_LOCALITY_POLICY,
  classifyLenderLocality,
  segmentLendersForCountyPage,
  presenceLineForCounty,
  homeLocalityLine,
  type LenderLocalityClass,
  type LenderPresenceLabel,
  type LenderLocalityVerdict,
  type LenderWithLocality,
  type CountyLenderSegments,
} from '@/lib/geo/locality-rules';
