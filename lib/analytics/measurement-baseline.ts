/**
 * Phase 5 — measurement baseline for Lender Trust Hub SEO + integrity program.
 *
 * Future GA4 / GSC comparisons (NMLS verification usage, calculator completions,
 * organic landings on Tier 1/2 counties and state hubs) use this date as the
 * program-close marker. Do not invent historical metrics.
 */

export const LENDER_MEASUREMENT_BASELINE_DATE = '2026-08-07';

export const LENDER_MEASUREMENT_BASELINE_LABEL = 'lender-trust-hub-phase-5';

export const LENDER_MEASUREMENT_BASELINE_NOTE =
  'Baseline: 2026-08-07 — Phase 5 priority research events + canonical sitemap (Tier 1/2 counties, state hubs, tools, verified profiles).';

/**
 * Priority GA4 event names for the Lender stream (NEXT_PUBLIC_GA4_ID).
 */
export const LENDER_PRIORITY_EVENTS = [
  'nmls_verification_lookup',
  'outbound_nmls_consumer_access',
  'calculator_complete',
  'lender_compare_session',
  'my_lending_save',
  'my_lending_return',
  'lender_profile_view',
  'research_path_click',
  'outbound_specialist_hub',
  'outbound_primary_source',
] as const;

export type LenderPriorityEvent = (typeof LENDER_PRIORITY_EVENTS)[number];

/** GSC: submit only this sitemap on the lendertrusthub.com property */
export const LENDER_CANONICAL_SITEMAP = 'https://www.lendertrusthub.com/sitemap.xml';
