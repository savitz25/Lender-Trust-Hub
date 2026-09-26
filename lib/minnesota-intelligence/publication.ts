/**
 * MN-LEND-001 — Minnesota state mortgage licensing publication gate.
 * Statewide only. No Minneapolis, St. Paul, Rochester, Duluth, or county routes.
 * Originator, servicer, MLO, branch, and exemption stay separate. No combined Minnesota lender total.
 */

export const MINNESOTA_INTELLIGENCE_GATE = {
  path: '/minnesota',
  robotsIndex: true,
  sitemap: true,
  title: 'Minnesota Mortgage Licensing & Lending Intelligence | LenderTrustHub',
  description:
    'How Minnesota mortgage licensing works: the Department of Commerce licenses residential mortgage originators and servicers (companies) and mortgage loan originators (individuals), verified on NMLS Consumer Access. Includes Commerce mortgage enforcement actions since 2022 and 2025 HMDA activity. Not a count of Minnesota lenders. Not a ranking or Trust Score.',
} as const;
