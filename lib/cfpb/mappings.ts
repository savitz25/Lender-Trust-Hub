import type { CfpbCompanyMapping } from './types';

/**
 * Curated CFPB company-name matches for major HMDA-linked directory slugs.
 *
 * Names must match the CFPB API `company` filter exactly (case, punctuation, LLC.).
 * Do not invent fuzzy matches at query time — extend this list deliberately.
 *
 * Matching notes are shown in the UI. Prefer under-matching to false positives.
 */
export const CFPB_COMPANY_MAPPINGS: CfpbCompanyMapping[] = [
  {
    ourLenderSlug: 'rocket-mortgage',
    cfpbCompanyNames: ['Rocket Mortgage, LLC'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “Rocket Mortgage, LLC” (includes Quicken legacy rows under this name when published as such).',
  },
  {
    ourLenderSlug: 'united-wholesale-mortgage',
    cfpbCompanyNames: ['United Shore Financial Services, LLC'],
    matchMethod: 'curated-dba',
    matchNote:
      'UWM publishes under the legal name “United Shore Financial Services, LLC” in the CFPB database (historical / legal entity name).',
  },
  {
    ourLenderSlug: 'freedom-mortgage',
    cfpbCompanyNames: ['Freedom Mortgage Company'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “Freedom Mortgage Company”.',
  },
  {
    ourLenderSlug: 'loandepot',
    cfpbCompanyNames: ['LD Holdings Group, LLC'],
    matchMethod: 'curated-dba',
    matchNote:
      'loanDepot-related mortgage complaints commonly publish under “LD Holdings Group, LLC” in CFPB (holding company label).',
  },
  {
    ourLenderSlug: 'guaranteed-rate',
    cfpbCompanyNames: ['GUARANTEED RATE INC.'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “GUARANTEED RATE INC.” (trailing period required).',
  },
  {
    ourLenderSlug: 'pennymac',
    cfpbCompanyNames: ['PENNYMAC LOAN SERVICES, LLC.'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “PENNYMAC LOAN SERVICES, LLC.” (trailing period required).',
  },
  {
    ourLenderSlug: 'jpmorgan-chase-bank',
    cfpbCompanyNames: ['JPMORGAN CHASE & CO.'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB parent label “JPMORGAN CHASE & CO.” — includes bank-wide mortgage complaints, not only the Chase mortgage brand product line.',
  },
  {
    ourLenderSlug: 'mr-cooper',
    cfpbCompanyNames: ['NATIONSTAR MORTGAGE LLC', 'Mr. Cooper Group Inc.'],
    matchMethod: 'curated-multi',
    matchNote:
      'Combined CFPB rows for “NATIONSTAR MORTGAGE LLC” and “Mr. Cooper Group Inc.” (same NMLS family / rebrand). Counts are summed; some historical rows may still be under only one label.',
  },
  {
    ourLenderSlug: 'newrez',
    cfpbCompanyNames: ['Shellpoint Partners, LLC'],
    matchMethod: 'curated-affiliate',
    matchNote:
      'Newrez / New Residential family activity often appears under “Shellpoint Partners, LLC” in CFPB. This is an affiliate/servicing-side label — treat as related entity context, not a perfect one-to-one brand match.',
  },
  {
    ourLenderSlug: 'cardinal-financial',
    cfpbCompanyNames: ['CARDINAL FINANCIAL COMPANY, LIMITED PARTNERSHIP'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “CARDINAL FINANCIAL COMPANY, LIMITED PARTNERSHIP”.',
  },
  {
    ourLenderSlug: 'amerihome-mortgage',
    cfpbCompanyNames: ['AmeriHome Mortgage Company, LLC'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “AmeriHome Mortgage Company, LLC”.',
  },
  {
    ourLenderSlug: 'eagle-home-mortgage',
    cfpbCompanyNames: ['Eagle Home Mortgage, LLC'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “Eagle Home Mortgage, LLC”.',
  },
  {
    ourLenderSlug: 'wells-fargo-bank',
    cfpbCompanyNames: ['WELLS FARGO & COMPANY'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB parent label “WELLS FARGO & COMPANY” — bank-wide mortgage complaints, not a product-line isolate.',
  },
  // ── Expansion wave 2 (2026-08) — exact CCDB company names only ──
  {
    ourLenderSlug: 'truist-bank',
    cfpbCompanyNames: [
      'TRUIST FINANCIAL CORPORATION',
      'SUNTRUST BANKS, INC.',
      'BB&T CORPORATION',
    ],
    matchMethod: 'curated-multi',
    matchNote:
      'Combined CFPB parent labels for Truist and predecessor banks SunTrust and BB&T. Counts are summed across lineage names; some historical complaints remain only under a predecessor label.',
  },
  {
    ourLenderSlug: 'regions-bank',
    cfpbCompanyNames: ['REGIONS FINANCIAL CORPORATION'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB parent label “REGIONS FINANCIAL CORPORATION” — bank-wide mortgage complaints.',
  },
  {
    ourLenderSlug: 'new-american-funding',
    cfpbCompanyNames: ['BROKER SOLUTIONS, INC.'],
    matchMethod: 'curated-dba',
    matchNote:
      'New American Funding publishes under legal entity “BROKER SOLUTIONS, INC.” in the CFPB database (NMLS family / DBA).',
  },
  {
    ourLenderSlug: 'pnc-bank',
    cfpbCompanyNames: ['PNC Bank N.A.'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “PNC Bank N.A.” — bank-wide mortgage complaints (spelling/punctuation as published).',
  },
  {
    ourLenderSlug: 'better-mortgage',
    cfpbCompanyNames: ['Better Mortgage, Inc.'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “Better Mortgage, Inc.”.',
  },
  {
    ourLenderSlug: 'ally-bank',
    cfpbCompanyNames: ['ALLY FINANCIAL INC.'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB parent label “ALLY FINANCIAL INC.” — mortgage-related complaints under the Ally financial group (not a separate “Ally Bank” company string in CCDB).',
  },
  {
    ourLenderSlug: 'td-bank',
    cfpbCompanyNames: ['TD BANK US HOLDING COMPANY'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB parent label “TD BANK US HOLDING COMPANY” — bank-wide mortgage complaints.',
  },
  {
    ourLenderSlug: 'usaa-federal-savings-bank',
    cfpbCompanyNames: ['UNITED SERVICES AUTOMOBILE ASSOCIATION'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “UNITED SERVICES AUTOMOBILE ASSOCIATION” (USAA family label used in CCDB for mortgage complaints).',
  },
  {
    ourLenderSlug: 'flagstar-bank',
    cfpbCompanyNames: ['Flagstar Bank, N.A.'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “Flagstar Bank, N.A.”.',
  },
  {
    ourLenderSlug: 'citizens-bank',
    cfpbCompanyNames: ['CITIZENS FINANCIAL GROUP, INC.'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB parent label “CITIZENS FINANCIAL GROUP, INC.” — not First Citizens or other similarly named institutions.',
  },
  {
    ourLenderSlug: 'us-bank',
    cfpbCompanyNames: ['U.S. BANCORP'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB parent label “U.S. BANCORP” — bank-wide mortgage complaints.',
  },
  {
    ourLenderSlug: 'sofi-bank',
    cfpbCompanyNames: ['SOFI TECHNOLOGIES, INC.', 'SoFi Mortgage, LLC'],
    matchMethod: 'curated-multi',
    matchNote:
      'Combined CFPB rows for “SOFI TECHNOLOGIES, INC.” and “SoFi Mortgage, LLC”. Counts are summed; volume is modest relative to large bank servicers.',
  },
  {
    ourLenderSlug: 'suncoast-credit-union',
    cfpbCompanyNames: ['SUNCOAST CREDIT UNION'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “SUNCOAST CREDIT UNION”. Mortgage complaint volume is low (credit unions publish fewer CCDB rows than large banks).',
  },
  {
    ourLenderSlug: 'academy-mortgage',
    cfpbCompanyNames: ['Academy Mortgage Corporation'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “Academy Mortgage Corporation”.',
  },
  {
    ourLenderSlug: 'carrington-mortgage',
    cfpbCompanyNames: ['CARRINGTON MORTGAGE SERVICES, LLC'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “CARRINGTON MORTGAGE SERVICES, LLC”.',
  },
  {
    ourLenderSlug: 'amerisave',
    cfpbCompanyNames: ['AMERISAVE MORTGAGE CORPORATION'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “AMERISAVE MORTGAGE CORPORATION”.',
  },
  {
    ourLenderSlug: 'lakeview-loan-servicing',
    cfpbCompanyNames: ['LAKEVIEW LOAN SERVICING, LLC'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “LAKEVIEW LOAN SERVICING, LLC” (servicing-side label).',
  },
  {
    ourLenderSlug: 'first-horizon-bank',
    cfpbCompanyNames: ['FIRST HORIZON BANK'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “FIRST HORIZON BANK”.',
  },
  {
    ourLenderSlug: 'southstate-bank',
    cfpbCompanyNames: ['SOUTHSTATE BANK CORPORATION'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “SOUTHSTATE BANK CORPORATION”.',
  },
  {
    ourLenderSlug: 'ameris-bank',
    cfpbCompanyNames: ['AMERIS BANCORP'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB parent label “AMERIS BANCORP” (no exact “AMERIS BANK” company string with mortgage hits in CCDB).',
  },
  {
    ourLenderSlug: '21st-mortgage',
    cfpbCompanyNames: ['21ST MORTGAGE CORP.'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “21ST MORTGAGE CORP.”.',
  },
];

const bySlug = new Map(CFPB_COMPANY_MAPPINGS.map((m) => [m.ourLenderSlug, m]));

export function getCfpbMappingBySlug(slug: string): CfpbCompanyMapping | null {
  return bySlug.get(slug) ?? null;
}

export function getAllMappedCfpbCompanyNames(): string[] {
  const set = new Set<string>();
  for (const m of CFPB_COMPANY_MAPPINGS) {
    for (const name of m.cfpbCompanyNames) set.add(name);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function getMappedCfpbSlugs(): string[] {
  return CFPB_COMPANY_MAPPINGS.map((m) => m.ourLenderSlug);
}
