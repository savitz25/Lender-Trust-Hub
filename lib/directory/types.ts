/**
 * Unified directory template types — shared across FDIC, mortgage, auto, MCA, etc.
 *
 * TO ADD A NEW VERTICAL:
 * 1. Add a DirectoryCategoryConfig entry in lib/directory/categories.ts
 * 2. Create lib/{vertical}/data/*.json with the same listing shape
 * 3. Copy app/fdic-insured-banks/[state]/page.tsx → app/{hub}/[state]/page.tsx
 * 4. Swap category config + data loader — components stay the same
 */

export interface DirectoryCategoryConfig {
  /** Unique slug: fdic | mortgage | auto | credit-repair | mca */
  id: string;
  /** Display: "FDIC Insured Banks" */
  label: string;
  labelShort: string;
  /** National hub path: /fdic-insured-banks */
  hubPath: string;
  /** State page path builder */
  statePath: (stateSlug: string) => string;
  /** SEO year suffix */
  year: number;
  /** Schema.org primary entity type for listings */
  schemaEntityType: 'FinancialService' | 'LocalBusiness' | 'Organization';
  /** Whether listings are free (for AggregateOffer schema) */
  isFreeDirectory: boolean;
  /** Related vertical links shown on state pages */
  relatedVerticals: RelatedVerticalLink[];
}

export interface RelatedVerticalLink {
  label: string;
  href: (stateSlug: string) => string;
  description: string;
  live: boolean;
}

export interface DirectoryInsightCard {
  title: string;
  description: string;
  bankNames: string[];
  filterHint: string;
  icon: 'home' | 'building' | 'shield' | 'trending';
}

export interface UserScenario {
  persona: string;
  headline: string;
  recommendation: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface RegulatorBreakdownRow {
  regulator: string;
  count: number;
  percentage: number;
}