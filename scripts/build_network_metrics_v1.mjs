/**
 * Build lender-network-metrics-v1 from production + publication-gated catalogs.
 * Does not write intelligence snapshots and does not touch AskTrustHub.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { publicationMetricInputs } from "./publication_metric_inputs.mjs";

import { reconcile } from "./reconcile_network_metrics.mjs";
import { createHash } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const out = join(root, "data/home/lender-network-metrics-v1.json");
  const check = process.argv.includes("--check");
  const previous = check ? JSON.parse(readFileSync(out, "utf8")) : null;
  const prod = JSON.parse(readFileSync(join(root, "data/home/lender-metric-census-r2-03.json"), "utf8"));
  const pub = publicationMetricInputs();
  const { computeLenderNetworkMetrics } = await import(
    pathToFileURL(join(root, "lib/metrics/compute-lender-network-metrics.ts")).href
  );

  const input = {
    generatedAt: previous?.generatedAt ?? new Date().toISOString(),
    institutions: prod.identity.institutions,
    branches: prod.identity.branches,
    personMlo: prod.identity.person_mlo,
    personPublicCandidate: prod.identity.person_public_candidate,
    nmlsInstitution: prod.identity.nmls_institution,
    nmlsBranch: prod.identity.nmls_branch,
    nmlsPerson: prod.identity.nmls_person,
    lei: prod.identity.lei,
    fdicCert: prod.identity.fdic,
    ncuaCharter: prod.identity.ncua,
    rssd: prod.identity.rssd,
    lpiSnapshots: prod.identity.lpi,
    depository: {
      FDIC: prod.depository.FDIC,
      NCUA: prod.depository.NCUA,
      NONBANK: prod.depository.NONBANK,
      UNKNOWN: prod.depository.UNKNOWN,
    },
    hmdaRows: prod.hmdaCounty2025.rows,
    hmdaApplications: prod.hmdaCounty2025.applications,
    hmdaOriginations: prod.hmdaCounty2025.originations,
    hmdaDenials: prod.hmdaCounty2025.denials,
    hmdaStateGrainApplications: prod.hmdaState2025.applications,
    geography: prod.geography,
    complaints: prod.cfpb.complaints,
    complaintsAttached: prod.cfpb.attached,
    complaintsUnattached: prod.cfpb.unattached,
    cfpbLabels: prod.cfpb.labels,
    cfpbBridges: prod.cfpbBridges,
    cfpbObserved: String(prod.cfpb.observed),
    federalEnforcementEvents: prod.federalEnforcement,
    flApprovedCredentials: prod.florida.approved_credentials,
    flConfirmedNmls: prod.florida.confirmed_nmls,
    flHeldNmls: prod.florida.held_nmls,
    flSre: prod.florida.sre,
    flOfrSourceAsOf: prod.floridaSourceClocks.map(r => r.source_observed_on).sort().at(-1),
    flUnresolvedSourceCompanyNmls: pub.flUnresolvedSourceCompanyNmls,
    flStateGrainApplications: pub.flStateGrainApplications,
    publicRender: pub.publicRender,
    publicIndex: pub.publicIndex,
    floridaPublic: pub.floridaPublic,
    publishedStateIntelligencePaths: pub.publishedStateIntelligencePaths,
    njCountyIntelligencePages: pub.njCountyIntelligencePages.length,
    njHmdaApplications: pub.njHmdaApplications,
    njHmdaOriginations: pub.njHmdaOriginations,
    njDobiUniqueOrders: pub.njDobiUniqueOrders,
    njRmlaRosterCoverage: pub.njRmlaRosterCoverage,
    njDobiSourceAsOf: pub.njDobiSourceAsOf,
    caHmdaApplications: pub.caHmdaApplications,
    caHmdaOriginations: pub.caHmdaOriginations,
    caCalhfaDirectoryRows: pub.caCalhfaDirectoryRows,
    caCrmlaRosterCoverage: pub.caCrmlaRosterCoverage,
    caCalhfaSourceAsOf: pub.caCalhfaSourceAsOf,
    txHmdaApplications: pub.txHmdaApplications,
    txHmdaOriginations: pub.txHmdaOriginations,
    txSmlOrders: pub.txSmlOrders,
    txLiveRosterCoverage: pub.txLiveRosterCoverage,
    txSmlSourceAsOf: pub.txSmlSourceAsOf,
    waHmdaApplications: pub.waHmdaApplications,
    waHmdaOriginations: pub.waHmdaOriginations,
    waDfiEnforcementRows: pub.waDfiEnforcementRows,
    waLiveRosterCoverage: pub.waLiveRosterCoverage,
    waDfiSourceAsOf: pub.waDfiSourceAsOf,
    azHmdaApplications: pub.azHmdaApplications,
    azHmdaOriginations: pub.azHmdaOriginations,
    azCfpbMortgageComplaints: pub.azCfpbMortgageComplaints,
    azLiveRosterCoverage: pub.azLiveRosterCoverage,
    azDifiSourceAsOf: pub.azDifiSourceAsOf,
    coHmdaApplications: pub.coHmdaApplications,
    coHmdaOriginations: pub.coHmdaOriginations,
    coCfpbMortgageComplaints: pub.coCfpbMortgageComplaints,
    coDreMloRows: pub.coDreMloRows,
    coLiveRosterCoverage: pub.coLiveRosterCoverage,
    coSourceAsOf: pub.coSourceAsOf,
    vaHmdaApplications: pub.vaHmdaApplications,
    vaHmdaOriginations: pub.vaHmdaOriginations,
    vaCfpbMortgageComplaints: pub.vaCfpbMortgageComplaints,
    vaSccDatedCompanyRows: pub.vaSccDatedCompanyRows,
    vaLiveRosterCoverage: pub.vaLiveRosterCoverage,
    vaSourceAsOf: pub.vaSourceAsOf,
    nyHmdaApplications: pub.nyHmdaApplications,
    nyHmdaOriginations: pub.nyHmdaOriginations,
    nyDfs2024Bankers: pub.nyDfs2024Bankers,
    nyEnforcementRows: pub.nyEnforcementRows,
    nyLiveRosterCoverage: pub.nyLiveRosterCoverage,
    ilHmdaApplications: pub.ilHmdaApplications,
    ilHmdaOriginations: pub.ilHmdaOriginations,
    ilFdicInstitutions: pub.ilFdicInstitutions,
    ilLiveRosterCoverage: pub.ilLiveRosterCoverage,
    orHmdaApplications: pub.orHmdaApplications,
    orHmdaOriginations: pub.orHmdaOriginations,
    orFdicInstitutions: pub.orFdicInstitutions,
    orLiveRosterCoverage: pub.orLiveRosterCoverage,
    paHmdaApplications: pub.paHmdaApplications,
    paHmdaOriginations: pub.paHmdaOriginations,
    paFdicInstitutions: pub.paFdicInstitutions,
    paCfpbMortgageComplaints: pub.paCfpbMortgageComplaints,
    paLiveRosterCoverage: pub.paLiveRosterCoverage,
    ncHmdaApplications: pub.ncHmdaApplications,
    ncHmdaOriginations: pub.ncHmdaOriginations,
    ncFdicInstitutions: pub.ncFdicInstitutions,
    ncCfpbMortgageComplaints: pub.ncCfpbMortgageComplaints,
    ncNccobMortgageLenderRows: pub.ncNccobMortgageLenderRows,
    ncLiveRosterCoverage: pub.ncLiveRosterCoverage,
    ohHmdaApplications: pub.ohHmdaApplications,
    ohHmdaOriginations: pub.ohHmdaOriginations,
    ohFdicInstitutions: pub.ohFdicInstitutions,
    ohCfpbMortgageComplaints: pub.ohCfpbMortgageComplaints,
    ohLiveRosterCoverage: pub.ohLiveRosterCoverage,
    servicerEvidenceRows: prod.servicerEvidenceRows,
    licensesTotal: prod.licensesTotal,
  };

  function validateInput(value, path = 'input') {
    if (value === undefined) throw new Error(`Missing accepted metric input: ${path}`);
    if (typeof value === 'number' && (!Number.isSafeInteger(value) || value < 0)) throw new Error(`Invalid count: ${path}`);
    if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) validateInput(item, `${path}.${key}`);
  }
  validateInput(input);
  const manifest = reconcile(computeLenderNetworkMetrics(input), prod, path => readFileSync(join(root,path), "utf8"));
  manifest.sourceFingerprint = createHash("sha256").update(JSON.stringify({ input, reconciliation: manifest.reconciliation, homepage: manifest.homepage })).digest("hex");
  manifest.homeProjection.fingerprint = manifest.sourceFingerprint;
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  if (check) {
    if (readFileSync(out, "utf8").replace(/\r\n/g, "\n") !== serialized) throw new Error("Network metrics stale; run npm run build:network-metrics");
  } else writeFileSync(out, serialized, "utf8");
  console.log(
    JSON.stringify(
      {
        wrote: "data/home/lender-network-metrics-v1.json",
        fingerprint: manifest.sourceFingerprint,
        generatedAt: manifest.generatedAt,
        institutions: manifest.identity.institutions,
        hmdaApplications: manifest.hmda.applications,
        complaints: manifest.cfpb.complaints,
        flConfirmedNmls: manifest.florida.confirmedNmls,
        personPublicCandidate: manifest.identity.personPublicCandidate,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
