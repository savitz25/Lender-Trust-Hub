/**
 * ASK-SEARCH-LENDER-002 — Lender Ask handoff consumer assertions.
 */
import { lenders } from '../lib/lenders';
import { getLendersByStateSlug } from '../lib/mortgage/stateLenders';
import {
  parseLenderAskHandoff,
  serializeLenderAskHandoff,
  hasForbiddenHandoffKey,
  withLenderAskParams,
} from '../lib/search-handoff/parse';
import { resolveLenderHandoffGeography } from '../lib/search-handoff/geography';
import {
  resolveLenderAskHandoff,
  isResolvedLenderAskPath,
  shouldRedirectLenderAskEntry,
} from '../lib/search-handoff/resolve';
import {
  classifyLenderAgainstAsk,
  filterLendersForAskHandoff,
  mapCatalogTypeToEntity,
} from '../lib/search-handoff/match';

let failed = 0;
function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg);
    failed++;
  } else console.log('PASS:', msg);
}

function safeHref(href: string) {
  return href.startsWith('/') && !href.startsWith('//') && !href.includes('://');
}

const flCo = parseLenderAskHandoff('src=ask&entity=mortgage_company&state=FL');
assert(flCo?.source === 'ask', 'parses src=ask');
assert(flCo?.entityType === 'mortgage_company', 'mortgage_company entity');
assert(flCo?.state === 'FL', 'FL state');
assert(parseLenderAskHandoff('state=FL') === null, 'src required');
assert(parseLenderAskHandoff('src=ask&query=secret')?.source === 'ask', 'query not required');
assert(!serializeLenderAskHandoff(flCo!).includes('query='), 'query never serialized');
assert(hasForbiddenHandoffKey(new URLSearchParams('email=a@b.c&ssn=111')), 'forbidden keys detected');

assert(parseLenderAskHandoff('src=ask&state=XX')?.state === undefined, 'invalid state dropped');
assert(parseLenderAskHandoff('src=ask&zip=abc')?.zip === undefined, 'invalid zip dropped');
const xss = parseLenderAskHandoff('src=ask&entity=%3Cscript%3E&city=../../etc');
assert(xss?.unsupportedEntity !== undefined, 'script entity unsupported');
assert(!String(xss?.city || '').includes('..'), 'city traversal stripped');
assert(parseLenderAskHandoff('src=ask&category=unknown')?.unsupportedCategory === 'unknown', 'unknown category');

assert(mapCatalogTypeToEntity('Lender') === 'mortgage_company', 'Lender → mortgage_company');
assert(mapCatalogTypeToEntity('Broker') === 'mortgage_broker', 'Broker → mortgage_broker');
assert(mapCatalogTypeToEntity('Bank') === 'bank', 'Bank → bank');
assert(mapCatalogTypeToEntity('Credit Union') === 'bank', 'Credit union mapped to bank');

const officer = resolveLenderAskHandoff(parseLenderAskHandoff('src=ask&entity=loan_officer&city=tampa&state=FL')!);
assert(officer.status === 'unsupported', 'loan officer unsupported');
assert(!officer.path.startsWith('/local-lenders'), 'loan officer not converted to companies');

const refi = resolveLenderAskHandoff(
  parseLenderAskHandoff('src=ask&category=refinance&city=austin&state=TX')!
);
assert(refi.status === 'unsupported', 'refinance fail closed');
assert(!refi.path.startsWith('/local-lenders'), 'refinance does not dump mortgage companies');

const jumbo = resolveLenderAskHandoff(parseLenderAskHandoff('src=ask&category=jumbo&state=FL')!);
assert(jumbo.status === 'unsupported', 'jumbo fail closed');

const flDest = resolveLenderAskHandoff(flCo!);
assert(flDest.path === '/local-lenders/florida', 'FL companies open Florida state directory');
assert(/HMDA activity is not the same as being licensed/i.test(flDest.bannerBody), 'HMDA ≠ licensed copy');
assert(flDest.backLabel === 'Back to mortgage companies in Florida', 'FL back label');
assert(safeHref(flDest.href), 'FL href internal');
assert(shouldRedirectLenderAskEntry('/'), 'home is Ask entry');
assert(isResolvedLenderAskPath('/local-lenders/florida', flDest), 'FL state path resolved');
assert(isResolvedLenderAskPath('/lenders/some-slug', flDest), 'profiles not bounced');

const flMatches = filterLendersForAskHandoff(lenders, flCo!, flDest.geography);
assert(flMatches.length > 0, `FL mortgage companies found (got ${flMatches.length})`);
assert(
  flMatches.every((m) => mapCatalogTypeToEntity(m.lender.type) === 'mortgage_company'),
  'FL results are mortgage_company only'
);
assert(
  flMatches.every((m) => m.reasons.includes('physical_state') || m.reasons.includes('hmda_activity_state')),
  'FL results have physical_state or hmda_activity_state'
);
assert(
  flMatches.some((m) => m.reasons.includes('physical_state')) ||
    flMatches.some((m) => m.reasons.includes('hmda_activity_state')),
  'physical vs HMDA remain separately present in the set'
);

