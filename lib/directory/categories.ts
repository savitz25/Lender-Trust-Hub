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
      label: 'Auto Loan Companies',
      href: (s) => `/auto-loan-companies/${s}`,
      description: 'Compare APR ranges & trust scores',
      live: true,
    },
    {
      label: 'Mortgage Calculators',
      href: () => '/calculators',
      description: 'Payment & affordability tools',
      live: true,
    },
    {
      label: 'Credit Repair',
      href: (s) => `/credit-repair/${s}`,
      description: 'Transparent credit repair listings',
      live: false,
    },
    {
      label: 'MCA Companies',
      href: (s) => `/mca-companies/${s}`,
      description: 'Merchant cash advance directory',
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
      label: 'Auto Loan Companies',
      href: (s) => `/auto-loan-companies/${s}`,
      description: 'Car loan rates by state',
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

/** Auto loans — LIVE (cloned from mortgage pattern) */
export const AUTO_CATEGORY: DirectoryCategoryConfig = {
  id: 'auto',
  label: 'Auto Loan Companies',
  labelShort: 'Auto Loans',
  hubPath: '/auto-loan-companies',
  statePath: (slug) => `/auto-loan-companies/${slug}`,
  year: 2026,
  schemaEntityType: 'FinancialService',
  isFreeDirectory: true,
  relatedVerticals: [
    {
      label: 'FDIC Insured Banks',
      href: (s) => `/fdic-insured-banks/${s}`,
      description: 'Verify deposit insurance',
      live: true,
    },
    {
      label: 'Mortgage Lenders',
      href: (s) => `/local-lenders/${s}`,
      description: 'NMLS verified brokers',
      live: true,
    },
    {
      label: 'Calculators',
      href: () => '/calculators',
      description: 'Payment tools',
      live: true,
    },
  ],
};

/** Credit repair — set live: true when data is ready (see VERTICAL_CLONE_GUIDE) */
export const CREDIT_REPAIR_CATEGORY: DirectoryCategoryConfig = {
  id: 'credit-repair',
  label: 'Credit Repair Companies',
  labelShort: 'Credit Repair',
  hubPath: '/credit-repair',
  statePath: (slug) => `/credit-repair/${slug}`,
  year: 2026,
  schemaEntityType: 'Organization',
  isFreeDirectory: true,
  relatedVerticals: FDIC_CATEGORY.relatedVerticals,
};

/** MCA — set live: true when data is ready (see VERTICAL_CLONE_GUIDE) */
export const MCA_CATEGORY: DirectoryCategoryConfig = {
  id: 'mca',
  label: 'MCA Companies',
  labelShort: 'MCA',
  hubPath: '/mca-companies',
  statePath: (slug) => `/mca-companies/${slug}`,
  year: 2026,
  schemaEntityType: 'FinancialService',
  isFreeDirectory: true,
  relatedVerticals: FDIC_CATEGORY.relatedVerticals,
};

export const DIRECTORY_CATEGORIES = {
  fdic: FDIC_CATEGORY,
  mortgage: MORTGAGE_CATEGORY,
  auto: AUTO_CATEGORY,
  'credit-repair': CREDIT_REPAIR_CATEGORY,
  mca: MCA_CATEGORY,
} as const;