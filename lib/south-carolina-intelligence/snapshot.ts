import rosterJson from "./roster.json";

/** SC-LEND-001. One NMLS license class. Lender and servicer are not split. Branches, brokers, and originators are not in this file. */
export type ScMortgageLicenseRow = {
  companyId: string;
  companyName: string;
  street: string;
  city: string;
  officeState: string;
  postalCode: string;
  phone: string;
  licenseName: string;
  licenseStatus: string;
  originalLicenseDate: string;
};

export const SC_MORTGAGE_ROSTER = rosterJson as ScMortgageLicenseRow[];

function utc(date: string): number {
  const [month, day, year] = date.split("/").map(Number);
  return Date.UTC(year, month - 1, day);
}

const stamps = SC_MORTGAGE_ROSTER.map((row) => utc(row.originalLicenseDate));
const earliest = SC_MORTGAGE_ROSTER[stamps.indexOf(Math.min(...stamps))];
const latest = SC_MORTGAGE_ROSTER[stamps.indexOf(Math.max(...stamps))];

export const SC_LENDER_SNAPSHOT = {
  contract: "lender-sc-state-intel-v1",
  path: "/south-carolina",
  generatedAt: "2026-10-05T18:05:00Z",
  retrievedAt: "2026-10-05",
  regulator: "South Carolina State Board of Financial Institutions, Office of the Commissioner of Consumer Finance",
  sources: {
    mortgagePage: "https://consumerfinance.sc.gov/regulated-institutions/mortgage-lending",
    pageLinkLabel: "Mortgage Lenders Approved Through 9/2/2026",
    rosterUrl: "https://consumerfinance.sc.gov/sites/consumerfinance/files/Documents/NMLS%20Data%209-3-2026.pdf",
    rosterFileName: "NMLS Data 9-3-2026.pdf",
    rosterTitle: "NMLS Data 9-3-2026.xlsx",
    rosterSha256: "423deea9214fc57643b12242d78e3d76adaaa674ce8222a2e1bc4cef8307fbc0",
    rosterBytes: 287370,
    rosterPages: 6,
    fileClock: "Approved as of 09/03/2026",
    pdfCreatedAt: "2026-09-03T16:50:42Z",
    statuteUrl: "https://www.scstatehouse.gov/code/t37c022.php",
    nmlsConsumerAccess: "https://nmlsconsumeraccess.org/",
    licenseeLookup: "https://consumerfinance.sc.gov/look-licensee",
  },
  licensing: {
    licenseName: "SC-BFI Mortgage Lender / Servicer License",
    licenseRows: SC_MORTGAGE_ROSTER.length,
    distinctCompanyIds: new Set(SC_MORTGAGE_ROSTER.map((row) => row.companyId)).size,
    approvedRows: SC_MORTGAGE_ROSTER.filter((row) => row.licenseStatus === "Approved").length,
    approvedDeficientRows: SC_MORTGAGE_ROSTER.filter((row) => row.licenseStatus === "Approved - Deficient").length,
    lenderCount: null,
    servicerCount: null,
    branchRows: null,
    brokerRows: null,
    originatorPersons: null,
    supervisedConsumerLenderRows: null,
    officeAddressInSouthCarolina: SC_MORTGAGE_ROSTER.filter((row) => row.officeState === "SC").length,
    earliestOriginalLicenseDate: earliest.originalLicenseDate,
    latestOriginalLicenseDate: latest.originalLicenseDate,
    branchRoster: "NOT_ACQUIRED",
    brokerRoster: "NOT_ACQUIRED",
    originatorRoster: "NOT_ACQUIRED",
    supervisedLenderRoster: "NOT_ACQUIRED",
    bondCompliance: "NOT_ACQUIRED",
  },
  hmda: {
    year: 2025,
    countyMarketRows: 30,
    countyMarketRowsAreAllCounties: false,
    leiSummaryRows: 1009,
    statewideApplications: null,
    leiRowsAreLicenses: false,
    source: "data/hmda/south-carolina/county_market_summary_sc.csv",
  },
  enforcement: {
    corpus: "NOT_ACQUIRED",
    exactCanonicalAttachments: 0,
    nameOnlyAdverseJoins: 0,
  },
  examinations: {
    count: null,
    corpus: "NOT_ACQUIRED",
  },
  newCanonicalOrganizations: 0,
  graphWrites: 0,
  claimEligibilityChanges: 0,
} as const;
