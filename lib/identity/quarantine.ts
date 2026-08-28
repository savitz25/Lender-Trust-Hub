/**
 * Known LEND-NAT-001 collision families. Never pass through generic resolution.
 */

export const BRANCH_NMLS_QUARANTINE = new Set([
  '2909', // Fairway Augusta / Sheppard team — company NMLS is 1702
]);

export const PERSON_OR_TEAM_NMLS_QUARANTINE = new Set([
  '2458338', // CMG Dennis Vo team vs company 1820
]);

/** Company NMLS referenced by contaminated maps but not always on catalog rows. */
export const KNOWN_COMPANY_NMLS_FOR_QUARANTINED = {
  fairway: '1702',
  cmg: '1820',
} as const;

export type NamedCollisionCase =
  | 'fairway'
  | 'cmg'
  | 'movement_veterans_united'
  | 'pennymac_fairway'
  | 'guaranteed_rate_bank_of_america'
  | 'harborone_summit'
  | 'cadence_huntington'
  | 'first_tech_duplicate_slug';

export const NAMED_LEI_COLLISIONS: Record<string, NamedCollisionCase[]> = {
  RVDPPPGHCGZ40J4VQ731: ['fairway', 'pennymac_fairway'],
  '254900DTLHVWQ7NP7R34': ['cmg'],
  '549300DD5QQUHO6PCH70': ['movement_veterans_united'],
  B4TYDEB6GKMZO031MB27: ['guaranteed_rate_bank_of_america'],
};

export const NAMED_NMLS_COLLISIONS: Record<string, NamedCollisionCase> = {
  '2561': 'harborone_summit',
  '402436': 'cadence_huntington',
  '2909': 'fairway',
  '2458338': 'cmg',
};

export const FIRST_TECH_DUPLICATE_SLUG = 'first-tech-federal-credit-union';

export function isQuarantinedLei(lei: string): boolean {
  return lei.toUpperCase() in NAMED_LEI_COLLISIONS;
}

export function isQuarantinedInstitutionNmls(nmls: string): boolean {
  return BRANCH_NMLS_QUARANTINE.has(nmls) || PERSON_OR_TEAM_NMLS_QUARANTINE.has(nmls);
}
