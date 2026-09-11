/**
 * IL-LEND-001A — Illinois state mortgage intelligence publication gate.
 * Statewide only. No Chicago, Cook County, or other local routes.
 * HMDA applications are not lenders. FDIC banks are not IDFPR mortgage companies.
 */

export const ILLINOIS_INTELLIGENCE_GATE = {
  path: '/illinois',
  robotsIndex: true,
  sitemap: true,
  title: 'Illinois Mortgage Lending Intelligence | LenderTrustHub',
  description:
    'Research 2025 HMDA Illinois mortgage activity, FDIC depository context, and official IDFPR/NMLS verification paths. Independent research. Not a ranking, recommendation, or Trust Score. Not a current Illinois mortgage-company census.',
} as const;
