/**
 * TN-LEND-001 — Tennessee state mortgage licensing publication gate.
 * Statewide only. No Nashville, Memphis, Knoxville, or Chattanooga routes.
 * Lender, broker, servicer, MLO, and branch stay separate. No combined Tennessee lender total.
 */

export const TENNESSEE_INTELLIGENCE_GATE = {
  path: '/tennessee',
  robotsIndex: true,
  sitemap: true,
  title: 'Tennessee Mortgage Licensing & Lending Intelligence | LenderTrustHub',
  description:
    'How Tennessee mortgage licensing works: TDFI licenses mortgage lenders, brokers, servicers, and loan originators and verifies them through NMLS Consumer Access. Includes TDFI enforcement orders and 2025 HMDA activity. Not a count of Tennessee lenders. Not a ranking or Trust Score.',
} as const;
