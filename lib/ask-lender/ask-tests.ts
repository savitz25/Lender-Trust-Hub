import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { executeLenderAsk } from './execute';
import { executeAskQuery } from './execute-query';
import { parseLenderAsk } from './parse';
import { namesCompatible } from './identity';
import { buildLenderHomeIntel } from '@/lib/home-intel/build';

export type AskCheck = { id: string; pass: boolean; detail: string };

function src(rel: string): string {
  return readFileSync(join(process.cwd(), rel), 'utf8');
}

export function runAskLenderTests(): AskCheck[] {
  const intel = buildLenderHomeIntel();
  const checks: AskCheck[] = [];
  const check = (id: string, pass: boolean, detail: string) => checks.push({ id, pass, detail });

  const closed = (q: string, kind: string) => parseLenderAsk(q).failClosedKind === kind;
  check('ASK-fail-best', closed('Which lender is best in Florida?', 'ranking'), 'best');
  check('ASK-fail-safest', closed('Which lender is safest?', 'safety'), 'safest');
  check('ASK-fail-trustworthy', closed('Most trustworthy lender', 'safety'), 'trustworthy');
  check('ASK-fail-cheapest', closed('Cheapest lender', 'pricing-rhetoric'), 'cheapest');
  check('ASK-fail-disc', closed('Which lender discriminates the most?', 'discrimination'), 'discrimination');
  check(
    'ASK-fail-rate-today',
    ['live-rate', 'ranking'].includes(parseLenderAsk('Which lender has the best mortgage rate today?').failClosedKind ?? ''),
    'live rate or ranking fail-closed',
  );
  check('ASK-fail-lowest-today', closed('Which lenders have the lowest rates today?', 'live-rate'), 'lowest rates today');
  check('ASK-fail-junk', closed('Which lender charges the most junk fees?', 'pricing-rhetoric'), 'junk');
  check('ASK-fail-near', closed('Show lenders near me', 'proximity'), 'near me');
  check('ASK-fail-denial-rate', closed('Which lender has the highest denial rate?', 'denial-rate'), 'denial rate');
  check('ASK-fail-denial-reason', closed('What denial reasons do Florida lenders use?', 'denial-reason'), 'denial reasons');
  check('ASK-fail-why-deny', closed('Why does this lender deny loans?', 'denial-reason'), 'why deny');
  check('ASK-fail-territory', closed('Which lenders have a Florida service territory?', 'service-territory'), 'service territory');
  check('ASK-fail-wrongdoing', closed('Which lenders committed mortgage fraud?', 'wrongdoing'), 'wrongdoing');
  check('ASK-fail-hq', closed('Which lenders are headquartered in Florida?', 'lender-location'), 'headquarters ≠ HMDA');

  const mostDenials = parseLenderAsk('lenders with the most denials');
  check('ASK-most-denials-not-rate', mostDenials.failClosedKind !== 'denial-rate' && mostDenials.requestedMetric !== 'rate', 'most ≠ rate');

  const apps = executeLenderAsk('How many mortgage applications are in the current research universe?', intel);
  check('ASK-count-apps', apps.query.mode === 'count' && (apps.facts?.some((f) => f.value.includes('11,529,787')) ?? false), apps.headline);

  const fl = executeLenderAsk('How many applications are for properties in Florida?', intel);
  check('ASK-fl-geo', fl.query.mode === 'count' && fl.body.toLowerCase().includes('not lenders headquartered'), fl.headline);
  check('ASK-fl-not-branch', !/service territory|headquartered in Florida as the metric/.test(fl.headline), 'property geo');

  const purchase = parseLenderAsk('Which lenders originated the most purchase mortgages in Florida?');
  check('ASK-purchase-closed', purchase.mode === 'fail_closed' && purchase.failClosedKind === 'loan-purpose-origination', purchase.failClosedKind ?? '');

  const fha = parseLenderAsk('Which lenders originated the most FHA mortgages in Florida?');
  check('ASK-fha-entity', fha.mode === 'entity' && fha.loanType?.[0] === 'FHA' && fha.geography?.state === 'FL', String(fha.mode));

  const entity = parseLenderAsk('Which lenders originated the most mortgages in Florida?');
  check('ASK-entity-florida', entity.mode === 'entity' && entity.geography?.state === 'FL' && entity.actionTaken?.[0] === 'origination', entity.mode);

  const cmp = parseLenderAsk('Compare Broward and Palm Beach mortgage activity');
  check('ASK-county-compare', cmp.mode === 'comparison' && cmp.geography?.grain === 'county', cmp.mode);
  check('ASK-broward-not-located', (cmp.geography?.note ?? '').toLowerCase().includes('not lender'), 'geo note');

  const browardQ = parseLenderAsk('Which lenders received the most applications for properties in Broward County?');
  check('ASK-broward-entity', browardQ.mode === 'entity' && browardQ.geography?.countyFips === '12011' && browardQ.actionTaken?.[0] === 'application', browardQ.mode);

  const cfpb = executeLenderAsk('Show indexed CFPB mortgage complaint coverage', intel);
  check('ASK-cfpb-not-wrongdoing', cfpb.body.includes('not a finding of wrongdoing'), 'complaints');

  check('ASK-public-vs-identity', intel.stateOfRecord.some((m) => m.id === 'institutions') && intel.stateOfRecord.some((m) => m.id === 'public-national'), 'identity vs public');

  const flRank = executeAskQuery({ q: 'Which lenders originated the most mortgages in Florida?' });
  const top = flRank.rows?.[0];
  check('ASK-fl-rank-runs', flRank.query.mode === 'entity' && (flRank.rows?.length ?? 0) > 0, flRank.headline);
  check('ASK-fl-rank-uwm', top?.lei === '549300HW662MN1WU8550' && top.metric === 49897, `${top?.displayName} ${top?.metric}`);
  check('ASK-fl-rank-not-best', !/best|recommended|safest/i.test(`${flRank.headline} ${flRank.body}`), 'most ≠ best');
  check('ASK-fl-rank-geo', (flRank.grain ?? '').toLowerCase().includes('florida') && flRank.geographyWarning.toLowerCase().includes('not lender'), flRank.grain ?? '');
  check('ASK-fl-rank-period', (flRank.period ?? '').includes('2025'), flRank.period ?? '');
  check('ASK-fl-rank-profile-gate', top?.identityStatus === 'public_profile' && Boolean(top.href?.includes('/lender/')), top?.identityStatus ?? '');
  check('ASK-fl-rank-page-size', (flRank.rows?.length ?? 0) <= 25 && (flRank.pageSize ?? 0) === 25, String(flRank.rows?.length));
  check('ASK-fl-unlabeled-not-silent', (flRank.facts?.some((f) => /LEI-only|Public-profile/i.test(f.label)) ?? false), 'identity accounting');

  const flPage2 = executeAskQuery({ q: 'Which lenders originated the most mortgages in Florida?', page: 2 });
  check('ASK-fl-page2', flPage2.page === 2 && flPage2.rows?.[0]?.rank === 26, `page ${flPage2.page} rank ${flPage2.rows?.[0]?.rank}`);

  const brRank = executeAskQuery({ q: 'Which lenders received the most applications for properties in Broward County?' });
  const brTop = brRank.rows?.[0];
  check('ASK-br-rank', brTop?.lei === '549300HW662MN1WU8550' && brTop.metric === 6801, `${brTop?.displayName} ${brTop?.metric}`);
  check('ASK-br-grain', (brRank.grain ?? '').toLowerCase().includes('broward'), brRank.grain ?? '');

  const countyCmp = executeAskQuery({ q: 'Compare Broward and Palm Beach mortgage activity' });
  check(
    'ASK-br-pb-facts',
    (countyCmp.facts?.some((f) => f.label.includes('Broward applications') && f.value.includes('67,743')) ?? false) &&
      (countyCmp.facts?.some((f) => f.label.includes('Palm Beach applications') && f.value.includes('56,484')) ?? false),
    countyCmp.facts?.map((f) => `${f.label}=${f.value}`).join(' | ') ?? '',
  );
  check('ASK-br-pb-purpose-label', countyCmp.facts?.some((f) => /purchase-purpose applications \(not originations\)/i.test(f.label)) ?? false, 'purchase labeled as apps');

  const fhaRank = executeAskQuery({ q: 'Which lenders originated the most FHA mortgages in Florida?' });
  check('ASK-fha-runs', fhaRank.query.mode === 'entity' && (fhaRank.rows?.length ?? 0) > 0 && fhaRank.rows![0]!.metric > 0, `${fhaRank.rows?.[0]?.displayName} ${fhaRank.rows?.[0]?.metric}`);
  check('ASK-fha-label', (fhaRank.rows?.[0]?.metricLabel ?? '').toLowerCase().includes('fha'), fhaRank.rows?.[0]?.metricLabel ?? '');
  check('ASK-contract', fhaRank.contract === 'lender-ask-v1', String(fhaRank.contract));
  check('ASK-fha-not-hq', fhaRank.geographyWarning.toLowerCase().includes('not lender headquarters'), fhaRank.geographyWarning);

  const vaRank = executeAskQuery({ q: 'Which lenders originated the most VA mortgages in Florida?' });
  check('ASK-va-runs', (vaRank.rows?.[0]?.metric ?? 0) > 0 && (vaRank.rows?.[0]?.metricLabel ?? '').includes('VA'), `${vaRank.rows?.[0]?.displayName} ${vaRank.rows?.[0]?.metric}`);

  const convRank = executeAskQuery({ q: 'Which lenders originated the most conventional mortgages in Florida?' });
  check('ASK-conv-runs', (convRank.rows?.[0]?.metric ?? 0) > 0, String(convRank.rows?.[0]?.metric));

  const usdaRank = executeAskQuery({ q: 'Which lenders originated the most USDA mortgages in Florida?' });
  check(
    'ASK-usda-supported',
    usdaRank.failClosed !== true && ((usdaRank.rows?.[0]?.metric ?? 0) > 0 || (usdaRank.facts?.length ?? 0) > 0 || usdaRank.query.loanType?.[0] === 'USDA'),
    `${usdaRank.query.mode} ${usdaRank.rows?.[0]?.metric ?? usdaRank.headline}`,
  );

  const rates = executeAskQuery({ q: 'Which lenders have the lowest rates today?' });
  check('ASK-rates-closed', rates.failClosed === true && rates.query.failClosedKind === 'live-rate', rates.query.failClosedKind ?? '');

  const cfpbEnt = executeAskQuery({ q: 'Which lenders have the most CFPB mortgage complaints?' });
  check('ASK-cfpb-entity', cfpbEnt.query.mode === 'entity' && (cfpbEnt.rows?.length ?? 0) > 0, String(cfpbEnt.rows?.length));
  check('ASK-cfpb-caveat', (cfpbEnt.body + (cfpbEnt.caveats ?? []).join(' ')).includes('not a finding of wrongdoing') || (cfpbEnt.rows?.[0]?.whyMatched.some((w) => w.includes('not a finding of wrongdoing')) ?? false), 'wrongdoing caveat');
  check('ASK-cfpb-unattached', (cfpbEnt.caveats ?? []).some((c) => c.includes('Unattached')), 'unattached excluded');

  const flVsUs = executeAskQuery({ q: 'Compare Florida and U.S. mortgage activity' });
  check('ASK-fl-us', flVsUs.facts?.some((f) => f.label.toLowerCase().includes('florida applications')) ?? false, flVsUs.headline);

  check('ASK-name-conflict', namesCompatible('PennyMac Loan Services, LLC', 'loanDepot') === false, 'LEI name conflict held');
  check('ASK-name-match', namesCompatible('United Wholesale Mortgage, LLC', 'United Wholesale Mortgage') === true, 'UWM compatible');

  const askPage = src('app/ask/page.tsx');
  const robots = src('app/robots.ts');
  const sitemap = src('app/sitemap.ts');
  check('ASK-route-noindex', askPage.includes('index: false') && askPage.includes('follow: true') && askPage.includes("title: { absolute: 'Ask LenderTrustHub' }"), 'ask noindex follow');
  check('ASK-robots-disallow', robots.includes("'/ask'") && robots.includes("'/ask/'"), 'robots /ask');
  check('ASK-not-in-sitemap', !sitemap.includes("path: '/ask'"), 'sitemap omits /ask');
  check('ASK-api-exists', src('app/api/ask/route.ts').includes('executeAskQuery'), 'api route');
  check('ASK-no-llm-facts', !src('lib/ask-lender/execute-query.ts').includes('openai') && !src('lib/ask-lender/parse.ts').includes('chat.completions'), 'no LLM facts');

  const why = flRank.rows?.[0]?.whyMatched.join(' ') ?? '';
  check('ASK-why-matched', /raw/.test(why) && /not a recommendation/i.test(why), why.slice(0, 160));

  return checks;
}
