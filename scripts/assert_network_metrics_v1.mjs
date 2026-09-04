/**
 * ATH-METRICS-003A grain / staleness gates.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { publicationMetricInputs } from "./publication_metric_inputs.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const failures = [];
const assert = (c, m) => {
  if (!c) failures.push(m);
};

const v1 = JSON.parse(read("data/home/lender-network-metrics-v1.json"));
const byKey = Object.fromEntries(v1.metrics.map((m) => [m.key, m]));
const pub = publicationMetricInputs();
const load = read("lib/home-intel/load.ts");
const hero = read("components/home-intel/lender-home-intelligence.tsx");
const build = read("lib/home-intel/build.ts");

assert(v1.schemaVersion === "lender-network-metrics-v1", "schema");
assert(typeof v1.sourceFingerprint === "string" && v1.sourceFingerprint.length === 64, "fingerprint");
assert(
  JSON.stringify(v1.network.publishedStateIntelligencePaths) === JSON.stringify(pub.publishedStateIntelligencePaths),
  "state intel paths match catalogs",
);
assert(v1.network.njCountyIntelligencePages === pub.njCountyIntelligencePages.length, "NJ county pages match catalog");
assert(v1.publication.nationalRender === pub.publicRender, "national render cohort");
assert(v1.publication.nationalIndex === pub.publicIndex, "national index cohort");
assert(v1.publication.floridaPublic === pub.floridaPublic, "florida public cohort");
assert(v1.publication.searchUnion === 311, "search union 311");
assert(v1.publication.searchUnionIsNotNationalHeadline === true, "311 is not a national headline");
assert(byKey.lenders_lending_institutions.value === 14623, "institutions 14623");
assert(byKey.lenders_lending_institutions.label === "Lenders & lending institutions", "plain-English institution label");
assert(!byKey.lenders_lending_institutions.label.toLowerCase().includes("canonical institutions"), "no canonical institutions primary label");
assert(byKey.nmls_institution_identifiers.value === 6641, "NMLS identifiers");
assert(byKey.nmls_institution_identifiers.value !== byKey.lenders_lending_institutions.value, "credential ≠ identity");
assert(byKey.hmda_2025_county_applications.value === 11529787, "HMDA apps");
assert(byKey.hmda_2025_county_originations.value === 6793253, "HMDA orig");
assert(v1.hmda.grain === "county", "HMDA grain");
assert(v1.hmda.stateGrainApplicationsExcluded !== v1.hmda.applications, "no county+state mix");
assert(byKey.cfpb_mortgage_complaint_observations.value === 458146, "complaints");
assert(v1.cfpb.attached + v1.cfpb.unattached === v1.cfpb.complaints, "complaint split");
assert(byKey.federal_enforcement_events.value === 17655, "federal enforcement");
assert(byKey.federal_enforcement_events.value !== byKey.cfpb_mortgage_complaint_observations.value, "enf ≠ complaints");
assert(v1.identity.personPublicCandidate === 0, "no public MLO PII");
assert(byKey.person_public_candidate.value === 0, "ppc metric 0");
assert(byKey.nj_rmla_license_roster.value === null, "NJ roster is not a number");
assert(byKey.nj_rmla_license_roster.valueState === "REQUEST_ONLY", "NJ request-only");
assert(v1.newJersey.statewideRmlaUniverse === null, "NJ universe null");
assert(byKey.ca_crmla_live_roster.value === null, "CA CRMLA is not a number");
assert(byKey.ca_crmla_live_roster.valueState === "NOT_ACQUIRED", "CA not acquired");
assert(v1.california.liveCrmlaUniverse === null, "CA universe null");
assert(byKey.tx_sml_live_roster.value === null, "TX roster is not a number");
assert(byKey.tx_sml_live_roster.valueState === "NOT_ACQUIRED", "TX not acquired");
assert(v1.texas.liveLicensedCompanyUniverse === null, "TX universe null");
assert(byKey.tx_sml_orders.value === pub.txSmlOrders, "TX SML orders");
assert(byKey.wa_dfi_live_roster.value === null, "WA roster is not a number");
assert(byKey.wa_dfi_live_roster.valueState === "NOT_ACQUIRED", "WA not acquired");
assert(v1.washington.liveLicensedCompanyUniverse === null, "WA universe null");
assert(byKey.wa_dfi_enforcement_rows.value === pub.waDfiEnforcementRows, "WA DFI enforcement rows");
assert(byKey.az_difi_live_roster.value === null, "AZ roster is not a number");
assert(byKey.az_difi_live_roster.valueState === "NOT_ACQUIRED", "AZ not acquired");
assert(v1.arizona.liveLicensedCompanyUniverse === null, "AZ universe null");
assert(byKey.az_cfpb_mortgage_complaints.value === pub.azCfpbMortgageComplaints, "AZ CFPB complaints");
assert(byKey.ca_calhfa_directory_rows.value === pub.caCalhfaDirectoryRows, "CalHFA rows");
assert(byKey.nj_dobi_unique_orders.value === pub.njDobiUniqueOrders, "NJ DOBI orders");
assert(v1.florida.heldNmls === 22, "FL held 22");
assert(v1.florida.unresolvedSourceCompanyNmls === 3907, "FL unresolved 3907");
assert(v1.florida.heldNmls !== v1.florida.unresolvedSourceCompanyNmls, "held ≠ unresolved");
assert(v1.florida.confirmedNmls !== v1.publication.floridaPublic, "FL internal ≠ public 130");
assert(v1.homeProjection.institutions === v1.identity.institutions, "homepage projection matches v1");
assert(v1.homeProjection.applications === v1.hmda.applications, "homepage HMDA matches v1");
assert(v1.homeProjection.floridaInternal === v1.florida.confirmedNmls, "homepage FL internal from v1");
assert(load.includes("projectLenderHomeIntelFromNetworkMetrics"), "homepage consumes v1");
assert(load.includes("loadLenderNetworkMetrics"), "homepage loads v1");
assert(hero.includes("Network rollup generated"), "hero generated clock");
assert(hero.includes("newestDocumentedSourceAsOf"), "hero documented source clock");
assert(!hero.includes("Last official update"), "no ambiguous official update");
assert(build.includes("Lenders & lending institutions"), "build uses consumer label");
assert(!/label: 'Canonical institution identities'/.test(build), "build dropped canonical primary label");
assert(byKey.florida_ofr_approved_company_credentials.sourceAsOf === pub.flOfrSourceAsOf, "FL sourceAsOf");
assert(byKey.florida_ofr_approved_company_credentials.sourceAsOf !== v1.generatedAt.slice(0, 10), "FL sourceAsOf != generatedAt");
assert(byKey.cfpb_mortgage_complaint_observations.sourceAsOf === "2026-08-26", "CFPB sourceAsOf");
assert(v1.generatedAt.startsWith("2026-"), "generatedAt");
assert(v1.rejectedTotals.length >= 6, "rejected totals documented");

if (failures.length) {
  console.error("ATH-METRICS-003A FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}
console.log("ATH-METRICS-003A PASS network metric grain and staleness gates");
