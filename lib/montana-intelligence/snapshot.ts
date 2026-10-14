/** Montana mortgage evidence derived from the already-owned 2025 HMDA partition. */
export const MONTANA_LENDER_SNAPSHOT = {
  hmdaVintage: 2025,
  countyRows: 56,
  applications: 37122,
  originations: 22968,
  denials: 5479,
  countyFile: "data/hmda/by-state/MT/county_market_summary.csv",
  countyFileSha256: "0fa39a03fb08e843134c584d05dce130f5fe7c5b086c16916204b8d23e632e71",
  hmdaLeiRows: 482,
  leiFile: "data/hmda/by-state/MT/lender_state_summary.csv",
  leiFileSha256: "d19f8845a49cd03bf66ed1633970c376038f6a35358625023ed324b6b97ffbb4",
  leiApplications: 37007,
  licenseCensus: "NOT_ACQUIRED",
  enforcementObservations: 259,
  latestVisibleOrderDate: "2026-10-07",
} as const;
