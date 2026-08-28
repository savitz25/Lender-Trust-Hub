#!/usr/bin/env python3
"""FL-LEND-005 — read-only Florida Intelligence snapshot from hidcrbex. No writes."""
from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote, unquote, urlparse

import psycopg2
from psycopg2.extras import RealDictCursor

ROOT = Path(r"C:\Users\makei\lender-trust-hub-ask-search-009")
REF = "hidcrbexurginnuqgipx"
OUT = ROOT / "docs" / "fl-lend-005-snapshot.json"


def dsn() -> str:
    raw = os.environ.get("TARGET_DATABASE_URL")
    p = ROOT / ".env.local"
    if not raw and p.exists():
        for line in p.read_text(encoding="utf-8").splitlines():
            if line.startswith("TARGET_DATABASE_URL="):
                raw = line.split("=", 1)[1].strip().strip('"').strip("'")
    u = urlparse(raw)
    if REF in (u.username or "") and "pooler" in (u.hostname or ""):
        return raw if "sslmode" in (u.query or "") else raw + ("&sslmode=require" if u.query else "?sslmode=require")
    pw = unquote(u.password or "")
    return (
        f"postgresql://postgres.{REF}:{quote(pw, safe='')}"
        f"@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require"
    )


def move_dsn() -> str:
    p = Path(r"C:\Users\makei\move-trust-hub\.env.local")
    for line in p.read_text(encoding="utf-8").splitlines():
        if "DATABASE_URL=" in line and "postgresql://" in line and "arepfyl" in line:
            return line.split("DATABASE_URL=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("move dsn missing")


def n(cur, sql, params=None):
    cur.execute(sql, params)
    return list(cur.fetchone().values())[0]


def rows(cur, sql, params=None):
    cur.execute(sql, params)
    return [dict(r) for r in cur.fetchall()]


def main() -> int:
    generated = datetime.now(timezone.utc)
    conn = psycopg2.connect(dsn())
    conn.set_session(readonly=True, autocommit=True)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("set statement_timeout = '10min'")
    u = urlparse(dsn())
    if REF not in (u.username or "") and REF not in (u.hostname or ""):
        print("STOP not hidcrbex")
        return 2

    baseline = {
        "institutions": n(cur, "select count(*) from lender_national_entities where entity_kind='institution'"),
        "nmls": n(cur, "select count(*) from lender_identifiers where identifier_type='NMLS_INSTITUTION'"),
        "person_mlo": n(cur, "select count(*) from lender_national_entities where entity_kind='person_mlo'"),
        "branch": n(cur, "select count(*) from lender_national_entities where entity_kind='branch'"),
        "lei": n(cur, "select count(*) from lender_identifiers where identifier_type='LEI'"),
        "fdic": n(cur, "select count(*) from lender_identifiers where identifier_type='FDIC_CERT'"),
        "ncua": n(cur, "select count(*) from lender_identifiers where identifier_type='NCUA_CHARTER'"),
        "rssd": n(cur, "select count(*) from lender_identifiers where identifier_type='RSSD'"),
        "hmda": n(cur, "select count(*) from lender_hmda_observations"),
        "cfpb": n(cur, "select count(*) from lender_cfpb_complaints"),
        "enf": n(cur, "select count(*) from lender_federal_enforcement_events"),
        "profiles": n(cur, "select count(*) from lender_profile_intelligence"),
        "licenses": n(cur, "select count(*) from lender_state_licenses"),
        "sre": n(cur, "select count(*) from lender_state_regulatory_events"),
    }
    print("BASELINE", json.dumps(baseline), flush=True)
    expected = {
        "institutions": 14623,
        "nmls": 6641,
        "person_mlo": 0,
        "branch": 0,
        "lei": 4715,
        "fdic": 5377,
        "ncua": 1096,
        "rssd": 8100,
        "hmda": 454480,
        "cfpb": 458146,
        "enf": 17655,
        "profiles": 8447,
        "licenses": 6435,
        "sre": 2515,
    }
    if baseline != expected:
        print("STOP baseline drift", {k: (baseline[k], expected[k]) for k in expected if baseline[k] != expected[k]})
        return 3

    licensing = {
        "approved_credentials": n(cur, "select count(*) from lender_state_licenses where ofr_status='Approved'"),
        "mbr": n(cur, "select count(*) from lender_state_licenses where license_class='MBR'"),
        "mld": n(cur, "select count(*) from lender_state_licenses where license_class='MLD'"),
        "unique_nmls": n(cur, "select count(distinct nmls_id) from lender_state_licenses"),
        "dual_nmls": n(
            cur,
            """
            select count(*) from (
              select nmls_id from lender_state_licenses
              group by nmls_id
              having count(*) filter (where license_class='MBR')>=1
                 and count(*) filter (where license_class='MLD')>=1
            ) s
            """,
        ),
        "confirmed_nmls": n(cur, "select count(distinct nmls_id) from lender_state_licenses where institution_id is not null"),
        "held_nmls": n(cur, "select count(distinct nmls_id) from lender_state_licenses where institution_id is null"),
        "held_rows": n(cur, "select count(*) from lender_state_licenses where institution_id is null"),
        "phone_credentials": n(cur, "select count(*) from lender_state_licenses where phone is not null and phone<>''"),
        "prim_addr": n(cur, "select count(*) from lender_state_licenses where prim_address1 is not null and prim_address1<>''"),
        "mail_addr": n(cur, "select count(*) from lender_state_licenses where mail_address1 is not null and mail_address1<>''"),
        "prim_state_fl": n(cur, "select count(*) from lender_state_licenses where upper(prim_state)='FL'"),
        "mld_servicer_yes_rows": n(cur, "select count(*) from lender_state_licenses where license_class='MLD' and servicer_flag='Yes'"),
        "mld_servicer_yes_nmls": n(
            cur,
            "select count(distinct nmls_id) from lender_state_licenses where license_class='MLD' and servicer_flag='Yes'",
        ),
        "source_dataset": "FL_OFR_CH494",
        "source_as_of": "2026-08-27",
        "source_role": "Current Approved Chapter 494 company credential roster (MBR/MLD).",
    }
    # multiplicity as 1/2/3
    dist_rows = rows(cur, "select c creds, count(*) nmls from (select nmls_id, count(*) c from lender_state_licenses group by nmls_id) s group by c order by c")
    licensing["credential_multiplicity"] = {str(r["creds"]): r["nmls"] for r in dist_rows}

    ofr = {
        "written_observations": n(cur, "select count(*) from lender_state_regulatory_events"),
        "company": n(cur, "select count(*) from lender_state_regulatory_events where respondent_kind='institution'"),
        "person_mlo": n(cur, "select count(*) from lender_state_regulatory_events where respondent_kind='person_mlo'"),
        "branch": n(cur, "select count(*) from lender_state_regulatory_events where respondent_kind='branch'"),
        "mixed": n(cur, "select count(*) from lender_state_regulatory_events where respondent_kind='mixed'"),
        "company_confirmed": n(
            cur,
            "select count(*) from lender_state_regulatory_events where respondent_kind='institution' and attribution_confidence='confirmed'",
        ),
        "company_review": n(
            cur,
            "select count(*) from lender_state_regulatory_events where respondent_kind='institution' and attribution_confidence='review_required'",
        ),
        "company_unresolved": n(
            cur,
            "select count(*) from lender_state_regulatory_events where respondent_kind='institution' and attribution_confidence='unresolved'",
        ),
        "confirmed_institutions": n(
            cur,
            "select count(distinct institution_id) from lender_state_regulatory_events where institution_id is not null and attribution_confidence='confirmed'",
        ),
        "company_types": {
            r["event_type_normalized"]: r["n"]
            for r in rows(
                cur,
                "select event_type_normalized, count(*) n from lender_state_regulatory_events where respondent_kind='institution' group by 1",
            )
        },
        "company_findings": {
            r["finding_type"]: r["n"]
            for r in rows(
                cur,
                "select coalesce(finding_type,'UNSPECIFIED') finding_type, count(*) n from lender_state_regulatory_events where respondent_kind='institution' group by 1",
            )
        },
        "company_fines": n(
            cur,
            "select count(*) from lender_state_regulatory_events where respondent_kind='institution' and amount is not null",
        ),
        "company_fine_dollars": float(
            n(
                cur,
                "select coalesce(sum(amount),0) from lender_state_regulatory_events where respondent_kind='institution' and amount is not null",
            )
        ),
        "company_revocation": n(
            cur,
            "select count(*) from lender_state_regulatory_events where respondent_kind='institution' and license_action='REVOCATION'",
        ),
        "company_suspension": n(
            cur,
            "select count(*) from lender_state_regulatory_events where respondent_kind='institution' and license_action='SUSPENSION'",
        ),
        "company_consent_mentioned": n(
            cur,
            "select count(*) from lender_state_regulatory_events where respondent_kind='institution' and (raw_metadata->>'consent_mentioned')='true'",
        ),
        "company_docs": n(
            cur,
            "select count(*) from lender_state_regulatory_events where respondent_kind='institution' and document_url is not null",
        ),
        "held_event_nmls": rows(
            cur,
            """
            select nmls_id, count(*) n
            from lender_state_regulatory_events
            where nmls_id in (
              select nmls_id from lender_state_licenses where institution_id is null
            )
            group by 1 order by 1
            """,
        ),
        "held_with_institution": n(
            cur,
            """
            select count(*) from lender_state_regulatory_events
            where nmls_id in (select nmls_id from lender_state_licenses where institution_id is null)
              and institution_id is not null
            """,
        ),
        "year_min": n(cur, "select min(event_date) from lender_state_regulatory_events where respondent_kind='institution'"),
        "year_max": n(cur, "select max(event_date) from lender_state_regulatory_events where respondent_kind='institution'"),
        "coverage_start": "2015-07",
        "coverage_end": "2026-08-27",
        "source_dataset": "FL_OFR_FLAIO",
        "source_url": "https://www.doah.state.fl.us/FLAIO/OFR/",
        "text_extractable_company": 943,
        "non_text_company": 9,
    }

    hmda = {
        "criterion": "geo_grain=state AND state_code=FL",
        "rows": n(cur, "select count(*) from lender_hmda_observations where geo_grain='state' and state_code='FL'"),
        "leis": n(cur, "select count(distinct lei) from lender_hmda_observations where geo_grain='state' and state_code='FL'"),
        "attached_inst": n(
            cur,
            "select count(distinct institution_id) from lender_hmda_observations where geo_grain='state' and state_code='FL' and institution_id is not null",
        ),
        "applications": n(cur, "select coalesce(sum(applications),0) from lender_hmda_observations where geo_grain='state' and state_code='FL'"),
        "originations": n(cur, "select coalesce(sum(originations),0) from lender_hmda_observations where geo_grain='state' and state_code='FL'"),
        "denials": n(cur, "select coalesce(sum(denials),0) from lender_hmda_observations where geo_grain='state' and state_code='FL'"),
        "apps_conventional": n(cur, "select coalesce(sum(apps_conventional),0) from lender_hmda_observations where geo_grain='state' and state_code='FL'"),
        "apps_fha": n(cur, "select coalesce(sum(apps_fha),0) from lender_hmda_observations where geo_grain='state' and state_code='FL'"),
        "apps_va": n(cur, "select coalesce(sum(apps_va),0) from lender_hmda_observations where geo_grain='state' and state_code='FL'"),
        "apps_usda_other": n(cur, "select coalesce(sum(apps_usda_other),0) from lender_hmda_observations where geo_grain='state' and state_code='FL'"),
        "purchase_applications": n(cur, "select coalesce(sum(purchase_applications),0) from lender_hmda_observations where geo_grain='state' and state_code='FL'"),
        "refinance_applications": n(cur, "select coalesce(sum(refinance_applications),0) from lender_hmda_observations where geo_grain='state' and state_code='FL'"),
        "years": rows(
            cur,
            "select data_year, count(*) rows, coalesce(sum(applications),0) applications, coalesce(sum(originations),0) originations, coalesce(sum(denials),0) denials from lender_hmda_observations where geo_grain='state' and state_code='FL' group by 1 order by 1",
        ),
        "vintages": rows(cur, "select source_vintage, count(*) n from lender_hmda_observations where geo_grain='state' and state_code='FL' group by 1"),
        "confidence": rows(
            cur,
            "select attribution_confidence, count(*) n from lender_hmda_observations where geo_grain='state' and state_code='FL' group by 1",
        ),
        "source_observed": n(cur, "select max(source_observed_date) from lender_hmda_observations where geo_grain='state' and state_code='FL'"),
        "source_dataset": n(cur, "select min(source_dataset) from lender_hmda_observations where geo_grain='state' and state_code='FL'"),
        "county_rows": n(cur, "select count(*) from lender_hmda_observations where geo_grain='county' and state_code='FL'"),
        "note": "State-grain HMDA LEI summaries for Florida. Not a ranking. Denial ratio is descriptive (denials/applications) and is not a fairness score.",
    }
    apps = hmda["applications"] or 0
    dens = hmda["denials"] or 0
    hmda["denial_ratio"] = round(dens / apps, 4) if apps else None

    cfpb = {
        "criterion": "consumer_state=FL AND product ILIKE mortgage (already mortgage-scoped table)",
        "rows": n(cur, "select count(*) from lender_cfpb_complaints where consumer_state='FL'"),
        "confirmed": n(
            cur,
            "select count(*) from lender_cfpb_complaints where consumer_state='FL' and attribution_confidence='confirmed'",
        ),
        "high_confidence": n(
            cur,
            "select count(*) from lender_cfpb_complaints where consumer_state='FL' and attribution_confidence='high_confidence'",
        ),
        "review_required": n(
            cur,
            "select count(*) from lender_cfpb_complaints where consumer_state='FL' and attribution_confidence='review_required'",
        ),
        "unresolved": n(
            cur,
            "select count(*) from lender_cfpb_complaints where consumer_state='FL' and attribution_confidence='unresolved'",
        ),
        "attached_inst": n(
            cur,
            "select count(distinct institution_id) from lender_cfpb_complaints where consumer_state='FL' and institution_id is not null",
        ),
        "products": rows(
            cur,
            "select product, count(*) n from lender_cfpb_complaints where consumer_state='FL' group by 1 order by n desc",
        ),
        "issues": rows(
            cur,
            "select issue, count(*) n from lender_cfpb_complaints where consumer_state='FL' group by 1 order by n desc limit 12",
        ),
        "years": rows(
            cur,
            "select extract(year from date_received)::int y, count(*) n from lender_cfpb_complaints where consumer_state='FL' group by 1 order by 1",
        ),
        "date_min": n(cur, "select min(date_received) from lender_cfpb_complaints where consumer_state='FL'"),
        "date_max": n(cur, "select max(date_received) from lender_cfpb_complaints where consumer_state='FL'"),
        "observed": n(cur, "select max(source_observed_at) from lender_cfpb_complaints where consumer_state='FL'"),
        "geography_edge": "COMPLAINT_REPORTED_FROM",
        "note": "Consumer-submitted CFPB mortgage complaints reported from Florida. Not regulator findings. Not a ranking.",
    }

    # Federal overlay: confirmed federal events on institutions that also have a confirmed FL company credential.
    fed = {
        "method": "Confirmed federal enforcement events whose respondent institution_id also has a confirmed Florida Chapter 494 company credential. Not HQ/address geocoding.",
        "events": n(
            cur,
            """
            select count(distinct e.id)
            from lender_federal_enforcement_events e
            join lender_federal_enforcement_event_respondents er on er.event_id=e.id
            join lender_federal_enforcement_respondents r on r.id=er.respondent_id
            where r.institution_id in (
              select distinct institution_id from lender_state_licenses
              where institution_id is not null
            )
            """,
        ),
        "institutions": n(
            cur,
            """
            select count(distinct r.institution_id)
            from lender_federal_enforcement_respondents r
            where r.institution_id in (
              select distinct institution_id from lender_state_licenses where institution_id is not null
            )
            and exists (
              select 1 from lender_federal_enforcement_event_respondents er where er.respondent_id=r.id
            )
            """,
        ),
        "label": "FEDERAL",
        "included": True,
    }

    idx = json.loads((ROOT / "docs" / "lend-nat-014-indexing-cohort.json").read_text(encoding="utf-8"))
    search = json.loads((ROOT / "docs" / "lend-nat-016-search-index.json").read_text(encoding="utf-8"))

    mconn = psycopg2.connect(move_dsn())
    mconn.set_session(readonly=True, autocommit=True)
    mc = mconn.cursor(cursor_factory=RealDictCursor)
    mc.execute("select to_regclass('public.lender_state_regulatory_events') r")
    move_sre = mc.fetchone()["r"]
    mc.execute("select to_regclass('public.lender_state_licenses') r")
    move_lic = mc.fetchone()["r"]
    mc.execute("select count(*) n from lender_national_entities where entity_kind='institution'")
    move_inst = mc.fetchone()["n"]
    mc.close()
    mconn.close()

    snap = {
        "task": "FL-LEND-005",
        "generated_at": generated.isoformat(),
        "snapshot_date": generated.date().isoformat(),
        "target": REF,
        "baseline": baseline,
        "licensing": licensing,
        "ofr": ofr,
        "hmda": hmda,
        "cfpb": cfpb,
        "federal_overlay": fed,
        "publication": {
            "index_cohort": idx["count"],
            "searchable": search["count"],
            "indexable": search.get("indexable_count", 180),
            "florida_profiles_published": 0,
        },
        "move": {"sre": move_sre, "licenses": move_lic, "institutions": move_inst},
        "sources": [
            {
                "id": "ofr_ch494",
                "name": "Florida OFR Chapter 494 monthly company files",
                "role": "Current Approved MBR/MLD credential roster",
                "coverage": "Approved company credentials as ingested FL-LEND-002 (2026-08-27 monthly files)",
                "as_of": "2026-08-27",
                "retrieved": "2026-08-27",
                "limitations": "Current Approved snapshot, not a historical license-status time series. PRIM COUNTY is not service territory.",
            },
            {
                "id": "flaio",
                "name": "DOAH FLAIO OFR indexed final agency actions",
                "role": "Florida Regulatory & Enforcement History (final agency action)",
                "coverage": "July 2015 through 2026-08-27",
                "as_of": "2026-08-27",
                "retrieved": "2026-08-27",
                "url": "https://www.doah.state.fl.us/FLAIO/OFR/",
                "limitations": "Pre-2015 REAL search not bulk-acquired. 607 company orders not attached to current Approved identities. Fine dollars partial. 9 PDFs not text-extractable. No OCR. Complaint exhibits are not standalone findings.",
            },
            {
                "id": "hmda",
                "name": "HMDA / FFIEC production evidence",
                "role": "Florida-state lending activity aggregates",
                "coverage": "State-grain LEI observations with state_code=FL",
                "as_of": str(hmda["source_observed"]),
                "vintage": hmda["vintages"],
                "limitations": "HMDA reporters only. Many Chapter 494 brokers are not HMDA reporters. Not lender quality. Denial ratio is descriptive, not a fairness score.",
            },
            {
                "id": "cfpb",
                "name": "CFPB Consumer Complaint Database",
                "role": "Florida-reported mortgage consumer complaint observations",
                "coverage": "consumer_state=FL in the mortgage-scoped production table",
                "as_of": str(cfpb["date_max"]),
                "retrieved": str(cfpb["observed"]),
                "limitations": "Consumer-submitted records, not regulator findings. Geography is COMPLAINT_REPORTED_FROM, never LICENSED_IN. Unattributed rows are included.",
            },
            {
                "id": "federal_enf",
                "name": "Existing federal enforcement graph",
                "role": "FEDERAL overlay on institutions that also hold confirmed Florida Chapter 494 credentials",
                "coverage": "Confirmed federal events on confirmed FL-licensed institutions",
                "limitations": "Not a Florida-HQ geocode. Separate sovereign from OFR. Not summed with OFR counts.",
            },
        ],
    }
    raw = json.dumps(snap, default=str, sort_keys=True).encode("utf-8")
    snap["fingerprint"] = hashlib.sha256(raw).hexdigest()
    OUT.write_text(json.dumps(snap, indent=2, default=str), encoding="utf-8")
    print("WROTE", OUT, "fp", snap["fingerprint"])
    print("LIC", {k: licensing[k] for k in ("approved_credentials", "unique_nmls", "confirmed_nmls", "held_nmls", "mbr", "mld", "dual_nmls", "mld_servicer_yes_rows", "mld_servicer_yes_nmls")})
    print("OFR", {k: ofr[k] for k in ("written_observations", "company", "company_confirmed", "company_review", "company_unresolved", "confirmed_institutions", "company_fines", "company_fine_dollars", "company_revocation", "company_suspension")})
    print("HMDA", {k: hmda[k] for k in ("rows", "leis", "applications", "originations", "denials", "denial_ratio")})
    print("CFPB", {k: cfpb[k] for k in ("rows", "confirmed", "unresolved", "attached_inst")})
    print("FED", fed)
    print("MOVE", snap["move"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