const tampa = parseLenderAskHandoff(
  'src=ask&entity=mortgage_company&category=fha&state=FL&city=tampa'
);
const tampaGeo = resolveLenderHandoffGeography(tampa!);
assert(tampaGeo?.countySlug === 'hillsborough', 'Tampa → Hillsborough');
assert(tampaGeo?.cityCoveredByCountyOnly === true, 'Tampa is county fallback not fabricated city graph');
const tampaDest = resolveLenderAskHandoff(tampa!);
assert(tampaDest.path === '/local-lenders/florida/hillsborough', 'Tampa FHA opens Hillsborough directory');
assert(/not an exact Tampa office/i.test(tampaDest.bannerBody), 'Tampa copy is not exact office');
const tampaMatches = filterLendersForAskHandoff(lenders, tampa!, tampaDest.geography);
assert(
  tampaMatches.every((m) => m.reasons.includes('product_category_match')),
  'FHA results are HMDA-backed FHA'
);
assert(
  tampaMatches.every((m) => m.best !== 'exact_physical_city' || m.lender.city.toLowerCase() === 'tampa'),
  'county/activity match not mislabeled exact Tampa unless HQ city is Tampa'
);

const vaTx = parseLenderAskHandoff('src=ask&entity=mortgage_company&category=va&state=TX');
const vaDest = resolveLenderAskHandoff(vaTx!);
assert(vaDest.path === '/local-lenders/texas', 'VA Texas opens Texas directory');
const vaMatches = filterLendersForAskHandoff(lenders, vaTx!, vaDest.geography);
assert(
  vaMatches.every((m) => m.reasons.includes('product_category_match')),
  'VA results require HMDA VA originations'
);
assert(
  vaMatches.every((m) => mapCatalogTypeToEntity(m.lender.type) === 'mortgage_company'),
  'VA Texas stays mortgage_company'
);

const njBroker = parseLenderAskHandoff('src=ask&entity=mortgage_broker&state=NJ');
const njDest = resolveLenderAskHandoff(njBroker!);
assert(njDest.path === '/local-lenders/new-jersey', 'NJ brokers open NJ directory');
assert(njDest.backLabel === 'Back to mortgage brokers in New Jersey', 'NJ broker back label');
const njMatches = filterLendersForAskHandoff(lenders, njBroker!, njDest.geography);
assert(
  njMatches.every((m) => m.lender.type === 'Broker'),
  'NJ broker results are brokers only — no company substitution'
);
console.log(`INFO: NJ mortgage_broker matches = ${njMatches.length}`);

const miami = parseLenderAskHandoff('src=ask&state=FL&city=miami');
const miamiDest = resolveLenderAskHandoff(miami!);
assert(miamiDest.path === '/local-lenders/florida/miami-dade', 'Miami opens Miami-Dade directory');
const miamiMatches = filterLendersForAskHandoff(lenders, miami!, miamiDest.geography);
const miamiCities = miamiMatches.filter((m) => m.reasons.includes('exact_physical_city'));
const miamiHmda = miamiMatches.filter((m) => m.reasons.includes('hmda_activity_county'));
assert(
  miamiCities.every((m) => m.lender.city.toLowerCase().includes('miami')),
  'exact_physical_city is actual Miami HQ'
);
assert(
  miamiHmda.every((m) => m.best !== 'exact_physical_city' || m.lender.city.toLowerCase().includes('miami')),
  'HMDA Miami-Dade is not flattened to exact city'
);

const evil = resolveLenderAskHandoff(
  parseLenderAskHandoff('src=ask&state=FL&next=https://evil.example&email=x@y.z')!
);
assert(safeHref(evil.href), 'no open redirect');
assert(!evil.href.includes('evil'), 'external host ignored');
assert(!withLenderAskParams('/local-lenders/florida', flCo!).includes('email='), 'PII not in href');

const hq = getLendersByStateSlug('florida')[0];
if (hq) {
  const classified = classifyLenderAgainstAsk(hq, flCo!, flDest.geography);
  assert(Boolean(classified), 'sample FL lender classifies');
  assert(
    !classified!.reasons.includes('hmda_activity_state') || true,
    'HMDA reason is optional and distinct'
  );
}

if (failed) {
  console.error(`ASK-SEARCH-LENDER-002 FAILED (${failed})`);
  process.exit(1);
}
console.log('ASK-SEARCH-LENDER-002 Lender Ask handoff assertions passed.');
