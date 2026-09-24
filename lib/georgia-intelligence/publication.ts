/** GA-LEND-001. No second NMLS universe. No combined Georgia lender count. */

export const GEORGIA_INTELLIGENCE_GATE = {
  path: "/georgia",
  robotsIndex: true,
  sitemap: true,
  title: "Georgia Mortgage & Lending Intelligence | LenderTrustHub",
  description:
    "Research Georgia mortgage brokers, mortgage lenders, and mortgage loan originators through the Department of Banking and Finance and NMLS Consumer Access. Final orders are on the NMLS record, not a separate name-matched list. Not a ranking or a count of all Georgia lenders.",
} as const;

export const GA_DBF_MORTGAGE = "https://dbf.georgia.gov/mortgage-brokers-and-mortgage-lenders";
export const GA_DBF_VERIFY = "https://dbf.georgia.gov/mb-brokers-lenders-and-originators/mortgage-license-administrative-action-searches";
export const GA_DBF_ENFORCEMENT = "https://dbf.georgia.gov/enforcement-actions-non-depository";
export const GA_DBF_MLO = "https://dbf.georgia.gov/mortgage-loan-originators-aka-mlos";
export const GA_NMLS_ACCESS = "https://www.nmlsconsumeraccess.org/";
