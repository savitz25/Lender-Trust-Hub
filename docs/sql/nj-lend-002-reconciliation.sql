-- NJ-LEND-002 reconciliation (LenderTrustHub only).
-- Run after confirming the connected database is LenderTrustHub.
-- Do not print credentials.

-- Pre / post counts
select 'lender_source_coverage' as relation, count(*) as n
from public.lender_source_coverage
where source_dataset = 'NJ_LEND_002_STATE_INTELLIGENCE'
union all
select 'lender_program_catalog', count(*) from public.lender_program_catalog where jurisdiction = 'NJ'
union all
select 'lender_program_participations', count(*) from public.lender_program_participations where source_dataset = 'NJ_LEND_002_STATE_INTELLIGENCE'
union all
select 'lender_program_limit_observations', count(*) from public.lender_program_limit_observations where source_dataset = 'NJ_LEND_002_STATE_INTELLIGENCE'
union all
select 'lender_policy_bulletins', count(*) from public.lender_policy_bulletins where source_dataset = 'NJ_LEND_002_STATE_INTELLIGENCE'
union all
select 'lender_state_market_observations', count(*) from public.lender_state_market_observations where source_dataset = 'NJ_LEND_002_STATE_INTELLIGENCE'
union all
select 'lender_monitoring_events', count(*) from public.lender_monitoring_events where source_dataset = 'NJ_LEND_002_STATE_INTELLIGENCE'
union all
select 'lender_identity_match_ledger', count(*) from public.lender_identity_match_ledger where source_dataset = 'NJ_LEND_002_STATE_INTELLIGENCE';

-- Duplicate guards
select row_fingerprint, count(*) from public.lender_program_participations
where source_dataset = 'NJ_LEND_002_STATE_INTELLIGENCE'
group by 1 having count(*) > 1;

select row_fingerprint, count(*) from public.lender_program_limit_observations
where source_dataset = 'NJ_LEND_002_STATE_INTELLIGENCE'
group by 1 having count(*) > 1;

select source_dataset, bulletin_number, count(*) from public.lender_policy_bulletins
where source_dataset = 'NJ_LEND_002_STATE_INTELLIGENCE'
group by 1, 2 having count(*) > 1;

-- HMDA overlay grain
select data_year, geo_grain, count(*)
from public.lender_state_market_observations
where source_dataset = 'NJ_LEND_002_STATE_INTELLIGENCE'
group by 1, 2
order by 1, 2;

-- Baseline-only / internal-only invariants
select monitoring_state, count(*)
from public.lender_monitoring_events
where source_dataset = 'NJ_LEND_002_STATE_INTELLIGENCE'
group by 1;

select public_eligibility, count(*)
from public.lender_program_participations
where source_dataset = 'NJ_LEND_002_STATE_INTELLIGENCE'
group by 1;

-- Historical alerts must be zero
select count(*) as historical_alerts
from public.lender_monitoring_events
where source_dataset = 'NJ_LEND_002_STATE_INTELLIGENCE'
  and monitoring_state = 'alerted';

-- NJ-LEND-001 events must not be duplicated by this ticket
select count(*) as lend_001_events
from public.lender_regulatory_events
where source_dataset = 'NJ_DOBI_LENDER_ENFORCEMENT';
