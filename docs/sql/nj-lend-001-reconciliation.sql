-- NJ-LEND-001 reconciliation (LenderTrustHub only).
-- Run after confirming the connected database is LenderTrustHub.
-- Do not print credentials.

-- Pre / post counts
select 'lender_source_coverage' as relation, count(*) as n from public.lender_source_coverage where source_dataset = 'NJ_DOBI_LENDER_ENFORCEMENT'
union all
select 'lender_source_occurrences', count(*) from public.lender_source_occurrences where source_dataset = 'NJ_DOBI_LENDER_ENFORCEMENT'
union all
select 'lender_regulatory_documents', count(*) from public.lender_regulatory_documents
union all
select 'lender_regulatory_events', count(*) from public.lender_regulatory_events where source_dataset = 'NJ_DOBI_LENDER_ENFORCEMENT'
union all
select 'lender_regulatory_event_parties', count(*) from public.lender_regulatory_event_parties p
  join public.lender_regulatory_events e on e.id = p.event_uuid
  where e.source_dataset = 'NJ_DOBI_LENDER_ENFORCEMENT'
union all
select 'lender_identity_match_ledger', count(*) from public.lender_identity_match_ledger where source_dataset = 'NJ_DOBI_LENDER_ENFORCEMENT';

-- Duplicate guards
select content_hash, count(*) from public.lender_regulatory_documents group by 1 having count(*) > 1;
select source_dataset, event_id, count(*) from public.lender_regulatory_events group by 1, 2 having count(*) > 1;
select source_dataset, occurrence_fingerprint, count(*) from public.lender_source_occurrences group by 1, 2 having count(*) > 1;

-- Event class / status
select event_class, event_status, count(*)
from public.lender_regulatory_events
where source_dataset = 'NJ_DOBI_LENDER_ENFORCEMENT'
group by 1, 2
order by 1, 2;

-- Party match ledger
select match_status, count(*)
from public.lender_regulatory_event_parties p
join public.lender_regulatory_events e on e.id = p.event_uuid
where e.source_dataset = 'NJ_DOBI_LENDER_ENFORCEMENT'
group by 1
order by 1;

-- Baseline-only / internal-only invariants
select monitoring_state, public_eligibility, count(*)
from public.lender_regulatory_events
where source_dataset = 'NJ_DOBI_LENDER_ENFORCEMENT'
group by 1, 2;

-- Coverage: missing year must not appear as zero events
select source_family, source_year, coverage_state, http_status
from public.lender_source_coverage
where source_dataset = 'NJ_DOBI_LENDER_ENFORCEMENT'
order by source_family, source_year, source_url;

-- No public person projection from this ingest
select count(*) as person_public_candidates
from public.lender_regulatory_event_parties p
join public.lender_regulatory_events e on e.id = p.event_uuid
where e.source_dataset = 'NJ_DOBI_LENDER_ENFORCEMENT'
  and p.public_eligibility <> 'internal_only'
  and p.party_type in ('INDIVIDUAL', 'INDIVIDUAL_MLO', 'QUALIFIED_INDIVIDUAL', 'OFFICER_PRINCIPAL');
