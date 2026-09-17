/**
 * PA-LEND-001 — Pennsylvania state mortgage intelligence publication gate.
 * Statewide only. No Philadelphia, Pittsburgh, or other local routes.
 * HMDA applications are not lenders. Open Data rows are not an NMLS census.
 */

export const PENNSYLVANIA_INTELLIGENCE_GATE = {
  path: '/pennsylvania',
  robotsIndex: true,
  sitemap: true,
  title: 'Pennsylvania Mortgage & Lending Intelligence | LenderTrustHub',
  description:
    'Research 2025 HMDA Pennsylvania mortgage activity, DoBS/NMLS licensing classes, CFPB 2025 mortgage complaints, PHFA participating lenders, and FDIC depository context. Independent research. Not a ranking, recommendation, or Trust Score. Not a current NMLS mortgage-company census.',
} as const;
