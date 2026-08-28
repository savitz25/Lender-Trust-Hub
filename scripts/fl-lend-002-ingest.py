#!/usr/bin/env python3
"""FL-LEND-002 — attach Florida OFR/NMLS credentials to the existing national graph.

  python scripts/fl-lend-002-ingest.py --dry-run
  python scripts/fl-lend-002-ingest.py --apply
  python scripts/fl-lend-002-ingest.py --apply   # idempotent second execute

Fail-closed:
  - Production DSN must be hidcrbexurginnuqgipx.
  - National graph tables must already exist (no v2 graph).
  - Unmatched company NMLS → UNRESOLVED_SOURCE_COMPANY_NMLS, never automatic net-new institutions.
  - Person contacts are never public_candidate.
  - No publication, no /florida, no MLO pages.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import uuid
from collections import Counter, defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import quote, unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "florida" / "ofr-prr-141420"
ORIG = RAW / "originals"
EXTR = RAW / "extracted"
DDL = ROOT / "supabase" / "migrations" / "20260828200000_florida_ofr_regulatory_graph.sql"
OUT = ROOT / "data" / "reports"
REF = "hidcrbexurginnuqgipx"
FORBIDDEN_REFS = (
    "arepfylnilkjmyduhwbz",  # Move auth / Move hub
    "ghjhcxfirxnszfnymdxb",  # Investor
    "jhjztnisugdsuliriajp",  # Contractor
    "uvqkyupfnpswdozmuzih",
)
NS = uuid.UUID("9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b")  # same as FL-LEND-009
NMLS_RE = re.compile(r"^[0-9]{3,12}$")
MONTHLY_AS_OF = date(2026, 8, 28)
NMLS_AS_OF = date(2026, 8, 27)
SOURCE_MONTHLY = "FL_OFR_MONTHLY_CH494"
SOURCE_NMLS = "FL_OFR_NMLS_PRR_141420"
PRR = "141420"
PRR_REF = "1341691"

NMLS_LICENSE_MAP = {
    "FL Mortgage Lender License": "MLD",
    "FL Mortgage Broker License": "MBR",
    "FL Mortgage Lender Branch License": "MLDB",
    "FL Mortgage Broker Branch License": "MBRB",
    "FL Mortgage Lender Servicer License": "MLS",
    "FL Mortgage Lender Servicer Branch License": "MLSB",
    "FL Mortgage Loan Originator License": "LO",
}
COMPANY_CLASSES = {"MLD", "MBR", "MLS"}
BRANCH_CLASSES = {"MLDB", "MBRB", "MLSB"}
PERSON_CLASSES = {"LO"}


def gid(*parts: str) -> uuid.UUID:
    return uuid.uuid5(NS, ":".join(parts))


def digits(v: str | None) -> str:
    return re.sub(r"[^0-9]", "", str(v or "").strip())


def nmls_ok(v: str | None) -> bool:
    d = digits(v)
    return bool(NMLS_RE.fullmatch(d)) and d != "0" * len(d)


def nmls_norm(v: str | None) -> str | None:
    d = digits(v)
    return d if nmls_ok(d) else None


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


def sniff_encoding(path: Path) -> str:
    head = path.read_bytes()[:8]
    if head.startswith(b"\xff\xfe") or head.startswith(b"\xfe\xff"):
        return "utf-16"
    if head.startswith(b"\xef\xbb\xbf"):
        return "utf-8-sig"
    return "utf-8"


def iter_rows(path: Path, skip_meta: bool = False):
    enc = sniff_encoding(path)
    with path.open("r", encoding=enc, errors="replace", newline="") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        if header and skip_meta and header and header[0].startswith("Report Name:"):
            header = next(reader, None)
        if not header:
            return []
        header = [h.strip() for h in header]
        out = []
        for raw in reader:
            if not raw or all(not (c or "").strip() for c in raw):
                continue
            if len(raw) < len(header):
                raw = raw + [""] * (len(header) - len(raw))
            out.append({header[i]: (raw[i] or "").strip() for i in range(len(header))})
        return out


def load_csv_dict(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8-sig", errors="replace", newline="") as f:
        return list(csv.DictReader(f))


def dump(name: str, obj) -> Path:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    path.write_text(json.dumps(obj, indent=2, default=str), encoding="utf-8")
    print("WROTE", path, flush=True)
    return path


def lender_dsn() -> str:
    candidates: list[str] = []
    env = os.environ.get("TARGET_DATABASE_URL") or os.environ.get("LENDER_DATABASE_URL")
    if env:
        candidates.append(env)
    for p in (
        ROOT / ".env.local",
        ROOT / "env.local",
        ROOT / "env.local.txt",
    ):
        if not p.exists():
            continue
        for line in p.read_text(encoding="utf-8", errors="replace").splitlines():
            if not line.strip() or line.strip().startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            if k.strip() in {"TARGET_DATABASE_URL", "LENDER_DATABASE_URL", "DATABASE_URL"}:
                candidates.append(v.strip().strip('"').strip("'"))
    for raw in candidates:
        u = urlparse(raw)
        blob = f"{u.username or ''} {u.hostname or ''} {raw}"
        if any(bad in blob for bad in FORBIDDEN_REFS):
            continue
        if REF not in blob:
            continue
        if REF in (u.username or "") and "pooler" in (u.hostname or ""):
            return raw if "sslmode" in (u.query or "") else raw + ("&sslmode=require" if u.query else "?sslmode=require")
        pw = unquote(u.password or "")
        return (
            f"postgresql://postgres.{REF}:{quote(pw, safe='')}"
            f"@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require"
        )
    return ""


def load_sources():
    monthly_mld = load_csv_dict(EXTR / "MortgageFirms_MLD-MLDB_Monthly.csv")
    monthly_mbr = load_csv_dict(EXTR / "MortgageFirms_MBR-MBRB_Monthly.csv")
    monthly_lo = (
        load_csv_dict(EXTR / "LoanOrignators_AI_Monthly.csv")
        + load_csv_dict(EXTR / "LoanOrignators_JR_Monthly.csv")
        + load_csv_dict(EXTR / "LoanOrignators_SZ_Monthly.csv")
    )
    nmls_biz = iter_rows(ORIG / "Mortgage Businesses.csv", skip_meta=True)
    nmls_lo = iter_rows(ORIG / "Loan Originators.csv", skip_meta=True)
    return {
        "monthly_mld": monthly_mld,
        "monthly_mbr": monthly_mbr,
        "monthly_lo": monthly_lo,
        "nmls_biz": nmls_biz,
        "nmls_lo": nmls_lo,
    }


def source_company_nmls(src) -> set[str]:
    out: set[str] = set()
    for r in src["monthly_mld"]:
        if (r.get("LICENSE TYPE") or "").strip() == "MLD":
            n = nmls_norm(r.get("NMLS ID"))
            if n:
                out.add(n)
    for r in src["monthly_mbr"]:
        if (r.get("LICENSE TYPE") or "").strip() == "MBR":
            n = nmls_norm(r.get("NMLS ID"))
            if n:
                out.add(n)
    for r in src["nmls_biz"]:
        if not (r.get("Branch Id") or "").strip():
            n = nmls_norm(r.get("Company Id"))
            if n:
                out.add(n)
    return out


def credential_counts(src) -> dict:
    def monthly_class(rows, klass):
        recs = [r for r in rows if (r.get("LICENSE TYPE") or "").strip() == klass]
        statuses = Counter((r.get("STATUS") or "").strip() or "(blank)" for r in recs)
        nmls = {nmls_norm(r.get("NMLS ID")) for r in recs}
        nmls.discard(None)
        lics = {(r.get("LICENSE NUMBER") or "").strip() for r in recs if (r.get("LICENSE NUMBER") or "").strip()}
        return {
            "rows": len(recs),
            "distinct_license": len(lics),
            "distinct_nmls": len(nmls),
            "status": dict(statuses),
            "current_approved": statuses.get("Approved", 0),
            "historical_other": len(recs) - statuses.get("Approved", 0),
        }

    firms = src["monthly_mld"] + src["monthly_mbr"]
    nmls_by_class = Counter()
    nmls_status = Counter()
    for r in src["nmls_biz"]:
        klass = NMLS_LICENSE_MAP.get((r.get("License Name") or "").strip())
        if klass:
            nmls_by_class[klass] += 1
        nmls_status[(r.get("License Status") or "").strip() or "(blank)"] += 1
    lo_nmls_status = Counter((r.get("License Status") or "").strip() or "(blank)" for r in src["nmls_lo"])
    return {
        "monthly": {
            "MLD": monthly_class(src["monthly_mld"], "MLD"),
            "MLDB": monthly_class(src["monthly_mld"], "MLDB"),
            "MBR": monthly_class(src["monthly_mbr"], "MBR"),
            "MBRB": monthly_class(src["monthly_mbr"], "MBRB"),
            "LO": monthly_class(src["monthly_lo"], "LO"),
        },
        "nmls_prr": {
            "by_class_rows": dict(nmls_by_class),
            "business_status": dict(nmls_status),
            "lo_status": dict(lo_nmls_status),
            "lo_rows": len(src["nmls_lo"]),
            "lo_distinct_nmls": len({nmls_norm(r.get("Individual Id")) for r in src["nmls_lo"] if nmls_norm(r.get("Individual Id"))}),
            "lo_with_sponsor": sum(1 for r in src["nmls_lo"] if nmls_norm(r.get("Sponsoring Company ID"))),
        },
    }


def branch_parent_map(nmls_biz) -> dict[str, str]:
    parents: dict[str, set[str]] = defaultdict(set)
    for r in nmls_biz:
        b = nmls_norm(r.get("Branch Id"))
        c = nmls_norm(r.get("Company Id"))
        if b and c:
            parents[b].add(c)
    out = {}
    collisions = {}
    for b, ps in parents.items():
        if len(ps) == 1:
            out[b] = next(iter(ps))
        else:
            collisions[b] = sorted(ps)
    return {"parent": out, "collisions": collisions}


def chunked(seq, n=400):
    for i in range(0, len(seq), n):
        yield seq[i : i + n]


def exec_chunks(cur, sql, rows, page=400):
    if not rows:
        return 0
    from psycopg2.extras import execute_values

    n = 0
    for part in chunked(rows, page):
        execute_values(cur, sql, part, page_size=page)
        n += len(part)
    return n


def n(cur, sql, params=None):
    cur.execute(sql, params)
    row = cur.fetchone()
    if row is None:
        return 0
    if isinstance(row, dict):
        return list(row.values())[0]
    return row[0]


def rows(cur, sql, params=None):
    cur.execute(sql, params)
    fetched = cur.fetchall()
    if fetched and isinstance(fetched[0], dict):
        return [dict(r) for r in fetched]
    desc = [d[0] for d in cur.description]
    return [dict(zip(desc, r)) for r in fetched]


def probe_graph(cur) -> dict:
    tables = n(
        cur,
        """
        select count(*) from information_schema.tables
        where table_schema='public' and table_name in (
          'lender_national_entities','lender_identifiers','lender_profile_intelligence',
          'lender_state_licenses','lender_entity_relationships','lender_entity_contacts',
          'lender_state_company_profiles','public.lenders'
        )
        """,
    )
    present = {
        r["table_name"]
        for r in rows(
            cur,
            """
            select table_name from information_schema.tables
            where table_schema='public'
              and table_name in (
                'lender_national_entities','lender_identifiers','lender_entity_names',
                'lender_source_record_links','legacy_lender_bridges','lender_identity_conflicts',
                'lender_entity_classifications','lender_entity_relationships',
                'lender_profile_intelligence','lender_state_company_profiles',
                'lender_entity_contacts','lender_state_licenses','lender_state_regulatory_events',
                'lenders'
              )
            """,
        )
    }
    graph_ok = {"lender_national_entities", "lender_identifiers", "lender_profile_intelligence"} <= present
    counts = {}
    if graph_ok:
        counts = {
            "institutions": n(cur, "select count(*) from lender_national_entities where entity_kind='institution'"),
            "branch": n(cur, "select count(*) from lender_national_entities where entity_kind='branch'"),
            "person_mlo": n(cur, "select count(*) from lender_national_entities where entity_kind='person_mlo'"),
            "nmls_institution": n(cur, "select count(*) from lender_identifiers where identifier_type='NMLS_INSTITUTION'"),
            "nmls_branch": n(cur, "select count(*) from lender_identifiers where identifier_type='NMLS_BRANCH'"),
            "nmls_person": n(cur, "select count(*) from lender_identifiers where identifier_type='NMLS_PERSON'"),
            "lpi": n(cur, "select count(*) from lender_profile_intelligence"),
            "associated_with": n(cur, "select count(*) from lender_entity_relationships where relationship_type='ASSOCIATED_WITH'"),
            "belongs_to": n(cur, "select count(*) from lender_entity_relationships where relationship_type='BELONGS_TO'"),
        }
        if "lender_state_licenses" in present:
            counts["licenses"] = n(cur, "select count(*) from lender_state_licenses")
            for klass in ("MLD", "MBR", "MLDB", "MBRB", "LO", "MLS", "MLSB"):
                counts[f"lic_{klass}"] = n(cur, "select count(*) from lender_state_licenses where license_class=%s", (klass,))
        if "lender_state_company_profiles" in present:
            counts["fl_profiles"] = n(cur, "select count(*) from lender_state_company_profiles")
        if "lender_entity_contacts" in present:
            counts["contacts"] = n(cur, "select count(*) from lender_entity_contacts")
            counts["person_public_candidate"] = n(
                cur,
                """
                select count(*) from lender_entity_contacts c
                join lender_national_entities e on e.id=c.entity_id
                where e.entity_kind='person_mlo' and c.classification='public_candidate'
                """,
            )
        if "lenders" in present:
            counts["public_lenders"] = n(cur, "select count(*) from lenders")
    return {"present": sorted(present), "graph_ok": graph_ok, "counts": counts, "table_hits": tables}


def classify_companies(cur, company_nmls: set[str]) -> dict[str, dict]:
    """Tier 1 exact NMLS_INSTITUTION. No name-only merge. Remainder held unresolved."""
    existing = {}
    for part in chunked(sorted(company_nmls), 500):
        cur.execute(
            """
            select identifier_value, entity_id, confidence
            from lender_identifiers
            where identifier_type='NMLS_INSTITUTION'
              and identifier_value = any(%s)
            """,
            (part,),
        )
        for r in cur.fetchall():
            if isinstance(r, dict):
                existing[r["identifier_value"]] = r
            else:
                existing[r[0]] = {"identifier_value": r[0], "entity_id": r[1], "confidence": r[2]}

    inst_kind = {}
    eids = [str(v["entity_id"]) for v in existing.values() if v.get("entity_id")]
    for part in chunked(eids, 500):
        cur.execute(
            "select id, entity_kind from lender_national_entities where id = any(%s::uuid[])",
            (part,),
        )
        for r in cur.fetchall():
            if isinstance(r, dict):
                inst_kind[str(r["id"])] = r["entity_kind"]
            else:
                inst_kind[str(r[0])] = r[1]

    # First pass is exact NMLS_INSTITUTION only. No name matching. No LEI/FDIC/profile crosswalk.
    out = {}
    for nmls_id in company_nmls:
        rec = existing.get(nmls_id)
        if rec and rec.get("entity_id"):
            kind = inst_kind.get(str(rec["entity_id"]))
            if kind and kind != "institution":
                out[nmls_id] = {
                    "resolution_class": "MULTI_ENTITY_CONFLICT",
                    "entity_id": str(rec["entity_id"]),
                    "match_method": "EXACT_NMLS_WRONG_KIND",
                    "notes": f"NMLS_INSTITUTION attached to entity_kind={kind}",
                }
            else:
                out[nmls_id] = {
                    "resolution_class": "ATTACHED_EXISTING_EXACT_NMLS",
                    "entity_id": str(rec["entity_id"]),
                    "match_method": "EXACT_NMLS_INSTITUTION",
                    "notes": None,
                }
            continue
        out[nmls_id] = {
            "resolution_class": "UNRESOLVED_SOURCE_COMPANY_NMLS",
            "entity_id": None,
            "match_method": "HELD_NO_EXISTING_INSTITUTION",
            "notes": "Not minted as net-new institution.",
        }
    return out


def person_name(r: dict, last_k, first_k, mid_k) -> str:
    last = (r.get(last_k) or "").strip()
    first = (r.get(first_k) or "").strip()
    mid = (r.get(mid_k) or "").strip()
    given = " ".join(x for x in (first, mid) if x)
    if last and given:
        return f"{last}, {given}"
    return last or given or "UNKNOWN LO"


def apply_ddl(cur):
    cur.execute(DDL.read_text(encoding="utf-8"))


def ingest(cur, src, resolutions: dict[str, dict], apply: bool) -> dict:
    from psycopg2.extras import Json

    biz_parents = branch_parent_map(src["nmls_biz"])
    company_name = {}
    for r in src["nmls_biz"]:
        cid = nmls_norm(r.get("Company Id"))
        name = (r.get("Company Name") or "").strip()
        if cid and name and len(name) > len(company_name.get(cid, "")):
            company_name[cid] = name
    for r in src["monthly_mld"] + src["monthly_mbr"]:
        nmls_id = nmls_norm(r.get("NMLS ID"))
        name = (r.get("FIRM NAME") or "").strip()
        klass = (r.get("LICENSE TYPE") or "").strip()
        if nmls_id and name and klass in COMPANY_CLASSES and len(name) > len(company_name.get(nmls_id, "")):
            company_name[nmls_id] = name

    # Identifiers for unresolved company NMLS (entity_id NULL). Existing rows untouched.
    ident_rows = []
    resolution_rows = []
    for nmls_id, res in resolutions.items():
        resolution_rows.append(
            (
                str(gid("res", "NMLS_INSTITUTION", nmls_id)),
                "NMLS_INSTITUTION",
                nmls_id,
                SOURCE_NMLS,
                res["resolution_class"],
                res.get("entity_id"),
                res.get("match_method"),
                res.get("notes"),
                NMLS_AS_OF,
                Json({"prr": PRR, "prr_ref": PRR_REF}),
            )
        )
        if res["resolution_class"] == "UNRESOLVED_SOURCE_COMPANY_NMLS":
            ident_rows.append(
                (
                    str(gid("ident", "NMLS_INSTITUTION", nmls_id)),
                    None,
                    "NMLS_INSTITUTION",
                    nmls_id,
                    "FL",
                    SOURCE_NMLS,
                    f"FL|UNRESOLVED|{nmls_id}",
                    NMLS_AS_OF,
                    "unresolved",
                    "unresolved",
                    Json(
                        {
                            "resolution_class": "UNRESOLVED_SOURCE_COMPANY_NMLS",
                            "legal_name": company_name.get(nmls_id),
                            "prr": PRR,
                        }
                    ),
                )
            )

    # Branch + person entities from NMLS rosters (reuse 009 keys).
    branch_ent, branch_ident, branch_names = [], [], []
    person_ent, person_ident, person_names = [], [], []
    contacts = []
    licenses = []
    observations = []
    rels = []

    # Branch entities from NMLS roster (deterministic parent when institution exists).
    seen_branch = set()
    for r in src["nmls_biz"]:
        klass = NMLS_LICENSE_MAP.get((r.get("License Name") or "").strip())
        bid = nmls_norm(r.get("Branch Id"))
        cid = nmls_norm(r.get("Company Id"))
        if klass not in BRANCH_CLASSES or not bid or bid in seen_branch:
            continue
        seen_branch.add(bid)
        eid = gid("branch", bid)
        iid = gid("ident", "NMLS_BRANCH", bid)
        name = (r.get("Company Name") or "").strip() or f"BRANCH {bid}"
        branch_ent.append(
            (
                str(eid),
                "branch",
                f"nmls-branch:{bid}",
                name[:500],
                name[:500],
                "confirmed",
                "observed",
                "internal_only",
                None,
                "FL-LEND-002 NMLS branch",
            )
        )
        branch_ident.append(
            (
                str(iid),
                str(eid),
                "NMLS_BRANCH",
                bid,
                "FL",
                SOURCE_NMLS,
                f"FL|NMLS_BRANCH|{bid}",
                NMLS_AS_OF,
                (r.get("License Status") or "").strip() or None,
                "confirmed",
                Json({"entity_class": "branch", "parent_company_nmls": cid}),
            )
        )
        branch_names.append(
            (str(gid("name", str(eid), name)), str(eid), "legal", name[:500], SOURCE_NMLS, f"FL|NMLS_BRANCH|{bid}", NMLS_AS_OF)
        )
        parent_nmls = biz_parents["parent"].get(bid)
        parent_eid = resolutions.get(parent_nmls or "", {}).get("entity_id") if parent_nmls else None
        if parent_eid:
            rels.append(
                (
                    str(gid("rel", "BELONGS_TO", str(eid), parent_eid)),
                    str(eid),
                    parent_eid,
                    "BELONGS_TO",
                    "confirmed",
                    SOURCE_NMLS,
                    f"PRR {PRR} Company Id {parent_nmls} + Branch Id {bid}",
                    NMLS_AS_OF,
                    None,
                    (r.get("License Status") or "").strip() or None,
                    f"FL|BRANCH|{bid}",
                )
            )
        email = (r.get("Company Contact Email") or "").strip()
        phone = (r.get("Company Contact Phone") or "").strip()
        if email and "@" in email:
            contacts.append(
                (
                    str(gid("ct", str(eid), "email", f"FL|NMLS_BRANCH|{bid}")),
                    str(eid),
                    "email",
                    "business",
                    "review_before_public",
                    None,
                    email[:320],
                    (r.get("Street") or "").strip() or None,
                    None,
                    (r.get("City") or "").strip() or None,
                    None,
                    (r.get("State") or "").strip() or None,
                    (r.get("Postal Code") or "").strip() or None,
                    SOURCE_NMLS,
                    f"FL|NMLS_BRANCH|{bid}|email",
                    NMLS_AS_OF,
                    Json({"role": "company_contact"}),
                )
            )
        if len(digits(phone)) >= 10:
            contacts.append(
                (
                    str(gid("ct", str(eid), "phone", f"FL|NMLS_BRANCH|{bid}")),
                    str(eid),
                    "phone",
                    "business",
                    "review_before_public",
                    phone[:40],
                    None,
                    (r.get("Street") or "").strip() or None,
                    None,
                    (r.get("City") or "").strip() or None,
                    None,
                    (r.get("State") or "").strip() or None,
                    (r.get("Postal Code") or "").strip() or None,
                    SOURCE_NMLS,
                    f"FL|NMLS_BRANCH|{bid}|phone",
                    NMLS_AS_OF,
                    Json({"role": "company_contact"}),
                )
            )

    # Person entities from NMLS LO roster.
    seen_person = set()
    for r in src["nmls_lo"]:
        nmls_id = nmls_norm(r.get("Individual Id"))
        if not nmls_id or nmls_id in seen_person:
            continue
        seen_person.add(nmls_id)
        eid = gid("person", nmls_id)
        iid = gid("ident", "NMLS_PERSON", nmls_id)
        name = person_name(r, "Individual Last Name", "Individual First Name", "Individual Middle Name")
        person_ent.append(
            (
                str(eid),
                "person_mlo",
                f"nmls-person:{nmls_id}",
                name[:500],
                name[:500],
                "confirmed",
                "observed",
                "internal_only",
                None,
                "FL-LEND-002 NMLS individual",
            )
        )
        person_ident.append(
            (
                str(iid),
                str(eid),
                "NMLS_PERSON",
                nmls_id,
                "FL",
                SOURCE_NMLS,
                f"FL|NMLS_PERSON|{nmls_id}",
                NMLS_AS_OF,
                (r.get("License Status") or "").strip() or None,
                "confirmed",
                Json({"entity_class": "person_mlo"}),
            )
        )
        person_names.append(
            (str(gid("name", str(eid), name)), str(eid), "legal", name[:500], SOURCE_NMLS, f"FL|NMLS_PERSON|{nmls_id}", NMLS_AS_OF)
        )
        sponsor = nmls_norm(r.get("Sponsoring Company ID"))
        sponsor_eid = resolutions.get(sponsor or "", {}).get("entity_id") if sponsor else None
        if sponsor_eid:
            rels.append(
                (
                    str(gid("rel", "ASSOCIATED_WITH", str(eid), sponsor_eid)),
                    str(eid),
                    sponsor_eid,
                    "ASSOCIATED_WITH",
                    "confirmed",
                    SOURCE_NMLS,
                    f"PRR {PRR} Sponsoring Company ID {sponsor}",
                    parse_date(r.get("Sponsorship Status Date")) or NMLS_AS_OF,
                    None,
                    (r.get("Sponsorship Status") or "").strip() or None,
                    f"FL|LO|{nmls_id}|sponsor|{sponsor}",
                )
            )
        # Individual emails: never public_candidate.
        for kind, col in (
            ("email", "Individual Notification Email Address"),
            ("email", "Individual Filing Email Address"),
        ):
            val = (r.get(col) or "").strip()
            if val and "@" in val:
                sid = f"FL|NMLS_PERSON|{nmls_id}|{col}"
                contacts.append(
                    (
                        str(gid("ct", str(eid), "email", sid)),
                        str(eid),
                        "email",
                        "professional",
                        "internal_only",
                        None,
                        val[:320],
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                        SOURCE_NMLS,
                        sid,
                        NMLS_AS_OF,
                        Json({"column": col, "public_eligible": False}),
                    )
                )

    # Business (company) contacts — blank Branch Id rows.
    seen_co_contact = set()
    for r in src["nmls_biz"]:
        if (r.get("Branch Id") or "").strip():
            continue
        cid = nmls_norm(r.get("Company Id"))
        if not cid:
            continue
        eid = resolutions.get(cid, {}).get("entity_id")
        if not eid or cid in seen_co_contact:
            continue
        seen_co_contact.add(cid)
        email = (r.get("Company Contact Email") or "").strip()
        phone = (r.get("Company Contact Phone") or "").strip()
        if email and "@" in email:
            contacts.append(
                (
                    str(gid("ct", eid, "email", f"FL|NMLS_CO|{cid}")),
                    eid,
                    "email",
                    "business",
                    "review_before_public",
                    None,
                    email[:320],
                    (r.get("Street") or "").strip() or None,
                    None,
                    (r.get("City") or "").strip() or None,
                    None,
                    (r.get("State") or "").strip() or None,
                    (r.get("Postal Code") or "").strip() or None,
                    SOURCE_NMLS,
                    f"FL|NMLS_CO|{cid}|email",
                    NMLS_AS_OF,
                    Json({"role": "company_contact"}),
                )
            )
        if len(digits(phone)) >= 10:
            contacts.append(
                (
                    str(gid("ct", eid, "phone", f"FL|NMLS_CO|{cid}")),
                    eid,
                    "phone",
                    "business",
                    "review_before_public",
                    phone[:40],
                    None,
                    (r.get("Street") or "").strip() or None,
                    None,
                    (r.get("City") or "").strip() or None,
                    None,
                    (r.get("State") or "").strip() or None,
                    (r.get("Postal Code") or "").strip() or None,
                    SOURCE_NMLS,
                    f"FL|NMLS_CO|{cid}|phone",
                    NMLS_AS_OF,
                    Json({"role": "company_contact"}),
                )
            )

    def add_license(klass, lic, nmls_id, status, status_dt, init_dt, entity_class, entity_id, ident_id, source, clock, sid, observed, extra):
        if not lic or not klass:
            return
        licenses.append(
            (
                str(gid("lic", klass, lic)),
                "FL",
                lic,
                klass,
                entity_class,
                nmls_id,
                status,
                status_dt,
                init_dt,
                extra.get("servicer_flag"),
                extra.get("firm_name"),
                extra.get("person_last"),
                extra.get("person_first"),
                extra.get("person_middle"),
                extra.get("phone"),
                extra.get("prim_address1"),
                extra.get("prim_address2"),
                extra.get("prim_city"),
                extra.get("prim_county"),
                extra.get("prim_state"),
                extra.get("prim_zip"),
                extra.get("mail_address1"),
                extra.get("mail_address2"),
                extra.get("mail_city"),
                extra.get("mail_state"),
                extra.get("mail_zip"),
                entity_id,
                ident_id,
                extra.get("confidence", "confirmed" if entity_id else "unresolved"),
                extra.get("match_method", "EXACT_NMLS" if nmls_id else "LICENSE_ONLY"),
                source,
                sid,
                observed,
                Json({"source_clock": clock, "prr": PRR, **extra.get("raw", {})}),
                clock,
            )
        )
        observations.append(
            (
                str(gid("obs", source, sid)),
                "FL",
                lic,
                klass,
                nmls_id,
                status,
                status_dt,
                init_dt,
                extra.get("servicer_flag"),
                clock,
                source,
                sid,
                observed,
                entity_id,
                Json({"prr": PRR, **extra.get("raw", {})}),
            )
        )

    # Monthly credentials (full status universe).
    for r in src["monthly_mld"] + src["monthly_mbr"] + src["monthly_lo"]:
        klass = (r.get("LICENSE TYPE") or "").strip()
        lic = (r.get("LICENSE NUMBER") or "").strip()
        nmls_id = nmls_norm(r.get("NMLS ID"))
        if klass not in {"MLD", "MBR", "MLDB", "MBRB", "LO"} or not lic:
            continue
        if klass in COMPANY_CLASSES:
            entity_class = "institution"
            inst_id = resolutions.get(nmls_id or "", {}).get("entity_id")
            ident_id = str(gid("ident", "NMLS_INSTITUTION", nmls_id)) if nmls_id else None
        elif klass in BRANCH_CLASSES:
            entity_class = "branch"
            inst_id = None
            ident_id = str(gid("ident", "NMLS_BRANCH", nmls_id)) if nmls_id else None
        else:
            entity_class = "person_mlo"
            inst_id = None
            ident_id = str(gid("ident", "NMLS_PERSON", nmls_id)) if nmls_id else None
        add_license(
            klass,
            lic,
            nmls_id,
            (r.get("STATUS") or "").strip() or None,
            parse_date(r.get("STATUS EFFECTIVE DATE")),
            parse_date(r.get("INTIAL APPROVAL")),
            entity_class,
            inst_id,
            ident_id,
            SOURCE_MONTHLY,
            "monthly_full",
            f"FL|MONTHLY|{klass}|{lic}",
            MONTHLY_AS_OF,
            {
                "servicer_flag": (r.get("SERVICER") or "").strip() or None,
                "firm_name": (r.get("FIRM NAME") or "").strip() or None,
                "person_last": (r.get("LAST NAME") or "").strip() or None,
                "person_first": (r.get("FIRST NAME") or "").strip() or None,
                "person_middle": (r.get("MIDDLE NAME") or "").strip() or None,
                "phone": (r.get("PHONE") or "").strip() or None,
                "prim_address1": (r.get("PRIM ADDRESS 1") or "").strip() or None,
                "prim_address2": (r.get("PRIM ADDRESS 2") or "").strip() or None,
                "prim_city": (r.get("PRIM CITY") or "").strip() or None,
                "prim_county": (r.get("COUNTY") or "").strip() or None,
                "prim_state": (r.get("PRIM STATE") or "").strip() or None,
                "prim_zip": (r.get("PRIM ZIP") or "").strip() or None,
                "mail_address1": (r.get("MAIL ADDRESS 1") or "").strip() or None,
                "mail_address2": (r.get("MAIL ADDRESS 2") or "").strip() or None,
                "mail_city": (r.get("MAIL CITY") or "").strip() or None,
                "mail_state": (r.get("MAIL STATE") or "").strip() or None,
                "mail_zip": (r.get("MAIL ZIP") or "").strip() or None,
            },
        )

    # NMLS PRR credentials (active-oriented). Includes official servicer classes.
    for r in src["nmls_biz"]:
        klass = NMLS_LICENSE_MAP.get((r.get("License Name") or "").strip())
        lic = (r.get("License Number") or "").strip()
        if not klass or not lic:
            continue
        bid = nmls_norm(r.get("Branch Id"))
        cid = nmls_norm(r.get("Company Id"))
        if klass in BRANCH_CLASSES:
            nmls_id = bid
            entity_class = "branch"
            inst_id = resolutions.get(cid or "", {}).get("entity_id") if cid else None
            ident_id = str(gid("ident", "NMLS_BRANCH", nmls_id)) if nmls_id else None
        else:
            nmls_id = cid
            entity_class = "institution"
            inst_id = resolutions.get(nmls_id or "", {}).get("entity_id")
            ident_id = str(gid("ident", "NMLS_INSTITUTION", nmls_id)) if nmls_id else None
        add_license(
            klass,
            lic,
            nmls_id,
            (r.get("License Status") or "").strip() or None,
            parse_date(r.get("License Status Date")),
            parse_date(r.get("Original License Date")),
            entity_class,
            inst_id,
            ident_id,
            SOURCE_NMLS,
            "nmls_active",
            f"FL|NMLS|{klass}|{lic}",
            NMLS_AS_OF,
            {
                "firm_name": (r.get("Company Name") or "").strip() or None,
                "phone": (r.get("Company Contact Phone") or "").strip() or None,
                "prim_address1": (r.get("Street") or "").strip() or None,
                "prim_city": (r.get("City") or "").strip() or None,
                "prim_state": (r.get("State") or "").strip() or None,
                "prim_zip": (r.get("Postal Code") or "").strip() or None,
                "raw": {"license_name": r.get("License Name"), "parent_company_nmls": cid},
            },
        )

    for r in src["nmls_lo"]:
        klass = NMLS_LICENSE_MAP.get((r.get("License Name") or "").strip()) or "LO"
        lic = (r.get("License Number") or "").strip()
        nmls_id = nmls_norm(r.get("Individual Id"))
        if not lic:
            continue
        entity_id = str(gid("person", nmls_id)) if nmls_id else None
        ident_id = str(gid("ident", "NMLS_PERSON", nmls_id)) if nmls_id else None
        add_license(
            klass,
            lic,
            nmls_id,
            (r.get("License Status") or "").strip() or None,
            parse_date(r.get("License Status Date")),
            parse_date(r.get("Original License Date")),
            "person_mlo",
            entity_id,
            ident_id,
            SOURCE_NMLS,
            "nmls_active",
            f"FL|NMLS|LO|{lic}",
            NMLS_AS_OF,
            {
                "person_last": (r.get("Individual Last Name") or "").strip() or None,
                "person_first": (r.get("Individual First Name") or "").strip() or None,
                "person_middle": (r.get("Individual Middle Name") or "").strip() or None,
                "raw": {"sponsoring_company_id": nmls_norm(r.get("Sponsoring Company ID"))},
            },
        )

    planned = {
        "unresolved_identifiers": len(ident_rows),
        "resolutions": len(resolution_rows),
        "branch_entities": len(branch_ent),
        "person_entities": len(person_ent),
        "licenses": len(licenses),
        "observations": len(observations),
        "relationships": len(rels),
        "contacts": len(contacts),
        "parent_collisions": len(biz_parents["collisions"]),
        "net_new_institutions": 0,
    }
    if not apply:
        return {"planned": planned, "applied": False}

    exec_chunks(
        cur,
        """
        insert into lender_national_entities (
          id, entity_kind, stable_key, legal_name, display_name,
          identity_confidence, current_status, public_projection_status, review_status, notes
        ) values %s
        on conflict (stable_key) do nothing
        """,
        branch_ent + person_ent,
    )
    exec_chunks(
        cur,
        """
        insert into lender_identifiers (
          id, entity_id, identifier_type, identifier_value, jurisdiction,
          source_dataset, source_record_id, observed_at, status, confidence, raw_metadata
        ) values %s
        on conflict (identifier_type, identifier_value) do nothing
        """,
        ident_rows + branch_ident + person_ident,
    )
    exec_chunks(
        cur,
        """
        insert into lender_entity_names (id, entity_id, name_kind, name, source_dataset, source_record_id, observed_at)
        values %s
        on conflict (entity_id, name_kind, name, source_dataset) do nothing
        """,
        branch_names + person_names,
    )
    exec_chunks(
        cur,
        """
        insert into lender_source_identity_resolutions (
          id, identifier_type, identifier_value, source_dataset, resolution_class,
          entity_id, match_method, notes, observed_at, raw_metadata
        ) values %s
        on conflict (identifier_type, identifier_value, source_dataset) do update set
          resolution_class = excluded.resolution_class,
          entity_id = excluded.entity_id,
          match_method = excluded.match_method,
          notes = excluded.notes,
          updated_at = now()
        """,
        resolution_rows,
    )
    exec_chunks(
        cur,
        """
        insert into lender_state_licenses (
          id, jurisdiction, license_number, license_class, entity_class, nmls_id, ofr_status,
          status_effective_on, initial_approval_on, servicer_flag, firm_name, person_last, person_first, person_middle,
          phone, prim_address1, prim_address2, prim_city, prim_county, prim_state, prim_zip,
          mail_address1, mail_address2, mail_city, mail_state, mail_zip,
          institution_id, identifier_id, attribution_confidence, match_method,
          source_dataset, source_record_id, source_observed_on, raw_metadata, source_clock
        ) values %s
        on conflict (jurisdiction, license_number) do update set
          ofr_status = excluded.ofr_status,
          status_effective_on = excluded.status_effective_on,
          source_dataset = excluded.source_dataset,
          source_record_id = excluded.source_record_id,
          source_observed_on = excluded.source_observed_on,
          source_clock = excluded.source_clock,
          institution_id = coalesce(lender_state_licenses.institution_id, excluded.institution_id),
          identifier_id = coalesce(lender_state_licenses.identifier_id, excluded.identifier_id),
          updated_at = now()
        """,
        licenses,
    )
    exec_chunks(
        cur,
        """
        insert into lender_state_license_observations (
          id, jurisdiction, license_number, license_class, nmls_id, ofr_status,
          status_effective_on, initial_approval_on, servicer_flag, source_clock,
          source_dataset, source_record_id, source_observed_on, entity_id, raw_metadata
        ) values %s
        on conflict (source_dataset, source_record_id) do nothing
        """,
        observations,
    )
    exec_chunks(
        cur,
        """
        insert into lender_entity_relationships (
          id, from_entity_id, to_entity_id, relationship_type, confidence,
          source_dataset, notes, valid_from, valid_to, ofr_status, source_record_id
        ) values %s
        on conflict (from_entity_id, to_entity_id, relationship_type) do nothing
        """,
        rels,
    )
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
    return {"planned": planned, "applied": True}


def post_counts(cur) -> dict:
    def cls(klass):
        total = n(cur, "select count(*) from lender_state_licenses where license_class=%s", (klass,))
        current = n(
            cur,
            "select count(*) from lender_state_licenses where license_class=%s and ofr_status='Approved'",
            (klass,),
        )
        hist = n(
            cur,
            "select count(*) from lender_state_license_observations where license_class=%s",
            (klass,),
        )
        return {"current_rows": total, "approved_current_rows": current, "observation_rows": hist}

    person_public = n(
        cur,
        """
        select count(*) from lender_entity_contacts c
        join lender_national_entities e on e.id=c.entity_id
        where e.entity_kind='person_mlo' and c.classification='public_candidate'
        """,
    )
    return {
        "institutions": n(cur, "select count(*) from lender_national_entities where entity_kind='institution'"),
        "branch": n(cur, "select count(*) from lender_national_entities where entity_kind='branch'"),
        "person_mlo": n(cur, "select count(*) from lender_national_entities where entity_kind='person_mlo'"),
        "lpi": n(cur, "select count(*) from lender_profile_intelligence"),
        "associated_with": n(cur, "select count(*) from lender_entity_relationships where relationship_type='ASSOCIATED_WITH'"),
        "belongs_to": n(cur, "select count(*) from lender_entity_relationships where relationship_type='BELONGS_TO'"),
        "contacts": n(cur, "select count(*) from lender_entity_contacts"),
        "person_public_candidate": person_public,
        "resolutions": {
            r["resolution_class"]: r["n"]
            for r in rows(
                cur,
                "select resolution_class, count(*) n from lender_source_identity_resolutions group by 1",
            )
        },
        "credentials": {k: cls(k) for k in ("MLD", "MBR", "MLS", "MLDB", "MBRB", "MLSB", "LO")},
        "canonical_institutions_with_fl_mortgage": n(
            cur,
            """
            select count(distinct institution_id)
            from lender_state_licenses
            where license_class in ('MLD','MBR','MLS')
              and institution_id is not null
            """,
        ),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    apply = bool(args.apply)

    if not (ORIG / "Mortgage Businesses.csv").exists() or not (EXTR / "MortgageFirms_MLD-MLDB_Monthly.csv").exists():
        print("STOP source files missing under data/raw/florida/ofr-prr-141420/")
        return 2

    print("Loading sources…", flush=True)
    src = load_sources()
    company = source_company_nmls(src)
    creds = credential_counts(src)
    parents = branch_parent_map(src["nmls_biz"])
    source_report = {
        "task": "FL-LEND-002",
        "prr": PRR,
        "prr_ref": PRR_REF,
        "source_company_nmls": len(company),
        "credentials": creds,
        "branch_parents": len(parents["parent"]),
        "branch_parent_collisions": len(parents["collisions"]),
        "net_new_confirmed_policy": 0,
        "apply": apply,
    }
    dump("fl-lend-002-source-dry-run.json", source_report)
    print(json.dumps({"source_company_nmls": len(company), "apply": apply}, indent=2), flush=True)

    dsn = lender_dsn()
    if not dsn:
        dump(
            "fl-lend-002-blocked.json",
            {
                "status": "BLOCKED",
                "reason": "NATIONAL_CANONICAL_GRAPH_NOT_OPENABLE",
                "detail": "TARGET_DATABASE_URL / .env.local for hidcrbexurginnuqgipx is not present on this host. Refusing to invent a v2 graph or write Move/Investor/Contractor databases.",
                "source_company_nmls": len(company),
                "held_unresolved_without_production": len(company),
                "net_new_confirmed": 0,
            },
        )
        print("STOP not hidcrbex — Production DSN missing. No ingest.")
        return 2

    import psycopg2
    from psycopg2.extras import RealDictCursor

    u = urlparse(dsn)
    if REF not in (u.username or "") and REF not in (u.hostname or ""):
        print("STOP not hidcrbex")
        return 2

    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=RealDictCursor)
    graph = probe_graph(cur)
    dump("fl-lend-002-graph-probe.json", graph)
    if not graph["graph_ok"]:
        dump(
            "fl-lend-002-blocked.json",
            {
                "status": "BLOCKED",
                "reason": "NATIONAL_CANONICAL_GRAPH_NOT_PRESENT",
                "present": graph["present"],
            },
        )
        print("STOP national graph tables missing on Production.")
        return 2

    print("Classifying company NMLS against existing NMLS_INSTITUTION…", flush=True)
    resolutions = classify_companies(cur, company)
    classes = Counter(v["resolution_class"] for v in resolutions.values())
    if sum(classes.values()) != len(company):
        print("STOP resolution classes do not sum to source company NMLS")
        return 2
    if classes.get("NET_NEW_CONFIRMED", 0):
        print("STOP unexpected NET_NEW_CONFIRMED")
        return 2

    class_report = {
        "source_company_nmls": len(company),
        "classes": dict(classes),
        "attached_existing": classes.get("ATTACHED_EXISTING_EXACT_NMLS", 0),
        "crosswalk_attached": classes.get("CROSSWALK_ATTACHED", 0),
        "net_new_confirmed": classes.get("NET_NEW_CONFIRMED", 0),
        "review_required": classes.get("REVIEW_REQUIRED", 0),
        "identity_conflict": classes.get("IDENTITY_CONFLICT", 0) + classes.get("MULTI_ENTITY_CONFLICT", 0),
        "malformed": classes.get("MALFORMED", 0),
        "unresolved_source_company_nmls": classes.get("UNRESOLVED_SOURCE_COMPANY_NMLS", 0),
        "attachment_pct": round(
            100.0
            * (
                classes.get("ATTACHED_EXISTING_EXACT_NMLS", 0)
                + classes.get("ATTACHED_EXISTING_ID", 0)
            )
            / len(company),
            2,
        )
        if company
        else None,
        "sum_ok": sum(classes.values()) == len(company),
        "pre_graph": graph["counts"],
    }
    dump("fl-lend-002-company-match.json", class_report)
    print(json.dumps(class_report, indent=2), flush=True)

    if not apply:
        planned = ingest(cur, src, resolutions, apply=False)
        dump("fl-lend-002-dry-run.json", {**class_report, **planned, "graph": graph})
        print("DRY_RUN_ONLY")
        return 0

    print("Applying additive DDL + ingest…", flush=True)
    apply_ddl(cur)
    first = ingest(cur, src, resolutions, apply=True)
    post1 = post_counts(cur)
    dump("fl-lend-002-post.json", {"first": first, "post": post1, "match": class_report})

    print("Second execute (idempotency)…", flush=True)
    second = ingest(cur, src, resolutions, apply=True)
    post2 = post_counts(cur)
    delta = {k: post2[k] - post1[k] for k in ("institutions", "branch", "person_mlo", "lpi", "associated_with", "belongs_to", "contacts") if isinstance(post1.get(k), int)}
    dump(
        "fl-lend-002-idempotency.json",
        {"first_post": post1, "second_post": post2, "delta": delta, "person_public_candidate": post2.get("person_public_candidate")},
    )
    print(json.dumps({"delta": delta, "person_public_candidate": post2.get("person_public_candidate")}, indent=2), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
