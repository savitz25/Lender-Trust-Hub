/**
 * NC-LEND-001 — North Carolina state mortgage intelligence publication gate.
 * Statewide only. No Charlotte, Raleigh, Durham, Greensboro, Wake, or Mecklenburg routes.
 * HMDA applications are not lenders. Mixed NCCOB current entities are not a lender census.
 */

export const NORTH_CAROLINA_INTELLIGENCE_GATE = {
  path: '/north-carolina',
  robotsIndex: true,
  sitemap: true,
  title: 'North Carolina Mortgage & Lending Intelligence | LenderTrustHub',
  description:
    'Research 2025 HMDA North Carolina mortgage activity, NCCOB current license classes, CFPB 2025 mortgage complaints, NCCOB mortgage enforcement, and FDIC depository context. Independent research. Not a ranking, recommendation, or Trust Score. 1,380 current licensed entities are not a combined North Carolina lenders count.',
} as const;
