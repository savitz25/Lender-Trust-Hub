#!/usr/bin/env python3
"""Read-only production counts for lender-network-metrics-v1. Does not write snapshots."""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from importlib.machinery import SourceFileLoader

gen = SourceFileLoader(
    "snapgen",
    str(Path(__file__).resolve().parent / "fl-lend-002e-generate-snapshots.py"),
).load_module()

import psycopg2
from psycopg2.extras import RealDictCursor


def table_exists(cur, name: str) -> bool:
    cur.execute(
        "select 1 from information_schema.tables where table_schema='public' and table_name=%s",
        (name,),
    )
    return cur.fetchone() is not None


def columns(cur, name: str) -> list[str]:
    cur.execute(
        """
        select column_name
        from information_schema.columns
        where table_schema='public' and table_name=%s
        order by ordinal_position
        """,
        (name,),
    )
    return [r["column_name"] for r in cur.fetchall()]


def main() -> None:
    conn = psycopg2.connect(gen.dsn())
    cur = conn.cursor(cursor_factory=RealDictCursor)
    identity = gen.one(
        cur,
        """
        select
          (select count(*) from lender_national_entities where entity_kind='institution') as institutions,
          (select count(*) from lender_national_entities where entity_kind='branch') as branches,
          (select count(*) from lender_national_entities where entity_kind='person_mlo') as person_mlo,
          (select count(*) from lender_national_entities where entity_kind='person_public_candidate') as person_public_candidate,
          (select count(*) from lender_identifiers where identifier_type='NMLS_INSTITUTION') as nmls_institution,
          (select count(*) from lender_identifiers where identifier_type='NMLS_BRANCH') as nmls_branch,
          (select count(*) from lender_identifiers where identifier_type='NMLS_PERSON') as nmls_person,
          (select count(*) from lender_identifiers where identifier_type='LEI') as lei,
          (select count(*) from lender_identifiers where identifier_type='FDIC_CERT') as fdic,
          (select count(*) from lender_identifiers where identifier_type='NCUA_CHARTER') as ncua,
          (select count(*) from lender_identifiers where identifier_type='RSSD') as rssd,
          (select count(*) from lender_profile_intelligence) as lpi
        """,
    )
    hmda = gen.one(
        cur,
        """
        select count(*) as rows,
          coalesce(sum(applications),0) as applications,
          coalesce(sum(originations),0) as originations,
          coalesce(sum(denials),0) as denials
        from lender_hmda_observations
        where data_year=2025 and geo_grain='county'
        """,
    )
    hmda_state = gen.one(
        cur,
        """
        select count(*) as rows,
          coalesce(sum(applications),0) as applications
        from lender_hmda_observations
        where data_year=2025 and geo_grain='state'
        """,
    )
    geography = gen.rows(
        cur,
        """
        select state_code as state,
          coalesce(sum(applications),0)::bigint as applications,
          coalesce(sum(originations),0)::bigint as originations,
          coalesce(sum(denials),0)::bigint as denials
        from lender_hmda_observations
        where data_year=2025 and geo_grain='county'
        group by 1
        order by 1
        """,
    )
    dep_rows = gen.rows(
        cur,
        """
        select profile->'roles'->>'depository' as d, count(*)::bigint as n
        from lender_profile_intelligence
        group by 1
        """,
    )
    depository = {r["d"] or "UNKNOWN": int(r["n"]) for r in dep_rows}
    for key in ("FDIC", "NCUA", "NONBANK", "UNKNOWN"):
        depository.setdefault(key, 0)
    cfpb = gen.one(
        cur,
        """
        select count(*) as complaints,
          count(*) filter (where institution_id is not null) as attached,
          count(*) filter (where institution_id is null) as unattached,
          count(distinct raw_company_label) as labels,
          max(source_observed_at)::date as observed
        from lender_cfpb_complaints
        """,
    )
    fl = gen.one(
        cur,
        """
        select
          (select count(*) from lender_state_licenses
            where jurisdiction='FL' and license_class in ('MBR','MLD') and ofr_status='Approved') as approved_credentials,
          (select count(distinct nmls_id) from lender_state_licenses
            where jurisdiction='FL' and license_class in ('MBR','MLD') and ofr_status='Approved'
              and institution_id is not null) as confirmed_nmls,
          (select count(distinct nmls_id) from lender_state_licenses
            where jurisdiction='FL' and license_class in ('MBR','MLD') and ofr_status='Approved'
              and institution_id is null) as held_nmls,
          (select count(*) from lender_state_regulatory_events) as sre
        """,
    )
    out = {
        "identity": identity,
        "hmdaCounty2025": hmda,
        "hmdaState2025": hmda_state,
        "geography": geography,
        "depository": depository,
        "cfpb": cfpb,
        "cfpbBridges": gen.n(cur, "select count(*) from lender_cfpb_company_entity_bridges"),
        "federalEnforcement": gen.n(cur, "select count(*) from lender_federal_enforcement_events"),
        "federalEnforcementColumns": columns(cur, "lender_federal_enforcement_events"),
        "florida": fl,
        "servicerTable": table_exists(cur, "lender_servicer_role_evidence"),
        "licensesTotal": gen.n(cur, "select count(*) from lender_state_licenses"),
    }
    if out["servicerTable"]:
        out["servicerEvidenceRows"] = gen.n(cur, "select count(*) from lender_servicer_role_evidence")
        out["servicerColumns"] = columns(cur, "lender_servicer_role_evidence")
    conn.close()
    print(json.dumps(out, default=str, indent=2))


if __name__ == "__main__":
    main()
