#!/usr/bin/env python3
"""FL-LEND-006 post-write verification. Read-only."""
from __future__ import annotations

import json
from pathlib import Path
import importlib.util
import psycopg2
from psycopg2.extras import RealDictCursor

spec = importlib.util.spec_from_file_location("g", Path(__file__).with_name("fl-lend-006-generate.py"))
g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)

conn = psycopg2.connect(g.lender_dsn())
conn.set_session(readonly=True, autocommit=True)
cur = conn.cursor(cursor_factory=RealDictCursor)

def n(sql):
    cur.execute(sql)
    return list(cur.fetchone().values())[0]

out = {
    "profiles": n("select count(*) from lender_state_company_profiles"),
    "unique_inst": n("select count(distinct institution_id) from lender_state_company_profiles"),
    "unique_slug": n("select count(distinct slug) from lender_state_company_profiles"),
    "held_leak": n(
        """
        select count(*) from lender_state_company_profiles p
        where p.nmls_id in (select nmls_id from lender_state_licenses where institution_id is null)
        """
    ),
    "internal_only": n("select count(*) from lender_state_company_profiles where public_projection_status='internal_only'"),
    "contract": n("select count(*) from lender_state_company_profiles where contract_version='fl-lend-provider-v1'"),
    "ofr_sum": n("select coalesce(sum(confirmed_ofr_event_count),0) from lender_state_company_profiles"),
    "ofr_prof": n("select count(*) from lender_state_company_profiles where confirmed_ofr_event_count>=1"),
    "hmda_nonnull": n(
        """
        select count(*) from lender_state_company_profiles
        where jsonb_typeof(profile->'hmda'->'florida_state_grain') = 'object'
        """
    ),
    "cfpb": n("select count(*) from lender_state_company_profiles where coalesce((profile->'cfpb'->>'confirmed_rows')::int,0)>0"),
    "federal": n("select count(*) from lender_state_company_profiles where coalesce((profile->'federalRegulatory'->>'confirmed_events')::int,0)>0"),
    "lpi": n("select count(*) from lender_profile_intelligence"),
    "institutions": n("select count(*) from lender_national_entities where entity_kind='institution'"),
    "licenses": n("select count(*) from lender_state_licenses"),
    "sre": n("select count(*) from lender_state_regulatory_events"),
    "anon_grants": n(
        """
        select count(*) from information_schema.role_table_grants
        where table_schema='public' and table_name='lender_state_company_profiles'
          and grantee in ('anon','authenticated')
        """
    ),
    "rls": n(
        """
        select count(*) from pg_class c
        join pg_namespace ns on ns.oid=c.relnamespace
        where ns.nspname='public' and c.relname='lender_state_company_profiles' and c.relrowsecurity
        """
    ),
}
print(json.dumps(out, default=str, indent=2))
assert out["profiles"] == 6303
assert out["unique_inst"] == 6303
assert out["unique_slug"] == 6303
assert out["held_leak"] == 0
assert out["ofr_sum"] == 342
assert out["ofr_prof"] == 294
assert out["lpi"] == 8447
assert out["anon_grants"] == 0
print("VERIFY_OK")
