import type { DirectoryCategoryConfig } from './types';

export const SITE_URL = 'https://www.lendertrusthub.com';

/** FDIC banks — live production vertical */
export const FDIC_CATEGORY: DirectoryCategoryConfig = {
  id: 'fdic',
  label: 'FDIC Insured Banks',
  labelShort: 'FDIC Banks',
  hubPath: '/fdic-insured-banks',
  statePath: (slug) => `/fdic-insured-banks/${slug}`,
  year: 2026,
  schemaEntityType: 'FinancialService',
  isFreeDirectory: true,
  relatedVerticals: [
    {
      label: 'Mortgage Lenders',
      href: (s) => `/local-lenders/${s}`,
      description: 'Verified local mortgage brokers',
      live: true,
    },
    {
      label: 'Mortgage Calculators',
      href: () => '/calculators',
      description: 'Payment & affordability tools',
      live: true,
    },
    {
      label: 'Auto Loan Companies',
      href: (s) => `/auto-loan-companies/${s}`,
      description: 'Coming soon — same trusted framework',
      live: false,
    },
    {
      label: 'Credit Repair',
      href: (s) => `/credit-repair/${s}`,
      description: 'Coming soon — transparent listings',
      live: false,
    },
    {
      label: 'MCA Companies',
      href: (s) => `/mca-companies/${s}`,
      description: 'Coming soon — merchant cash advance directory',
      live: false,
    },
  ],
};

/** Mortgage lenders — clone FDIC page structure with this config */
export const MORTGAGE_CATEGORY: DirectoryCategoryConfig = {
  id: 'mortgage',
  label: 'Mortgage Lenders',
  labelShort: 'Mortgage',
  hubPath: '/local-lenders',
  statePath: (slug) => `/local-lenders/${slug}`,
  year: 2026,
  schemaEntityType: 'LocalBusiness',
  isFreeDirectory: true,
  relatedVerticals: [
    {
      label: 'FDIC Insured Banks',
      href: (s) => `/fdic-insured-banks/${s}`,
      description: 'Verify deposit insurance',
      live: true,
    },
    {
      label: 'Calculators',
      href: () => '/calculators',
      description: 'Mortgage payment tools',
      live: true,
    },
  ],
};

/** Template configs for future verticals — swap data source only */
export const AUTO_CATEGORY: DirectoryCategoryConfig = {
  id: 'auto',
  label: 'Auto Loan Companies',
  labelShort: 'Auto Loans',
  hubPath: '/auto-loan-companies',
  statePath: (slug) => `/auto-loan-companies/${slug}`,
  year: 2026,
  schemaEntityType: 'FinancialService',
  isFreeDirectory: true,
  relatedVerticals: FDIC_CATEGORY.relatedVerticals,
};

export const DIRECTORY_CATEGORIES = {
  fdic: FDIC_CATEGORY,
  mortgage: MORTGAGE_CATEGORY,
  auto: AUTO_CATEGORY,
} as const;