/**
 * Pull CFPB mortgage complaint aggregates for curated company names
 * and write data/cfpb/mortgage-complaints-snapshot.json.
 *
 *   npx tsx scripts/fetch-cfpb-complaints.ts
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { getAllMappedCfpbCompanyNames } from '../lib/cfpb/mappings';
import { buildCompanySnapshot } from '../lib/cfpb/client';
import { cfpbSnapshotPath } from '../lib/cfpb/load';
import type { CfpbSnapshotFile } from '../lib/cfpb/types';
import {
  CFPB_PRODUCT_MORTGAGE,
  CFPB_SOURCE_LABEL,
  CFPB_SOURCE_URL,
} from '../lib/cfpb/types';

function recentWindowStart(monthsBack = 24): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - monthsBack);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const companies = getAllMappedCfpbCompanyNames();
  const windowStart = recentWindowStart(24);
  console.log(
    `Fetching CFPB mortgage stats for ${companies.length} company names (recent ≥ ${windowStart})…`
  );

  const snaps = [];
  for (const company of companies) {
    process.stdout.write(`  · ${company} … `);
    try {
      const snap = await buildCompanySnapshot(company, windowStart);
      snaps.push(snap);
      console.log(
        `total=${snap.totalComplaints} recent=${snap.complaintsLast24Months}`
      );
    } catch (err) {
      console.log('FAILED');
      console.error(err);
      process.exitCode = 1;
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  const file: CfpbSnapshotFile = {
    version: 1,
    product: CFPB_PRODUCT_MORTGAGE,
    generatedAt: new Date().toISOString(),
    recentWindowStart: windowStart,
    source: CFPB_SOURCE_LABEL,
    sourceUrl: CFPB_SOURCE_URL,
    companies: snaps,
  };

  const out = cfpbSnapshotPath();
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
  console.log(`\nWrote ${snaps.length} companies → ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
