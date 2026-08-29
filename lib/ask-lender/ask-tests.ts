import { executeLenderAsk } from './execute';
import { parseLenderAsk } from './parse';
import { buildLenderHomeIntel } from '@/lib/home-intel/build';

export type AskCheck = { id: string; pass: boolean; detail: string };

export function runAskLenderTests(): AskCheck[] {
  const intel = buildLenderHomeIntel();
  const checks: AskCheck[] = [];
  const check = (id: string, pass: boolean, detail: string) => checks.push({ id, pass, detail });

  const closed = (q: string, kind: string) => parseLenderAsk(q).failClosedKind === kind;
  check('ASK-fail-best', closed('Which lender is best in Florida?', 'ranking'), 'best');
  check('ASK-fail-safest', closed('Which lender is safest?', 'safety'), 'safest');
  check('ASK-fail-disc', closed('Which lender discriminates the most?', 'discrimination'), 'discrimination');
  check(
    'ASK-fail-rate-today',
    ['live-rate', 'ranking'].includes(parseLenderAsk('Which lender has the best mortgage rate today?').failClosedKind ?? ''),
    'live rate or ranking fail-closed',
  );
  check('ASK-fail-junk', closed('Which lender charges the most junk fees?', 'pricing-rhetoric'), 'junk');
  check('ASK-fail-near', closed('Show lenders near me', 'proximity'), 'near me');
  check('ASK-fail-denial-rate', closed('Which lender has the highest denial rate?', 'denial-rate'), 'denial rate');

  const mostDenials = parseLenderAsk('lenders with the most denials');
  check('ASK-most-denials-not-rate', mostDenials.failClosedKind !== 'denial-rate' && mostDenials.requestedMetric !== 'rate', 'most ≠ rate');

  const apps = executeLenderAsk('How many mortgage applications are in the current research universe?', intel);
  check('ASK-count-apps', apps.query.mode === 'count' && (apps.facts?.some((f) => f.value.includes('11,529,787')) ?? false), apps.headline);

  const fl = executeLenderAsk('How many applications are for properties in Florida?', intel);
  check('ASK-fl-geo', fl.query.mode === 'count' && fl.body.toLowerCase().includes('not lenders headquartered'), fl.headline);
  check('ASK-fl-not-branch', !/service territory|headquartered in Florida as the metric/.test(fl.headline), 'property geo');

  const fha = parseLenderAsk('Show lenders with the most FHA purchase originations in Florida');
  check('ASK-fha-deferred', fha.mode === 'fail_closed' && fha.failClosedKind === 'product-split', String(fha.failClosedKind));

  const entity = parseLenderAsk('Which lenders originated the most mortgages in Florida?');
  check('ASK-entity-not-faked', entity.mode === 'fail_closed' && entity.failClosedKind === 'entity-volume', entity.failClosedKind ?? '');

  const cmp = parseLenderAsk('Compare Broward and Palm Beach mortgage activity');
  check('ASK-county-closed', cmp.mode === 'fail_closed' && cmp.geography?.grain === 'county', cmp.failClosedKind ?? '');
  check('ASK-broward-not-located', (cmp.geography?.note ?? '').toLowerCase().includes('not lender'), 'geo note');

  const cfpb = executeLenderAsk('Show indexed CFPB mortgage complaint coverage', intel);
  check('ASK-cfpb-not-wrongdoing', cfpb.body.includes('not a finding of wrongdoing'), 'complaints');

  check('ASK-public-vs-identity', intel.stateOfRecord.some((m) => m.id === 'institutions') && intel.stateOfRecord.some((m) => m.id === 'public-national'), 'identity vs public');

  return checks;
}
