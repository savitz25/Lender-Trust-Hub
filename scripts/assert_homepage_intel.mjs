/**
 * ATH-METRICS-003A homepage intelligence projection from v1.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const failures = [];
const assert = (c, m) => {
  if (!c) failures.push(m);
};

const v1 = JSON.parse(read("data/home/lender-network-metrics-v1.json"));
const page = read("app/page.tsx");
const load = read("lib/home-intel/load.ts");
const hero = read("components/home-intel/lender-home-intelligence.tsx");
const byKey = Object.fromEntries(v1.metrics.map((m) => [m.key, m]));

assert(v1.schemaVersion === "lender-network-metrics-v1", "v1 schema");
assert(page.includes("loadLenderHomeIntel") && page.includes("LenderHomeIntelligence"), "homepage wiring");
assert(page.includes("from '@/lib/home-intel/load'"), "page consumes loader");
assert(!page.includes("from '@/lib/home-intel/build'"), "page does not import build directly");
assert(load.includes("projectLenderHomeIntelFromNetworkMetrics"), "loader projects from v1");
assert(hero.includes("Trace this number"), "Trace this number");
assert(hero.includes("Network rollup generated"), "two-clock generated");
assert(byKey.lenders_lending_institutions.value === v1.homeProjection.institutions, "hero institutions from v1");
assert(v1.homeProjection.applications === 11529787, "homepage HMDA");
assert(v1.homeProjection.complaints === 458146, "homepage complaints");
assert(v1.homeProjection.graph.person_public_candidate === 0, "no public person pages");
assert(v1.homeProjection.publicRender === 181, "181 render");
assert(v1.homeProjection.publicIndex === 180, "180 index");
assert(v1.homeProjection.floridaPublic === 130, "130 florida public");
assert(!JSON.stringify(v1.metrics.find((m) => m.key === "lenders_lending_institutions")).includes("Canonical institutions"), "no canonical primary");

if (failures.length) {
  console.error("ATH-METRICS-003A HOMEPAGE FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}
console.log("ATH-METRICS-003A PASS homepage intel projection");
