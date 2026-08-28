/**
 * FL-LEND-005 — Florida State Intelligence publication gate.
 * Individual Florida company profiles are not published from this gate.
 */

export const FLORIDA_INTELLIGENCE_GATE = {
  path: '/florida',
  /** Production QA passed on SHA a6bad40. Index the State Intelligence page only. */
  robotsIndex: true,
  sitemap: true,
  title: 'Florida Mortgage & Lending Research — Licensing, HMDA & Regulatory History',
  description:
    'Research Florida mortgage brokers and lenders using official OFR licensing and final agency actions, HMDA lending activity, CFPB complaint evidence and other public sources.',
} as const;
