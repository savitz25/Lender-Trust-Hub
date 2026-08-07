/**
 * Lender Trust Hub Phase 0 — data integrity static checks (standalone LTH repo).
 * Run: node scripts/check-lender-phase0-integrity.mjs
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

const nmls = read('lib/verification/nmls.ts');
ok('cleanNmlsId rejects placeholders', nmls.includes('SEE-NMLS') || nmls.includes('see-nmls'));
ok('resolveNmlsVerification exists', nmls.includes('resolveNmlsVerification'));
ok('hard badge requires verified flag + ID', nmls.includes('showNmlsVerifiedBadge'));

const phone = read('lib/verification/phone.ts');
ok('555 exchange treated as placeholder', phone.includes('555'));
ok('cleanDisplayPhone', phone.includes('cleanDisplayPhone'));

const perf = read('lib/verification/performance-metrics.ts');
ok('closing performance suppressed without provenance', perf.includes('NO_CLOSING_PERFORMANCE_LABEL'));

const sanitize = read('lib/verification/sanitize-lender.ts');
ok('sanitizeLender wires NMLS + phone + close', sanitize.includes('sanitizeLender'));
ok('finalizeLenderCatalog applies entity trust', sanitize.includes('applyEntityTrustScores'));

const entity = read('lib/verification/entity-identity.ts');
ok('entity key by NMLS', entity.includes('nmls:'));
ok('dedupe by entity', entity.includes('dedupeLendersByEntity'));

const mock = read('lib/mockData.ts');
ok('catalog finalized through sanitize', mock.includes('finalizeLenderCatalog'));
ok('honest TRUST_STATS from counts', mock.includes('countLenderCatalog'));
ok('no invented 12450 verified count', !mock.includes('verifiedLenders: 12450'));
ok('no invented 2.8M reviews', !mock.includes('2_800_000'));

const fl = read('lib/mortgage/floridaLenders.ts');
ok('SEE-NMLS removed from FL source', !fl.includes("nmlsId: 'SEE-NMLS'") && !fl.includes('nmlsId: "SEE-NMLS"'));

const card = read('components/LenderCard.tsx');
ok('card uses NmlsVerificationBadge', card.includes('NmlsVerificationBadge'));
ok('card no avg close days display', !card.includes('avgCloseDays') && !card.includes('Close est'));

const filter = read('lib/directory/filter-lenders.ts');
ok('close-days sort removed', !filter.includes("'close-days'"));

const stateStats = read('lib/mortgage/stateLenders.ts');
ok('state stats dedupe entities', stateStats.includes('dedupeLendersByEntity'));

const badge = read('components/nmls-verification-badge.tsx');
ok('badge component uses resolveNmlsVerification', badge.includes('resolveNmlsVerification'));

let badNmlsTokens = 0;
for (const f of fs.readdirSync('lib/mortgage')) {
  if (!f.endsWith('Lenders.ts') && !f.endsWith('lenders.ts')) continue;
  const body = read(path.join('lib/mortgage', f));
  if (/nmlsId:\s*['"](?:SEE-NMLS|TBD|N\/A|NA)['"]/i.test(body)) badNmlsTokens++;
}
ok('no placeholder nmlsId tokens in mortgage source files', badNmlsTokens === 0);

for (const c of checks) {
  console.log(`${c.pass ? 'PASS' : 'FAIL'} | ${c.name}`);
}
const failed = checks.filter((c) => !c.pass);
console.log(
  failed.length ? `\n${failed.length} FAILED` : `\nAll ${checks.length} Lender Phase 0 checks passed`
);
process.exit(failed.length ? 1 : 0);
