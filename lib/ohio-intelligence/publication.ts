/**
 * OH-LEND-001 — Ohio state mortgage intelligence publication gate.
 * Statewide only. No Columbus, Cleveland, Cincinnati, Toledo, Dayton, or Akron routes.
 * HMDA applications are not lenders. Search-only RMLA registration is not zero companies.
 */

export const OHIO_INTELLIGENCE_GATE = {
  path: '/ohio',
  robotsIndex: true,
  sitemap: true,
  title: 'Ohio Mortgage & Lending Intelligence | LenderTrustHub',
  description:
    'Research 2025 HMDA Ohio mortgage activity, DFI/NMLS RMLA verification, CFPB 2025 mortgage complaints, OHFA participating-lender county lists, and FDIC depository context. Independent research. Not a ranking, recommendation, or Trust Score. Current RMLA company registration is search-only and is not a combined Ohio lenders count.',
} as const;
