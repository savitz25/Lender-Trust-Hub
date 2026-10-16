-- =============================================================================
-- ROLLBACK: 20261013200000_lender_rls_fail_closed
-- Project: Lender-Trust-Hub (ref hidcrbexurginnuqgipx).  Drafted 2026-10-13 by Grok Bot (TrustHub Supabase Security).
-- Audit: network-rls-audit-20261013/audit.md.  Capture: read-only catalog SELECT 2026-10-13 (raw/catalog/lender_tables.txt).
-- DRAFT - NOT APPLIED.  Requires Founder GO.  Rehearse on a branch first.  Do NOT `supabase db push`.
-- Run as postgres, single session, psql -v ON_ERROR_STOP=1:
--   SET mth.rls_fail_closed_target = 'branch';            -- preview branch / restored copy
--   SET mth.rls_fail_closed_target = 'hidcrbexurginnuqgipx';  -- production
-- NOTE: system_identifier 7656985631720456337 is NOT unique on its own;
--       the guard also requires a project-specific table fingerprint.
-- =============================================================================
-- WARNING: RE-OPENS the exposure (anon read/write/TRUNCATE on all 17 tables). Outage recovery only.
-- Restores captured state: RLS off, FORCE off, ACL {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}, 0 policies, 0 column grants.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '300s';

CREATE TEMP TABLE _mth_rls_capture (relname text PRIMARY KEY, pre_acl text NOT NULL) ON COMMIT DROP;
INSERT INTO _mth_rls_capture (relname, pre_acl) VALUES
    ('depository_fdic_institutions', '{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}'),
    ('depository_ncua_credit_unions', '{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}'),
    ('lender_cfpb_company_entity_bridges', '{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}'),
    ('lender_cfpb_complaint_classifications', '{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}'),
    ('lender_cfpb_complaints', '{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}'),
    ('lender_cfpb_identity_conflicts', '{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}'),
    ('lender_cfpb_source_companies', '{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}'),
    ('lender_federal_enforcement_amounts', '{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}'),
    ('lender_federal_enforcement_classifications', '{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}'),
    ('lender_federal_enforcement_conflicts', '{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}'),
    ('lender_federal_enforcement_documents', '{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}'),
    ('lender_federal_enforcement_event_respondents', '{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}'),
    ('lender_federal_enforcement_events', '{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}'),
    ('lender_federal_enforcement_respondents', '{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}'),
    ('lender_federal_enforcement_source_freshness', '{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}'),
    ('lender_servicer_identity_conflicts', '{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}'),
    ('lender_servicer_role_evidence', '{postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}');

CREATE FUNCTION pg_temp.mth_acl_norm(a aclitem[]) RETURNS text[] LANGUAGE sql IMMUTABLE AS $f$
  SELECT coalesce(array_agg(x ORDER BY x), '{}')
  FROM (SELECT format('%s>%s:%s:%s', x.grantor::regrole,
                      CASE x.grantee WHEN 0 THEN 'PUBLIC' ELSE x.grantee::regrole::text END,
                      x.privilege_type, x.is_grantable) AS x
        FROM aclexplode(a) x) s
$f$;

DO $guard$
DECLARE
  v_target text := current_setting('mth.rls_fail_closed_target', true);
  v_sysid bigint;
  v_prod_sysid constant bigint := 7656985631720456337;  -- hidcrbexurginnuqgipx, captured 2026-10-13
  v_missing int; v_bad text;
