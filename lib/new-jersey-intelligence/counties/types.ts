import type monmouth from './monmouth.json';
import type middlesex from './middlesex.json';
import type somerset from './somerset.json';
import type union from './union.json';

export const NJ_COUNTY_CONTRACT = 'lender-nj-county-intel-v1' as const;

export type NjCountySlug =
  | 'monmouth-county'
  | 'middlesex-county'
  | 'somerset-county'
  | 'union-county';

export type NjCountyIntelligenceSnapshot =
  | typeof monmouth
  | typeof middlesex
  | typeof somerset
  | typeof union;

export const NJ_COUNTY_SLUGS: readonly NjCountySlug[] = [
  'monmouth-county',
  'middlesex-county',
  'somerset-county',
  'union-county',
] as const;

export const NJ_COUNTY_NAME_TO_PATH: Record<string, string> = {
  Monmouth: '/new-jersey/monmouth-county',
  Middlesex: '/new-jersey/middlesex-county',
  Somerset: '/new-jersey/somerset-county',
  Union: '/new-jersey/union-county',
};

export function isNjCountySlug(value: string): value is NjCountySlug {
  return (NJ_COUNTY_SLUGS as readonly string[]).includes(value);
}
