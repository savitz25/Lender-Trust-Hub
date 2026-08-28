-- FL-LEND-002D-08-dry-run.sql
-- SELECT only. Run after staging CSVs are loaded and before 02-07 writes.
-- Exact NMLS_INSTITUTION join. No names.

select 'staging_companies' as metric, count(*)::text as value from staging_fl_ofr_companies
union all select 'expected_companies', '10216'
union all select 'staging_company_credentials', count(*)::text from staging_fl_ofr_company_credentials
union all select 'staging_branches', count(*)::text from staging_fl_ofr_branches
union all select 'distinct_prr_branch_nmls', count(distinct branch_nmls_id)::text
  from staging_fl_ofr_branches where source_clock = 'nmls_active'
union all select 'expected_prr_branch_nmls', '6690'
union all select 'staging_mlo_rows', count(*)::text from staging_fl_ofr_mlos
union all select 'staging_sponsorships', count(*)::text from staging_fl_ofr_sponsorships
union all select 'expected_sponsorships', '53421'
union all select 'staging_business_contacts', count(*)::text from staging_fl_ofr_business_contacts
union all select 'staging_person_contacts', count(*)::text from staging_fl_ofr_person_contacts;

with hits as (
  select
    s.company_nmls_id,
    count(distinct i.entity_id) filter (where i.entity_id is not null) as entity_n,
    min(i.entity_id) as entity_id
  from staging_fl_ofr_companies s
  left join lender_identifiers i
    on i.identifier_type = 'NMLS_INSTITUTION'
   and i.identifier_value = s.company_nmls_id
  group by s.company_nmls_id
),
cls as (
  select
    h.company_nmls_id,
    case
      when h.company_nmls_id !~ '^[0-9]{3,12}$' then 'MALFORMED'
      when h.entity_n > 1 then 'MULTI_ENTITY_CONFLICT'
      when h.entity_n = 1 and e.entity_kind is distinct from 'institution' then 'MULTI_ENTITY_CONFLICT'
      when h.entity_n = 1 then 'ATTACHED_EXISTING_EXACT_NMLS'
      else 'UNRESOLVED_SOURCE_COMPANY_NMLS'
    end as resolution_class,
    case when h.entity_n = 1 and e.entity_kind = 'institution' then h.entity_id end as entity_id
  from hits h
  left join lender_national_entities e on e.id = h.entity_id
)
select
  count(*) as source_company_nmls,
  count(*) filter (where resolution_class = 'ATTACHED_EXISTING_EXACT_NMLS') as attached_existing_exact_nmls,
  count(*) filter (where resolution_class = 'UNRESOLVED_SOURCE_COMPANY_NMLS') as unresolved_source_company_nmls,
  count(*) filter (where resolution_class = 'MULTI_ENTITY_CONFLICT') as multi_entity_conflict,
  count(*) filter (where resolution_class = 'MALFORMED') as malformed
from cls;

with hits as (
  select s.company_nmls_id,
    count(distinct i.entity_id) filter (where i.entity_id is not null) as entity_n,
    min(i.entity_id) as entity_id
  from staging_fl_ofr_companies s
  left join lender_identifiers i
    on i.identifier_type = 'NMLS_INSTITUTION' and i.identifier_value = s.company_nmls_id
  group by s.company_nmls_id
),
attached as (
  select h.company_nmls_id
  from hits h
  join lender_national_entities e on e.id = h.entity_id
  where h.entity_n = 1 and e.entity_kind = 'institution'
)
select c.license_class, c.source_clock,
  count(*) as rows,
  count(*) filter (where a.company_nmls_id is not null) as attachable_rows,
  count(*) filter (where a.company_nmls_id is null) as unresolved_entity_rows
from staging_fl_ofr_company_credentials c
left join attached a on a.company_nmls_id = c.company_nmls_id
group by 1,2
order by 1,2;

with attached as (
  select s.company_nmls_id
  from staging_fl_ofr_companies s
  join lender_identifiers i
    on i.identifier_type = 'NMLS_INSTITUTION' and i.identifier_value = s.company_nmls_id
  join lender_national_entities e on e.id = i.entity_id and e.entity_kind = 'institution'
  group by s.company_nmls_id
  having count(distinct i.entity_id) = 1
)
select
  count(distinct branch_nmls_id) filter (where source_clock = 'nmls_active') as prr_branch_nmls,
  count(distinct branch_nmls_id) filter (
    where source_clock = 'nmls_active' and parent_company_nmls_id in (select company_nmls_id from attached)
  ) as parent_resolved,
  count(distinct branch_nmls_id) filter (
    where source_clock = 'nmls_active' and parent_company_nmls_id not in (select company_nmls_id from attached)
  ) as parent_unresolved
from staging_fl_ofr_branches;

select
  count(distinct individual_nmls_id) filter (where individual_nmls_id ~ '^[0-9]{3,12}$') as person_nmls,
  count(*) as lo_credential_rows
from staging_fl_ofr_mlos;

with attached as (
  select s.company_nmls_id
  from staging_fl_ofr_companies s
  join lender_identifiers i
    on i.identifier_type = 'NMLS_INSTITUTION' and i.identifier_value = s.company_nmls_id
  join lender_national_entities e on e.id = i.entity_id and e.entity_kind = 'institution'
  group by s.company_nmls_id
  having count(distinct i.entity_id) = 1
)
select
  count(*) as sponsorship_rows,
  count(*) filter (where sponsor_company_nmls_id in (select company_nmls_id from attached)) as sponsor_resolved,
  count(*) filter (where sponsor_company_nmls_id not in (select company_nmls_id from attached)) as sponsor_unresolved
from staging_fl_ofr_sponsorships;