BEGIN
  IF current_user <> 'postgres' THEN RAISE EXCEPTION 'guard: must run as postgres (got %)', current_user; END IF;
  IF current_database() <> 'postgres' THEN RAISE EXCEPTION 'guard: unexpected database %', current_database(); END IF;
  IF current_setting('server_version_num')::int < 170000 THEN RAISE EXCEPTION 'guard: expected PostgreSQL 17+'; END IF;
  -- project fingerprint (Lender-Trust-Hub)
  IF to_regclass('public.lender_cfpb_complaints') IS NULL OR to_regclass('public.lender_servicer_role_evidence') IS NULL OR to_regclass('public.depository_fdic_institutions') IS NULL THEN RAISE EXCEPTION 'guard: fingerprint tables missing - this is not Lender-Trust-Hub'; END IF;
  IF to_regclass('public.pbj_staffing_day') IS NOT NULL OR to_regclass('public.form_adv_filings') IS NOT NULL THEN RAISE EXCEPTION 'guard: foreign-project table present - this is not Lender-Trust-Hub'; END IF;
  IF to_regnamespace('move_v2') IS NOT NULL THEN RAISE EXCEPTION 'guard: schema move_v2 present - this is the Move database'; END IF;

  SELECT system_identifier INTO v_sysid FROM pg_control_system();
  IF v_target IS NULL OR v_target = '' THEN
    RAISE EXCEPTION 'guard: set mth.rls_fail_closed_target first (''hidcrbexurginnuqgipx'' or ''branch'')';
  ELSIF v_target = 'hidcrbexurginnuqgipx' THEN
    IF v_sysid <> v_prod_sysid THEN RAISE EXCEPTION 'guard: target says prod but system_identifier % <> %', v_sysid, v_prod_sysid; END IF;
  ELSIF v_target = 'branch' THEN
    NULL;  -- branches may clone sysid; fingerprint + captured-state checks still apply
  ELSE
    RAISE EXCEPTION 'guard: unknown mth.rls_fail_closed_target %', v_target;
  END IF;

  SELECT count(*) INTO v_missing
  FROM _mth_rls_capture c
  LEFT JOIN pg_class k ON k.relname = c.relname AND k.relnamespace = 'public'::regnamespace
  WHERE k.oid IS NULL OR k.relkind <> 'r' OR k.relispartition
     OR pg_get_userbyid(k.relowner) <> 'postgres' OR k.relforcerowsecurity;
  IF v_missing > 0 THEN RAISE EXCEPTION 'guard: % of 17 tables missing / not owned by postgres / wrong kind / FORCE RLS', v_missing; END IF;

  SELECT string_agg(c.relname, ', ') INTO v_bad
  FROM _mth_rls_capture c
  JOIN pg_class k ON k.relname = c.relname AND k.relnamespace = 'public'::regnamespace
  WHERE NOT (
        (NOT k.relrowsecurity AND pg_temp.mth_acl_norm(k.relacl) = pg_temp.mth_acl_norm(c.pre_acl::aclitem[]))
     OR (k.relrowsecurity AND NOT EXISTS (SELECT 1 FROM aclexplode(k.relacl) a
           WHERE a.grantee = 0 OR a.grantee IN ('anon'::regrole, 'authenticated'::regrole))));
  IF v_bad IS NOT NULL THEN RAISE EXCEPTION 'rollback guard: tables not in known pre/post state: %', v_bad; END IF;
  IF EXISTS (SELECT 1 FROM pg_policies pp JOIN _mth_rls_capture c ON c.relname = pp.tablename WHERE pp.schemaname='public') THEN
    RAISE EXCEPTION 'guard: policies exist on captured tables (capture had 0) - re-audit';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_attribute a JOIN _mth_rls_capture c ON a.attrelid = ('public.'||quote_ident(c.relname))::regclass
             WHERE a.attnum > 0 AND a.attacl IS NOT NULL) THEN
    RAISE EXCEPTION 'guard: column ACLs exist on captured tables (capture had none) - re-audit';
  END IF;
END
$guard$;

GRANT ALL ON TABLE public.depository_fdic_institutions TO anon, authenticated;  -- restores anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres
GRANT ALL ON TABLE public.depository_ncua_credit_unions TO anon, authenticated;  -- restores anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres
GRANT ALL ON TABLE public.lender_cfpb_company_entity_bridges TO anon, authenticated;  -- restores anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres
GRANT ALL ON TABLE public.lender_cfpb_complaint_classifications TO anon, authenticated;  -- restores anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres
GRANT ALL ON TABLE public.lender_cfpb_complaints TO anon, authenticated;  -- restores anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres
GRANT ALL ON TABLE public.lender_cfpb_identity_conflicts TO anon, authenticated;  -- restores anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres
GRANT ALL ON TABLE public.lender_cfpb_source_companies TO anon, authenticated;  -- restores anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres
GRANT ALL ON TABLE public.lender_federal_enforcement_amounts TO anon, authenticated;  -- restores anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres
GRANT ALL ON TABLE public.lender_federal_enforcement_classifications TO anon, authenticated;  -- restores anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres
GRANT ALL ON TABLE public.lender_federal_enforcement_conflicts TO anon, authenticated;  -- restores anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres
GRANT ALL ON TABLE public.lender_federal_enforcement_documents TO anon, authenticated;  -- restores anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres
GRANT ALL ON TABLE public.lender_federal_enforcement_event_respondents TO anon, authenticated;  -- restores anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres
GRANT ALL ON TABLE public.lender_federal_enforcement_events TO anon, authenticated;  -- restores anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres
GRANT ALL ON TABLE public.lender_federal_enforcement_respondents TO anon, authenticated;  -- restores anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres
GRANT ALL ON TABLE public.lender_federal_enforcement_source_freshness TO anon, authenticated;  -- restores anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres
GRANT ALL ON TABLE public.lender_servicer_identity_conflicts TO anon, authenticated;  -- restores anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres
GRANT ALL ON TABLE public.lender_servicer_role_evidence TO anon, authenticated;  -- restores anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres

DO $rls$
DECLARE r record;
BEGIN
  FOR r IN SELECT relname FROM _mth_rls_capture ORDER BY relname LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.relname);
  END LOOP;
END
$rls$;

DO $post$
DECLARE v_bad text;
BEGIN
  SELECT string_agg(c.relname || ' [' || coalesce(k.relacl::text,'NULL') || ']', '; ') INTO v_bad
  FROM _mth_rls_capture c JOIN pg_class k ON k.relname = c.relname AND k.relnamespace = 'public'::regnamespace
  WHERE k.relrowsecurity OR k.relforcerowsecurity
     OR pg_temp.mth_acl_norm(k.relacl) IS DISTINCT FROM pg_temp.mth_acl_norm(c.pre_acl::aclitem[]);
  IF v_bad IS NOT NULL THEN RAISE EXCEPTION 'rollback post: mismatch vs capture: %', v_bad; END IF;
  RAISE NOTICE 'rollback: 17 tables restored to captured pre-fix state';
END
$post$;

COMMIT;
