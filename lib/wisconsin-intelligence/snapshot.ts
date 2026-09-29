/** WI-LEND-001: DFI verification, accepted HMDA 2025 property activity, selected DFI mortgage actions. */
export const WISCONSIN_SNAPSHOT = {
  path: '/wisconsin',
  generatedAt: '2026-09-29T16:01:44Z',
  retrievedAt: '2026-09-29',
  regulator: 'Wisconsin Department of Financial Institutions, Division of Banking, Mortgage Banking',
  sources: {
    licensing: 'https://dfi.wi.gov/Pages/FinancialServices/MortgageBanking/GeneralInformation.aspx',
    licenseTypes: 'https://dfi.wi.gov/Pages/FinancialServices/MortgageBanking/LicenseTypesRequirements.aspx',
    nmls: 'https://www.nmlsconsumeraccess.org/',
    complaints: 'https://dfi.wi.gov/Pages/FinancialServices/MortgageBanking/FileAComplaint.aspx',
  },
  licensing: {
    verification: 'KNOWN', roster: 'NOT_ACQUIRED', rows: null, sourceAsOf: null,
    classes: ['Mortgage Banker License', 'Mortgage Broker License', 'Mortgage Banker License (Branch)', 'Mortgage Broker License (Branch)', 'Mortgage Loan Originator License'] as const,
    servicerClass: 'Servicing is included in the DFI Mortgage Banker License description; no separate servicer-license class is listed.',
    classCounts: null, rowsWithPrintedNmls: null, distinctNmls: null, exactExistingCanonicalMatches: null, unmatchedRows: null,
  },
  hmda: {
    year: 2025, source: 'data/hmda/by-state/WI/county_market_summary.csv',
    applications: 226408, originations: 154296, denials: 31362, denialApplicationPct: 13.85,
    distinctLeis: 843, counties: 72,
    purchase: 86960, refinance: 80900, otherPurpose: 58548,
    conventional: 197399, fha: 16478, va: 11909, usdaOther: 622,
  },
  enforcement: {
    window: ['2022-01-01', '2026-09-29'], retrievedAt: '2026-09-29',
    scope: 'Two selected DFI mortgage-servicing multistate settlement announcements; not a complete Wisconsin mortgage enforcement census.',
    rows: [
      { date: '2025-01-08', respondent: 'Bayview Asset Management LLC and affiliates Lakeview Loan Servicing, Community Loan Servicing, and Pingora Holdings', grain: 'company group', action: 'Multistate mortgage-servicing settlement', status: 'announced settlement', nmls: null, wisconsinLicense: null, caseNumber: null, url: 'https://dfi.wi.gov/Pages/About/NewsEvents/NewsReleases/20250108BayviewCompanies.aspx' },
      { date: '2026-08-12', respondent: 'NewRez LLC', grain: 'company', action: 'Multistate mortgage-servicing settlement', status: 'announced settlement', nmls: '3013', wisconsinLicense: null, caseNumber: null, url: 'https://dfi.wi.gov/Pages/About/NewsEvents/NewsReleases/20260812MortgageServicerSettlement.aspx' },
    ],
    rowsWithPrintedNmls: 1, distinctPrintedNmls: 1, exactCanonicalAttachments: 0, nameOnlyAdverseJoins: 0,
  },
  complaints: { intake: 'KNOWN', providerRows: 'NOT_ACQUIRED', outcomes: 'REQUEST_ONLY/NOT_ACQUIRED' },
  newCanonicalOrganizations: 0, graphWrites: 0, claimEligibilityChanges: 0,
} as const;
