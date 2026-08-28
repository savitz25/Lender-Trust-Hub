-- FL-LEND-002D-05-mlo.sql
-- Person identities by NMLS Individual ID only. Never an institution.

begin;

insert into public.lender_national_entities (
  id, entity_kind, stable_key, legal_name, display_name,
  identity_confidence, current_status, public_projection_status, notes
)
select distinct
  uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'person:'||m.individual_nmls_id),
  'person_mlo',
  'nmls-person:'||m.individual_nmls_id,
  left(trim(both from concat_ws(', ', nullif(m.person_last,''), nullif(concat_ws(' ', m.person_first, m.person_middle),''))), 500),
  left(trim(both from concat_ws(', ', nullif(m.person_last,''), nullif(concat_ws(' ', m.person_first, m.person_middle),''))), 500),
  'confirmed', 'observed', 'internal_only',
  'FL-LEND-002D NMLS individual'
from public.staging_fl_ofr_mlos m
where coalesce(m.individual_nmls_id,'') ~ '^[0-9]{3,12}$'
on conflict (stable_key) do nothing;

insert into public.lender_identifiers (
  id, entity_id, identifier_type, identifier_value, jurisdiction,
  source_dataset, source_record_id, observed_at, confidence, raw_metadata
)
select distinct
  uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'ident:NMLS_PERSON:'||m.individual_nmls_id),
  uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'person:'||m.individual_nmls_id),
  'NMLS_PERSON', m.individual_nmls_id, 'FL',
  'FL_OFR_NMLS_PRR_141420', 'FL|NMLS_PERSON|'||m.individual_nmls_id, date '2026-08-27',
  'confirmed', jsonb_build_object('entity_class','person_mlo')
from public.staging_fl_ofr_mlos m
where coalesce(m.individual_nmls_id,'') ~ '^[0-9]{3,12}$'
on conflict (identifier_type, identifier_value) do nothing;

insert into public.lender_state_license_observations (
  id, jurisdiction, license_number, license_class, nmls_id, ofr_status,
  status_effective_on, initial_approval_on, source_clock, source_dataset,
  source_record_id, source_observed_on, entity_id, raw_metadata
)
select
  uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'obs:'||m.source_dataset||':'||m.source_record_id),
  'FL', m.fl_lo_license, 'LO', m.individual_nmls_id, m.ofr_status,
  m.status_effective_on, m.initial_approval_on, m.source_clock, m.source_dataset,
  m.source_record_id, m.source_observed_on,
  case when coalesce(m.individual_nmls_id,'') ~ '^[0-9]{3,12}$'
       then uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'person:'||m.individual_nmls_id)
  end,
  jsonb_build_object('privacy','internal_only')
from public.staging_fl_ofr_mlos m
where coalesce(m.fl_lo_license,'') <> ''
on conflict (source_dataset, source_record_id) do nothing;

insert into public.lender_state_licenses (
  id, jurisdiction, license_number, license_class, entity_class, nmls_id, ofr_status,
  status_effective_on, initial_approval_on, person_last, person_first, person_middle,
  attribution_confidence, match_method, source_dataset, source_record_id, source_observed_on,
  raw_metadata, source_clock
)
select
  uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'lic:LO:'||m.fl_lo_license),
  'FL', m.fl_lo_license, 'LO', 'person_mlo', m.individual_nmls_id, m.ofr_status,
  m.status_effective_on, m.initial_approval_on, m.person_last, m.person_first, m.person_middle,
  'confirmed', 'EXACT_NMLS_PERSON', m.source_dataset, m.source_record_id, m.source_observed_on,
  jsonb_build_object('privacy','internal_only','source_clock', m.source_clock),
  m.source_clock
from public.staging_fl_ofr_mlos m
where coalesce(m.fl_lo_license,'') <> ''
on conflict (jurisdiction, license_number) do update set
  ofr_status = excluded.ofr_status,
  source_clock = excluded.source_clock,
  updated_at = now();

commit;
