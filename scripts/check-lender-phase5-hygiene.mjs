/**
 * Lender Trust Hub Phase 5 — measurement + program hygiene checks.
 * Run: node scripts/check-lender-phase5-hygiene.mjs
 */
import fs from 'fs';

const checks = [];
function ok(name, cond) {
  checks.push({ name, pass: Boolean(cond) });
}
function read(p) {
  return fs.readFileSync(p, 'utf8');
}

const bl = read('lib/analytics/measurement-baseline.ts');
ok('baseline date', bl.includes('2026-08-07'));
ok('baseline label phase-5', bl.includes('lender-trust-hub-phase-5'));
ok('priority nmls event', bl.includes('nmls_verification_lookup'));
ok('priority calculator_complete', bl.includes('calculator_complete'));
ok('priority compare session', bl.includes('lender_compare_session'));
ok('priority my_lending', bl.includes('my_lending_save') && bl.includes('my_lending_return'));
ok('priority profile view', bl.includes('lender_profile_view'));
ok('canonical sitemap URL', bl.includes('lendertrusthub.com/sitemap.xml'));

const ga = read('lib/analytics/ga-events.ts');
ok('trackNmlsVerificationLookup', ga.includes('trackNmlsVerificationLookup'));
ok('trackLenderProfileView', ga.includes('trackLenderProfileView'));

const tracker = read('components/analytics/research-click-tracker.tsx');
ok('click tracker NMLS', tracker.includes('nmlsconsumeraccess'));
ok('click tracker cross-hub', tracker.includes('insurancetrusthub') || tracker.includes('outbound_specialist'));
ok('click tracker research paths', tracker.includes('hub_to_profile'));

const gtag = read('components/directory/GtagProvider.tsx');
ok('GtagProvider mounts ResearchClickTracker', gtag.includes('ResearchClickTracker'));
ok('baseline globals', gtag.includes('__LTH_MEASUREMENT_BASELINE'));

// Phase 0–4 residual integrity (spot checks)
const nmls = read('lib/verification/nmls.ts');
ok('Phase0 NMLS clean', nmls.includes('cleanNmlsId') && nmls.includes('showNmlsVerifiedBadge'));

const phone = read('lib/verification/phone.ts');
ok('Phase0 phone 555 block', phone.includes('555'));

const perf = read('lib/verification/performance-metrics.ts');
ok('Phase0 close metrics suppressed', perf.includes('displayable: false') || perf.includes('NO_CLOSING_PERFORMANCE'));

const locality = read('lib/geo/locality-rules.ts');
ok('Phase1 in_county', locality.includes('in_county'));

const clusters = read('lib/directory/content-clusters.ts');
ok('Phase2 no Targets scaffold', !clusters.includes('best mortgage lenders by state'));
ok('Phase2 no SEO Targets in UI data', !clusters.includes('is LenderTrustHub legit'));

const research = read('lib/research/research-signals.ts');
ok('Phase3 research score', research.includes('computeLenderResearchScore'));
ok('Phase3 data confidence', research.includes('computeDataConfidence'));

const quality = read('lib/mortgage/county-quality-score.ts');
ok('Phase4 tier thresholds', quality.includes('tier1MinScore'));

const sitemap = read('app/sitemap.ts');
ok('Phase4 tiered sitemap', sitemap.includes('getSitemapCounties'));

const profile = read('app/lenders/[slug]/page.tsx');
ok('profile view tracker', profile.includes('LenderProfileViewTracker'));

const compare = read('app/compare/page.tsx');
ok('compare session track', compare.includes('trackLenderCompareSession'));

const save = read('components/my-lending/save-lender-button.tsx');
ok('my lending save track', save.includes('trackMyLendingSave'));

const myLending = read('app/my-lending/page.tsx');
ok('my lending return tracker', myLending.includes('MyLendingReturnTracker'));

const handoff = read('docs/LENDER-PHASE-5-HANDOFF.md');
ok('phase 5 handoff doc', handoff.includes('Completed systems') || handoff.includes('measurement'));

for (const c of checks) {
  console.log(`${c.pass ? 'PASS' : 'FAIL'} | ${c.name}`);
}
const failed = checks.filter((c) => !c.pass);
console.log(
  failed.length ? `\n${failed.length} FAILED` : `\nAll ${checks.length} Lender Phase 5 checks passed`
);
process.exit(failed.length ? 1 : 0);
