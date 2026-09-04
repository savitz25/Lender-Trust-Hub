/**
 * Parse publication catalogs the Lender network rollup must track.
 * A new state intelligence page, county page, or file-backed cohort
 * change fails CI until lender-network-metrics-v1 is regenerated.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

export function publicationMetricInputs() {
  const flPub = read("lib/florida-intelligence/publication.ts");
  const njPub = read("lib/new-jersey-intelligence/publication.ts");
  const caPub = read("lib/california-intelligence/publication.ts");
  const txPub = read("lib/texas-intelligence/publication.ts");
  const njTypes = read("lib/new-jersey-intelligence/counties/types.ts");
  const render = JSON.parse(read("docs/lend-nat-014-render-cohort.json"));
  const index = JSON.parse(read("docs/lend-nat-014-indexing-cohort.json"));
  const phase1 = JSON.parse(read("docs/fl-lend-007-phase1-manifest.json"));
  const phase2 = JSON.parse(read("docs/fl-lend-008-phase2-manifest.json"));
  const njSnap = JSON.parse(read("lib/new-jersey-intelligence/accepted-snapshot.json"));
  const caSnap = JSON.parse(read("lib/california-intelligence/accepted-snapshot.json"));
  const txSnap = JSON.parse(read("lib/texas-intelligence/accepted-snapshot.json"));
  const flSnap = JSON.parse(read("lib/florida-intelligence/accepted-snapshot.json"));

  const flPath = flPub.match(/path:\s*'(\/[^']+)'/)?.[1];
  const njPath = njPub.match(/path:\s*'(\/[^']+)'/)?.[1];
  const caPath = caPub.match(/path:\s*'(\/[^']+)'/)?.[1];
  const txPath = txPub.match(/path:\s*'(\/[^']+)'/)?.[1];
  if (!flPath || !njPath || !caPath || !txPath) {
    throw new Error("state intelligence publication paths missing");
  }
  if (!existsSync(join(root, "app/florida/page.tsx"))) throw new Error("Florida page missing");
  if (!existsSync(join(root, "app/new-jersey/page.tsx"))) throw new Error("New Jersey page missing");
  if (!existsSync(join(root, "app/california/page.tsx"))) throw new Error("California page missing");
  if (!existsSync(join(root, "app/texas/page.tsx"))) throw new Error("Texas page missing");

  const njCountySlugs = [
    ...njTypes.match(/export const NJ_COUNTY_SLUGS[\s\S]*?\] as const/)[0].matchAll(/'([a-z-]+-county)'/g),
  ].map((m) => m[1]);

  return {
    publishedStateIntelligencePaths: [flPath, njPath, caPath, txPath],
    njCountyIntelligencePages: njCountySlugs,
    publicRender: render.count,
    publicIndex: index.count,
    floridaPublic: phase1.count + phase2.count,
    njHmdaApplications: njSnap.hero.universe_value,
    njHmdaOriginations: njSnap.hero.current_value,
    njDobiUniqueOrders: njSnap.hero.observations_value,
    njRmlaRosterCoverage: njSnap.rmla.coverage_state,
    njDobiSourceAsOf: njSnap.source_as_of.dobi_fi_list,
    caHmdaApplications: caSnap.hero.universe_value,
    caHmdaOriginations: caSnap.hero.current_value,
    caCalhfaDirectoryRows: caSnap.hero.observations_value,
    caCrmlaRosterCoverage: caSnap.source_as_of.live_crmla_roster,
    caCalhfaSourceAsOf: "2026-09-03",
    txHmdaApplications: txSnap.hero.universe_value,
    txHmdaOriginations: txSnap.hero.current_value,
    txSmlOrders: txSnap.hero.observations_value,
    txLiveRosterCoverage: txSnap.live_roster.CURRENT_TEXAS_MORTGAGE_COMPANY_BULK_ROSTER,
    txSmlSourceAsOf: txSnap.source_as_of.sml_orders,
    flOfrSourceAsOf: flSnap.licensing.source_as_of,
    flUnresolvedSourceCompanyNmls: flSnap.graph.unresolved_source_company_nmls,
    flStateGrainApplications: flSnap.hmda.applications,
    flHeldNmlsSnapshot: flSnap.licensing.held_nmls,
  };
}
