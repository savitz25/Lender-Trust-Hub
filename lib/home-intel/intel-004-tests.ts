import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildLenderHomeIntel, HMDA_OTHER_ACTIONS } from './build';
import { fingerprintLenderHomeIntel } from './fingerprint';
import { COMBINED_SEARCHABLE_COUNT, DISCOVERY_INDEXABLE_COUNT, DISCOVERY_SEARCHABLE_COUNT, FLORIDA_SEARCHABLE_COUNT } from '@/lib/national-profile/discovery';
import { INDEXING_COHORT, RENDER_COHORT } from '@/lib/national-profile/publication';
import { FLORIDA_PHASE1_COUNT } from '@/lib/florida-profile/phase1';
import { FLORIDA_PHASE2_COUNT } from '@/lib/florida-profile/phase2';
import snapshot from './snapshot.json';

export type Check = { id: string; pass: boolean; detail: string };

const PROHIBITED =
  /Trust Score|Research Score|County Experience|best lender|top lender|recommended lender|approval rate|approval odds|fairness score|risk score|worst lender/i;

export function runIntel004ContractTests(): Check[] {
  const first = buildLenderHomeIntel();
  const second = buildLenderHomeIntel();
  const third = buildLenderHomeIntel('2099-01-01T00:00:00.000Z');
  const blob = JSON.stringify(first);
  const displayBlob = JSON.stringify({
    titles: first.findings.map((item) => item.title),
    summaries: first.findings.map((item) => item.summary),
    labels: first.stateOfRecord.map((item) => item.label),
    tools: first.tools.map((item) => `${item.label} ${item.note}`),
  });
  const checks: Check[] = [];
  const check = (id: string, pass: boolean, detail: string) => checks.push({ id, pass, detail });

  check('I004-10', first.payloadFingerprint === second.payloadFingerprint, first.payloadFingerprint);
  check('I004-11', first.payloadFingerprint === third.payloadFingerprint, 'generatedAt excluded from hash');
  check('I004-10b', first.payloadFingerprint === fingerprintLenderHomeIntel(first), 'self-hash');
  check('I004-12', first.stateOfRecord.length === 5, String(first.stateOfRecord.length));
  check('I004-13', first.stateOfRecord.every((row) => row.payloadKey.length > 0 && row.method.length > 0), 'trace fields');
  check('I004-14', first.findings.length === 3, String(first.findings.length));
  check(
    'I004-15',
    first.findings.map((s) => s.storyType).join(',') === 'BENCHMARK,BENCHMARK,GAP',
    first.findings.map((s) => s.storyType).join(','),
  );
  check(
    'I004-v11-two-market',
    first.findings.filter((s) => s.storyType === 'BENCHMARK').length === 2 &&
      first.findings.filter((s) => s.storyType === 'GAP').length === 1,
    'two market findings, one GAP',
  );
  check('I004-5', first.stateOfRecord[0]?.value === 14623, String(first.stateOfRecord[0]?.value));
  check('I004-6', first.stateOfRecord[2]?.value === 11529787 && first.stateOfRecord[3]?.value === 6793253, 'HMDA apps/orig');
  check('I004-7', first.stateOfRecord[4]?.value === 458146, 'complaints');
  check('I004-8', snapshot.nmlsInstitution === 6641 && snapshot.nmlsInstitution !== snapshot.institutions, 'credential ≠ identity');
  check('I004-9', HMDA_OTHER_ACTIONS === 11529787 - 6793253 - 2008514, String(HMDA_OTHER_ACTIONS));
  check(
    'I004-16',
    !/approval rate|approval odds/i.test(displayBlob) && Boolean(first.findings[1]?.doesNotMean.some((s) => /approval/i.test(s))),
    'HMDA not prediction',
  );
  check('I004-17', !blob.includes('debt-to-income') || first.findings[1]?.doesNotMean.some((s) => /Denial-reason/i.test(s)), 'denial reasons deferred');
  check('I004-18', first.findings[2]?.doesNotMean.some((s) => /violation/i.test(s)), 'complaint semantics');
  check('I004-19', !PROHIBITED.test(displayBlob), 'no legacy score/ranking language in headlines');
  check('I004-20', first.findings[1]?.chart.series.every((s) => s.value >= 0), 'count series');
  check(
    'I004-21',
    !/complaints per 10,000/i.test(displayBlob) && Boolean(first.findings[2]?.doesNotMean.some((s) => /10,000/i.test(s))),
    'no complaint/HMDA rate',
  );
  check('I004-22', first.pricingHomepageV1 === 'DEFERRED', first.pricingHomepageV1);
  check('I004-23', !/racial ranking|discrimination score/i.test(blob), 'no demographic headline');
  check('I004-24', first.coverage.length >= 11, String(first.coverage.length));
  check('I004-25', first.gaps.length >= 8, String(first.gaps.length));
  check('I004-26', first.geography.every((g) => g.state !== 'FL' || g.intelligenceHref === '/florida'), 'FL link');
  check('I004-26b', first.geography.filter((g) => g.state !== 'FL').every((g) => g.searchHref === '/lender' && g.intelligenceHref === null), 'safe state routes');
  check('I004-34', first.changeModule.status === 'UNSUPPORTED', first.changeModule.status);
  check('I004-55', RENDER_COHORT.length === 181 && DISCOVERY_SEARCHABLE_COUNT === 181, 'national render 181');
  check('I004-56', INDEXING_COHORT.length === 180 && DISCOVERY_INDEXABLE_COUNT === 180, 'national index 180');
  check('I004-56b', FLORIDA_PHASE1_COUNT + FLORIDA_PHASE2_COUNT === 130 && FLORIDA_SEARCHABLE_COUNT === 130, 'florida 130');
  check('I004-54', COMBINED_SEARCHABLE_COUNT === 311, 'search 311 union');
  check('I004-54b', !first.stateOfRecord.some((row) => row.label.toLowerCase().includes('311')), '311 not a national headline');
  check(
    'I004-geo-sum',
    first.geography.reduce((sum, row) => sum + row.applications, 0) === 11529787,
    'geo county-grain apps',
  );
  check(
    'I004-dep-sum',
    snapshot.depository.FDIC + snapshot.depository.NCUA + snapshot.depository.NONBANK + snapshot.depository.UNKNOWN === 8447,
    'exclusive LPI depository',
  );
  check('I004-other', first.findings[1]?.chart.series.some((s) => s.label.startsWith('Other reported')), 'other actions explicit');
  check('I004-tools-compare', !first.tools.some((t) => t.href === '/compare'), 'no legacy /compare CTA');
  check('I004-score-null', first.score === null && first.ranking === null, 'no score');
  const bankAsk = first.askMarket.find((item) => item.id === 'bank-vs-nonbank')?.answer ?? '';
  const origAsk = first.askMarket.find((item) => item.id === 'how-many-orig')?.answer ?? '';
  const appsAsk = first.askMarket.find((item) => item.id === 'how-many-apps')?.answer ?? '';
  const researchAsk = first.askMarket.find((item) => item.id === 'research-lender')?.answer ?? '';
  check('I004-ask-lpi', bankAsk.includes(snapshot.lpiSnapshots.toLocaleString('en-US')) && bankAsk.includes(snapshot.depository.FDIC.toLocaleString('en-US')), 'Ask bank/nonbank uses LPI snapshot grain');
  check('I004-ask-hmda', origAsk.includes(snapshot.originations.toLocaleString('en-US')) && appsAsk.includes(snapshot.applications.toLocaleString('en-US')), 'Ask HMDA uses county-grain snapshot');
  check(
    'I004-ask-search',
    researchAsk.includes((snapshot.publicRender + snapshot.floridaPublic).toLocaleString('en-US')) &&
      researchAsk.includes(snapshot.publicRender.toLocaleString('en-US')) &&
      researchAsk.includes(String(snapshot.floridaPublic)),
    'Ask search union uses publication grains',
  );
  check('I004-ask-count', first.askMarket.length >= 4 && first.askMarket.length <= 7, String(first.askMarket.length));

  const page = readFileSync(join(process.cwd(), 'app/page.tsx'), 'utf8');
  check('I004-36-src', page.includes('getLenderHomeIntel') && page.includes('LenderHomeIntelligence'), 'SSR wiring');
  check('I004-37-src', !page.includes('Loading lender intelligence'), 'no loading shell');
  check('I004-51-src', !page.includes('aggregateRating') && !page.includes('ratingValue'), 'no rating schema on page');

  return checks;
}
