#!/usr/bin/env python3
"""FL-LEND-009 — ingest Approved Florida LO + branch identities on hidcrbex only.

  python scripts/fl-lend-009-apply.py --dry-run
  python scripts/fl-lend-009-apply.py --apply
  python scripts/fl-lend-009-apply.py --apply   # idempotent
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import uuid
from collections import Counter, defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
import importlib.util

import psycopg2
from psycopg2.extras import Json, RealDictCursor, execute_values

ROOT = Path(r"C:\Users\makei\lender-trust-hub-ask-search-009")
SRC = ROOT / "data" / "florida" / "fl-lend-001-source" / "unzipped"
DDL = ROOT / "supabase" / "migrations" / "20260828140000_florida_mlo_branch_identity.sql"
OUT = ROOT / "docs" / "fl-lend-009-post.json"
QA = ROOT / "docs" / "fl-lend-009-qa-cohort.json"
SOURCE = "FL_OFR_CH494"
REF = "hidcrbexurginnuqgipx"
NS = uuid.UUID("9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b")
NMLS_RE = re.compile(r"^[0-9]{3,12}$")
OBSERVED = date(2026, 8, 27)


def gid(*parts: str) -> uuid.UUID:
    return uuid.uuid5(NS, ":".join(parts))


def nmls_norm(v: str | None) -> str | None:
    if not v:
        return None
    s = re.sub(r"[^0-9]", "", str(v).strip())
    return s if NMLS_RE.fullmatch(s) else None


def parse_date(v: str | None):
    s = (v or "").strip()
    if not s:
        return None
    for fmt in ("%m/%d/%Y", "%Y-%m-%d", "%m/%d/%y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def load_csv(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8-sig", errors="replace", newline="") as f:
        return list(csv.DictReader(f))


def load_g():
    spec = importlib.util.spec_from_file_location("g", ROOT / "scripts" / "fl-lend-006-generate.py")
    g = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(g)
    return g


def src_id(klass: str, lic: str) -> str:
    return f"FL|{klass}|{lic}"


def person_name(r: dict) -> str:
    last = (r.get("LAST NAME") or "").strip()
    first = (r.get("FIRST NAME") or "").strip()
    mid = (r.get("MIDDLE NAME") or "").strip()
    given = " ".join(x for x in (first, mid) if x)
    if last and given:
        return f"{last}, {given}"
    return last or given or "UNKNOWN LO"


def load_sources():
    mbr = load_csv(SRC / "mbr-mbrb" / "MortgageFirms_MBR-MBRB_Monthly.csv")
    mld = load_csv(SRC / "mld-mldb" / "MortgageFirms_MLD-MLDB_Monthly.csv")
    lo = (
        load_csv(SRC / "lo-ai" / "LoanOrignators_AI_Monthly.csv")
        + load_csv(SRC / "lo-jr" / "LoanOrignators_JR_Monthly.csv")
        + load_csv(SRC / "lo-sz" / "LoanOrignators_SZ_Monthly.csv")
    )
    firms = mbr + mld
    lo_appr = [r for r in lo if (r.get("LICENSE TYPE") or "").strip() == "LO" and (r.get("STATUS") or "").strip() == "Approved"]
    br_appr = [
        r
        for r in firms
        if (r.get("LICENSE TYPE") or "").strip() in {"MBRB", "MLDB"} and (r.get("STATUS") or "").strip() == "Approved"
    ]
    return lo_appr, br_appr


def build_workset(lo_appr, br_appr):
    persons = {}
    for r in lo_appr:
        nmls = nmls_norm(r.get("NMLS ID"))
        lic = (r.get("LICENSE NUMBER") or "").strip()
        if not nmls or not lic:
            continue
        rec = persons.setdefault(
            nmls,
            {"nmls": nmls, "name": person_name(r), "rows": []},
        )
        rec["rows"].append(r)
        if len(person_name(r)) > len(rec["name"]):
            rec["name"] = person_name(r)
    branches = {}
    for r in br_appr:
        nmls = nmls_norm(r.get("NMLS ID"))
        lic = (r.get("LICENSE NUMBER") or "").strip()
        klass = (r.get("LICENSE TYPE") or "").strip()
        if not nmls or not lic or klass not in {"MBRB", "MLDB"}:
            continue
        rec = branches.setdefault(
            nmls,
            {"nmls": nmls, "name": (r.get("FIRM NAME") or "").strip() or f"BRANCH {nmls}", "rows": []},
        )
        rec["rows"].append(r)
        firm = (r.get("FIRM NAME") or "").strip()
        if firm and len(firm) > len(rec["name"]):
            rec["name"] = firm
    return persons, branches


def chunked(seq, n=300):
    for i in range(0, len(seq), n):
        yield seq[i : i + n]


def exec_chunks(cur, sql, rows, page=300):
    if not rows:
        return 0
    n = 0
    for part in chunked(rows, page):
        execute_values(cur, sql, part, page_size=page)
        n += len(part)
    return n


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    apply = bool(args.apply)
    g = load_g()
    dsn = g.lender_dsn()
    from urllib.parse import urlparse

    u = urlparse(dsn)
    if REF not in (u.username or "") and REF not in (u.hostname or ""):
        print("STOP not hidcrbex")
        return 2
    lo_appr, br_appr = load_sources()
    persons, branches = build_workset(lo_appr, br_appr)
    dual = sum(1 for b in branches.values() if {"MBRB", "MLDB"} <= {(r.get("LICENSE TYPE") or "").strip() for r in b["rows"]})
    print(
        json.dumps(
            {
                "persons": len(persons),
                "person_creds": sum(len(p["rows"]) for p in persons.values()),
                "branches": len(branches),
                "branch_creds": sum(len(b["rows"]) for b in branches.values()),
                "dual_mbrb_mldb": dual,
                "apply": apply,
            },
            indent=2,
        )
    )
    if not apply:
        print("DRY_RUN_ONLY")
        return 0

    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(DDL.read_text(encoding="utf-8"))
    cur.execute("revoke all on table public.lender_entity_contacts from anon, authenticated, public")
    cur.execute("grant all on table public.lender_entity_contacts to service_role")

    ent, ident, names, lics, contacts = [], [], [], [], []
    for nmls, rec in persons.items():
        eid = gid("person", nmls)
        iid = gid("ident", "NMLS_PERSON", nmls)
        first = rec["rows"][0]
        ent.append(
            (
                str(eid),
                "person_mlo",
                f"nmls-person:{nmls}",
                rec["name"][:500],
                rec["name"][:500],
                "confirmed",
                "active",
                "internal_only",
                None,
                "FL-LEND-009 Approved LO",
            )
        )
        ident.append(
            (
                str(iid),
                str(eid),
                "NMLS_PERSON",
                nmls,
                "FL",
                SOURCE,
                src_id("LO", (first.get("LICENSE NUMBER") or "").strip()),
                OBSERVED,
                "Approved",
                "confirmed",
                Json({"entity_class": "person_mlo"}),
            )
        )
        names.append((str(gid("name", str(eid), rec["name"])), str(eid), "legal", rec["name"][:500], SOURCE, src_id("LO", nmls), OBSERVED))
        for r in rec["rows"]:
            lic = (r.get("LICENSE NUMBER") or "").strip()
            sid = src_id("LO", lic)
            lics.append(
                (
                    str(gid("lic", "LO", lic)),
                    "FL",
                    lic,
                    "LO",
                    "person_mlo",
                    nmls,
                    "Approved",
                    parse_date(r.get("STATUS EFFECTIVE DATE")),
                    parse_date(r.get("INTIAL APPROVAL")),
                    None,
                    None,
                    (r.get("LAST NAME") or "").strip() or None,
                    (r.get("FIRST NAME") or "").strip() or None,
                    (r.get("MIDDLE NAME") or "").strip() or None,
                    (r.get("PHONE") or "").strip() or None,
                    (r.get("PRIM ADDRESS 1") or "").strip() or None,
                    (r.get("PRIM ADDRESS 2") or "").strip() or None,
                    (r.get("PRIM CITY") or "").strip() or None,
                    (r.get("COUNTY") or "").strip() or None,
                    (r.get("PRIM STATE") or "").strip() or None,
                    (r.get("PRIM ZIP") or "").strip() or None,
                    (r.get("MAIL ADDRESS 1") or "").strip() or None,
                    (r.get("MAIL ADDRESS 2") or "").strip() or None,
                    (r.get("MAIL CITY") or "").strip() or None,
                    (r.get("MAIL STATE") or "").strip() or None,
                    (r.get("MAIL ZIP") or "").strip() or None,
                    None,
                    str(iid),
                    "confirmed",
                    "EXACT_NMLS_PERSON",
                    SOURCE,
                    sid,
                    OBSERVED,
                    Json({"privacy": "review_before_public"}),
                )
            )
            phone = (r.get("PHONE") or "").strip()
            if phone:
                contacts.append(
                    (
                        str(gid("ct", str(eid), "phone", sid)),
                        str(eid),
                        "phone",
                        "professional",
                        "review_before_public",
                        phone,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        SOURCE,
                        sid,
                        OBSERVED,
                        Json({}),
                    )
                )
            if (r.get("PRIM ADDRESS 1") or "").strip():
                contacts.append(
                    (
                        str(gid("ct", str(eid), "prim_address", sid)),
                        str(eid),
                        "prim_address",
                        "unknown",
                        "review_before_public",
                        None,
                        None,
                        (r.get("PRIM ADDRESS 1") or "").strip() or None,
                        (r.get("PRIM ADDRESS 2") or "").strip() or None,
                        (r.get("PRIM CITY") or "").strip() or None,
                        (r.get("COUNTY") or "").strip() or None,
                        (r.get("PRIM STATE") or "").strip() or None,
                        (r.get("PRIM ZIP") or "").strip() or None,
                        SOURCE,
                        sid,
                        OBSERVED,
                        Json({}),
                    )
                )
            if (r.get("MAIL ADDRESS 1") or "").strip():
                contacts.append(
                    (
                        str(gid("ct", str(eid), "mail_address", sid)),
                        str(eid),
                        "mail_address",
                        "unknown",
                        "review_before_public",
                        None,
                        None,
                        (r.get("MAIL ADDRESS 1") or "").strip() or None,
                        (r.get("MAIL ADDRESS 2") or "").strip() or None,
                        (r.get("MAIL CITY") or "").strip() or None,
                        None,
                        (r.get("MAIL STATE") or "").strip() or None,
                        (r.get("MAIL ZIP") or "").strip() or None,
                        SOURCE,
                        sid,
                        OBSERVED,
                        Json({}),
                    )
                )

    for nmls, rec in branches.items():
        eid = gid("branch", nmls)
        iid = gid("ident", "NMLS_BRANCH", nmls)
        first = rec["rows"][0]
        ent.append(
            (
                str(eid),
                "branch",
                f"nmls-branch:{nmls}",
                rec["name"][:500],
                rec["name"][:500],
                "confirmed",
                "active",
                "internal_only",
                None,
                "FL-LEND-009 Approved branch",
            )
        )
        ident.append(
            (
                str(iid),
                str(eid),
                "NMLS_BRANCH",
                nmls,
                "FL",
                SOURCE,
                src_id((first.get("LICENSE TYPE") or "MBRB").strip(), (first.get("LICENSE NUMBER") or "").strip()),
                OBSERVED,
                "Approved",
                "confirmed",
                Json({"entity_class": "branch"}),
            )
        )
        names.append((str(gid("name", str(eid), rec["name"])), str(eid), "legal", rec["name"][:500], SOURCE, src_id("BR", nmls), OBSERVED))
        for r in rec["rows"]:
            klass = (r.get("LICENSE TYPE") or "").strip()
            lic = (r.get("LICENSE NUMBER") or "").strip()
            sid = src_id(klass, lic)
            lics.append(
                (
                    str(gid("lic", klass, lic)),
                    "FL",
                    lic,
                    klass,
                    "branch",
                    nmls,
                    "Approved",
                    parse_date(r.get("STATUS EFFECTIVE DATE")),
                    parse_date(r.get("INTIAL APPROVAL")),
                    (r.get("SERVICER") or "").strip() or None if klass == "MLDB" else None,
                    (r.get("FIRM NAME") or "").strip() or None,
                    None,
                    None,
                    None,
                    (r.get("PHONE") or "").strip() or None,
                    (r.get("PRIM ADDRESS 1") or "").strip() or None,
                    (r.get("PRIM ADDRESS 2") or "").strip() or None,
                    (r.get("PRIM CITY") or "").strip() or None,
                    (r.get("COUNTY") or "").strip() or None,
                    (r.get("PRIM STATE") or "").strip() or None,
                    (r.get("PRIM ZIP") or "").strip() or None,
                    (r.get("MAIL ADDRESS 1") or "").strip() or None,
                    (r.get("MAIL ADDRESS 2") or "").strip() or None,
                    (r.get("MAIL CITY") or "").strip() or None,
                    (r.get("MAIL STATE") or "").strip() or None,
                    (r.get("MAIL ZIP") or "").strip() or None,
                    None,
                    str(iid),
                    "confirmed",
                    "EXACT_NMLS_BRANCH",
                    SOURCE,
                    sid,
                    OBSERVED,
                    Json({"parent_company_nmls": None, "parent_link": "UNRESOLVED_NO_OFFICIAL_PARENT_NMLS"}),
                )
            )
            phone = (r.get("PHONE") or "").strip()
            if phone:
                contacts.append(
                    (
                        str(gid("ct", str(eid), "phone", sid)),
                        str(eid),
                        "phone",
                        "business",
                        "public_candidate",
                        phone,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        SOURCE,
                        sid,
                        OBSERVED,
                        Json({"published": False}),
                    )
                )
            if (r.get("PRIM ADDRESS 1") or "").strip():
                contacts.append(
                    (
                        str(gid("ct", str(eid), "prim_address", sid)),
                        str(eid),
                        "prim_address",
                        "business",
                        "public_candidate",
                        None,
                        None,
                        (r.get("PRIM ADDRESS 1") or "").strip() or None,
                        (r.get("PRIM ADDRESS 2") or "").strip() or None,
                        (r.get("PRIM CITY") or "").strip() or None,
                        (r.get("COUNTY") or "").strip() or None,
                        (r.get("PRIM STATE") or "").strip() or None,
                        (r.get("PRIM ZIP") or "").strip() or None,
                        SOURCE,
                        sid,
                        OBSERVED,
                        Json({"published": False, "not_service_territory": True}),
                    )
                )

    print("ROWS", len(ent), len(ident), len(names), len(lics), len(contacts))
    conn.autocommit = False
    cur.execute("set statement_timeout = '20min'")
    try:
        exec_chunks(
            cur,
            """
            insert into lender_national_entities (
              id, entity_kind, stable_key, legal_name, display_name,
              identity_confidence, current_status, public_projection_status, review_status, notes
            ) values %s
            on conflict (stable_key) do nothing
            """,
            ent,
        )
        print("entities ok")
        exec_chunks(
            cur,
            """
            insert into lender_identifiers (
              id, entity_id, identifier_type, identifier_value, jurisdiction,
              source_dataset, source_record_id, observed_at, status, confidence, raw_metadata
            ) values %s
            on conflict (identifier_type, identifier_value) do nothing
            """,
            ident,
        )
        print("idents ok")
        exec_chunks(
            cur,
            """
            insert into lender_entity_names (id, entity_id, name_kind, name, source_dataset, source_record_id, observed_at)
            values %s
            on conflict (entity_id, name_kind, name, source_dataset) do nothing
            """,
            names,
        )
        print("names ok")
        exec_chunks(
            cur,
            """
            insert into lender_state_licenses (
              id, jurisdiction, license_number, license_class, entity_class, nmls_id, ofr_status,
              status_effective_on, initial_approval_on, servicer_flag, firm_name, person_last, person_first, person_middle,
              phone, prim_address1, prim_address2, prim_city, prim_county, prim_state, prim_zip,
              mail_address1, mail_address2, mail_city, mail_state, mail_zip,
              institution_id, identifier_id, attribution_confidence, match_method,
              source_dataset, source_record_id, source_observed_on, raw_metadata
            ) values %s
            on conflict (jurisdiction, license_number) do nothing
            """,
            lics,
        )
        print("licenses ok")
        exec_chunks(
            cur,
            """
            insert into lender_entity_contacts (
              id, entity_id, contact_kind, contact_role, classification, phone, email,
              address1, address2, city, county, state, zip,
              source_dataset, source_record_id, observed_at, raw_metadata
            ) values %s
            on conflict (entity_id, contact_kind, source_record_id) do nothing
            """,
            contacts,
        )
        print("contacts ok")
        conn.commit()
    except Exception:
        conn.rollback()
        raise

    conn.autocommit = True
    cur.execute("revoke all on table public.lender_entity_contacts from anon, authenticated, public")

    def n(sql):
        cur.execute(sql)
        return list(cur.fetchone().values())[0]

    post = {
        "person_mlo": n("select count(*) from lender_national_entities where entity_kind='person_mlo'"),
        "branch": n("select count(*) from lender_national_entities where entity_kind='branch'"),
        "institutions": n("select count(*) from lender_national_entities where entity_kind='institution'"),
        "nmls_person": n("select count(*) from lender_identifiers where identifier_type='NMLS_PERSON'"),
        "nmls_branch": n("select count(*) from lender_identifiers where identifier_type='NMLS_BRANCH'"),
        "nmls_institution": n("select count(*) from lender_identifiers where identifier_type='NMLS_INSTITUTION'"),
        "lo_licenses": n("select count(*) from lender_state_licenses where license_class='LO'"),
        "mbrb": n("select count(*) from lender_state_licenses where license_class='MBRB'"),
        "mldb": n("select count(*) from lender_state_licenses where license_class='MLDB'"),
        "mbr": n("select count(*) from lender_state_licenses where license_class='MBR'"),
        "mld": n("select count(*) from lender_state_licenses where license_class='MLD'"),
        "contacts": n("select count(*) from lender_entity_contacts"),
        "person_contacts": n(
            "select count(*) from lender_entity_contacts c join lender_national_entities e on e.id=c.entity_id where e.entity_kind='person_mlo'"
        ),
        "branch_contacts": n(
            "select count(*) from lender_entity_contacts c join lender_national_entities e on e.id=c.entity_id where e.entity_kind='branch'"
        ),
        "person_public_candidate": n(
            "select count(*) from lender_entity_contacts c join lender_national_entities e on e.id=c.entity_id where e.entity_kind='person_mlo' and c.classification='public_candidate'"
        ),
        "assoc": n("select count(*) from lender_entity_relationships where relationship_type='ASSOCIATED_WITH'"),
        "belongs": n("select count(*) from lender_entity_relationships where relationship_type='BELONGS_TO'"),
        "subsidiary": n("select count(*) from lender_entity_relationships where relationship_type='SUBSIDIARY_OF'"),
        "profiles": n("select count(*) from lender_state_company_profiles"),
        "sre": n("select count(*) from lender_state_regulatory_events"),
        "sre_company_confirmed": n(
            "select count(*) from lender_state_regulatory_events where respondent_kind='institution' and attribution_confidence='confirmed'"
        ),
        "sre_company_inst": n(
            "select count(distinct institution_id) from lender_state_regulatory_events where respondent_kind='institution' and attribution_confidence='confirmed'"
        ),
        "sre_person": n("select count(*) from lender_state_regulatory_events where respondent_kind='person_mlo'"),
        "sre_person_unresolved": n(
            "select count(*) from lender_state_regulatory_events where respondent_kind='person_mlo' and attribution_confidence='unresolved'"
        ),
        "sre_branch": n("select count(*) from lender_state_regulatory_events where respondent_kind='branch'"),
        "sre_branch_unresolved": n(
            "select count(*) from lender_state_regulatory_events where respondent_kind='branch' and attribution_confidence='unresolved'"
        ),
        "sre_mixed": n("select count(*) from lender_state_regulatory_events where respondent_kind='mixed'"),
        "lpi": n("select count(*) from lender_profile_intelligence"),
        "anon_contacts": n(
            "select count(*) from information_schema.role_table_grants where table_name='lender_entity_contacts' and grantee in ('anon','authenticated')"
        ),
        "dual_branches": n(
            """
            select count(*) from (
              select nmls_id from lender_state_licenses
              where license_class in ('MBRB','MLDB') and ofr_status='Approved'
              group by nmls_id having count(distinct license_class)=2
            ) s
            """
        ),
        "persons_multi_cred": n(
            """
            select count(*) from (
              select nmls_id from lender_state_licenses where license_class='LO' group by nmls_id having count(*)>1
            ) s
            """
        ),
    }
    OUT.write_text(json.dumps({"task": "FL-LEND-009", "post": post}, indent=2, default=str), encoding="utf-8")
    print(json.dumps(post, indent=2, default=str))
    ok = (
        post["person_mlo"] == len(persons)
        and post["branch"] == len(branches)
        and post["institutions"] == 14623
        and post["nmls_institution"] == 6641
        and post["mbr"] == 5051
        and post["mld"] == 1384
        and post["profiles"] == 6303
        and post["sre"] == 2515
        and post["sre_company_confirmed"] == 342
        and post["sre_company_inst"] == 294
        and post["assoc"] == 0
        and post["belongs"] == 0
        and post["person_public_candidate"] == 0
        and post["anon_contacts"] == 0
        and post["lpi"] == 8447
    )
    print("APPLY_OK" if ok else "APPLY_MISMATCH")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
