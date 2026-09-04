/**
 * Rebuild lender-network-metrics-v1 from the committed JSON identity
 * numbers plus publication catalogs. Used when TARGET_DATABASE_URL is
 * not available. Does not invent Arizona roster counts.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { publicationMetricInputs } from './publication_metric_inputs.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const v1 = JSON.parse(readFileSync(join(root, 'data/home/lender-network-metrics-v1.json'), 'utf8'));
const pub = publicationMetricInputs();
const { computeLenderNetworkMetrics } = await import(
  pathToFileURL(join(root, 'lib/metrics/compute-lender-network-metrics.ts')).href
);

const input = {
  generatedAt: new Date().toISOString(),
  institutions: v1.identity.institutions,
  branches: v1.identity.branches,
  personMlo: v1.identity.personMlo,
  personPublicCandidate: v1.identity.personPublicCandidate,
  nmlsInstitution: v1.identity.nmlsInstitution,
  nmlsBranch: v1.identity.nmlsBranch,
  nmlsPerson: v1.identity.nmlsPerson,
  lei: v1.identity.lei,
  fdicCert: v1.identity.fdicCert,
  ncuaCharter: v1.identity.ncuaCharter,
  rssd: v1.identity.rssd,
  lpiSnapshots: v1.identity.lpiSnapshots,
  depository: v1.homeProjection.depository,
  hmdaRows: v1.hmda.rows,
  hmdaApplications: v1.hmda.applications,
  hmdaOriginations: v1.hmda.originations,
  hmdaDenials: v1.hmda.denials,
  hmdaStateGrainApplications: v1.hmda.stateGrainApplicationsExcluded,
  geography: v1.homeProjection.geography,
  complaints: v1.cfpb.complaints,
  complaintsAttached: v1.cfpb.attached,
  complaintsUnattached: v1.cfpb.unattached,
  cfpbLabels: v1.cfpb.labels,
  cfpbBridges: v1.cfpb.confirmedBridges,
  cfpbObserved: String(v1.cfpb.observed),
  federalEnforcementEvents: v1.enforcement.federalEvents,
  flApprovedCredentials: v1.florida.approvedCredentials,
  flConfirmedNmls: v1.florida.confirmedNmls,
  flHeldNmls: v1.florida.heldNmls,
  flSre: v1.florida.stateRegulatoryEvents,
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
  azHmdaApplications: pub.azHmdaApplications,
  azHmdaOriginations: pub.azHmdaOriginations,
  azCfpbMortgageComplaints: pub.azCfpbMortgageComplaints,
  azLiveRosterCoverage: pub.azLiveRosterCoverage,
  azDifiSourceAsOf: pub.azDifiSourceAsOf,
  servicerEvidenceRows: 10,
  licensesTotal: 164965,
};

const manifest = computeLenderNetworkMetrics(input);
const out = join(root, 'data/home/lender-network-metrics-v1.json');
writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(
  JSON.stringify(
    {
      wrote: 'data/home/lender-network-metrics-v1.json',
      fingerprint: manifest.sourceFingerprint,
      generatedAt: manifest.generatedAt,
      paths: manifest.network.publishedStateIntelligencePaths,
      arizona: manifest.arizona,
    },
    null,
    2,
  ),
);
