/**
 * NV-LEND-001 — Nevada state mortgage licensing publication gate.
 * Statewide only. No Las Vegas, Reno, Henderson, or county routes.
 * Mortgage company, MLO, servicer, escrow, commercial-only, and branch stay separate. No combined Nevada lender total.
 */

export const NEVADA_INTELLIGENCE_GATE = {
  path: '/nevada',
  robotsIndex: true,
  sitemap: true,
  title: 'Nevada Mortgage Licensing & Lending Intelligence | LenderTrustHub',
  description:
    'How Nevada mortgage licensing works: the Division of Mortgage Lending licenses mortgage companies, loan originators, and servicers through NMLS and commercial-only, escrow, and exempt classes through its SRS portal. Includes MLD enforcement orders since 2012 and 2025 HMDA activity. Not a count of Nevada lenders. Not a ranking or Trust Score.',
} as const;
