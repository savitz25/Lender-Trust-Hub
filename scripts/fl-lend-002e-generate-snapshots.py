#!/usr/bin/env python3
"""FL-LEND-002E — generate + publish versioned national and Florida intelligence snapshots.

Reads production hidcrbex. Writes immutable rows to lender_intelligence_snapshots
and last-accepted artifacts consumed by / and /florida. Never invents live-SQL
fallbacks for the pages. File-backed publication cohorts stay file-backed.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path
from urllib.parse import quote, unquote, urlparse

import psycopg2
from psycopg2.extras import RealDictCursor, Json

ROOT = Path(__file__).resolve().parents[1]
REF = "hidcrbexurginnuqgipx"
ENV_CANDIDATES = [
    ROOT / ".env.local",
    Path(r"C:\Users\makei\lender-trust-hub-ask-search-009\.env.local"),
]
NATIONAL_CONTRACT = "lender-home-intel-snapshot-v2"
FLORIDA_CONTRACT = "lender-fl-state-intel-v2"
# FLAIO extractability pass remains file-backed (no DB column).
FLAIO_TEXT_EXTRACTABLE_COMPANY = 943
FLAIO_NON_TEXT_COMPANY = 9
# Publication policy is file-backed INTEL-004 / FL-LEND-006+008.
PUBLIC_NATIONAL_RENDER = 181
PUBLIC_NATIONAL_INDEX = 180
PUBLIC_FLORIDA = 130


def jsonable(value):
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: jsonable(v) for k, v in value.items()}
    if isinstance(value, list):
        return [jsonable(v) for v in value]
    return value


def canonical(obj) -> str:
    return json.dumps(jsonable(obj), sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def fingerprint_payload(payload: dict) -> str:
    copy = json.loads(canonical(payload))
    copy.pop("generated_at", None)
    copy.pop("fingerprint", None)
    return hashlib.sha256(canonical(copy).encode("utf-8")).hexdigest()


def dsn() -> str:
    raw = None
    for path in ENV_CANDIDATES:
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.startswith("TARGET_DATABASE_URL=") or line.startswith("DATABASE_URL="):
                candidate = line.split("=", 1)[1].strip().strip('"').strip("'")
                if REF in candidate:
                    raw = candidate
                    break
        if raw:
            break
    if not raw:
        raise SystemExit("STOP: TARGET_DATABASE_URL for hidcrbex missing")
    u = urlparse(raw)
    if REF not in (u.username or "") and REF not in (u.hostname or "") and REF not in raw:
        raise SystemExit("STOP: DSN is not hidcrbex")
    if "sslmode" not in (u.query or ""):
        raw = raw + ("&sslmode=require" if u.query else "?sslmode=require")
    return raw


def n(cur, sql, params=None):
    cur.execute(sql, params)
    row = cur.fetchone()
    return list(row.values())[0]


def rows(cur, sql, params=None):
    cur.execute(sql, params)
    return [jsonable(dict(r)) for r in cur.fetchall()]


def one(cur, sql, params=None):
    cur.execute(sql, params)
    return jsonable(dict(cur.fetchone()))


def apply_schema(cur) -> None:
    sql_path = ROOT / "supabase" / "migrations" / "20260830120000_lender_intelligence_snapshots.sql"
    cur.execute(sql_path.read_text(encoding="utf-8"))


def national_payload(cur, generated_at: str) -> dict:
    identity = one(
        cur,
        """
        select
          (select count(*) from lender_national_entities where entity_kind='institution') as institutions,
          (select count(*) from lender_national_entities where entity_kind='branch') as branch,
          (select count(*) from lender_national_entities where entity_kind='person_mlo') as person_mlo,
          (select count(*) from lender_national_entities where entity_kind='person_public_candidate') as person_public_candidate,
          (select count(*) from lender_identifiers where identifier_type='NMLS_INSTITUTION') as nmls_institution,
          (select count(*) from lender_identifiers where identifier_type='NMLS_BRANCH') as nmls_branch,
          (select count(*) from lender_identifiers where identifier_type='NMLS_PERSON') as nmls_person,
          (select count(*) from lender_profile_intelligence) as lpi_snapshots
        """,
    )
    if identity["person_public_candidate"] != 0:
        raise SystemExit("STOP: person_public_candidate must remain 0")
    hmda = one(
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
    geography = rows(
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
    dep_rows = rows(
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
    cfpb = one(
        cur,
        """
        select count(*) as complaints,
          count(*) filter (where institution_id is not null) as complaints_attached,
          count(*) filter (where institution_id is null) as complaints_unattached,
          count(distinct raw_company_label) as labels
        from lender_cfpb_complaints
        """,
    )
    bridges = n(cur, "select count(*) from lender_cfpb_company_entity_bridges")
    fl_confirmed = n(
        cur,
        """
        select count(distinct nmls_id)
        from lender_state_licenses
        where jurisdiction='FL' and license_class in ('MBR','MLD') and ofr_status='Approved'
          and institution_id is not null
        """,
    )
    retrieved = "2026-08-30"
    payload = {
        "snapshotVersion": NATIONAL_CONTRACT,
        "homepagePublicationVersion": "intel-004-v1",
        "generated_at": generated_at,
        "retrievedAt": retrieved,
        "hmdaOfficialAsOf": "2025",
        "hmdaSourceVintage": "HMDA 2025 reporting vintage",
        "hmdaGrain": "county",
        "institutions": int(identity["institutions"]),
        "lpiSnapshots": int(identity["lpi_snapshots"]),
        "nmlsInstitution": int(identity["nmls_institution"]),
        "publicRender": PUBLIC_NATIONAL_RENDER,
        "publicIndex": PUBLIC_NATIONAL_INDEX,
        "floridaPublic": PUBLIC_FLORIDA,
        "floridaInternal": int(fl_confirmed),
        "applications": int(hmda["applications"]),
        "originations": int(hmda["originations"]),
        "denials": int(hmda["denials"]),
        "complaints": int(cfpb["complaints"]),
        "complaintsAttached": int(cfpb["complaints_attached"]),
        "complaintsUnattached": int(cfpb["complaints_unattached"]),
        "cfpbLabels": int(cfpb["labels"]),
        "cfpbConfirmedBridges": int(bridges),
        "depository": {
            "FDIC": int(depository["FDIC"]),
            "NCUA": int(depository["NCUA"]),
            "NONBANK": int(depository["NONBANK"]),
            "UNKNOWN": int(depository["UNKNOWN"]),
        },
        "geography": geography,
        "graph": {
            "branch_entities": int(identity["branch"]),
            "person_mlo_entities": int(identity["person_mlo"]),
            "nmls_branch": int(identity["nmls_branch"]),
            "nmls_person": int(identity["nmls_person"]),
            "person_public_candidate": int(identity["person_public_candidate"]),
        },
        "grains": {
            "institutions": "canonical institution entity (lender_national_entities.entity_kind=institution)",
            "lpiSnapshots": "lender_profile_intelligence row; not the identity universe",
            "nmlsInstitution": "NMLS_INSTITUTION identifier slot; not an institution count",
            "publicRender": "file-backed lend-nat-014 national render cohort",
            "publicIndex": "file-backed lend-nat-014 national index cohort",
            "floridaPublic": "file-backed Florida Phase 1+2 public company cohort",
            "floridaInternal": "distinct Approved FL MBR/MLD NMLS with confirmed institution_id",
            "applications": "HMDA 2025 county-grain LEI observation, summed nationally; exclude state grain",
            "originations": "same county-grain 2025 rows as applications",
            "denials": "same county-grain 2025 rows as applications",
            "complaints": "lender_cfpb_complaints mortgage observation row",
            "depository": "exclusive profile.roles.depository on LPI snapshots",
            "branch_entities": "canonical branch entity; not a branch license row",
            "person_mlo_entities": "canonical person_mlo entity; not an LO license row",
        },
        "source_as_of": {
            "identity": retrieved,
            "hmda": "2025",
            "cfpb_observed": str(n(cur, "select max(source_observed_at)::date from lender_cfpb_complaints")),
            "publication": "file-backed INTEL-004 / FL-LEND-006+008",
        },
    }
    payload["fingerprint"] = fingerprint_payload(payload)
    return payload


def florida_payload(cur, generated_at: str, national: dict) -> dict:
    licensing = one(
        cur,
        """
        select
          count(*) as approved_credentials,
          count(*) filter (where license_class='MBR') as mbr,
          count(*) filter (where license_class='MLD') as mld,
          count(distinct nmls_id) as unique_nmls,
          count(distinct nmls_id) filter (where institution_id is not null) as confirmed_nmls,
          count(distinct nmls_id) filter (where institution_id is null) as held_nmls,
          count(*) filter (where institution_id is null) as held_rows,
          count(*) filter (where phone is not null and phone<>'') as phone_credentials,
          count(*) filter (where prim_address1 is not null and prim_address1<>'') as prim_addr,
          count(*) filter (where mail_address1 is not null and mail_address1<>'') as mail_addr,
          count(*) filter (where upper(prim_state)='FL') as prim_state_fl,
          count(*) filter (where license_class='MLD' and servicer_flag='Yes') as mld_servicer_yes_rows,
          count(distinct nmls_id) filter (where license_class='MLD' and servicer_flag='Yes') as mld_servicer_yes_nmls,
          min(source_dataset) as source_dataset,
          max(source_observed_on)::text as source_as_of
        from lender_state_licenses
        where jurisdiction='FL' and license_class in ('MBR','MLD') and ofr_status='Approved'
        """,
    )
    dual = n(
        cur,
        """
        select count(*) from (
          select nmls_id
          from lender_state_licenses
          where jurisdiction='FL' and license_class in ('MBR','MLD') and ofr_status='Approved'
          group by nmls_id
          having count(*) filter (where license_class='MBR')>=1
             and count(*) filter (where license_class='MLD')>=1
        ) s
        """,
    )
    multiplicity = {
        str(r["creds"]): int(r["nmls"])
        for r in rows(
            cur,
            """
            select c as creds, count(*) as nmls
            from (
              select nmls_id, count(*) as c
              from lender_state_licenses
              where jurisdiction='FL' and license_class in ('MBR','MLD') and ofr_status='Approved'
              group by nmls_id
            ) s
            group by c order by c
            """,
        )
    }
    graph = one(
        cur,
        """
        select
          (select count(*) from lender_national_entities e
             join lender_identifiers i on i.entity_id=e.id and i.identifier_type='NMLS_BRANCH'
           where e.entity_kind='branch' and i.jurisdiction='FL') as fl_branch_entities,
          (select count(*) from lender_state_licenses
           where jurisdiction='FL' and license_class in ('MLDB','MBRB','MLSB')) as fl_branch_license_rows,
          (select count(distinct nmls_id) from lender_state_licenses
           where jurisdiction='FL' and license_class in ('MLDB','MBRB','MLSB')) as fl_branch_license_nmls,
          (select count(*) from lender_national_entities where entity_kind='person_mlo') as person_mlo_entities,
          (select count(*) from lender_state_licenses
           where jurisdiction='FL' and license_class='LO') as fl_lo_license_rows,
          (select count(distinct nmls_id) from lender_state_licenses
           where jurisdiction='FL' and license_class='LO') as fl_lo_nmls,
          (select count(*) from lender_state_licenses where jurisdiction='FL') as fl_license_rows
        """,
    )
    unresolved_source = n(
        cur,
        """
        select count(*) from lender_source_identity_resolutions
        where identifier_type='NMLS_INSTITUTION'
          and source_dataset='FL_OFR_NMLS_PRR_141420'
          and resolution_class='UNRESOLVED_SOURCE_COMPANY_NMLS'
        """,
    )
    ofr = one(
        cur,
        """
        select
          count(*) as written_observations,
          count(*) filter (where respondent_kind='institution') as company,
          count(*) filter (where respondent_kind='person_mlo') as person_mlo,
          count(*) filter (where respondent_kind='branch') as branch,
          count(*) filter (where respondent_kind='mixed') as mixed,
          count(*) filter (where respondent_kind='institution' and attribution_confidence='confirmed') as company_confirmed,
          count(*) filter (where respondent_kind='institution' and attribution_confidence='review_required') as company_review,
          count(*) filter (where respondent_kind='institution' and attribution_confidence='unresolved') as company_unresolved,
          count(distinct institution_id) filter (
            where institution_id is not null and attribution_confidence='confirmed'
          ) as confirmed_institutions,
          count(*) filter (where respondent_kind='institution' and amount is not null) as company_fines,
          coalesce(sum(amount) filter (where respondent_kind='institution' and amount is not null),0) as company_fine_dollars,
          count(*) filter (where respondent_kind='institution' and license_action='REVOCATION') as company_revocation,
          count(*) filter (where respondent_kind='institution' and license_action='SUSPENSION') as company_suspension,
          count(*) filter (where respondent_kind='institution' and (raw_metadata->>'consent_mentioned')='true') as company_consent_mentioned,
          count(*) filter (where respondent_kind='institution' and document_url is not null) as company_docs,
          min(event_date) filter (where respondent_kind='institution') as year_min,
          max(event_date) filter (where respondent_kind='institution') as year_max
        from lender_state_regulatory_events
        """,
    )
    ofr_types = {
        r["event_type_normalized"]: int(r["n"])
        for r in rows(
            cur,
            "select event_type_normalized, count(*) n from lender_state_regulatory_events where respondent_kind='institution' group by 1",
        )
    }
    ofr_findings = {
        r["finding_type"]: int(r["n"])
        for r in rows(
            cur,
            "select coalesce(finding_type,'UNSPECIFIED') finding_type, count(*) n from lender_state_regulatory_events where respondent_kind='institution' group by 1",
        )
    }
    held_event_nmls = rows(
        cur,
        """
        select nmls_id, count(*) n
        from lender_state_regulatory_events
        where nmls_id in (
          select nmls_id from lender_state_licenses
          where jurisdiction='FL' and license_class in ('MBR','MLD') and ofr_status='Approved'
            and institution_id is null
        )
        group by 1 order by 1
        """,
    )
    held_with_institution = n(
        cur,
        """
        select count(*) from lender_state_regulatory_events
        where nmls_id in (
          select nmls_id from lender_state_licenses
          where jurisdiction='FL' and license_class in ('MBR','MLD') and ofr_status='Approved'
            and institution_id is null
        ) and institution_id is not null
        """,
    )
    hmda = one(
        cur,
        """
        select count(*) as rows,
          count(distinct lei) as leis,
          count(distinct institution_id) filter (where institution_id is not null) as attached_inst,
          coalesce(sum(applications),0) as applications,
          coalesce(sum(originations),0) as originations,
          coalesce(sum(denials),0) as denials,
          max(source_observed_date)::text as source_observed,
          min(source_dataset) as source_dataset
        from lender_hmda_observations
        where geo_grain='state' and state_code='FL'
        """,
    )
    hmda_years = rows(
        cur,
        """
        select data_year, count(*) as rows,
          coalesce(sum(applications),0) as applications,
          coalesce(sum(originations),0) as originations,
          coalesce(sum(denials),0) as denials
        from lender_hmda_observations
        where geo_grain='state' and state_code='FL'
        group by 1 order by 1
        """,
    )
    hmda_vintages = rows(
        cur,
        "select source_vintage, count(*) n from lender_hmda_observations where geo_grain='state' and state_code='FL' group by 1",
    )
    hmda_conf = rows(
        cur,
        "select attribution_confidence, count(*) n from lender_hmda_observations where geo_grain='state' and state_code='FL' group by 1",
    )
    county_rows = n(
        cur,
        "select count(*) from lender_hmda_observations where geo_grain='county' and state_code='FL'",
    )
    cfpb = one(
        cur,
        """
        select count(*) as rows,
          count(*) filter (where attribution_confidence='confirmed') as confirmed,
          count(*) filter (where attribution_confidence='high_confidence') as high_confidence,
          count(*) filter (where attribution_confidence='review_required') as review_required,
          count(*) filter (where attribution_confidence='unresolved') as unresolved,
          count(distinct institution_id) filter (where institution_id is not null) as attached_inst,
          min(date_received)::text as date_min,
          max(date_received)::text as date_max,
          max(source_observed_at)::text as observed
        from lender_cfpb_complaints
        where consumer_state='FL'
        """,
    )
    cfpb_products = rows(
        cur,
        "select product, count(*) n from lender_cfpb_complaints where consumer_state='FL' group by 1 order by n desc",
    )
    cfpb_issues = rows(
        cur,
        "select issue, count(*) n from lender_cfpb_complaints where consumer_state='FL' group by 1 order by n desc limit 12",
    )
    cfpb_years = rows(
        cur,
        "select extract(year from date_received)::int y, count(*) n from lender_cfpb_complaints where consumer_state='FL' group by 1 order by 1",
    )
    fed = one(
        cur,
        """
        select
          count(distinct e.id) as events,
          count(distinct r.institution_id) as institutions
        from lender_federal_enforcement_events e
        join lender_federal_enforcement_event_respondents er on er.event_id=e.id
        join lender_federal_enforcement_respondents r on r.id=er.respondent_id
        where r.institution_id in (
          select distinct institution_id from lender_state_licenses
          where jurisdiction='FL' and license_class in ('MBR','MLD') and ofr_status='Approved'
            and institution_id is not null
        )
        """,
    )
    fine_dollars = ofr["company_fine_dollars"]
    if isinstance(fine_dollars, str):
        fine_dollars = float(fine_dollars)
    apps = int(hmda["applications"] or 0)
    dens = int(hmda["denials"] or 0)
    payload = {
        "task": "FL-LEND-002E",
        "contract": FLORIDA_CONTRACT,
        "generated_at": generated_at,
        "snapshot_date": generated_at[:10],
        "target": REF,
        "baseline": {
            "institutions": int(national["institutions"]),
            "nmls": int(national["nmlsInstitution"]),
            "person_mlo": int(national["graph"]["person_mlo_entities"]),
            "branch": int(national["graph"]["branch_entities"]),
            "lei": int(n(cur, "select count(*) from lender_identifiers where identifier_type='LEI'")),
            "fdic": int(n(cur, "select count(*) from lender_identifiers where identifier_type='FDIC_CERT'")),
            "ncua": int(n(cur, "select count(*) from lender_identifiers where identifier_type='NCUA_CHARTER'")),
            "rssd": int(n(cur, "select count(*) from lender_identifiers where identifier_type='RSSD'")),
            "hmda": int(n(cur, "select count(*) from lender_hmda_observations")),
            "cfpb": int(national["complaints"]),
            "enf": int(n(cur, "select count(*) from lender_federal_enforcement_events")),
            "profiles": int(national["lpiSnapshots"]),
            "licenses": int(n(cur, "select count(*) from lender_state_licenses")),
            "sre": int(ofr["written_observations"]),
        },
        "licensing": {
            "approved_credentials": int(licensing["approved_credentials"]),
            "mbr": int(licensing["mbr"]),
            "mld": int(licensing["mld"]),
            "unique_nmls": int(licensing["unique_nmls"]),
            "dual_nmls": int(dual),
            "confirmed_nmls": int(licensing["confirmed_nmls"]),
            "held_nmls": int(licensing["held_nmls"]),
            "held_rows": int(licensing["held_rows"]),
            "phone_credentials": int(licensing["phone_credentials"]),
            "prim_addr": int(licensing["prim_addr"]),
            "mail_addr": int(licensing["mail_addr"]),
            "prim_state_fl": int(licensing["prim_state_fl"]),
            "mld_servicer_yes_rows": int(licensing["mld_servicer_yes_rows"]),
            "mld_servicer_yes_nmls": int(licensing["mld_servicer_yes_nmls"]),
            "source_dataset": licensing["source_dataset"],
            "source_as_of": licensing["source_as_of"],
            "source_role": "Current Approved Chapter 494 company credential roster (MBR/MLD), jurisdiction=FL, ofr_status=Approved.",
            "credential_multiplicity": multiplicity,
        },
        "graph": {
            "fl_branch_entities": int(graph["fl_branch_entities"]),
            "fl_branch_license_rows": int(graph["fl_branch_license_rows"]),
            "fl_branch_license_nmls": int(graph["fl_branch_license_nmls"]),
            "person_mlo_entities": int(graph["person_mlo_entities"]),
            "fl_lo_license_rows": int(graph["fl_lo_license_rows"]),
            "fl_lo_nmls": int(graph["fl_lo_nmls"]),
            "fl_license_rows": int(graph["fl_license_rows"]),
            "unresolved_source_company_nmls": int(unresolved_source),
        },
        "ofr": {
            "written_observations": int(ofr["written_observations"]),
            "company": int(ofr["company"]),
            "person_mlo": int(ofr["person_mlo"]),
            "branch": int(ofr["branch"]),
            "mixed": int(ofr["mixed"]),
            "company_confirmed": int(ofr["company_confirmed"]),
            "company_review": int(ofr["company_review"]),
            "company_unresolved": int(ofr["company_unresolved"]),
            "confirmed_institutions": int(ofr["confirmed_institutions"]),
            "company_types": ofr_types,
            "company_findings": ofr_findings,
            "company_fines": int(ofr["company_fines"]),
            "company_fine_dollars": int(fine_dollars) if float(fine_dollars) == int(float(fine_dollars)) else float(fine_dollars),
            "company_revocation": int(ofr["company_revocation"]),
            "company_suspension": int(ofr["company_suspension"]),
            "company_consent_mentioned": int(ofr["company_consent_mentioned"]),
            "company_docs": int(ofr["company_docs"]),
            "held_event_nmls": held_event_nmls,
            "held_with_institution": int(held_with_institution),
            "year_min": ofr["year_min"],
            "year_max": ofr["year_max"],
            "coverage_start": "2015-07",
            "coverage_end": str(ofr["year_max"])[:10] if ofr["year_max"] else None,
            "source_dataset": "FL_OFR_FLAIO",
            "source_url": "https://www.doah.state.fl.us/FLAIO/OFR/",
            "text_extractable_company": FLAIO_TEXT_EXTRACTABLE_COMPANY,
            "non_text_company": FLAIO_NON_TEXT_COMPANY,
        },
        "hmda": {
            "criterion": "geo_grain=state AND state_code=FL",
            "rows": int(hmda["rows"]),
            "leis": int(hmda["leis"]),
            "attached_inst": int(hmda["attached_inst"]),
            "applications": int(hmda["applications"]),
            "originations": int(hmda["originations"]),
            "denials": int(hmda["denials"]),
            "years": hmda_years,
            "vintages": hmda_vintages,
            "confidence": hmda_conf,
            "source_observed": hmda["source_observed"],
            "source_dataset": hmda["source_dataset"],
            "county_rows": int(county_rows),
            "note": "State-grain HMDA LEI summaries for Florida. Not a ranking. Denial ratio is descriptive (denials/applications) and is not a fairness score.",
            "denial_ratio": (int(round(dens / apps, 4)) if dens == 0 else round(dens / apps, 4)) if apps else None,
        },
        "cfpb": {
            "criterion": "consumer_state=FL AND product ILIKE mortgage (already mortgage-scoped table)",
            "rows": int(cfpb["rows"]),
            "confirmed": int(cfpb["confirmed"]),
            "high_confidence": int(cfpb["high_confidence"]),
            "review_required": int(cfpb["review_required"]),
            "unresolved": int(cfpb["unresolved"]),
            "attached_inst": int(cfpb["attached_inst"]),
            "products": cfpb_products,
            "issues": cfpb_issues,
            "years": cfpb_years,
            "date_min": cfpb["date_min"],
            "date_max": cfpb["date_max"],
            "observed": cfpb["observed"],
            "geography_edge": "COMPLAINT_REPORTED_FROM",
            "note": "Consumer-submitted CFPB mortgage complaints reported from Florida. Not regulator findings. Not a ranking.",
        },
        "federal_overlay": {
            "method": "Confirmed federal enforcement events whose respondent institution_id also has a confirmed Florida Approved MBR/MLD credential. Not HQ/address geocoding.",
            "events": int(fed["events"]),
            "institutions": int(fed["institutions"]),
            "label": "FEDERAL",
            "included": int(fed["events"]) > 0,
        },
        "publication": {
            "index_cohort": PUBLIC_NATIONAL_INDEX,
            "searchable": PUBLIC_NATIONAL_RENDER,
            "indexable": PUBLIC_NATIONAL_INDEX,
            "florida_profiles_published": 0,
            "florida_public_cohort": PUBLIC_FLORIDA,
        },
        "grains": {
            "approved_credentials": "current Florida Approved MBR/MLD license rows (not unique companies, not all FL licenses)",
            "unique_nmls": "distinct NMLS among those Approved MBR/MLD rows",
            "confirmed_nmls": "Approved unique NMLS with institution_id attached",
            "held_nmls": "Approved unique NMLS with institution_id null; not the 002D source-identity hold set",
            "unresolved_source_company_nmls": "FL-LEND-002D OFR source identities remaining UNRESOLVED; not current Approved held_nmls",
            "fl_branch_entities": "branch entity with NMLS_BRANCH jurisdiction=FL; not a branch license row",
            "fl_branch_license_rows": "current FL MLDB/MBRB/MLSB credential rows",
            "fl_lo_license_rows": "current FL LO credential rows; not person_mlo entities",
            "fl_lo_nmls": "distinct person NMLS with a current FL LO license",
            "fl_license_rows": "all current Florida OFR license rows (company+branch+LO); not unique companies",
            "person_mlo_entities": "canonical person_mlo entities in the graph; not LO observations",
            "hmda_applications": "HMDA state-grain LEI rows with state_code=FL; not county grain",
            "cfpb_rows": "CFPB mortgage observations with consumer_state=FL (COMPLAINT_REPORTED_FROM)",
            "ofr_company": "FLAIO respondent_kind=institution; not total SRE",
        },
        "sources": [
            {
                "id": "ofr_ch494",
                "name": "Florida OFR Chapter 494 current company licenses",
                "role": "Current Approved MBR/MLD credential roster",
                "coverage": "Approved company credentials, jurisdiction=FL",
                "as_of": licensing["source_as_of"],
                "retrieved": generated_at[:10],
                "limitations": "Current Approved snapshot, not a historical license-status time series. PRIM COUNTY is not service territory. Branch and LO credentials are a different grain.",
            },
            {
                "id": "flaio",
                "name": "DOAH FLAIO OFR indexed final agency actions",
                "role": "Florida Regulatory & Enforcement History (final agency action)",
                "coverage": "July 2015 through connected FLAIO company observations",
                "as_of": str(ofr["year_max"])[:10] if ofr["year_max"] else None,
                "retrieved": generated_at[:10],
                "url": "https://www.doah.state.fl.us/FLAIO/OFR/",
                "limitations": "Pre-2015 REAL search not bulk-acquired. Unresolved company orders are not attached to current Approved identities. Fine dollars partial. 9 PDFs not text-extractable (FL-LEND-005 extractability pass). No OCR. Complaint exhibits are not standalone findings.",
            },
            {
                "id": "hmda",
                "name": "HMDA / FFIEC production evidence",
                "role": "Florida-state lending activity aggregates",
                "coverage": "State-grain LEI observations with state_code=FL",
                "as_of": hmda["source_observed"],
                "vintage": hmda_vintages,
                "limitations": "HMDA reporters only. Many Chapter 494 brokers are not HMDA reporters. Not lender quality. County grain is not summed into this state-grain total.",
            },
            {
                "id": "cfpb",
                "name": "CFPB Consumer Complaint Database",
                "role": "Florida-reported mortgage consumer complaint observations",
                "coverage": "consumer_state=FL in the mortgage-scoped production table",
                "as_of": cfpb["date_max"],
                "retrieved": cfpb["observed"],
                "limitations": "Consumer-submitted records, not regulator findings. Geography is COMPLAINT_REPORTED_FROM, never LICENSED_IN. Unattributed rows are included.",
            },
            {
                "id": "identity-graph",
                "name": "Lender identity graph after FL-LEND-002D",
                "role": "Branch, person_mlo, and license grains",
                "coverage": "Florida-filtered branch entities, LO credentials, and current OFR license rows",
                "as_of": generated_at[:10],
                "limitations": "Branch entity is not a branch license row. person_mlo is not an LO observation. 3,907 unresolved OFR source identities are not the current Approved held_nmls=22 set. person_public_candidate remains 0.",
            },
        ],
    }
    payload["fingerprint"] = fingerprint_payload(payload)
    return payload


def publish(cur, contract: str, geography: str, payload: dict) -> None:
    cur.execute(
        """
        update public.lender_intelligence_snapshots
        set publication_status='superseded'
        where contract_name=%s and geography=%s and publication_status='published'
        """,
        (contract, geography),
    )
    cur.execute(
        """
        insert into public.lender_intelligence_snapshots (
          contract_name, contract_version, geography, generated_at, source_as_of,
          payload, fingerprint, publication_status
        ) values (%s, %s, %s, %s, %s, %s, %s, 'published')
        """,
        (
            contract,
            payload.get("snapshotVersion") or payload.get("contract"),
            geography,
            payload["generated_at"],
            Json(payload.get("source_as_of") or payload.get("grains") or {}),
            Json(payload),
            payload["fingerprint"],
        ),
    )


def write_artifact(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")


def assert_grains(national: dict, florida: dict) -> None:
    L = florida["licensing"]
    G = florida["graph"]
    B = florida["baseline"]
    assert national["graph"]["person_public_candidate"] == 0
    assert L["approved_credentials"] != L["unique_nmls"]
    assert L["unique_nmls"] != G["fl_license_rows"]
    assert L["held_nmls"] != G["unresolved_source_company_nmls"]
    assert G["fl_branch_entities"] != G["fl_branch_license_rows"]
    assert G["person_mlo_entities"] != G["fl_lo_license_rows"]
    assert G["fl_lo_nmls"] != G["fl_lo_license_rows"]
    assert florida["hmda"]["applications"] != national["applications"]
    assert L["approved_credentials"] != 164936
    assert L["unique_nmls"] != 164936
    assert B["licenses"] != L["approved_credentials"]
    assert fingerprint_payload(national) == national["fingerprint"]
    assert fingerprint_payload(florida) == florida["fingerprint"]
    national2 = dict(national)
    national2["generated_at"] = "2099-01-01T00:00:00+00:00"
    assert fingerprint_payload(national2) == national["fingerprint"]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    generated_at = datetime.now(timezone.utc).isoformat()
    conn = psycopg2.connect(dsn())
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("set statement_timeout = '10min'")
    apply_schema(cur)
    national = national_payload(cur, generated_at)
    florida = florida_payload(cur, generated_at, national)
    assert_grains(national, florida)
    national_out = ROOT / "lib" / "home-intel" / "accepted-snapshot.json"
    florida_out = ROOT / "lib" / "florida-intelligence" / "accepted-snapshot.json"
    write_artifact(national_out, national)
    write_artifact(florida_out, florida)
    if args.dry_run:
        conn.rollback()
        print("DRY_RUN")
    else:
        publish(cur, NATIONAL_CONTRACT, "NATIONAL", national)
        publish(cur, FLORIDA_CONTRACT, "FL", florida)
        conn.commit()
        print("PUBLISHED")
    print("NATIONAL_FP", national["fingerprint"])
    print("FLORIDA_FP", florida["fingerprint"])
    print(
        "NATIONAL",
        json.dumps(
            {
                "institutions": national["institutions"],
                "lpi": national["lpiSnapshots"],
                "nmls": national["nmlsInstitution"],
                "apps": national["applications"],
                "orig": national["originations"],
                "den": national["denials"],
                "cfpb": national["complaints"],
                "floridaInternal": national["floridaInternal"],
            }
        ),
    )
    print(
        "FLORIDA",
        json.dumps(
            {
                "creds": florida["licensing"]["approved_credentials"],
                "unique_nmls": florida["licensing"]["unique_nmls"],
                "confirmed": florida["licensing"]["confirmed_nmls"],
                "held": florida["licensing"]["held_nmls"],
                "mbr": florida["licensing"]["mbr"],
                "mld": florida["licensing"]["mld"],
                "dual": florida["licensing"]["dual_nmls"],
                "branch_entities": florida["graph"]["fl_branch_entities"],
                "lo_nmls": florida["graph"]["fl_lo_nmls"],
                "fl_licenses": florida["graph"]["fl_license_rows"],
            }
        ),
    )
    cur.close()
    conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
