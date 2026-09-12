#!/usr/bin/env python3
"""Read-only production counts for lender-network-metrics-v1. Does not write snapshots."""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
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
    conn.set_session(readonly=True, isolation_level="REPEATABLE READ")
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
        select coalesce(profile->'roles'->>'depository', 'UNKNOWN') as d, count(*)::bigint as n
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
        "contractRevision": "ATH-METRICS-R2-03",
        "retrievedAt": datetime.now(timezone.utc).isoformat(),
        "sourceAsOf": None,
        "acquisition": "Read-only REPEATABLE READ PostgreSQL census; source clocks are recorded separately, not inferred from retrieval.",
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
        "servicerEvidenceRows": None,
        "licensesTotal": gen.n(cur, "select count(*) from lender_state_licenses"),
    }
    if out["servicerTable"]:
        out["servicerEvidenceRows"] = gen.n(cur, "select count(*) from lender_servicer_role_evidence")
        out["servicerColumns"] = columns(cur, "lender_servicer_role_evidence")
    out["floridaStatusPartition"] = gen.rows(cur, """
        select license_class, ofr_status, count(*) as rows
        from lender_state_licenses
        where jurisdiction='FL' and license_class in ('MBR','MLD')
        group by 1,2 order by 1,2
    """)
    out["floridaSourceClocks"] = gen.rows(cur, """
        select source_dataset, source_clock, source_observed_on, max(updated_at) as ledgerUpdatedAt,
          count(*) as credentialRows
        from lender_state_licenses
        where jurisdiction='FL' and license_class in ('MBR','MLD')
        group by 1,2,3 order by 1,2,3
    """)
    out["floridaApprovedTransitions"] = gen.rows(cur, """
        select o.license_number, o.nmls_id, o.source_dataset as previous_dataset,
          o.source_record_id as previous_record_id, o.ofr_status as previous_status,
          o.source_observed_on as previous_source_observed_on,
          l.source_dataset as current_dataset, l.source_record_id as current_record_id,
          l.ofr_status as current_status, l.source_observed_on as current_source_observed_on,
          l.updated_at as ledger_updated_at
        from lender_state_license_observations o
        join lender_state_licenses l on l.jurisdiction=o.jurisdiction and l.license_number=o.license_number
        where o.jurisdiction='FL' and o.license_class in ('MBR','MLD')
          and o.source_dataset='FL_OFR_NMLS_PRR_141420' and o.source_clock='nmls_active'
          and ((o.ofr_status='Approved' and l.ofr_status is distinct from 'Approved')
            or (o.ofr_status is distinct from 'Approved' and l.ofr_status='Approved'))
        order by o.license_number
    """)
    conn.rollback()
    conn.close()
    print(json.dumps(out, default=str, indent=2))


if __name__ == "__main__":
    main()
