/**
 * LEND-NAT-011 PI tests that can run against a cohort fixture (no DB).
 * Live PI1–PI20 run in scripts/lend-nat-011-snapshot.py after apply.
 */

import { FORBIDDEN_PROFILE_KEYS, PROFILE_METRIC_DICTIONARY } from './profile-metrics';
import { PROFILE_CONTRACT_VERSION, assertNoScores } from './profile-intelligence';

export type PiResult = { id: string; pass: boolean; detail: string };

export function runProfileFixtureTests(cohort: Record<string, Record<string, unknown>>): PiResult[] {
  const out: PiResult[] = [];
  const check = (id: string, pass: boolean, detail: string) => out.push({ id, pass, detail });

  const rocket = cohort.rocket;
  const freedom = cohort.freedom_corporation;
  const newrez = cohort.newrez;
  const sls = cohort.sls_llc;
  const phh = cohort.phh_home_loans;

  check('PI12', Boolean(rocket) && rocket.scores === null && rocket.rankings === null, 'no score/ranking fields');
  const scoreHits = rocket ? assertNoScores(rocket) : ['missing rocket'];
  check('PI12b', scoreHits.length === 0, scoreHits.join(',') || 'no forbidden keys');

  if (rocket) {
    const ids = (rocket.identity as { identifiers: { identifier_type: string; identifier_value: string }[] })
      .identifiers;
    const lei = ids.find((i) => i.identifier_type === 'LEI');
    const nmls = ids.find((i) => i.identifier_type === 'NMLS_INSTITUTION');
    check('PI2', Boolean(lei && nmls && lei.identifier_value !== nmls.identifier_value), 'LEI ≠ NMLS');
    check('PI15', nmls?.identifier_value === '3030' && lei?.identifier_value === '549300FGXN1K3HLB1R50', 'Rocket NMLS 3030 + GLEIF LEI');
    check('PI11', (rocket.roles as { servicer_status: string }).servicer_status === 'NOT ESTABLISHED', 'Rocket is not a servicer by complaint volume');
    check('PI6', (rocket.geography as { language: string }).language?.includes('HMDA activity observed'), 'activity language');
    check('PI1', rocket.contract_version === PROFILE_CONTRACT_VERSION && typeof (rocket.identity as { institution_id: string }).institution_id === 'string', 'one contract object');
    check('PI14', rocket.public_projection_status === 'internal_only', 'internal_only');
    check('PI7', (rocket.cfpb as { attribution_confidence: string }).attribution_confidence === 'confirmed', 'CFPB confirmed only');
  }

  if (freedom) {
    const names = ((freedom.identity as { names: { name: string }[] }).names || []).map((n) => n.name.toUpperCase());
    const related = ((freedom.cfpb as { unresolved_related?: { label: string }[] }).unresolved_related || []).map(
      (x) => x.label
    );
    check('PI16', !names.some((n) => n === 'FREEDOM MORTGAGE COMPANY') && related.includes('Freedom Mortgage Company'), 'Company not folded onto Corporation');
  }

  if (newrez) {
    const names = ((newrez.identity as { names: { name: string }[] }).names || []).map((n) => n.name.toUpperCase());
    const related = ((newrez.cfpb as { unresolved_related?: { label: string }[] }).unresolved_related || []).map(
      (x) => x.label
    );
    check('PI17', !names.some((n) => n.includes('SHELLPOINT')) && related.includes('Shellpoint Partners, LLC'), 'Shellpoint not mapped to Newrez');
  }

  if (sls) {
    const related = ((sls.cfpb as { unresolved_related?: { label: string }[] }).unresolved_related || []).map((x) => x.label);
    check('PI18', related.includes('Specialized Loan Servicing Holdings LLC'), 'Holdings disclosed, not folded');
  }

  if (phh) {
    const related = ((phh.cfpb as { unresolved_related?: { label: string }[] }).unresolved_related || []).map((x) => x.label);
    check('PI19', related.some((l) => l.includes('PHH Mortgage Services')), 'PHH services not folded from ownership');
  }

  check(
    'PI5',
    PROFILE_METRIC_DICTIONARY.some(
      (m) => m.metric_key === 'hmda_denial_rate' && m.denominator.includes('state grain') && !m.denominator.includes('observation-row')
    ),
    'denial denominator documented'
  );
  check(
    'dict-no-score',
    PROFILE_METRIC_DICTIONARY.every((m) => !FORBIDDEN_PROFILE_KEYS.some((k) => m.metric_key.toLowerCase().includes(k.toLowerCase().replace('_', '')))),
    'dictionary has no score keys'
  );

  return out;
}
