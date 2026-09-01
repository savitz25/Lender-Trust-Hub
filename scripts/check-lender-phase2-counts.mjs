/**
 * Lender Trust Hub Phase 2 — SEO scaffolding + count integrity checks.
 * Run: node scripts/check-lender-phase2-counts.mjs
 */
import fs from 'fs';
import path from 'path';

const checks = [];
function ok(name, cond) {
  checks.push({ name, pass: Boolean(cond) });
}
function read(p) {
  return fs.readFileSync(p, 'utf8');
}

// Walk app + components for consumer-visible scaffolding phrases
const badPatterns = [
  /Targets:\s*/i,
  /SEO-optimized/i,
  /featured-snippet/i,
  /query family/i,
  /search volume/i,
];
// Allow in comments/docs under lib/directory rollout etc. — only scan consumer surfaces
const consumerFiles = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.next') continue;
      walk(p);
    } else if (/\.(tsx|ts|jsx|js)$/.test(ent.name)) {
      consumerFiles.push(p);
    }
  }
}
walk('app');
walk('components');
consumerFiles.push('lib/directory/content-clusters.ts');
consumerFiles.push('lib/mortgage/seo.ts');
consumerFiles.push('lib/fdic/seo.ts');
consumerFiles.push('lib/auto/seo.ts');

let scaffoldingHits = [];
for (const f of consumerFiles) {
  if (!fs.existsSync(f)) continue;
  const body = read(f);
  // Skip pure type/comment planning files if any
  if (f.includes('launch-checklist') || f.includes('growth-plan') || f.includes('rollout')) continue;
  for (const re of badPatterns) {
    if (re.test(body)) scaffoldingHits.push(`${f} :: ${re}`);
  }
}
ok('no Targets: / SEO-optimized / featured-snippet / query family in consumer UI', scaffoldingHits.length === 0);
if (scaffoldingHits.length) console.log('HITS', scaffoldingHits);

const clusterUi = read('components/directory/ContentClusterHub.tsx');
ok('ContentClusterHub has no Targets label', !clusterUi.includes('Targets:'));
ok('ContentClusterHub has no featured-snippet', !clusterUi.includes('featured-snippet'));

const shell = read('components/directory/NationalHubShell.tsx');
ok('NationalHubShell no SEO-optimized', !shell.includes('SEO-optimized'));
ok('uses HUB_TOPIC_SECTIONS', shell.includes('HUB_TOPIC_SECTIONS'));

const clusters = read('lib/directory/content-clusters.ts');
ok('no best mortgage targetQuery', !clusters.includes('best mortgage lenders by state'));
ok('no is LenderTrustHub legit target', !clusters.includes('is LenderTrustHub legit'));
ok('HUB_TOPIC_SECTIONS defined', clusters.includes('HUB_TOPIC_SECTIONS'));

const counts = read('lib/directory/public-counts.ts');
ok('public counts helper', counts.includes('getMortgagePublicCounts'));
ok('exact count formatter', counts.includes('formatExactCount'));

const mortgagePage = read('app/local-lenders/page.tsx');
ok('mortgage hub uses public counts', mortgagePage.includes('getMortgagePublicCounts') || mortgagePage.includes('directorySummary'));
ok('no best mortgage lenders 2026 keyword', !mortgagePage.includes('best mortgage lenders 2026'));
ok('no decorative + on NMLS count', !mortgagePage.includes('toLocaleString()}+'));

const trustBar = read('components/TrustBar.tsx');
ok('TrustBar uses public count helper', trustBar.includes('getPublicTrustBarStats'));

const fdicPage = read('app/fdic-insured-banks/page.tsx');
ok('FDIC hub no + inflation', !fdicPage.includes("toLocaleString()}+"));

const autoPage = read('app/auto-loan-companies/page.tsx');
ok('auto hub no + inflation', !autoPage.includes('autoProviders.length}+'));

for (const c of checks) {
  console.log(`${c.pass ? 'PASS' : 'FAIL'} | ${c.name}`);
}
const failed = checks.filter((c) => !c.pass);
console.log(
  failed.length ? `\n${failed.length} FAILED` : `\nAll ${checks.length} Lender Phase 2 checks passed`
);
process.exit(failed.length ? 1 : 0);
