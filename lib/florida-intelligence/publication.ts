/**
 * FL-LEND-005 — Florida State Intelligence publication gate.
 * Individual Florida company profiles are not published from this gate.
 */

export const FLORIDA_INTELLIGENCE_GATE = {
  path: '/florida',
  /** Preview/production start noindex until semantic QA. Flip in a controlled change. */
  robotsIndex: false,
  sitemap: false,
  title: 'Florida Mortgage & Lending Research — Licensing, HMDA & Regulatory History',
  description:
    'Research Florida mortgage brokers and lenders using official OFR licensing and final agency actions, HMDA lending activity, CFPB complaint evidence and other public sources.',
} as const;
