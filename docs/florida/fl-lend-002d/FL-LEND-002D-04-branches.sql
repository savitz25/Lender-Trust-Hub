-- FL-LEND-002D-04-branches.sql
-- Create/reuse branch entities only when parent Company Id is exact-attached.
-- One branch NMLS → one subordinate entity. Multiple credential classes allowed.

begin;

insert into public.lender_national_entities (
  id, entity_kind, stable_key, legal_name, display_name,
  identity_confidence, current_status, public_projection_status, notes
)
select distinct
  uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'branch:'||b.branch_nmls_id),
  'branch',
  'nmls-branch:'||b.branch_nmls_id,
  coalesce(nullif(b.firm_name,''), 'BRANCH '||b.branch_nmls_id),
  coalesce(nullif(b.firm_name,''), 'BRANCH '||b.branch_nmls_id),
  'confirmed', 'observed', 'internal_only',
  'FL-LEND-002D NMLS branch'
from public.staging_fl_ofr_branches b
join public.lender_source_identity_resolutions r
  on r.identifier_type = 'NMLS_INSTITUTION'
 and r.identifier_value = b.parent_company_nmls_id
 and r.source_dataset = 'FL_OFR_NMLS_PRR_141420'
 and r.resolution_class = 'ATTACHED_EXISTING_EXACT_NMLS'
where coalesce(b.branch_nmls_id,'') <> ''
on conflict (stable_key) do nothing;

insert into public.lender_identifiers (
  id, entity_id, identifier_type, identifier_value, jurisdiction,
  source_dataset, source_record_id, observed_at, status, confidence, raw_metadata
)
select distinct
  uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'ident:NMLS_BRANCH:'||b.branch_nmls_id),
  uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'branch:'||b.branch_nmls_id),
  'NMLS_BRANCH', b.branch_nmls_id, 'FL',
  'FL_OFR_NMLS_PRR_141420', 'FL|NMLS_BRANCH|'||b.branch_nmls_id, date '2026-08-27',
  b.ofr_status, 'confirmed',
  jsonb_build_object('parent_company_nmls', b.parent_company_nmls_id)
from public.staging_fl_ofr_branches b
join public.lender_source_identity_resolutions r
  on r.identifier_type = 'NMLS_INSTITUTION'
 and r.identifier_value = b.parent_company_nmls_id
 and r.resolution_class = 'ATTACHED_EXISTING_EXACT_NMLS'
where coalesce(b.branch_nmls_id,'') <> ''
on conflict (identifier_type, identifier_value) do nothing;

insert into public.lender_entity_relationships (
  id, from_entity_id, to_entity_id, relationship_type, confidence,
  source_dataset, notes, valid_from, ofr_status, source_record_id
)
select distinct
  uuid_generate_v5(
    '9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid,
    'rel:BELONGS_TO:'||uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'branch:'||b.branch_nmls_id)::text||':'||r.entity_id::text
  ),
  uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'branch:'||b.branch_nmls_id),
  r.entity_id,
  'BELONGS_TO', 'confirmed',
  'FL_OFR_NMLS_PRR_141420',
  'PRR 141420 Company Id '||b.parent_company_nmls_id||' + Branch Id '||b.branch_nmls_id,
  date '2026-08-27', b.ofr_status, 'FL|BRANCH|'||b.branch_nmls_id
from public.staging_fl_ofr_branches b
join public.lender_source_identity_resolutions r
  on r.identifier_type = 'NMLS_INSTITUTION'
 and r.identifier_value = b.parent_company_nmls_id
 and r.resolution_class = 'ATTACHED_EXISTING_EXACT_NMLS'
where b.source_clock = 'nmls_active'
on conflict (from_entity_id, to_entity_id, relationship_type) do nothing;

insert into public.lender_state_license_observations (
  id, jurisdiction, license_number, license_class, nmls_id, ofr_status,
  status_effective_on, source_clock, source_dataset, source_record_id, source_observed_on, entity_id, raw_metadata
)
select
  uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'obs:'||b.source_dataset||':'||b.source_record_id),
  'FL', b.license_number, b.license_class, b.branch_nmls_id, b.ofr_status,
  null, b.source_clock, b.source_dataset, b.source_record_id, b.source_observed_on,
  case when r.resolution_class = 'ATTACHED_EXISTING_EXACT_NMLS'
       then uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'branch:'||b.branch_nmls_id)
  end,
  jsonb_build_object('parent_company_nmls', b.parent_company_nmls_id)
from public.staging_fl_ofr_branches b
left join public.lender_source_identity_resolutions r
  on r.identifier_type = 'NMLS_INSTITUTION'
 and r.identifier_value = b.parent_company_nmls_id
 and r.source_dataset = 'FL_OFR_NMLS_PRR_141420'
where b.license_class in ('MLDB','MBRB','MLSB')
  and coalesce(b.license_number,'') <> ''
on conflict (source_dataset, source_record_id) do nothing;

insert into public.lender_state_licenses (
  id, jurisdiction, license_number, license_class, entity_class, nmls_id, ofr_status,
  firm_name, phone, prim_address1, prim_city, prim_state, prim_zip,
  institution_id, attribution_confidence, match_method,
  source_dataset, source_record_id, source_observed_on, raw_metadata, source_clock
)
select
  uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'lic:'||b.license_class||':'||b.license_number),
  'FL', b.license_number, b.license_class, 'branch', b.branch_nmls_id, b.ofr_status,
  b.firm_name, nullif(b.phone,''), b.address1, b.city, b.state, b.zip,
  r.entity_id, 'confirmed', 'EXACT_NMLS_BRANCH',
  b.source_dataset, b.source_record_id, b.source_observed_on,
  jsonb_build_object('source_clock', b.source_clock, 'branch_nmls', b.branch_nmls_id),
  b.source_clock
from public.staging_fl_ofr_branches b
join public.lender_source_identity_resolutions r
  on r.identifier_type = 'NMLS_INSTITUTION'
 and r.identifier_value = b.parent_company_nmls_id
 and r.resolution_class = 'ATTACHED_EXISTING_EXACT_NMLS'
where b.license_class in ('MLDB','MBRB','MLSB')
  and coalesce(b.license_number,'') <> ''
on conflict (jurisdiction, license_number) do update set
  ofr_status = excluded.ofr_status,
  source_clock = excluded.source_clock,
  institution_id = coalesce(public.lender_state_licenses.institution_id, excluded.institution_id),
  updated_at = now();

insert into public.lender_source_identity_resolutions (
  id, identifier_type, identifier_value, source_dataset, resolution_class,
  match_method, notes, observed_at, raw_metadata
)
select distinct
  uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'res:NMLS_BRANCH:'||b.branch_nmls_id),
  'NMLS_BRANCH', b.branch_nmls_id, 'FL_OFR_NMLS_PRR_141420',
  'UNRESOLVED_SOURCE_COMPANY_NMLS',
  'PARENT_COMPANY_UNRESOLVED',
  'branch parent company not exact-attached; branch held',
  date '2026-08-27',
  jsonb_build_object('parent_company_nmls', b.parent_company_nmls_id)
from public.staging_fl_ofr_branches b
left join public.lender_source_identity_resolutions r
  on r.identifier_type = 'NMLS_INSTITUTION'
 and r.identifier_value = b.parent_company_nmls_id
 and r.resolution_class = 'ATTACHED_EXISTING_EXACT_NMLS'
where b.source_clock = 'nmls_active'
  and r.identifier_value is null
on conflict (identifier_type, identifier_value, source_dataset) do nothing;

commit;
