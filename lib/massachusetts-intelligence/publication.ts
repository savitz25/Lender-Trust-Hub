/**
 * MA-LEND-001 — Massachusetts state mortgage licensing publication gate.
 * Statewide only. No Boston, Worcester, Springfield, or county routes.
 * Lender, broker, and MLO counts stay separate. No combined Massachusetts lender total.
 */

export const MASSACHUSETTS_INTELLIGENCE_GATE = {
  path: '/massachusetts',
  robotsIndex: true,
  sitemap: true,
  title: 'Massachusetts Mortgage Licensing & Lending Intelligence | LenderTrustHub',
  description:
    'Massachusetts Division of Banks mortgage lender, mortgage broker, and loan originator licensee files as of June 30, 2026, DOB mortgage enforcement actions 2021-2026, and 2025 HMDA activity. Lender, broker, and originator counts are separate. Not a ranking or Trust Score.',
} as const;
