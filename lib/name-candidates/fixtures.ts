/**
 * TH-SEARCH-R1-019C: NONPRODUCTION catalog fixtures for deterministic browser / HTTP checks of cases the
 * real catalog cannot produce on demand (a capped window, a source outage, keyword-shaped names).
 * HYPOTHETICAL institutions only. Refused when VERCEL_ENV is "production"; off unless the variable is set.
 */
import type { CatalogInstitution } from './engine';

export const NAME_CANDIDATE_FIXTURES = ['keyword-shapes', 'large-window', 'source-unavailable'] as const;
export type NameCandidateFixture = (typeof NAME_CANDIDATE_FIXTURES)[number];

export function activeNameCandidateFixture(env: Record<string, string | undefined> = process.env): NameCandidateFixture | null {
  if (env.VERCEL_ENV === 'production') return null;
  const value = env.LENDER_NAME_CANDIDATES_FIXTURE ?? '';
  return (NAME_CANDIDATE_FIXTURES as readonly string[]).includes(value) ? (value as NameCandidateFixture) : null;
}

const make = (displayName: string, index: number): CatalogInstitution => ({
  institutionKey: `fixture:${index}`, displayName, entityType: 'Fixture institution (hypothetical)',
  names: [{ value: displayName, field: 'canonical_name', sourceLabel: 'fixture name' }],
  nmls: null, lei: null, publicationState: 'unpublished_research_identity', profilePath: null, sourceReference: 'nonproduction fixture',
});

/** Throws for `source-unavailable` -- exactly what a failed approved source does. */
export function fixtureInstitutions(fixture: NameCandidateFixture): CatalogInstitution[] {
  if (fixture === 'source-unavailable') throw new Error('fixture_source_unavailable');
  if (fixture === 'large-window') return Array.from({ length: 230 }, (_, i) => make(`Summit Ridge ${i + 1} Lending`, i));
  return ['Charter Bank', 'Branch River Bank', 'Branch River Savings', 'LEI Financial Group', 'Originator Home Loans', 'Best Bank'].map(make);
}
