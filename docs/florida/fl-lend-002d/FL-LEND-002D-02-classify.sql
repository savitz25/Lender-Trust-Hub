-- FL-LEND-002D-02-classify.sql
-- Exact NMLS_INSTITUTION join. No names. No net-new institutions.
-- Requires staging_fl_ofr_companies loaded (10,216 rows).

begin;

do $$
begin
  if (select count(*) from staging_fl_ofr_companies) <> 10216 then
    raise exception 'FL-LEND-002D STOP: staging companies = %, expected 10216',
      (select count(*) from staging_fl_ofr_companies);
  end if;
end $$;

create temporary table tmp_fl_nmls_hits as
select
  s.company_nmls_id,
  count(distinct i.entity_id) filter (where i.entity_id is not null) as entity_n,
  min(i.entity_id) as entity_id
from staging_fl_ofr_companies s
left join public.lender_identifiers i
  on i.identifier_type = 'NMLS_INSTITUTION'
 and i.identifier_value = s.company_nmls_id
group by s.company_nmls_id;

create temporary table tmp_fl_class as
select
  h.company_nmls_id,
  case
    when h.company_nmls_id !~ '^[0-9]{3,12}$' then 'MALFORMED'
    when h.entity_n > 1 then 'MULTI_ENTITY_CONFLICT'
    when h.entity_n = 1 and e.entity_kind is distinct from 'institution' then 'MULTI_ENTITY_CONFLICT'
    when h.entity_n = 1 then 'ATTACHED_EXISTING_EXACT_NMLS'
    else 'UNRESOLVED_SOURCE_COMPANY_NMLS'
  end as resolution_class,
  case when h.entity_n = 1 and e.entity_kind = 'institution' then h.entity_id else null end as entity_id,
  case
    when h.entity_n > 1 then 'EXACT_NMLS_MULTI_ENTITY'
    when h.entity_n = 1 and e.entity_kind is distinct from 'institution' then 'EXACT_NMLS_WRONG_KIND'
    when h.entity_n = 1 then 'EXACT_NMLS_INSTITUTION'
    else 'HELD_NO_EXISTING_INSTITUTION'
  end as match_method
from tmp_fl_nmls_hits h
left join public.lender_national_entities e on e.id = h.entity_id;

insert into public.lender_source_identity_resolutions (
  id, identifier_type, identifier_value, source_dataset, resolution_class,
  entity_id, match_method, notes, observed_at, raw_metadata
)
select
  uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'res:NMLS_INSTITUTION:' || company_nmls_id),
  'NMLS_INSTITUTION',
  company_nmls_id,
  'FL_OFR_NMLS_PRR_141420',
  resolution_class,
  entity_id,
  match_method,
  case
    when resolution_class = 'UNRESOLVED_SOURCE_COMPANY_NMLS' then 'Not minted as net-new institution.'
    when resolution_class = 'MULTI_ENTITY_CONFLICT' then 'source NMLS maps to multiple or non-institution entities; not attached'
    else null
  end,
  date '2026-08-27',
  jsonb_build_object('prr','141420')
from tmp_fl_class
on conflict (identifier_type, identifier_value, source_dataset) do update set
  resolution_class = excluded.resolution_class,
  entity_id = excluded.entity_id,
  match_method = excluded.match_method,
  notes = excluded.notes,
  updated_at = now();

select
  count(*) as source_company_nmls,
  count(*) filter (where resolution_class = 'ATTACHED_EXISTING_EXACT_NMLS') as attached_existing_exact_nmls,
  count(*) filter (where resolution_class = 'UNRESOLVED_SOURCE_COMPANY_NMLS') as unresolved_source_company_nmls,
  count(*) filter (where resolution_class = 'MULTI_ENTITY_CONFLICT') as multi_entity_conflict,
  count(*) filter (where resolution_class = 'MALFORMED') as malformed
from public.lender_source_identity_resolutions
where source_dataset = 'FL_OFR_NMLS_PRR_141420'
  and identifier_type = 'NMLS_INSTITUTION';

commit;
