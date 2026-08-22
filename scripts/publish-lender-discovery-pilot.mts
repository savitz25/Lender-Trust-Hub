/**
 * ASK-SEARCH-LENDER-001 — emit Lender discovery pilot JSON.
 * Usage: npx tsx scripts/publish-lender-discovery-pilot.mts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PILOT_ARTIFACT, publishLenderDiscoveryPilot } from '../lib/network-discovery/publish';

const root = process.cwd();
const outDir = join(root, 'data', 'network-discovery');
mkdirSync(outDir, { recursive: true });

const tWrite = performance.now();
const result = publishLenderDiscoveryPilot();
if (!result.validationOk) {
  console.error('VALIDATION FAILED', result.validationIssues.slice(0, 20));
  process.exit(1);
}

const outPath = join(outDir, PILOT_ARTIFACT);
writeFileSync(outPath, JSON.stringify(result.manifest, null, 2) + '\n', 'utf8');
result.timings_ms.export_ms = Number((performance.now() - tWrite).toFixed(3));

console.log(
  JSON.stringify(
    {
      wrote: outPath,
      entity_count: result.manifest.entity_count,
      fingerprint: result.manifest.content_fingerprint,
      eligibility: result.manifest.eligibility,
      entity_type_breakdown: result.manifest.entity_type_breakdown,
      geography: result.manifest.geography,
      deferred: result.manifest.deferred,
      query_readiness: result.manifest.query_readiness,
      timings_ms: result.timings_ms,
      external_calls: { Google: 0, LLM: 0, external_geo: 0, other_enrichment: 0 },
    },
    null,
    2
  )
);
