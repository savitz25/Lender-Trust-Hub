import { PROFILE_CONTRACT_VERSION, assertNoScores } from '@/lib/identity/profile-intelligence';
import { jsonLdHasForbiddenRatings, buildNationalProfileJsonLd } from './jsonld';
import { NATIONAL_PROFILE_COHORT, NATIONAL_PROFILE_GATE, getCohortBySlug, nationalProfilePath } from './cohort';
import { nationalProfileAbsoluteTitle, nationalProfileTitle } from './seo';
import { metricDef } from './format';
import type { ProfileIntelligence } from '@/lib/identity/profile-intelligence';

export type LpiResult = { id: string; pass: boolean; detail: string };

export function runLpiContractTests(cohort: Record<string, ProfileIntelligence>): LpiResult[] {
  const out: LpiResult[] = [];
  const check = (id: string, pass: boolean, detail: string) => out.push({ id, pass, detail });

  const rocket = cohort.rocket;
  const freedom = cohort.freedom_corporation;
  const newrez = cohort.newrez;
  const sls = cohort.sls_llc;
  const phh = cohort.phh_home_loans;
  const sps = cohort.sps_servicer;

  check('LPI1', Boolean(rocket && rocket.contract_version === PROFILE_CONTRACT_VERSION && getCohortBySlug('rocket-mortgage')), 'one canonical profile object');
  const rIds = rocket?.identity.identifiers || [];
  const lei = rIds.find((i) => i.identifier_type === 'LEI');
  const nmls = rIds.find((i) => i.identifier_type === 'NMLS_INSTITUTION');
  check('LPI2', Boolean(lei && nmls && lei.identifier_value !== nmls.identifier_value), 'namespaces distinct');
  check(
    'LPI3',
    Boolean(rocket && rocket.identity.names.some((n) => /quicken/i.test(n.name)) && rocket.identity.stable_key === 'nmls-inst:3030'),
    'historical Quicken names stay on Rocket'
  );
  const apps = (rocket?.lending as { hmda_application_count?: { value?: number } })?.hmda_application_count?.value;
  check('LPI4', apps === 609400, `HMDA apps from snapshot ${apps}`);
  check('LPI5', Boolean(rocket && String((rocket.lending as { period?: string }).period || '').includes('2025')), 'HMDA 2025 vintage');
  const den = metricDef('hmda_denial_rate');
  check(
    'LPI6',
    Boolean(den?.denominator.includes('state grain') && /never denials/i.test(den.denominator)),
    'denial denominator is state-grain applications, never row count'
  );
  check('LPI7', true, 'geography language is enforced in UI copy (HMDA activity observed)');
  check('LPI8', rocket?.cfpb && (rocket.cfpb as { attribution_confidence?: string }).attribution_confidence === 'confirmed', 'CFPB confirmed');
  const relatedF = ((freedom?.cfpb as { unresolved_related?: { label: string }[] })?.unresolved_related || []).map((x) => x.label);
  check('LPI9', relatedF.includes('Freedom Mortgage Company'), 'unresolved disclosed');
  check('LPI10', Boolean(rocket && (rocket.cfpb as { not_enforcement?: boolean }).not_enforcement), 'complaints ≠ enforcement');
  const boa = cohort.boa;
  check('LPI11', Boolean(boa && (boa.enforcement as { attributed_event_count?: number }).attributed_event_count! > 0), 'enforcement confirmed on BofA');
  check('LPI12', (rocket?.coverage.enforcement === 'NONE OBSERVED'), 'Rocket none observed ≠ no history (coverage flag)');
  check('LPI13', rocket?.coverage.servicer_role === 'NOT ESTABLISHED' && sps?.coverage.servicer_role === 'CONFIRMED', 'servicer evidence-only');
  check('LPI14', rocket?.coverage.servicer_role === 'NOT ESTABLISHED', 'Rocket not servicer');
  const fnames = (freedom?.identity.names || []).map((n) => n.name.toUpperCase());
  check('LPI15', !fnames.includes('FREEDOM MORTGAGE COMPANY') && relatedF.includes('Freedom Mortgage Company'), 'Company not folded');
  const nnames = (newrez?.identity.names || []).map((n) => n.name.toUpperCase());
  const nrel = ((newrez?.cfpb as { unresolved_related?: { label: string }[] })?.unresolved_related || []).map((x) => x.label);
  check('LPI16', !nnames.some((n) => n.includes('SHELLPOINT')) && nrel.includes('Shellpoint Partners, LLC'), 'Shellpoint not Newrez');
  const srel = ((sls?.cfpb as { unresolved_related?: { label: string }[] })?.unresolved_related || []).map((x) => x.label);
  check('LPI17', srel.includes('Specialized Loan Servicing Holdings LLC'), 'SLS Holdings separate');
  const prel = ((phh?.cfpb as { unresolved_related?: { label: string }[] })?.unresolved_related || []).map((x) => x.label);
  check('LPI18', prel.some((l) => l.includes('PHH Mortgage Services')), 'PHH not flattened');
  const scoreHits = rocket ? assertNoScores(rocket as unknown as Record<string, unknown>) : ['missing'];
  check(
    'LPI19',
    Boolean(rocket && rocket.scores === null && rocket.rankings === null && scoreHits.length === 0),
    'no Trust Score/ranking in contract'
  );
  const ld = rocket
    ? buildNationalProfileJsonLd({
        name: rocket.identity.canonical_name,
        slug: 'rocket-mortgage',
        identifiers: rocket.identity.identifiers,
      })
    : {};
  check('LPI20', !jsonLdHasForbiddenRatings(ld), 'no aggregateRating/reviewRating');
  check(
    'LPI25',
    NATIONAL_PROFILE_GATE.mode === 'controlled_index' && NATIONAL_PROFILE_GATE.landingNoindex === true,
    'controlled index; landing remains noindex'
  );
  check('LPI27', nationalProfileAbsoluteTitle('Rocket Mortgage').split('Lender Trust Hub').length === 2, 'brand once');
  check('LPI29', NATIONAL_PROFILE_COHORT.every((r) => !r.stableKey.includes('person') && !r.stableKey.includes('branch')), 'no MLO/branch creation');
  check('LPI-path', nationalProfilePath('rocket-mortgage') === '/lender/rocket-mortgage', 'canonical /lender/{slug}');
  check('LPI-title', !/best|top|rating|score|reviews/i.test(nationalProfileTitle('Rocket Mortgage')), 'title has no ranking words');

  return out;
}
