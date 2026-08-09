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
