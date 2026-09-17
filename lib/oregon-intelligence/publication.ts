/**
 * OR-LEND-001 — Oregon state mortgage intelligence publication gate.
 * Statewide only. No Portland, Multnomah County, or other local routes.
 * HMDA applications are not lenders. FDIC banks are not DFR mortgage companies.
 */

export const OREGON_INTELLIGENCE_GATE = {
  path: '/oregon',
  robotsIndex: true,
  sitemap: true,
  title: 'Oregon Mortgage Lending Intelligence | LenderTrustHub',
  description:
    'Research 2025 HMDA Oregon mortgage activity, FDIC depository context, and official DFR/NMLS verification paths. Independent research. Not a ranking, recommendation, or Trust Score. Not a current Oregon mortgage-company census.',
} as const;
