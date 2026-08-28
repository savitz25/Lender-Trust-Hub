-- FL-LEND-002D-10-verify-idempotency.sql
-- Run after first apply, then after second apply. Deltas must be zero.

select
  (select count(*) from lender_national_entities where entity_kind = 'institution') as institutions,
  (select count(*) from lender_national_entities where entity_kind = 'branch') as branches,
  (select count(*) from lender_national_entities where entity_kind = 'person_mlo') as person_mlo,
  (select count(*) from lender_identifiers where identifier_type = 'NMLS_INSTITUTION') as nmls_institution,
  (select count(*) from lender_identifiers where identifier_type = 'NMLS_BRANCH') as nmls_branch,
  (select count(*) from lender_identifiers where identifier_type = 'NMLS_PERSON') as nmls_person,
  (select count(*) from lender_profile_intelligence) as lpi,
  (select count(*) from lender_state_licenses) as licenses,
  (select count(*) from lender_state_license_observations) as observations,
  (select count(*) from lender_source_identity_resolutions where identifier_type = 'NMLS_INSTITUTION') as company_resolutions,
  (select count(*) from lender_entity_relationships where relationship_type = 'BELONGS_TO') as belongs_to,
  (select count(*) from lender_entity_relationships where relationship_type = 'ASSOCIATED_WITH') as associated_with,
  (select count(*) from lender_entity_contacts) as contacts,
  (select count(*) from lender_entity_contacts c
     join lender_national_entities e on e.id = c.entity_id
    where e.entity_kind = 'person_mlo' and c.classification = 'public_candidate') as person_public_candidate;

select resolution_class, count(*)
from lender_source_identity_resolutions
where identifier_type = 'NMLS_INSTITUTION'
  and source_dataset = 'FL_OFR_NMLS_PRR_141420'
group by 1
order by 1;

select license_class, source_clock, count(*)
from lender_state_license_observations
group by 1,2
order by 1,2;

-- Duplicate natural keys must be zero.
select 'dup_licenses' as check, count(*) - count(distinct (jurisdiction, license_number)) as extra from lender_state_licenses
union all
select 'dup_obs', count(*) - count(distinct (source_dataset, source_record_id)) from lender_state_license_observations
union all
select 'dup_nmls_inst', count(*) - count(distinct identifier_value)
from lender_identifiers where identifier_type = 'NMLS_INSTITUTION'
union all
select 'dup_stable_key', count(*) - count(distinct stable_key) from lender_national_entities;
