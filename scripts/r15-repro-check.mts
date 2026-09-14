import { executeAskQuery } from '../lib/ask-lender/execute-query';
import { executeLenderAsk } from '../lib/ask-lender/execute';
import { buildLenderHomeIntel } from '../lib/home-intel/build';

const QUERIES = [
  'lenders in New Jersey',
  'lender in new jersey',
  'mortgage lenders in Texas',
  'mortgage companies in Florida',
  'which lenders in New Jersey',
];

const intel = buildLenderHomeIntel();

for (const q of QUERIES) {
  const ask = executeAskQuery({ q });
  const home = executeLenderAsk(q, intel);
  console.log(JSON.stringify({
    q,
    surface_ask: {
      mode: ask.query.mode,
      failClosed: ask.failClosed ?? false,
      failClosedKind: ask.query.failClosedKind,
      coverageState: ask.query.coverageState,
      headline: ask.headline,
      body: ask.body.slice(0, 220),
      facts: ask.facts,
      totalRows: ask.totalRows,
      caveats: ask.caveats,
    },
    surface_home: {
      mode: home.query.mode,
      failClosed: home.failClosed ?? false,
      failClosedKind: home.query.failClosedKind,
      headline: home.headline,
      body: home.body.slice(0, 220),
      href: home.href,
      facts: home.facts,
    },
  }, null, 2));
}
