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
    nmlsIds: ['3030'],
    cfpbCompanyNames: ['Rocket Mortgage, LLC'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “Rocket Mortgage, LLC” (includes Quicken legacy rows under this name when published as such).',
  },
  {
    ourLenderSlug: 'united-wholesale-mortgage',
    nmlsIds: ['3038'],
    cfpbCompanyNames: ['United Shore Financial Services, LLC'],
    matchMethod: 'curated-dba',
    matchNote:
      'UWM publishes under the legal name “United Shore Financial Services, LLC” in the CFPB database (historical / legal entity name).',
  },
  {
    ourLenderSlug: 'freedom-mortgage',
    nmlsIds: ['2767'],
    cfpbCompanyNames: ['Freedom Mortgage Company'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “Freedom Mortgage Company”.',
  },
  {
    ourLenderSlug: 'loandepot',
    nmlsIds: ['174457'],
    cfpbCompanyNames: ['LD Holdings Group, LLC'],
    matchMethod: 'curated-dba',
    matchNote:
      'loanDepot-related mortgage complaints commonly publish under “LD Holdings Group, LLC” in CFPB (holding company label).',
  },
  {
    ourLenderSlug: 'guaranteed-rate',
    nmlsIds: ['2611'],
    cfpbCompanyNames: ['GUARANTEED RATE INC.'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “GUARANTEED RATE INC.” (trailing period required).',
  },
  {
    ourLenderSlug: 'pennymac',
    nmlsIds: ['35953'],
    cfpbCompanyNames: ['PENNYMAC LOAN SERVICES, LLC.'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “PENNYMAC LOAN SERVICES, LLC.” (trailing period required).',
  },
  {
    ourLenderSlug: 'jpmorgan-chase-bank',
    nmlsIds: ['399798'],
    cfpbCompanyNames: ['JPMORGAN CHASE & CO.'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB parent label “JPMORGAN CHASE & CO.” — includes bank-wide mortgage complaints, not only the Chase mortgage brand product line.',
  },
  {
    ourLenderSlug: 'mr-cooper',
    nmlsIds: ['2104'],
    cfpbCompanyNames: ['NATIONSTAR MORTGAGE LLC', 'Mr. Cooper Group Inc.'],
    matchMethod: 'curated-multi',
    matchNote:
      'Combined CFPB rows for “NATIONSTAR MORTGAGE LLC” and “Mr. Cooper Group Inc.” (same NMLS family / rebrand). Counts are summed; some historical rows may still be under only one label.',
  },
  {
    ourLenderSlug: 'newrez',
    nmlsIds: ['2289', '7996'],
    cfpbCompanyNames: ['Shellpoint Partners, LLC'],
    matchMethod: 'curated-affiliate',
    matchNote:
      'Newrez / New Residential family activity often appears under “Shellpoint Partners, LLC” in CFPB. This is an affiliate/servicing-side label — treat as related entity context, not a perfect one-to-one brand match.',
  },
  {
    ourLenderSlug: 'cardinal-financial',
    nmlsIds: ['66247'],
    cfpbCompanyNames: ['CARDINAL FINANCIAL COMPANY, LIMITED PARTNERSHIP'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “CARDINAL FINANCIAL COMPANY, LIMITED PARTNERSHIP”.',
  },
  {
    ourLenderSlug: 'amerihome-mortgage',
    nmlsIds: ['1120271'],
    cfpbCompanyNames: ['AmeriHome Mortgage Company, LLC'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “AmeriHome Mortgage Company, LLC”.',
  },
  {
    ourLenderSlug: 'eagle-home-mortgage',
    nmlsIds: ['2925'],
    cfpbCompanyNames: ['Eagle Home Mortgage, LLC'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “Eagle Home Mortgage, LLC”.',
  },
  {
    ourLenderSlug: 'wells-fargo-bank',
    nmlsIds: ['399801'],
    cfpbCompanyNames: ['WELLS FARGO & COMPANY'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB parent label “WELLS FARGO & COMPANY” — bank-wide mortgage complaints, not a product-line isolate.',
  },
  // ── Expansion wave 2 (2026-08) — exact CCDB company names only ──
  {
    ourLenderSlug: 'truist-bank',
    nmlsIds: ['405457'],
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
    nmlsIds: ['467341'],
    cfpbCompanyNames: ['REGIONS FINANCIAL CORPORATION'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB parent label “REGIONS FINANCIAL CORPORATION” — bank-wide mortgage complaints.',
  },
  {
    ourLenderSlug: 'new-american-funding',
    nmlsIds: ['6606'],
    cfpbCompanyNames: ['BROKER SOLUTIONS, INC.'],
    matchMethod: 'curated-dba',
    matchNote:
      'New American Funding publishes under legal entity “BROKER SOLUTIONS, INC.” in the CFPB database (NMLS family / DBA). All directory NAF branch listings with company NMLS 6606 inherit this mapping.',
  },
  {
    ourLenderSlug: 'pnc-bank',
    nmlsIds: ['446038'],
    cfpbCompanyNames: ['PNC Bank N.A.'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “PNC Bank N.A.” — bank-wide mortgage complaints (spelling/punctuation as published).',
  },
  {
    ourLenderSlug: 'better-mortgage',
    nmlsIds: ['330511'],
    cfpbCompanyNames: ['Better Mortgage, Inc.'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “Better Mortgage, Inc.”.',
  },
  {
    ourLenderSlug: 'ally-bank',
    nmlsIds: ['181005'],
    cfpbCompanyNames: ['ALLY FINANCIAL INC.'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB parent label “ALLY FINANCIAL INC.” — mortgage-related complaints under the Ally financial group (not a separate “Ally Bank” company string in CCDB).',
  },
  {
    ourLenderSlug: 'td-bank',
    nmlsIds: ['481428'],
    cfpbCompanyNames: ['TD BANK US HOLDING COMPANY'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB parent label “TD BANK US HOLDING COMPANY” — bank-wide mortgage complaints.',
  },
  {
    ourLenderSlug: 'usaa-federal-savings-bank',
    nmlsIds: ['399809'],
    cfpbCompanyNames: ['UNITED SERVICES AUTOMOBILE ASSOCIATION'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “UNITED SERVICES AUTOMOBILE ASSOCIATION” (USAA family label used in CCDB for mortgage complaints).',
  },
  {
    ourLenderSlug: 'flagstar-bank',
    nmlsIds: ['399797'],
    cfpbCompanyNames: ['Flagstar Bank, N.A.'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “Flagstar Bank, N.A.”.',
  },
  {
    ourLenderSlug: 'citizens-bank',
    nmlsIds: ['433960'],
    cfpbCompanyNames: ['CITIZENS FINANCIAL GROUP, INC.'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB parent label “CITIZENS FINANCIAL GROUP, INC.” — not First Citizens or other similarly named institutions.',
  },
  {
    ourLenderSlug: 'us-bank',
    nmlsIds: ['402216'],
    cfpbCompanyNames: ['U.S. BANCORP'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB parent label “U.S. BANCORP” — bank-wide mortgage complaints.',
  },
  {
    ourLenderSlug: 'sofi-bank',
    nmlsIds: ['1121636'],
    cfpbCompanyNames: ['SOFI TECHNOLOGIES, INC.', 'SoFi Mortgage, LLC'],
    matchMethod: 'curated-multi',
    matchNote:
      'Combined CFPB rows for “SOFI TECHNOLOGIES, INC.” and “SoFi Mortgage, LLC”. Counts are summed; volume is modest relative to large bank servicers.',
  },
  {
    ourLenderSlug: 'suncoast-credit-union',
    nmlsIds: ['417636'],
    cfpbCompanyNames: ['SUNCOAST CREDIT UNION'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “SUNCOAST CREDIT UNION”. Mortgage complaint volume is low (credit unions publish fewer CCDB rows than large banks).',
  },
  {
    ourLenderSlug: 'academy-mortgage',
    nmlsIds: ['3113'],
    cfpbCompanyNames: ['Academy Mortgage Corporation'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “Academy Mortgage Corporation”.',
  },
  {
    ourLenderSlug: 'carrington-mortgage',
    nmlsIds: ['2250'],
    cfpbCompanyNames: ['CARRINGTON MORTGAGE SERVICES, LLC'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “CARRINGTON MORTGAGE SERVICES, LLC”.',
  },
  {
    ourLenderSlug: 'amerisave',
    nmlsIds: ['1168'],
    cfpbCompanyNames: ['AMERISAVE MORTGAGE CORPORATION'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “AMERISAVE MORTGAGE CORPORATION”.',
  },
  {
    ourLenderSlug: 'lakeview-loan-servicing',
    nmlsIds: ['4095'],
    cfpbCompanyNames: ['LAKEVIEW LOAN SERVICING, LLC'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “LAKEVIEW LOAN SERVICING, LLC” (servicing-side label).',
  },
  {
    ourLenderSlug: 'first-horizon-bank',
    nmlsIds: ['405456'],
    cfpbCompanyNames: ['FIRST HORIZON BANK'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “FIRST HORIZON BANK”.',
  },
  {
    ourLenderSlug: 'southstate-bank',
    nmlsIds: ['405461'],
    cfpbCompanyNames: ['SOUTHSTATE BANK CORPORATION'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “SOUTHSTATE BANK CORPORATION”.',
  },
  {
    ourLenderSlug: 'ameris-bank',
    nmlsIds: ['405455'],
    cfpbCompanyNames: ['AMERIS BANCORP'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB parent label “AMERIS BANCORP” (no exact “AMERIS BANK” company string with mortgage hits in CCDB).',
  },
  {
    ourLenderSlug: '21st-mortgage',
    nmlsIds: ['2280'],
    cfpbCompanyNames: ['21ST MORTGAGE CORP.'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “21ST MORTGAGE CORP.”.',
  },
  // ── Expansion wave 3 (2026-08) — directory branch/company slugs + confirmed exact CCDB names ──
  {
    ourLenderSlug: 'movement-mortgage-myrtle-beach',
    nmlsIds: ['39179'],
    cfpbCompanyNames: ['Movement Mortgage LLC'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “Movement Mortgage LLC” (no comma). All directory Movement branch listings with company NMLS 39179 inherit this mapping.',
  },
  {
    ourLenderSlug: 'navy-federal-jacksonville',
    nmlsIds: ['399807'],
    cfpbCompanyNames: ['NAVY FEDERAL CREDIT UNION'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “NAVY FEDERAL CREDIT UNION”. Directory slug is a regional listing of the national credit union.',
  },
  {
    ourLenderSlug: 'penfed-dc-mid-city',
    nmlsIds: ['401822'],
    cfpbCompanyNames: ['PENTAGON FEDERAL CREDIT UNION'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “PENTAGON FEDERAL CREDIT UNION” (PenFed). Directory slug is a regional listing.',
  },
  {
    ourLenderSlug: 'primelending-columbus',
    nmlsIds: ['1921'],
    cfpbCompanyNames: ['PRIMELENDING, A PLAINSCAPITAL COMPANY'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “PRIMELENDING, A PLAINSCAPITAL COMPANY”. Directory slug is a regional team listing.',
  },
  {
    ourLenderSlug: 'fairway-mortgage-augusta-sheppard',
    nmlsIds: ['2909', '1702'],
    cfpbCompanyNames: ['Fairway Independent Mortgage Corporation'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “Fairway Independent Mortgage Corporation”. Branch/team directory listings inherit via company NMLS when present.',
  },
  {
    ourLenderSlug: 'guild-mortgage-west-valley',
    nmlsIds: ['3274'],
    cfpbCompanyNames: ['Guild Holdings Company'],
    matchMethod: 'curated-dba',
    matchNote:
      'Guild Mortgage activity publishes under parent “Guild Holdings Company” in CCDB (not “Guild Mortgage Company”). All directory Guild listings with company NMLS 3274 inherit this mapping.',
  },
  {
    ourLenderSlug: 'crosscountry-mortgage-west-valley',
    nmlsIds: ['3029'],
    cfpbCompanyNames: ['CrossCountry Mortgage LLC'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “CrossCountry Mortgage LLC” (no comma). All directory CrossCountry listings with company NMLS 3029 inherit this mapping.',
  },
  {
    ourLenderSlug: 'prmg',
    nmlsIds: ['75243', '1041'],
    cfpbCompanyNames: ['PARAMOUNT RESIDENTIAL MORTGAGE GROUP'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “PARAMOUNT RESIDENTIAL MORTGAGE GROUP” (no “, Inc.” suffix in CCDB).',
  },
  {
    ourLenderSlug: 'dhi-mortgage-buckeye',
    nmlsIds: ['14622'],
    cfpbCompanyNames: ['DHI Mortgage Company'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “DHI Mortgage Company”. Directory slug is a regional listing of D.R. Horton’s captive lender.',
  },
  {
    ourLenderSlug: 'cmg-home-loans-dennis-vo',
    nmlsIds: ['1820', '2458338'],
    cfpbCompanyNames: ['CMG Financial Services, Inc.'],
    matchMethod: 'curated-dba',
    matchNote:
      'CMG Home Loans / CMG Mortgage brand activity publishes under “CMG Financial Services, Inc.” in CCDB. Directory slug is a team listing under CMG.',
  },
  {
    ourLenderSlug: 'prmi-aaron-swenson',
    nmlsIds: ['3094', '3087'],
    cfpbCompanyNames: ['PRIMARY RESIDENTIAL MORTGAGE'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “PRIMARY RESIDENTIAL MORTGAGE” (no “, Inc.” in CCDB). Directory slug is a branch listing of PRMI.',
  },
  // ── Expansion wave 4 (2026-08) — remaining major brands + NMLS inheritance ──
  {
    ourLenderSlug: 'bank-of-america-mortgage-silicon-valley',
    nmlsIds: ['399802'],
    cfpbCompanyNames: ['BANK OF AMERICA, NATIONAL ASSOCIATION'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “BANK OF AMERICA, NATIONAL ASSOCIATION” — bank-wide mortgage complaints. All directory Bank of America Mortgage listings with company NMLS 399802 inherit this mapping.',
  },
  {
    ourLenderSlug: 'veterans-united-jacksonville',
    nmlsIds: ['1907'],
    cfpbCompanyNames: ['Mortgage Research Center, LLC'],
    matchMethod: 'curated-dba',
    matchNote:
      'Veterans United Home Loans publishes under legal entity “Mortgage Research Center, LLC” in CCDB (confirmed exact company= filter). All directory Veterans United listings with company NMLS 1907 inherit this mapping.',
  },
  {
    ourLenderSlug: 'lennar-mortgage-clovis',
    nmlsIds: ['1058'],
    cfpbCompanyNames: ['Lennar Financial Services, LLC'],
    matchMethod: 'curated-dba',
    matchNote:
      'Lennar Mortgage brand activity publishes under “Lennar Financial Services, LLC” in CCDB (not “Lennar Mortgage, LLC”). All directory Lennar Mortgage listings with company NMLS 1058 inherit this mapping.',
  },
  {
    ourLenderSlug: 'supreme-lending-south-florida',
    nmlsIds: ['2129'],
    cfpbCompanyNames: ['Supreme Lending'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “Supreme Lending”.',
  },
  {
    ourLenderSlug: 'acrisure-mortgage',
    nmlsIds: ['152859'],
    cfpbCompanyNames: ['FBC MORTGAGE, LLC', 'Acrisure Mortgage Partners, LLC'],
    matchMethod: 'curated-multi',
    matchNote:
      'Acrisure Mortgage (formerly FBC Mortgage) — combined exact CCDB labels “FBC MORTGAGE, LLC” and “Acrisure Mortgage Partners, LLC”. Counts are summed. All directory Acrisure listings with company NMLS 152859 inherit this mapping.',
  },
  {
    ourLenderSlug: 'union-home-mortgage-reeves-team',
    cfpbCompanyNames: ['Union Home Mortgage Corp'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “Union Home Mortgage Corp” (no trailing period). Individual LO/branch NMLS IDs on directory rows may differ — slug mapping is explicit for UHM team listings; other UHM slugs are also listed below.',
  },
  {
    ourLenderSlug: 'union-home-mortgage-coastal',
    cfpbCompanyNames: ['Union Home Mortgage Corp'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “Union Home Mortgage Corp” (same company label as other UHM directory teams).',
  },
  {
    ourLenderSlug: 'union-home-mortgage-myrtle-beach',
    cfpbCompanyNames: ['Union Home Mortgage Corp'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “Union Home Mortgage Corp” (same company label as other UHM directory teams).',
  },
  {
    ourLenderSlug: 'city-national-bank-mortgage',
    nmlsIds: ['5369'],
    cfpbCompanyNames: ['CITY NATIONAL BANK'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “CITY NATIONAL BANK” (RBC City National / CNB label as published). Not City National Bank of Florida (no exact FL CNB mortgage hits).',
  },
  {
    ourLenderSlug: 'fifth-third-bank',
    nmlsIds: ['3444', '399800'],
    cfpbCompanyNames: ['FIFTH THIRD FINANCIAL CORPORATION'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB parent label “FIFTH THIRD FINANCIAL CORPORATION”. Added for company-level inheritance if/when directory rows use Fifth Third company NMLS.',
  },
  {
    ourLenderSlug: 'huntington-bank',
    cfpbCompanyNames: ['HUNTINGTON NATIONAL BANK, THE'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “HUNTINGTON NATIONAL BANK, THE” (trailing “THE” required). No primary directory slug yet — mapping reserved for future profile + NMLS inheritance.',
  },
  {
    ourLenderSlug: 'keybank',
    cfpbCompanyNames: ['KEYCORP'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB parent label “KEYCORP”. Reserved for directory profiles that use KeyBank company NMLS.',
  },
  {
    ourLenderSlug: 'capital-one',
    cfpbCompanyNames: ['CAPITAL ONE FINANCIAL CORPORATION'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB parent label “CAPITAL ONE FINANCIAL CORPORATION”. Reserved for directory profiles that use Capital One company NMLS.',
  },
  {
    ourLenderSlug: 'citibank',
    cfpbCompanyNames: ['CITIBANK, N.A.'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “CITIBANK, N.A.” (trailing period required).',
  },
  {
    ourLenderSlug: 'discover-bank',
    nmlsIds: ['3656'],
    cfpbCompanyNames: ['DISCOVER BANK'],
    matchMethod: 'curated-exact',
    matchNote: 'Matched to CFPB company name “DISCOVER BANK”.',
  },
  {
    ourLenderSlug: 'synovus-bank',
    nmlsIds: ['480004', '179119'],
    cfpbCompanyNames: ['Synovus Bank'],
    matchMethod: 'curated-exact',
    matchNote:
      'Matched to CFPB company name “Synovus Bank”. NMLS inheritance covers bank/mortgage company IDs when present on directory rows.',
  },
];

const bySlug = new Map(CFPB_COMPANY_MAPPINGS.map((m) => [m.ourLenderSlug, m]));

const byNmls = new Map<string, CfpbCompanyMapping>();
for (const m of CFPB_COMPANY_MAPPINGS) {
  for (const n of m.nmlsIds ?? []) {
    const digits = n.replace(/\D/g, '');
    if (digits && !byNmls.has(digits)) byNmls.set(digits, m);
  }
}

export function getCfpbMappingBySlug(slug: string): CfpbCompanyMapping | null {
  return bySlug.get(slug) ?? null;
}

/** Resolve mapping by company NMLS (covers multi-branch directory listings). */
export function getCfpbMappingByNmls(nmlsId: string | null | undefined): CfpbCompanyMapping | null {
  if (!nmlsId) return null;
  const digits = nmlsId.replace(/\D/g, '');
  if (!digits) return null;
  return byNmls.get(digits) ?? null;
}

/**
 * Prefer slug mapping; fall back to company NMLS so regional branch profiles
 * inherit the same exact CFPB company match as the parent company.
 */
export function resolveCfpbMapping(params: {
  slug: string;
  nmlsId?: string | null;
}): CfpbCompanyMapping | null {
  return getCfpbMappingBySlug(params.slug) ?? getCfpbMappingByNmls(params.nmlsId);
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
