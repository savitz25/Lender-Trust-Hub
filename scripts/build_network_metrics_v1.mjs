/**
 * Build lender-network-metrics-v1 from production + publication-gated catalogs.
 * Does not write intelligence snapshots and does not touch AskTrustHub.
 */
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { publicationMetricInputs } from "./publication_metric_inputs.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const py = spawnSync("python", ["scripts/export_lender_metric_inputs.py"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (py.status !== 0) {
    throw new Error(`export failed: ${py.stderr || py.stdout}`);
  }
  const prod = JSON.parse(py.stdout);
  const pub = publicationMetricInputs();
  const { computeLenderNetworkMetrics } = await import(
    pathToFileURL(join(root, "lib/metrics/compute-lender-network-metrics.ts")).href
  );

  const input = {
    generatedAt: new Date().toISOString(),
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
    flOfrSourceAsOf: pub.flOfrSourceAsOf,
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
    servicerEvidenceRows: prod.servicerEvidenceRows ?? 0,
    licensesTotal: prod.licensesTotal,
  };

  const manifest = computeLenderNetworkMetrics(input);
  const out = join(root, "data/home/lender-network-metrics-v1.json");
  writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
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
