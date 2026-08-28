-- FL-LEND-002D-03-company-credentials.sql
-- Exact-resolved companies only for lender_state_licenses.
-- All staged credential rows get observation history (clocks stay separate).
-- MLS stays a credential class, not national servicer-role evidence.

begin;

insert into public.lender_state_license_observations (
  id, jurisdiction, license_number, license_class, nmls_id, ofr_status,
  status_effective_on, initial_approval_on, servicer_flag, source_clock,
  source_dataset, source_record_id, source_observed_on, entity_id, raw_metadata
)
select
  uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'obs:'||c.source_dataset||':'||c.source_record_id),
  'FL', c.license_number, c.license_class, c.company_nmls_id, c.ofr_status,
  c.status_effective_on, c.initial_approval_on, nullif(c.servicer_flag,''), c.source_clock,
  c.source_dataset, c.source_record_id, c.source_observed_on,
  r.entity_id,
  jsonb_build_object('firm_name', c.firm_name, 'license_name', c.raw_metadata)
from public.staging_fl_ofr_company_credentials c
left join public.lender_source_identity_resolutions r
  on r.identifier_type = 'NMLS_INSTITUTION'
 and r.identifier_value = c.company_nmls_id
 and r.source_dataset = 'FL_OFR_NMLS_PRR_141420'
where c.license_class in ('MLD','MBR','MLS')
  and coalesce(c.license_number,'') <> ''
on conflict (source_dataset, source_record_id) do nothing;

insert into public.lender_state_licenses (
  id, jurisdiction, license_number, license_class, entity_class, nmls_id, ofr_status,
  status_effective_on, initial_approval_on, servicer_flag, firm_name,
  phone, prim_address1, prim_address2, prim_city, prim_county, prim_state, prim_zip,
  institution_id, attribution_confidence, match_method,
  source_dataset, source_record_id, source_observed_on, raw_metadata, source_clock
)
select
  uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'lic:'||c.license_class||':'||c.license_number),
  'FL', c.license_number, c.license_class, 'institution', c.company_nmls_id, c.ofr_status,
  c.status_effective_on, c.initial_approval_on, nullif(c.servicer_flag,''), c.firm_name,
  nullif(c.phone,''), c.prim_address1, c.prim_address2, c.prim_city, c.prim_county, c.prim_state, c.prim_zip,
  r.entity_id, 'confirmed', 'EXACT_NMLS_INSTITUTION',
  c.source_dataset, c.source_record_id, c.source_observed_on,
  jsonb_build_object('source_clock', c.source_clock, 'prr', '141420'),
  c.source_clock
from public.staging_fl_ofr_company_credentials c
join public.lender_source_identity_resolutions r
  on r.identifier_type = 'NMLS_INSTITUTION'
 and r.identifier_value = c.company_nmls_id
 and r.source_dataset = 'FL_OFR_NMLS_PRR_141420'
 and r.resolution_class = 'ATTACHED_EXISTING_EXACT_NMLS'
where c.license_class in ('MLD','MBR','MLS')
  and coalesce(c.license_number,'') <> ''
on conflict (jurisdiction, license_number) do update set
  ofr_status = excluded.ofr_status,
  status_effective_on = excluded.status_effective_on,
  source_dataset = excluded.source_dataset,
  source_record_id = excluded.source_record_id,
  source_observed_on = excluded.source_observed_on,
  source_clock = excluded.source_clock,
  institution_id = coalesce(public.lender_state_licenses.institution_id, excluded.institution_id),
  updated_at = now();

select license_class, source_clock, count(*) as observation_rows
from public.lender_state_license_observations
where license_class in ('MLD','MBR','MLS')
group by 1,2
order by 1,2;

commit;
