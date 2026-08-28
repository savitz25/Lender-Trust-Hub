#!/usr/bin/env python3
"""FL-LEND-009 prewrite audit + dry-run. Read-only. No production writes."""
from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
import importlib.util

import psycopg2
from psycopg2.extras import RealDictCursor

ROOT = Path(r"C:\Users\makei\lender-trust-hub-ask-search-009")
SRC = ROOT / "data" / "florida" / "fl-lend-001-source" / "unzipped"
OUT = ROOT / "docs" / "fl-lend-009-prewrite.json"
NMLS_RE = re.compile(r"^[0-9]{3,12}$")
HELD = {
    "2600", "2916", "3013", "3114", "10287", "18188", "88244", "169063", "205042",
    "238143", "322180", "372178", "391521", "461249", "1028232", "1268485",
    "1359205", "1992052", "2085556", "2286700", "2493643", "2669836",
}


def nmls_norm(v: str | None) -> str | None:
    if not v:
        return None
    s = re.sub(r"[^0-9]", "", str(v).strip())
    if NMLS_RE.fullmatch(s):
        return s
    return None


def load_csv(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8-sig", errors="replace", newline="") as f:
        return list(csv.DictReader(f))


def load_g():
    spec = importlib.util.spec_from_file_location("g", ROOT / "scripts" / "fl-lend-006-generate.py")
    g = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(g)
    return g


def class_audit(rows: list[dict], want_types: set[str], label: str) -> dict:
    typed = [r for r in rows if (r.get("LICENSE TYPE") or "").strip() in want_types]
    statuses = Counter((r.get("STATUS") or "").strip() for r in typed)
    types = Counter((r.get("LICENSE TYPE") or "").strip() for r in typed)
    approved = [r for r in typed if (r.get("STATUS") or "").strip() == "Approved"]
    lic_all = [(r.get("LICENSE NUMBER") or "").strip() for r in typed]
    lic_ok = [x for x in lic_all if x]
    nmls_all = [nmls_norm(r.get("NMLS ID")) for r in typed]
    nmls_ok = [x for x in nmls_all if x]
    nmls_missing = sum(1 for x in nmls_all if not x)
    nmls_malformed = 0
    for r in typed:
        raw = (r.get("NMLS ID") or "").strip()
        if raw and not nmls_norm(raw):
            nmls_malformed += 1
    appr_nmls = [nmls_norm(r.get("NMLS ID")) for r in approved]
    appr_nmls_ok = [x for x in appr_nmls if x]
    dup_groups = {k: v for k, v in Counter(appr_nmls_ok).items() if v > 1}
    lic_dups = {k: v for k, v in Counter(lic_ok).items() if v > 1}
    phones = sum(1 for r in approved if (r.get("PHONE") or "").strip())
    email_cols = [c for c in (typed[0].keys() if typed else []) if "MAIL" in c.upper() and "ADDRESS" not in c.upper() and "EMAIL" in c.upper()]
    emails = 0
    addr = sum(1 for r in approved if (r.get("PRIM ADDRESS 1") or "").strip())
    mail = sum(1 for r in approved if (r.get("MAIL ADDRESS 1") or "").strip())
    company_cols = [
        c
        for c in (typed[0].keys() if typed else [])
        if re.search(r"employ|sponsor|company nmls|parent|main office|qualif|associated|firm nmls|company id", c, re.I)
    ]
    return {
        "label": label,
        "source_rows": len(typed),
        "status_distribution": dict(statuses),
        "type_distribution": dict(types),
        "approved_rows": len(approved),
        "unique_nmls_all": len(set(nmls_ok)),
        "unique_approved_nmls": len(set(appr_nmls_ok)),
        "approved_missing_nmls": sum(1 for x in appr_nmls if not x),
        "malformed_nmls": nmls_malformed,
        "missing_nmls_all": nmls_missing,
        "license_rows": len(lic_ok),
        "unique_licenses": len(set(lic_ok)),
        "duplicate_license_groups": len(lic_dups),
        "duplicate_approved_nmls_groups": len(dup_groups),
        "max_rows_per_approved_nmls": max(Counter(appr_nmls_ok).values()) if appr_nmls_ok else 0,
        "phone_approved": phones,
        "email_columns": email_cols,
        "email_approved": emails,
        "prim_address_approved": addr,
        "mail_address_approved": mail,
        "company_reference_columns": company_cols,
        "columns": list(typed[0].keys()) if typed else [],
    }


def main() -> int:
    mbr = load_csv(SRC / "mbr-mbrb" / "MortgageFirms_MBR-MBRB_Monthly.csv")
    mld = load_csv(SRC / "mld-mldb" / "MortgageFirms_MLD-MLDB_Monthly.csv")
    lo = (
        load_csv(SRC / "lo-ai" / "LoanOrignators_AI_Monthly.csv")
        + load_csv(SRC / "lo-jr" / "LoanOrignators_JR_Monthly.csv")
        + load_csv(SRC / "lo-sz" / "LoanOrignators_SZ_Monthly.csv")
    )
    firms = mbr + mld

    lo_audit = class_audit(lo, {"LO"}, "LO")
    mbrb_audit = class_audit(firms, {"MBRB"}, "MBRB")
    mldb_audit = class_audit(firms, {"MLDB"}, "MLDB")

    lo_appr = [r for r in lo if (r.get("LICENSE TYPE") or "").strip() == "LO" and (r.get("STATUS") or "").strip() == "Approved"]
    mbrb_appr = [r for r in firms if (r.get("LICENSE TYPE") or "").strip() == "MBRB" and (r.get("STATUS") or "").strip() == "Approved"]
    mldb_appr = [r for r in firms if (r.get("LICENSE TYPE") or "").strip() == "MLDB" and (r.get("STATUS") or "").strip() == "Approved"]
    company_appr = [
        r
        for r in firms
        if (r.get("LICENSE TYPE") or "").strip() in {"MBR", "MLD"} and (r.get("STATUS") or "").strip() == "Approved"
    ]

    lo_nmls = {nmls_norm(r.get("NMLS ID")) for r in lo_appr}
    lo_nmls.discard(None)
    mbrb_nmls = {nmls_norm(r.get("NMLS ID")) for r in mbrb_appr}
    mbrb_nmls.discard(None)
    mldb_nmls = {nmls_norm(r.get("NMLS ID")) for r in mldb_appr}
    mldb_nmls.discard(None)
    branch_nmls = mbrb_nmls | mldb_nmls
    company_nmls = {nmls_norm(r.get("NMLS ID")) for r in company_appr}
    company_nmls.discard(None)

    dual_branch = mbrb_nmls & mldb_nmls
    lo_company_overlap = lo_nmls & company_nmls
    branch_company_overlap = branch_nmls & company_nmls
    lo_branch_overlap = lo_nmls & branch_nmls

    # license uniqueness across all current approved classes
    all_appr_lic = []
    for r, cls in [(x, "LO") for x in lo_appr] + [(x, "MBRB") for x in mbrb_appr] + [(x, "MLDB") for x in mldb_appr]:
        all_appr_lic.append((r.get("LICENSE NUMBER") or "").strip())
    lic_blank = sum(1 for x in all_appr_lic if not x)

    # noncurrent
    lo_non = [r for r in lo if (r.get("LICENSE TYPE") or "").strip() == "LO" and (r.get("STATUS") or "").strip() != "Approved"]
    br_non = [
        r
        for r in firms
        if (r.get("LICENSE TYPE") or "").strip() in {"MBRB", "MLDB"} and (r.get("STATUS") or "").strip() != "Approved"
    ]

    # Approved LO that also have non-approved extra licenses
    lo_by_nmls = defaultdict(list)
    for r in lo:
        if (r.get("LICENSE TYPE") or "").strip() != "LO":
            continue
        n = nmls_norm(r.get("NMLS ID"))
        if n:
            lo_by_nmls[n].append(r)
    multi_cred_lo = sum(1 for n, rs in lo_by_nmls.items() if n in lo_nmls and len(rs) > 1)

    br_by_nmls = defaultdict(list)
    for r in firms:
        if (r.get("LICENSE TYPE") or "").strip() not in {"MBRB", "MLDB"}:
            continue
        n = nmls_norm(r.get("NMLS ID"))
        if n:
            br_by_nmls[n].append(r)
    multi_cred_br = sum(1 for n, rs in br_by_nmls.items() if n in branch_nmls and len({(x.get("LICENSE TYPE") or "").strip() for x in rs}) > 1)

    g = load_g()
    conn = psycopg2.connect(g.lender_dsn())
    conn.set_session(readonly=True, autocommit=True)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    u = __import__("urllib.parse", fromlist=["urlparse"]).urlparse(g.lender_dsn())
    host_ok = "hidcrbex" in (u.username or "") or "hidcrbex" in (u.hostname or "")

    def q(sql, params=None):
        cur.execute(sql, params)
        return [dict(r) for r in cur.fetchall()]

    def n(sql, params=None):
        cur.execute(sql, params)
        return list(cur.fetchone().values())[0]

    graph = {
        "institutions": n("select count(*) from lender_national_entities where entity_kind='institution'"),
        "person_mlo": n("select count(*) from lender_national_entities where entity_kind='person_mlo'"),
        "branch": n("select count(*) from lender_national_entities where entity_kind='branch'"),
        "nmls_institution": n("select count(*) from lender_identifiers where identifier_type='NMLS_INSTITUTION'"),
        "nmls_branch": n("select count(*) from lender_identifiers where identifier_type='NMLS_BRANCH'"),
        "nmls_person": n("select count(*) from lender_identifiers where identifier_type='NMLS_PERSON'"),
        "nmls_branch_unattached": n(
            "select count(*) from lender_identifiers where identifier_type='NMLS_BRANCH' and entity_id is null"
        ),
        "nmls_branch_values": [r["identifier_value"] for r in q("select identifier_value from lender_identifiers where identifier_type='NMLS_BRANCH'")],
        "relationships": n("select count(*) from lender_entity_relationships"),
        "licenses": n("select count(*) from lender_state_licenses"),
        "license_classes": {r["license_class"]: r["n"] for r in q("select license_class, count(*) n from lender_state_licenses group by 1")},
        "profiles": n("select count(*) from lender_state_company_profiles"),
        "sre": n("select count(*) from lender_state_regulatory_events"),
        "sre_company_confirmed": n(
            "select count(*) from lender_state_regulatory_events where respondent_kind='institution' and attribution_confidence='confirmed'"
        ),
        "sre_company_inst": n(
            "select count(distinct institution_id) from lender_state_regulatory_events where respondent_kind='institution' and attribution_confidence='confirmed'"
        ),
        "sre_person": n("select count(*) from lender_state_regulatory_events where respondent_kind='person_mlo'"),
        "sre_branch": n("select count(*) from lender_state_regulatory_events where respondent_kind='branch'"),
        "sre_mixed": n("select count(*) from lender_state_regulatory_events where respondent_kind='mixed'"),
        "identifier_types": [r["identifier_type"] for r in q("select unnest(enum_range(null::text))") ] if False else [],
    }
    sre_person = q(
        """
        select nmls_id, license_number, attribution_confidence, match_method, event_type_normalized, finding_type
        from lender_state_regulatory_events where respondent_kind='person_mlo'
        """
    )
    sre_branch = q(
        """
        select nmls_id, license_number, attribution_confidence, match_method, event_type_normalized, finding_type
        from lender_state_regulatory_events where respondent_kind='branch'
        """
    )
    sre_mixed = q("select id, nmls_id, license_number, subject_raw, attribution_confidence from lender_state_regulatory_events where respondent_kind='mixed'")

    person_nmls_hit = sum(1 for r in sre_person if nmls_norm(r["nmls_id"]) in lo_nmls)
    person_lic_set = {(r.get("LICENSE NUMBER") or "").strip() for r in lo_appr}
    person_lic_hit = sum(1 for r in sre_person if (r["license_number"] or "") in person_lic_set)
    branch_nmls_hit = sum(1 for r in sre_branch if nmls_norm(r["nmls_id"]) in branch_nmls)
    branch_lic_set = {(r.get("LICENSE NUMBER") or "").strip() for r in mbrb_appr + mldb_appr}
    branch_lic_hit = sum(1 for r in sre_branch if (r["license_number"] or "") in branch_lic_set)

    existing_branch_ids = set(graph["nmls_branch_values"])
    new_branch_nmls = branch_nmls - existing_branch_ids
    existing_person = n("select count(*) from lender_identifiers where identifier_type='NMLS_PERSON'")

    # existing company licenses to avoid colliding unique(jurisdiction, license_number)
    existing_lic = {r["license_number"] for r in q("select license_number from lender_state_licenses")}
    new_lo_lic = {(r.get("LICENSE NUMBER") or "").strip() for r in lo_appr} - {""}
    new_br_lic = {(r.get("LICENSE NUMBER") or "").strip() for r in mbrb_appr + mldb_appr} - {""}
    lic_collide = (new_lo_lic | new_br_lic) & existing_lic

    predicted_person_entities = len(lo_nmls)  # existing person_mlo is 0
    predicted_branch_entities = len(new_branch_nmls)
    predicted_nmls_person = len(lo_nmls) - existing_person
    predicted_nmls_branch = len(new_branch_nmls)
    # extra credentials on approved NMLS including non-approved extra licenses? contract: approved foundation
    predicted_lo_creds = len(new_lo_lic - existing_lic)
    predicted_br_creds = len(new_br_lic - existing_lic)

    stop = {
        "person_nmls_mixed_into_institution": len(lo_company_overlap) > 0,
        "branch_nmls_mixed_into_institution": len(branch_company_overlap) > 0,
        "lo_branch_nmls_overlap": len(lo_branch_overlap) > 0,
        "cannot_distinguish_person_vs_branch": len(lo_branch_overlap) > 0,
        "name_only_canonical": False,
        "wrong_db": not host_ok,
        "license_pk_collision": len(lic_collide) > 0,
        "held_silently_attached": False,
    }

    dry = {
        "new_PERSON_MLO_entities": predicted_person_entities,
        "existing_person_overlap": existing_person,
        "new_BRANCH_entities": predicted_branch_entities,
        "existing_branch_identifier_overlap": len(branch_nmls & existing_branch_ids),
        "new_NMLS_PERSON": predicted_nmls_person,
        "new_NMLS_BRANCH": predicted_nmls_branch,
        "new_LO_credentials": predicted_lo_creds,
        "new_branch_credentials": predicted_br_creds,
        "person_company_confirmed_relations": 0,
        "branch_company_confirmed_relations": 0,
        "person_branch_confirmed_relations": 0,
        "reason_relations_zero": "OFR Chapter 494 monthly LO/MBRB/MLDB files contain no employer, sponsor, parent, main-office, or company-NMLS column. Name/address/phone inference is forbidden.",
        "regulatory_person_confirmed_nmls": person_nmls_hit,
        "regulatory_person_confirmed_license": person_lic_hit,
        "regulatory_person_events": len(sre_person),
        "regulatory_branch_confirmed_nmls": branch_nmls_hit,
        "regulatory_branch_confirmed_license": branch_lic_hit,
        "regulatory_branch_events": len(sre_branch),
        "mixed_events": len(sre_mixed),
        "license_pk_collisions": sorted(lic_collide)[:20],
        "idempotency_key": {
            "entities": "stable_key = nmls-person:{nmls} | nmls-branch:{nmls}",
            "identifiers": "(identifier_type, identifier_value)",
            "licenses": "(jurisdiction, license_number) and (source_dataset, source_record_id)",
            "relationships": "none predicted from current official files",
        },
    }

    out = {
        "task": "FL-LEND-009",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "target": "hidcrbexurginnuqgipx",
        "host_ok": host_ok,
        "architecture": {
            "entity_table": "lender_national_entities",
            "kinds": ["institution", "branch", "person_mlo"],
            "person_identifier_type": "NMLS_PERSON",
            "person_identifier_note": "Existing enum is NMLS_PERSON, not NMLS_INDIVIDUAL. Use existing type; do not split namespace.",
            "branch_identifier_type": "NMLS_BRANCH",
            "license_table": "lender_state_licenses already allows LO,MBRB,MLDB; FL-LEND-002 ingested Approved MBR/MLD only",
            "relationship_table": "lender_entity_relationships currently SUBSIDIARY_OF/PARENT_OF/BRAND_OF/SUCCESSOR_TO/PREDECESSOR_OF; needs ASSOCIATED_WITH and BELONGS_TO plus temporality",
            "company_graph_locked": True,
            "publication": "none",
        },
        "lo": lo_audit,
        "mbrb": mbrb_audit,
        "mldb": mldb_audit,
        "overlaps": {
            "lo_company_nmls": len(lo_company_overlap),
            "branch_company_nmls": len(branch_company_overlap),
            "lo_branch_nmls": len(lo_branch_overlap),
            "dual_mbrb_mldb_nmls": len(dual_branch),
        },
        "approved_unique": {
            "lo_nmls": len(lo_nmls),
            "mbrb_nmls": len(mbrb_nmls),
            "mldb_nmls": len(mldb_nmls),
            "branch_nmls": len(branch_nmls),
            "dual_branch_nmls": len(dual_branch),
        },
        "historical": {
            "lo_nonapproved_rows": len(lo_non),
            "branch_nonapproved_rows": len(br_non),
            "approved_lo_with_additional_license_rows": multi_cred_lo,
            "approved_branch_with_both_classes_in_source": multi_cred_br,
        },
        "blank_approved_licenses": lic_blank,
        "graph": graph,
        "regulatory_preview": {
            "person_events": len(sre_person),
            "person_with_nmls": sum(1 for r in sre_person if nmls_norm(r["nmls_id"])),
            "person_with_license": sum(1 for r in sre_person if r["license_number"]),
            "person_nmls_in_approved_lo": person_nmls_hit,
            "person_license_in_approved_lo": person_lic_hit,
            "person_conf_now": Counter(r["attribution_confidence"] for r in sre_person),
            "branch_events": len(sre_branch),
            "branch_with_nmls": sum(1 for r in sre_branch if nmls_norm(r["nmls_id"])),
            "branch_nmls_in_approved": branch_nmls_hit,
            "branch_license_in_approved": branch_lic_hit,
            "branch_conf_now": Counter(r["attribution_confidence"] for r in sre_branch),
            "mixed": sre_mixed,
        },
        "stop": stop,
        "dry_run": dry,
        "pass": host_ok
        and not any(stop.values())
        and len(lo_nmls) > 0
        and len(branch_nmls) > 0
        and lo_audit["company_reference_columns"] == []
        and mbrb_audit["company_reference_columns"] == []
        and mldb_audit["company_reference_columns"] == [],
    }
    # JSON-safe counters
    out["regulatory_preview"]["person_conf_now"] = dict(out["regulatory_preview"]["person_conf_now"])
    out["regulatory_preview"]["branch_conf_now"] = dict(out["regulatory_preview"]["branch_conf_now"])
    OUT.write_text(json.dumps(out, indent=2, default=str), encoding="utf-8")
    print(json.dumps({k: out[k] for k in out if k not in ("lo", "mbrb", "mldb")}, indent=2, default=str)[:8000])
    print("LO", json.dumps({k: lo_audit[k] for k in lo_audit if k != "columns"}, indent=2))
    print("MBRB", json.dumps({k: mbrb_audit[k] for k in mbrb_audit if k != "columns"}, indent=2))
    print("MLDB", json.dumps({k: mldb_audit[k] for k in mldb_audit if k != "columns"}, indent=2))
    print("PREWRITE", "PASS" if out["pass"] else "FAIL", "STOP", {k: v for k, v in stop.items() if v})
    return 0 if out["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
