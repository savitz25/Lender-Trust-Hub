#!/usr/bin/env python3
"""FL-LEND-006 — generate internal Florida company profile projections on hidcrbex only.

  python scripts/fl-lend-006-generate.py --dry-run
  python scripts/fl-lend-006-generate.py --apply
  python scripts/fl-lend-006-generate.py --apply   # idempotent rerun
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote, unquote, urlparse

import psycopg2
from psycopg2.extras import Json, RealDictCursor, execute_values

ROOT = Path(r"C:\Users\makei\lender-trust-hub-ask-search-009")
REF = "hidcrbexurginnuqgipx"
MOVE = "arepfylnilkjmyduhwbz"
MIGRATION = ROOT / "supabase" / "migrations" / "20260828120000_florida_state_company_profiles.sql"
OUT = ROOT / "docs" / "fl-lend-006-post.json"
QA_OUT = ROOT / "docs" / "fl-lend-006-qa-cohort.json"
CONTRACT = "fl-lend-provider-v1"

LIMITATIONS_ALWAYS = [
    "Florida OFR license evidence is a current Approved snapshot, not a historical license-status time series.",
    "OFR primary address / county is license/business/HQ address evidence. It is not service territory, operating footprint, branch footprint, or Florida lending-activity geography.",
    "FLAIO connected coverage begins July 2015. Pre-2015 REAL orders are not bulk represented.",
    "607 company FLAIO orders are not attached to current confirmed identities.",
    "CFPB complaints are consumer-submitted records, not regulator findings.",
    "HMDA is reporting activity, not a quality metric.",
    "No MLO/person or branch identity layer is published from this foundation.",
    "Absence of observed enforcement is not a clean-record finding.",
    "Consent in an OFR order is not an admission of the underlying allegations.",
    "A final agency action is not automatically an adverse disciplinary finding.",
    "Florida OFR events and federal enforcement are separate sovereigns and are not summed.",
]


def lender_dsn() -> str:
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


def n(cur, sql, params=None):
    cur.execute(sql, params)
    return list(cur.fetchone().values())[0]


def rows(cur, sql, params=None):
    cur.execute(sql, params)
    return [dict(r) for r in cur.fetchall()]


def slugify(text: str) -> str:
    s = (text or "").lower()
    s = s.replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s[:80]


def catalog_slugs() -> set[str]:
    text = (ROOT / "lib" / "mockData.ts").read_text(encoding="utf-8")
    return set(re.findall(r"slug:\s*'([a-z0-9-]+)'", text))


def split_sql(sql: str) -> list[str]:
    stmts, buf, npos = [], [], 0
    in_single, dollar = False, None
    while npos < len(sql):
        ch = sql[npos]
        if dollar:
            end = sql.find(dollar, npos)
            if end < 0:
                buf.append(sql[npos:])
                break
            buf.append(sql[npos : end + len(dollar)])
            npos = end + len(dollar)
            dollar = None
            continue
        if in_single:
            buf.append(ch)
            if ch == "'" and sql[npos : npos + 2] != "''":
                in_single = False
            elif ch == "'" and sql[npos : npos + 2] == "''":
                buf.append("'")
                npos += 1
            npos += 1
            continue
        if ch == "'" :
            in_single = True
            buf.append(ch)
            npos += 1
            continue
        if ch == "$" and sql.startswith("$$", npos):
            dollar = "$$"
            buf.append("$$")
            npos += 2
            continue
        if ch == ";":
            stmt = "".join(buf).strip()
            if stmt and not stmt.startswith("--"):
                stmts.append(stmt)
            buf = []
            npos += 1
            continue
        buf.append(ch)
        npos += 1
    tail = "".join(buf).strip()
    if tail:
        stmts.append(tail)
    return [s for s in stmts if s and not all(line.strip().startswith("--") or not line.strip() for line in s.splitlines())]


def addr(row: dict, prefix: str) -> dict:
    return {
        "address1": row.get(f"{prefix}_address1"),
        "address2": row.get(f"{prefix}_address2"),
        "city": row.get(f"{prefix}_city"),
        "county": row.get(f"{prefix}_county") if prefix == "prim" else None,
        "state": row.get(f"{prefix}_state"),
        "zip": row.get(f"{prefix}_zip"),
    }


def classify_phone(phone: str | None) -> str:
    if not phone:
        return "internal_only"
    return "public_candidate"


def sha_profile(profile: dict) -> str:
    frozen = json.loads(json.dumps(profile, default=str))
    if isinstance(frozen.get("freshness"), dict):
        frozen["freshness"] = {k: v for k, v in frozen["freshness"].items() if k != "profile_generated_at"}
    blob = json.dumps(frozen, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()


def build_profile(inst: dict, lics: list[dict], events: list[dict], hmda: dict | None, cfpb_n: int, slug: str, national: dict) -> dict:
    names = []
    for l in lics:
        nm = (l.get("firm_name") or "").strip()
        if nm and nm not in names:
            names.append(nm)
    classes = sorted({l["license_class"] for l in lics})
    dual = "MBR" in classes and "MLD" in classes
    servicer_yes = sum(1 for l in lics if l.get("license_class") == "MLD" and (l.get("servicer_flag") or "") == "Yes")
    creds = []
    for l in sorted(lics, key=lambda x: (x["license_class"], x["license_number"])):
        personish = any((l.get(k) or "").strip() for k in ("person_last", "person_first"))
        creds.append(
            {
                "license_number": l["license_number"],
                "license_class": l["license_class"],
                "license_class_label": "Mortgage Broker" if l["license_class"] == "MBR" else "Mortgage Lender",
                "ofr_status": l.get("ofr_status"),
                "servicer_flag": l.get("servicer_flag"),
                "firm_name": l.get("firm_name"),
                "phone": l.get("phone"),
                "phone_class": "review_before_public" if personish else classify_phone(l.get("phone")),
                "prim_address": addr(l, "prim"),
                "mail_address": addr(l, "mail"),
                "address_means": "license_business_hq_evidence",
                "not_service_territory": True,
                "contact_class": "review_before_public" if personish else "public_candidate",
            }
        )
    phones = []
    for l in lics:
        if l.get("phone") and l["phone"] not in phones:
            phones.append(l["phone"])
    ev_sorted = sorted(
        events,
        key=lambda e: (e.get("event_date") or datetime.min.date(), e.get("id") or ""),
        reverse=True,
    )
    types = Counter(e.get("event_type_normalized") for e in ev_sorted)
    findings = Counter(e.get("finding_type") or "UNSPECIFIED" for e in ev_sorted)
    fines = [e for e in ev_sorted if e.get("amount") is not None]
    orders = [e for e in ev_sorted if e.get("event_type_normalized") == "FINAL_ORDER"]
    docs = []
    for e in ev_sorted:
        url = e.get("document_url")
        if url and url not in {d["url"] for d in docs}:
            docs.append({"url": url, "title": e.get("document_title"), "event_date": str(e.get("event_date") or "")})
        if len(docs) >= 8:
            break

    def slim(e: dict) -> dict:
        return {
            "id": e.get("id"),
            "event_date": str(e.get("event_date") or ""),
            "event_type_normalized": e.get("event_type_normalized"),
            "finding_type": e.get("finding_type"),
            "license_action": e.get("license_action"),
            "finality": e.get("finality"),
            "amount": float(e["amount"]) if e.get("amount") is not None else None,
            "document_url": e.get("document_url"),
            "case_number": e.get("case_number"),
            "consent_mentioned": (e.get("raw_metadata") or {}).get("consent_mentioned") if isinstance(e.get("raw_metadata"), dict) else None,
        }

    ofr_count = len(ev_sorted)
    florida_reg = {
        "confirmed_event_observations": ofr_count,
        "event_types": dict(types),
        "finding_types": dict(findings),
        "fine_bearing_observations": len(fines),
        "parsed_fine_dollars": float(sum(float(e["amount"]) for e in fines)) if fines else 0,
        "explicit_revocation": sum(1 for e in ev_sorted if e.get("license_action") == "REVOCATION"),
        "explicit_suspension": sum(1 for e in ev_sorted if e.get("license_action") == "SUSPENSION"),
        "emergency_order": sum(1 for e in ev_sorted if e.get("event_type_normalized") == "EMERGENCY_ORDER"),
        "earliest_event_date": str(min(e["event_date"] for e in ev_sorted if e.get("event_date"))) if any(e.get("event_date") for e in ev_sorted) else None,
        "latest_event_date": str(max(e["event_date"] for e in ev_sorted if e.get("event_date"))) if any(e.get("event_date") for e in ev_sorted) else None,
        "official_document_count": len(docs),
        "recent_events": [slim(e) for e in ev_sorted[:8]],
        "recent_fine_bearing": [slim(e) for e in fines[:3]],
        "recent_final_orders": [slim(e) for e in orders[:3]],
        "official_document_links": docs,
        "unresolved_and_review_excluded": True,
        "person_and_branch_excluded": True,
        "not_a_score": True,
        "absence_language": None
        if ofr_count
        else "No confirmed Florida OFR final-agency-action observations are currently attached to this identity. That is not a clean-record finding.",
    }

    generated = datetime.now(timezone.utc).isoformat()
    profile = {
        "contract_version": CONTRACT,
        "public_projection_status": "internal_only",
        "scores": None,
        "rankings": None,
        "identity": {
            "institution_id": inst["institution_id"],
            "nmls_id": str(inst["nmls_id"]),
            "stable_key": inst["stable_key"],
            "ofr_names": names,
            "canonical_name": names[0] if names else (inst.get("legal_name") or inst.get("display_name")),
            "legal_name": inst.get("legal_name"),
            "slug": slug,
        },
        "floridaLicensing": {
            "approved_credential_count": len(lics),
            "classes": classes,
            "dual_mbr_mld": dual,
            "source_dataset": "FL_OFR_CH494",
            "source_as_of": "2026-08-27",
        },
        "credentialClasses": creds,
        "servicerEvidence": {
            "ofr_mld_servicer_yes_credentials": servicer_yes,
            "statement": "OFR MLD credential reports SERVICER=Yes" if servicer_yes else None,
            "blank_or_no_is_not_never_services": True,
        },
        "contacts": {
            "canonical_summary": {
                "phones": phones,
                "phone_class": "public_candidate" if phones else "internal_only",
            },
            "source": "OFR_CH494_CREDENTIAL",
            "audit": "Official OFR business name, license class/number, business phone, business address, and mail address are public_candidate pending publication review. Person-name fields trigger review_before_public.",
        },
        "addresses": {
            "semantics": "license_business_hq_evidence",
            "not_service_territory": True,
            "not_operating_footprint": True,
            "not_branch_footprint": True,
            "no_county_coverage_from_prim_county": True,
        },
        "hmda": {
            "identity_safe": True,
            "quality_metric": False,
            "florida_state_grain": hmda,
            "note": "HMDA is reporting activity, not a quality score. Denial ratios are not a fairness score.",
        },
        "cfpb": {
            "confirmed_rows": int(cfpb_n or 0),
            "complaints_are_not_findings": True,
            "geography_edge": "COMPLAINT_REPORTED_FROM",
            "note": "Consumer-submitted CFPB mortgage complaints attributed to this institution. Not regulator findings.",
        },
        "federalRegulatory": {
            "confirmed_events": 0,
            "included": False,
            "separate_sovereign": True,
            "note": "No confirmed federal enforcement events are attached to this identity. Absence is not a clean-record finding. Federal evidence is not fabricated.",
        },
        "floridaRegulatory": florida_reg,
        "sources": [
            {
                "id": "ofr_ch494",
                "name": "Florida OFR Chapter 494 monthly company files",
                "as_of": "2026-08-27",
                "role": "Current Approved MBR/MLD credential roster",
            },
            {
                "id": "flaio",
                "name": "DOAH FLAIO OFR indexed final agency actions",
                "coverage_start": "2015-07",
                "as_of": "2026-08-27",
                "role": "Confirmed company final agency actions only",
            },
            {"id": "hmda", "name": "HMDA / FFIEC production evidence", "role": "Identity-safe overlay when institution_id is attached"},
            {"id": "cfpb", "name": "CFPB Consumer Complaint Database", "role": "Confirmed complaint observations only"},
            {"id": "federal_enf", "name": "Existing federal enforcement graph", "role": "Separate sovereign; omitted when zero confirmed events"},
        ],
        "freshness": {
            "ofr_licensing_as_of": "2026-08-27",
            "flaio_coverage_start": "2015-07",
            "flaio_coverage_end": "2026-08-27",
            "profile_generated_at": generated,
            "hmda_vintage": (hmda or {}).get("vintages"),
            "cfpb_present": bool(cfpb_n),
            "federal_present": False,
        },
        "limitations": LIMITATIONS_ALWAYS,
        "publication": {
            "status": "internal_only",
            "index": False,
            "sitemap": False,
            "national_render": national["render"],
            "national_index": national["index"],
            "has_national_snapshot": national["has_lpi"],
        },
    }
    return profile


def pick_qa(rows_in: list[dict]) -> list[dict]:
    by = {r["nmls_id"]: r for r in rows_in}
    want = []

    def take(pred, tag):
        for r in sorted(rows_in, key=lambda x: str(x["nmls_id"])):
            if r["institution_id"] in {x["institution_id"] for x in want}:
                continue
            if pred(r):
                want.append({**{k: r[k] for k in ("institution_id", "nmls_id", "slug", "name")}, "tag": tag})
                return

    take(lambda r: r["national_render"], "national_overlap")
    take(lambda r: not r["has_lpi"], "florida_only_new")
    take(lambda r: r["classes"] == ["MBR"], "mbr_only")
    take(lambda r: r["classes"] == ["MLD"], "mld_only")
    take(lambda r: r["dual"], "dual_mbr_mld")
    take(lambda r: r["servicer_yes"] > 0, "servicer_yes")
    take(lambda r: r["ofr_n"] == 1, "one_ofr_event")
    take(lambda r: r["ofr_n"] >= 2, "multiple_ofr_events")
    take(lambda r: r["fine_n"] > 0, "fine")
    take(lambda r: r["ofr_n"] == 0, "no_confirmed_ofr")
    take(lambda r: r["hmda"], "hmda")
    take(lambda r: r["cfpb_n"] > 0, "cfpb")
    take(lambda r: False, "federal")  # none in workset
    take(lambda r: r["cred_n"] == 1 and r["ofr_n"] == 0 and not r["hmda"] and r["cfpb_n"] == 0, "sparse")
    take(lambda r: len(r["name"] or "") >= 40, "long_name")
    take(lambda r: r["cred_n"] >= 2, "multiple_credentials")
    for r in sorted(rows_in, key=lambda x: str(x["nmls_id"])):
        if len(want) >= 30:
            break
        if r["institution_id"] in {x["institution_id"] for x in want}:
            continue
        want.append({**{k: r[k] for k in ("institution_id", "nmls_id", "slug", "name")}, "tag": "fill"})
    return want[:30]


def apply_migration(cur) -> None:
    sql = MIGRATION.read_text(encoding="utf-8")
    cur.execute(sql)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    apply = bool(args.apply)
    dsn = lender_dsn()
    u = urlparse(dsn)
    if REF not in (u.username or "") and REF not in (u.hostname or ""):
        print("STOP not hidcrbex")
        return 2

    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("set statement_timeout = '15min'")

    workset = n(cur, "select count(distinct institution_id) from lender_state_licenses where institution_id is not null")
    held = n(cur, "select count(distinct nmls_id) from lender_state_licenses where institution_id is null")
    lpi = n(cur, "select count(*) from lender_profile_intelligence")
    if workset != 6303 or held != 22 or lpi != 8447:
        print("STOP workset/held/lpi", workset, held, lpi)
        conn.close()
        return 3

    indexing = json.loads((ROOT / "docs/lend-nat-014-indexing-cohort.json").read_text(encoding="utf-8"))
    render = json.loads((ROOT / "docs/lend-nat-014-render-cohort.json").read_text(encoding="utf-8"))
    search = json.loads((ROOT / "docs/lend-nat-016-search-index.json").read_text(encoding="utf-8"))
    index_slug = {r["institution_id"]: r["slug"] for r in indexing["rows"]}
    render_slug = {r["institution_id"]: r["slug"] for r in render["rows"]}
    index_ids = set(index_slug)
    render_ids = set(render_slug)

    reserved = catalog_slugs() | {r["slug"] for r in indexing["rows"]} | {r["slug"] for r in render["rows"]} | {
        r["slug"] for r in search["rows"]
    } | {"florida", "lender", "lenders"}

    inst_rows = rows(
        cur,
        """
        select e.id as institution_id, e.stable_key, e.legal_name, e.display_name,
               i.identifier_value as nmls_id,
               exists(select 1 from lender_profile_intelligence p where p.entity_id=e.id) as has_lpi
        from lender_national_entities e
        join lender_identifiers i on i.entity_id=e.id and i.identifier_type='NMLS_INSTITUTION'
        where e.id in (select distinct institution_id from lender_state_licenses where institution_id is not null)
        """,
    )
    lic_rows = rows(cur, "select * from lender_state_licenses where institution_id is not null")
    ev_rows = rows(
        cur,
        """
        select id, institution_id, event_date, event_type_normalized, finding_type, license_action,
               finality, amount, document_url, document_title, case_number, raw_metadata
        from lender_state_regulatory_events
        where respondent_kind='institution' and attribution_confidence='confirmed' and institution_id is not null
        """,
    )
    hmda_rows = rows(
        cur,
        """
        select institution_id,
               count(*)::int as rows,
               coalesce(sum(applications),0)::bigint as applications,
               coalesce(sum(originations),0)::bigint as originations,
               array_agg(distinct source_vintage) as vintages
        from lender_hmda_observations
        where geo_grain='state' and state_code='FL' and institution_id is not null
          and institution_id in (select distinct institution_id from lender_state_licenses where institution_id is not null)
        group by 1
        """,
    )
    cfpb_rows = rows(
        cur,
        """
        select institution_id, count(*)::int as n
        from lender_cfpb_complaints
        where attribution_confidence='confirmed' and institution_id is not null
          and institution_id in (select distinct institution_id from lender_state_licenses where institution_id is not null)
        group by 1
        """,
    )

    lics_by = defaultdict(list)
    for l in lic_rows:
        lics_by[l["institution_id"]].append(l)
    ev_by = defaultdict(list)
    for e in ev_rows:
        ev_by[e["institution_id"]].append(e)
    hmda_by = {r["institution_id"]: {"rows": r["rows"], "applications": int(r["applications"]), "originations": int(r["originations"]), "vintages": list(r["vintages"] or []), "geo_grain": "state", "state_code": "FL"} for r in hmda_rows}
    cfpb_by = {r["institution_id"]: int(r["n"]) for r in cfpb_rows}

    used = {}
    payloads = []
    qa_meta = []
    strategies = Counter()
    for inst in inst_rows:
        iid = inst["institution_id"]
        nmls = str(inst["nmls_id"])
        lics = lics_by[iid]
        ofr_name = None
        for l in sorted(lics, key=lambda x: (0 if x["license_class"] == "MBR" else 1, x["license_number"])):
            if l.get("firm_name"):
                ofr_name = l["firm_name"]
                break
        if iid in render_slug:
            slug = render_slug[iid]
            strategies["reuse_national_render"] += 1
        elif iid in index_slug:
            slug = index_slug[iid]
            strategies["reuse_national_index"] += 1
        else:
            base = slugify(ofr_name or inst.get("legal_name") or inst.get("display_name") or "") or "institution"
            slug = base
            if slug in reserved or slug in used:
                slug = f"{base}-nmls-{nmls}"
                strategies["disambiguated_nmls"] += 1
            else:
                strategies["name"] += 1
            if slug in reserved or slug in used:
                slug = f"{base}-nmls-{nmls}-{iid.replace('-', '')[:8]}"
                strategies["disambiguated_id"] += 1
        if slug in used:
            print("STOP slug collision", slug)
            conn.close()
            return 5
        used[slug] = iid
        reserved.add(slug)
        national = {
            "render": iid in render_ids,
            "index": iid in index_ids,
            "has_lpi": bool(inst["has_lpi"]),
        }
        events = ev_by.get(iid, [])
        profile = build_profile(inst, lics, events, hmda_by.get(iid), cfpb_by.get(iid, 0), slug, national)
        digest = sha_profile(profile)
        classes = sorted({l["license_class"] for l in lics})
        qa_meta.append(
            {
                "institution_id": iid,
                "nmls_id": nmls,
                "slug": slug,
                "name": profile["identity"]["canonical_name"],
                "classes": classes,
                "dual": "MBR" in classes and "MLD" in classes,
                "servicer_yes": sum(1 for l in lics if l.get("license_class") == "MLD" and l.get("servicer_flag") == "Yes"),
                "ofr_n": len(events),
                "fine_n": sum(1 for e in events if e.get("amount") is not None),
                "hmda": iid in hmda_by,
                "cfpb_n": cfpb_by.get(iid, 0),
                "cred_n": len(lics),
                "has_lpi": bool(inst["has_lpi"]),
                "national_render": iid in render_ids,
            }
        )
        payloads.append(
            (
                iid,
                "FL",
                CONTRACT,
                nmls,
                slug,
                Json(profile),
                digest,
                len(lics),
                len(events),
                bool(inst["has_lpi"]),
                "internal_only",
            )
        )

    if len(payloads) != 6303:
        print("STOP payload", len(payloads))
        conn.close()
        return 6

    qa = pick_qa(qa_meta)
    summary = {
        "workset": 6303,
        "held_excluded": 22,
        "slug_strategies": dict(strategies),
        "unique_slugs": len(used),
        "has_lpi": sum(1 for r in qa_meta if r["has_lpi"]),
        "no_lpi": sum(1 for r in qa_meta if not r["has_lpi"]),
        "apply": apply,
    }
    print(json.dumps(summary, indent=2))

    if not apply:
        conn.rollback()
        conn.close()
        print("DRY_RUN_GENERATE_OK", len(payloads))
        return 0

    conn.rollback()
    conn.close()
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=RealDictCursor)
    apply_migration(cur)
    before = n(cur, "select count(*) from lender_state_company_profiles")
    ins = """
        insert into lender_state_company_profiles (
          institution_id, jurisdiction, contract_version, nmls_id, slug, profile,
          content_sha256, credential_count, confirmed_ofr_event_count, has_national_snapshot,
          public_projection_status
        ) values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        on conflict (institution_id) do update set
          nmls_id = excluded.nmls_id,
          slug = excluded.slug,
          profile = excluded.profile,
          content_sha256 = excluded.content_sha256,
          credential_count = excluded.credential_count,
          confirmed_ofr_event_count = excluded.confirmed_ofr_event_count,
          has_national_snapshot = excluded.has_national_snapshot,
          computed_at = now()
        where lender_state_company_profiles.content_sha256 is distinct from excluded.content_sha256
        """

    def reconnect():
        nonlocal conn, cur
        try:
            conn.close()
        except Exception:
            pass
        conn = psycopg2.connect(dsn)
        conn.autocommit = True
        cur = conn.cursor(cursor_factory=RealDictCursor)

    for i, row in enumerate(payloads):
        for attempt in range(5):
            try:
                cur.execute(ins, row)
                break
            except Exception:
                if attempt == 4:
                    raise
                reconnect()
        if i and i % 500 == 0:
            print("progress", i, flush=True)
    after = n(cur, "select count(*) from lender_state_company_profiles")
    dup_slug = n(cur, "select count(*) from (select slug from lender_state_company_profiles group by 1 having count(*)>1) s")
    held_leak = n(
        cur,
        """
        select count(*) from lender_state_company_profiles p
        join lender_state_licenses l on l.nmls_id=p.nmls_id
        where l.institution_id is null
        """,
    )
    ofr_sum = n(cur, "select coalesce(sum(confirmed_ofr_event_count),0) from lender_state_company_profiles")
    ofr_prof = n(cur, "select count(*) from lender_state_company_profiles where confirmed_ofr_event_count>=1")
    status_bad = n(cur, "select count(*) from lender_state_company_profiles where public_projection_status<>'internal_only'")
    grants = rows(
        cur,
        """
        select grantee, privilege_type from information_schema.role_table_grants
        where table_schema='public' and table_name='lender_state_company_profiles'
          and grantee in ('anon','authenticated')
        """,
    )
    if after != 6303 or dup_slug or held_leak or ofr_sum != 342 or ofr_prof != 294 or status_bad or grants:
        conn.rollback()
        print("STOP post-write", dict(after=after, dup_slug=dup_slug, held_leak=held_leak, ofr_sum=ofr_sum, ofr_prof=ofr_prof, status_bad=status_bad, grants=grants))
        conn.close()
        return 7
    lpi2 = n(cur, "select count(*) from lender_profile_intelligence")
    inst2 = n(cur, "select count(*) from lender_national_entities where entity_kind='institution'")
    if lpi2 != 8447 or inst2 != 14623:
        print("STOP national mutation", lpi2, inst2)
        conn.close()
        return 8

    recon = {
        "florida_confirmed_companies": after,
        "license_credential_rows_attached": n(cur, "select count(*) from lender_state_licenses where institution_id is not null"),
        "mbr_attached": n(cur, "select count(*) from lender_state_licenses where institution_id is not null and license_class='MBR'"),
        "mld_attached": n(cur, "select count(*) from lender_state_licenses where institution_id is not null and license_class='MLD'"),
        "dual_companies": n(
            cur,
            """
            select count(*) from (
              select nmls_id from lender_state_licenses where institution_id is not null
              group by 1
              having count(*) filter (where license_class='MBR')>=1
                 and count(*) filter (where license_class='MLD')>=1
            ) s
            """,
        ),
        "servicer_yes_companies": n(
            cur,
            """
            select count(distinct institution_id) from lender_state_licenses
            where institution_id is not null and license_class='MLD' and servicer_flag='Yes'
            """,
        ),
        "profiles_with_phone": n(
            cur,
            """
            select count(distinct institution_id) from lender_state_licenses
            where institution_id is not null and phone is not null and phone<>''
            """,
        ),
        "profiles_with_prim_addr": n(
            cur,
            """
            select count(distinct institution_id) from lender_state_licenses
            where institution_id is not null and prim_address1 is not null and prim_address1<>''
            """,
        ),
        "profiles_with_mail_addr": n(
            cur,
            """
            select count(distinct institution_id) from lender_state_licenses
            where institution_id is not null and mail_address1 is not null and mail_address1<>''
            """,
        ),
        "profiles_with_confirmed_ofr": ofr_prof,
        "confirmed_ofr_event_observations": int(ofr_sum),
        "no_confirmed_ofr_profiles": after - ofr_prof,
        "confirmed_fine_obs": n(
            cur,
            """
            select count(*) from lender_state_regulatory_events
            where respondent_kind='institution' and attribution_confidence='confirmed' and amount is not null
            """,
        ),
        "confirmed_fine_dollars": float(
            n(
                cur,
                """
                select coalesce(sum(amount),0) from lender_state_regulatory_events
                where respondent_kind='institution' and attribution_confidence='confirmed' and amount is not null
                """,
            )
        ),
        "profiles_with_hmda": n(cur, "select count(*) from lender_state_company_profiles p where (p.profile->'hmda'->'florida_state_grain') is not null"),
        "profiles_with_cfpb": n(cur, "select count(*) from lender_state_company_profiles p where coalesce((p.profile->'cfpb'->>'confirmed_rows')::int,0)>0"),
        "profiles_with_federal": n(cur, "select count(*) from lender_state_company_profiles p where coalesce((p.profile->'federalRegulatory'->>'confirmed_events')::int,0)>0"),
        "has_lpi_overlap": n(cur, "select count(*) from lender_state_company_profiles where has_national_snapshot"),
        "rows_before": before,
        "rows_after": after,
        "anon_authenticated_grants": grants,
    }
    post = {
        "task": "FL-LEND-006",
        "target": REF,
        "contract": CONTRACT,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": summary,
        "reconciliation": recon,
        "qa_cohort_count": len(qa),
        "idempotency_hint": {"before": before, "after": after, "new_if_before_zero": after - before},
    }
    OUT.write_text(json.dumps(post, default=str, indent=2), encoding="utf-8")
    QA_OUT.write_text(
        json.dumps(
            {
                "task": "FL-LEND-006",
                "public": False,
                "index": False,
                "sitemap": False,
                "production_renderer": False,
                "federal_slot": "NONE_AVAILABLE_IN_WORKSET",
                "count": len(qa),
                "rows": qa,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(json.dumps(recon, default=str, indent=2))
    print("APPLY_OK", after)
    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
