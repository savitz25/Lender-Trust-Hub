/**
 * CA-LEND-001 — California state mortgage intelligence publication gate.
 * No California county routes. No person-level MLO directory.
 */

export const CALIFORNIA_INTELLIGENCE_GATE = {
  path: '/california',
  robotsIndex: true,
  sitemap: true,
  title: 'California Mortgage & Lending Intelligence | LenderTrustHub',
  description:
    'Research California mortgage activity using 2025 HMDA, CalHFA programs and approved-lender listings, and the 2024 CRMLA annual report. Independent research. Not a ranking, recommendation, or score.',
} as const;
