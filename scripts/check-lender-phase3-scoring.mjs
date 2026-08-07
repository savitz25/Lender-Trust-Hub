/**
 * Lender Trust Hub Phase 3 — score redesign + provenance checks.
 */
import fs from 'fs';

const checks = [];
function ok(name, cond) {
  checks.push({ name, pass: Boolean(cond) });
}
function read(p) {
  return fs.readFileSync(p, 'utf8');
}

const rs = read('lib/research/research-signals.ts');
ok('research signals module', rs.includes('computeLenderResearchSignals'));
ok('research score recompute', rs.includes('computeLenderResearchScore'));
ok('data confidence', rs.includes('computeDataConfidence'));
ok('local market evidence', rs.includes('computeLocalMarketEvidence'));
ok('ranking basis', rs.includes('LENDER_RANKING_BASIS'));
ok('factor weights published', rs.includes('RESEARCH_SCORE_WEIGHTS'));
ok('does not measure approval', rs.includes('approval'));

const sanitize = read('lib/verification/sanitize-lender.ts');
ok('catalog applies research score', sanitize.includes('applyResearchScoreToLender'));

const provenance = read('lib/verification/metric-provenance.ts');
ok('seed google suppressed', provenance.includes('Suppressed until independently retrieved'));
ok('volume rank suppressed', provenance.includes('displayable: false') || provenance.includes('Suppressed until a documented volume'));
ok('cfpb not finding of wrongdoing', provenance.includes('not a finding of wrongdoing'));

const card = read('components/LenderCard.tsx');
ok('card shows Research Score', card.includes('Research Score'));
ok('card no seed BBB badge stack', !card.includes('BBB {lender.bbbRating}') && !card.includes('BBB ${'));
ok('card no star review display required', !card.includes('fill-current'));

const profile = read('app/lenders/[slug]/page.tsx');
ok('profile ResearchScoreDisplay', profile.includes('ResearchScoreDisplay'));
ok('profile provenance-gated metrics', profile.includes('provenance-gated') || profile.includes('Public metrics'));

const compare = read('app/compare/page.tsx');
ok('compare Research Score', compare.includes('Research Score'));
ok('compare no raw BBB without context', !compare.includes("{ label: 'BBB'"));

const county = read('app/local-lenders/[state]/[county]/page.tsx');
ok('ranking basis panel', county.includes('RankingBasisPanel'));

const locality = read('lib/geo/locality-rules.ts');
ok('sort by research honesty', locality.includes('compareLendersByResearchHonesty'));

const methodology = read('app/methodology/page.tsx');
ok('methodology Research Score honesty', methodology.includes('Research Score honesty'));
ok('methodology factor weights', methodology.includes('NMLS identity evidence'));

for (const c of checks) {
  console.log(`${c.pass ? 'PASS' : 'FAIL'} | ${c.name}`);
}
const failed = checks.filter((c) => !c.pass);
console.log(
  failed.length ? `\n${failed.length} FAILED` : `\nAll ${checks.length} Lender Phase 3 checks passed`
);
process.exit(failed.length ? 1 : 0);
