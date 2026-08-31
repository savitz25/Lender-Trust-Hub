"""FL-LEND-002F exact-NMLS PRR 141437 ingest and verification runner.

Modes before production write: check, dry-run.
Write modes: schema, stage, apply, verify, all.
The runner refuses any database URL that is not the canonical Lender project.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import os
import re
import sys
import tempfile
import time
from collections import Counter, defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import psycopg2
import psycopg
from psycopg2.extras import Json, RealDictCursor, execute_values

ROOT = Path(__file__).resolve().parents[1]
PROJECT_REF = "hidcrbexurginnuqgipx"
DATASET = "FL_OFR_NMLS_PRR_141437"
REQUEST = "141437"
REFERENCE = "1341691"
OBSERVED = date(2026, 8, 30)
NAMESPACE = "9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b"
DEFAULT_SOURCE = Path(
    r"C:\Users\makei\Dropbox\Ask Trust Hub\Lender-Trust_Hub\data\Florida Office Public Records- Mortgage-loan-branches"
)
ENV_CANDIDATES = [
    Path(r"C:\Users\makei\lender-trust-hub-ask-search-009\.env.local"),
    Path(r"C:\Users\makei\lender-trust-hub\.env.local.txt"),
    ROOT / ".env.local",
]
OUT = ROOT / "data" / "generated" / "fl-lend-002f"
MIGRATION = ROOT / "supabase" / "migrations" / "20260831160000_fl_lend_002f_observation_ledger.sql"

FILES = {
    "Branches.csv": {
        "bytes": 14_877_292,
        "sha256": "f8284469af1f8ffd036a9f64f993fb44491f5ec6e6182349a3ab09ed13ffad84",
        "rows": 42_166,
        "generated": datetime(2026, 8, 31, 8, 41),
        "scope": "ALL_STATUS_LEDGER",
    },
    "Loan Originators.csv": {
        "bytes": 17_053_891,
        "sha256": "2654424737ffb2eeb67a32af4cc25d79f93757d4be9d315a4ec80c7f252d7d36",
        "rows": 61_668,
        "generated": datetime(2026, 8, 31, 8, 0),
        "scope": "ACTIVE_SNAPSHOT",
    },
    "Mortgage Businesses.csv": {
        "bytes": 4_080_862,
        "sha256": "f17e4974578cb08b1405f82fe31dd78e9659f438dc8396cc7406abe45b40c0e9",
        "rows": 13_321,
        "generated": datetime(2026, 8, 31, 8, 0),
        "scope": "ACTIVE_SNAPSHOT",
    },
}

LICENSE_CLASS = {
    "FL Mortgage Broker License": "MBR",
    "FL Mortgage Broker Branch License": "MBRB",
    "FL Mortgage Lender License": "MLD",
    "FL Mortgage Lender Branch License": "MLDB",
    "FL Mortgage Lender Servicer License": "MLS",
    "FL Mortgage Lender Servicer Branch License": "MLSB",
    "FL Mortgage Loan Originator License": "LO",
}
COUNTRY_ANOMALIES = {"ABC", "QCC", "ZWB", "BCC"}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    text = value.replace("\u00a0", " ")
    replacements = {"â€™": "’", "â€œ": "“", "â€": "”", "Â": ""}
    for bad, good in replacements.items():
        text = text.replace(bad, good)
    return re.sub(r"\s+", " ", text).strip()


def normalize_status(value: str | None) -> str:
    return re.sub(r"[^A-Z0-9]+", "_", normalize_text(value).upper()).strip("_")


def parse_date(value: str | None) -> date | None:
    value = normalize_text(value)
    if not value:
        return None
    for fmt in ("%m/%d/%Y", "%Y-%m-%d", "%m/%d/%y"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            pass
    return None


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def fingerprint(value: Any) -> str:
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def open_source(path: Path):
    # OFR export contains UTF-8 BOM-like bytes and later Windows-1252 bytes.
    raw = path.read_bytes()
    text = raw.decode("cp1252")
    if text.startswith("ï»¿"):
        text = text[3:]
    return io.StringIO(text, newline="")


def read_source(path: Path) -> tuple[dict[str, str], list[dict[str, str]]]:
    with open_source(path) as handle:
        reader = csv.reader(handle)
        meta_values = next(reader)
        headers = next(reader)
        headers[0] = headers[0].lstrip("\ufeff").replace("ï»¿", "")
        metadata: dict[str, str] = {}
        for item in meta_values:
            if ":" in item:
                key, value = item.split(":", 1)
                metadata[key.strip()] = value.strip()
        rows = []
        for number, values in enumerate(reader, 1):
            if len(values) != len(headers):
                raise SystemExit(f"STOP malformed-width row {path.name}:{number}")
            row = dict(zip(headers, values))
            row["__row_number"] = str(number)
            rows.append(row)
    return metadata, rows


def source_dir() -> Path:
    return Path(os.environ.get("FL_LEND_002F_SOURCE_DIR", str(DEFAULT_SOURCE)))


def source_audit() -> tuple[dict[str, Any], dict[str, list[dict[str, str]]]]:
    root = source_dir()
    report: dict[str, Any] = {"dataset": DATASET, "files": {}, "counts": {}}
    loaded: dict[str, list[dict[str, str]]] = {}
    for name, expected in FILES.items():
        path = root / name
        if not path.exists():
            raise SystemExit(f"STOP missing source file: {path}")
        size, digest = path.stat().st_size, sha256_file(path)
        if size != expected["bytes"] or digest != expected["sha256"]:
            raise SystemExit(f"STOP source lock mismatch: {name}")
        meta, rows = read_source(path)
        if len(rows) != expected["rows"]:
            raise SystemExit(f"STOP row count {name}={len(rows)} expected={expected['rows']}")
        if meta.get("As Of Date") != "8/30/2026":
            raise SystemExit(f"STOP source vintage mismatch {name}: {meta}")
        loaded[name] = rows
        report["files"][name] = {
            "bytes": size,
            "sha256": digest,
            "rows": len(rows),
            "metadata": meta,
            "scope": expected["scope"],
        }

    branches, mlos, businesses = loaded["Branches.csv"], loaded["Loan Originators.csv"], loaded["Mortgage Businesses.csv"]
    counts = {
        "branches_rows": len(branches),
        "branches_branch_rows": sum(bool(normalize_text(r["Branch Id"])) for r in branches),
        "branches_company_rows": sum(not normalize_text(r["Branch Id"]) for r in branches),
        "branches_company_ids": len({normalize_text(r["Company Id"]) for r in branches}),
        "business_rows": len(businesses),
        "business_branch_rows": sum(bool(normalize_text(r["Branch Id"])) for r in businesses),
        "business_company_rows": sum(not normalize_text(r["Branch Id"]) for r in businesses),
        "business_company_ids": len({normalize_text(r["Company Id"]) for r in businesses}),
        "mlo_rows": len(mlos),
        "mlo_with_license": sum(bool(normalize_text(r["License Number"])) for r in mlos),
        "mlo_pending_without_license": sum(not normalize_text(r["License Number"]) for r in mlos),
        "mlo_distinct_ids": len({normalize_text(r["Individual Id"]) for r in mlos}),
        "sponsorship_pairs": len({(normalize_text(r["Individual Id"]), normalize_text(r["Sponsoring Company ID"])) for r in mlos if normalize_text(r["Sponsoring Company ID"])}),
        "sponsorship_accepted": sum(normalize_text(r["Sponsorship Status"]) == "Accepted" for r in mlos),
        "sponsorship_requested": sum(normalize_text(r["Sponsorship Status"]) == "Requested" for r in mlos),
        "branch_manager_pairs": len({(normalize_text(r["Branch Id"]), normalize_text(r["Branch Manager NMLS ID"])) for r in branches if normalize_text(r["Branch Id"]) and normalize_text(r["Branch Manager NMLS ID"])}),
    }
    expected_counts = {
        "branches_rows": 42166, "branches_branch_rows": 28572, "branches_company_rows": 13594,
        "branches_company_ids": 11180, "business_rows": 13321, "business_branch_rows": 6745,
        "business_company_rows": 6576, "business_company_ids": 6453, "mlo_rows": 61668,
        "mlo_with_license": 59576, "mlo_pending_without_license": 2092, "mlo_distinct_ids": 61641,
        "sponsorship_pairs": 53434, "sponsorship_accepted": 53167, "sponsorship_requested": 267,
        "branch_manager_pairs": 6671,
    }
    if counts != expected_counts:
        raise SystemExit("STOP audited count mismatch: " + json.dumps({k: [counts.get(k), v] for k, v in expected_counts.items() if counts.get(k) != v}))
    report["counts"] = counts
    report["ingest_fingerprint"] = fingerprint({"dataset": DATASET, "files": {k: v["sha256"] for k, v in report["files"].items()}})
    return report, loaded


def load_url() -> str:
    if os.environ.get("TARGET_DATABASE_URL"):
        value = os.environ["TARGET_DATABASE_URL"]
    else:
        value = ""
        for path in ENV_CANDIDATES:
            if not path.exists():
                continue
            for line in path.read_text(encoding="utf-8").splitlines():
                if line.startswith("TARGET_DATABASE_URL="):
                    value = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
            if value:
                break
    if PROJECT_REF not in value:
        raise SystemExit(f"STOP database URL is not canonical Lender project {PROJECT_REF}")
    return value


def connect(read_only: bool = False):
    conn = psycopg2.connect(load_url(), connect_timeout=30, keepalives=1, keepalives_idle=15)
    conn.autocommit = False
    if read_only:
        with conn.cursor() as cur:
            cur.execute("set transaction read only")
    return conn


def baseline(cur) -> dict[str, int]:
    cur.execute("""
      select
        (select count(*) from lender_national_entities where entity_kind='institution') institutions,
        (select count(*) from lender_national_entities where entity_kind='branch') branches,
        (select count(*) from lender_national_entities where entity_kind='person_mlo') person_mlo,
        (select count(*) from lender_profile_intelligence) profiles,
        (select count(*) from lender_state_company_profiles) state_profiles,
        (select count(*) from lender_state_licenses) licenses,
        (select count(*) from lender_state_license_observations) license_observations,
        (select count(*) from lender_entity_relationships where relationship_type='BELONGS_TO') belongs_to,
        (select count(*) from lender_entity_relationships where relationship_type='ASSOCIATED_WITH') associated_with,
        (select count(*) from lender_entity_contacts) contacts,
        (select count(*) from lender_entity_contacts c join lender_national_entities e on e.id=c.entity_id where e.entity_kind='person_mlo' and c.classification='public_candidate') person_public_candidate
    """)
    return dict(cur.fetchone())


def dry_run(report: dict[str, Any], loaded: dict[str, list[dict[str, str]]]) -> dict[str, Any]:
    conn = connect(read_only=True)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    before = baseline(cur)
    cur.execute("""select i.identifier_type,i.identifier_value,i.entity_id,e.entity_kind
      from lender_identifiers i left join lender_national_entities e on e.id=i.entity_id
      where i.identifier_type in ('NMLS_INSTITUTION','NMLS_BRANCH','NMLS_PERSON')""")
    identifiers: dict[str, dict[str, list[tuple[str | None, str | None]]]] = defaultdict(lambda: defaultdict(list))
    for row in cur.fetchall():
        identifiers[row["identifier_type"]][row["identifier_value"]].append((str(row["entity_id"]) if row["entity_id"] else None, row["entity_kind"]))
    cur.execute("select identifier_value,resolution_class from lender_source_identity_resolutions where source_dataset='FL_OFR_NMLS_PRR_141420' and identifier_type='NMLS_INSTITUTION'")
    old_company = {r["identifier_value"]: r["resolution_class"] for r in cur.fetchall()}
    cur.execute("select individual_nmls_id,sponsor_company_nmls_id,sponsorship_status from staging_fl_ofr_sponsorships")
    old_sponsorship = {(r["individual_nmls_id"], r["sponsor_company_nmls_id"]): r["sponsorship_status"] for r in cur.fetchall()}
    cur.execute("select branch_nmls_id,parent_company_nmls_id,license_number,license_class from staging_fl_ofr_branches where source_dataset='FL_OFR_NMLS_PRR_141420'")
    old_branch_rows = cur.fetchall()
    old_branch_keys = {(r["branch_nmls_id"], r["parent_company_nmls_id"], r["license_number"] or "", r["license_class"]) for r in old_branch_rows}
    old_branch_ids = {r["branch_nmls_id"] for r in old_branch_rows if r["branch_nmls_id"]}
    cur.execute("select company_nmls_id,license_number,license_class from staging_fl_ofr_company_credentials where source_dataset='FL_OFR_NMLS_PRR_141420'")
    old_company_keys = {(r["company_nmls_id"], r["license_number"] or "", r["license_class"]) for r in cur.fetchall()}
    cur.execute("select individual_nmls_id,fl_lo_license from staging_fl_ofr_mlos where source_dataset='FL_OFR_NMLS_PRR_141420'")
    old_mlo_keys = {(r["individual_nmls_id"], r["fl_lo_license"]) for r in cur.fetchall() if r["fl_lo_license"]}
    conn.rollback(); conn.close()

    branches, mlos, businesses = loaded["Branches.csv"], loaded["Loan Originators.csv"], loaded["Mortgage Businesses.csv"]
    all_companies = {normalize_text(r["Company Id"]) for r in branches}
    active_companies = {normalize_text(r["Company Id"]) for r in businesses}
    attached, unresolved, conflicts, malformed = set(), set(), set(), set()
    for nmls in all_companies:
        hits = identifiers["NMLS_INSTITUTION"].get(nmls, [])
        entity_hits = {(entity_id, kind) for entity_id, kind in hits if entity_id}
        if not re.fullmatch(r"[0-9]{3,12}", nmls): malformed.add(nmls)
        elif len(entity_hits) == 1 and next(iter(entity_hits))[1] == "institution": attached.add(nmls)
        elif len(entity_hits) == 0: unresolved.add(nmls)
        else: conflicts.add(nmls)

    class_for = lambda row: LICENSE_CLASS.get(normalize_text(row["License Name"]), "")
    active_branches = {normalize_text(r["Branch Id"]) for r in businesses if normalize_text(r["Branch Id"])}
    new_branch_keys = {(normalize_text(r["Branch Id"]), normalize_text(r["Company Id"]), normalize_text(r["License Number"]), class_for(r)) for r in businesses if normalize_text(r["Branch Id"])}
    new_company_keys = {(normalize_text(r["Company Id"]), normalize_text(r["License Number"]), class_for(r)) for r in businesses if not normalize_text(r["Branch Id"])}
    mlo_keys = {(normalize_text(r["Individual Id"]), normalize_text(r["License Number"])) for r in mlos if normalize_text(r["License Number"])}
    sponsor = {(normalize_text(r["Individual Id"]), normalize_text(r["Sponsoring Company ID"])): normalize_text(r["Sponsorship Status"]) for r in mlos if normalize_text(r["Sponsoring Company ID"])}
    parent_map: dict[str, set[str]] = defaultdict(set)
    for row in branches:
        if normalize_text(row["Branch Id"]): parent_map[normalize_text(row["Branch Id"])].add(normalize_text(row["Company Id"]))
    mldb = [(normalize_text(r["Company Id"]), normalize_text(r["Branch Id"])) for r in branches if normalize_text(r["License Number"]) == "MLDB7594"]
    metrics = {
        "baseline": before,
        "source_counts": report["counts"],
        "company_identity": {"all_status": len(all_companies), "active": len(active_companies), "attached_exact_all_status": len(attached), "attached_exact_active": len(active_companies&attached), "unresolved": len(unresolved), "conflicts": len(conflicts), "malformed": len(malformed), "new_all_status_vs_002d": len(all_companies-set(old_company)), "new_active_vs_002d": len(active_companies-set(old_company))},
        "company_credentials": {"active_keys": len(new_company_keys), "additions_vs_002d": len(new_company_keys-old_company_keys), "prior_keys_absent": len(old_company_keys-new_company_keys)},
        "branches": {"active_ids": len(active_branches), "new_ids_vs_002d": len(active_branches-old_branch_ids), "prior_ids_absent": len(old_branch_ids-active_branches), "new_ids_vs_canonical": len(active_branches-set(identifiers["NMLS_BRANCH"])), "new_credential_keys_vs_002d": len(new_branch_keys-old_branch_keys), "prior_keys_absent": len(old_branch_keys-new_branch_keys), "parent_conflicts": sum(len(v)>1 for v in parent_map.values())},
        "mlo": {"distinct_ids": report["counts"]["mlo_distinct_ids"], "new_ids_vs_002d": len({normalize_text(r["Individual Id"]) for r in mlos}-{x[0] for x in old_mlo_keys}), "new_ids_vs_canonical": len({normalize_text(r["Individual Id"]) for r in mlos}-set(identifiers["NMLS_PERSON"])), "credential_additions_vs_002d": len(mlo_keys-old_mlo_keys), "prior_keys_absent": len(old_mlo_keys-mlo_keys), "pending_without_license": report["counts"]["mlo_pending_without_license"]},
        "sponsorship": {"pairs": len(sponsor), "additions": len(set(sponsor)-set(old_sponsorship)), "prior_absent": len(set(old_sponsorship)-set(sponsor)), "status_changes": sum(old_sponsorship.get(k) not in (None,v) for k,v in sponsor.items()), "accepted": report["counts"]["sponsorship_accepted"], "requested": report["counts"]["sponsorship_requested"]},
        "branch_managers": report["counts"]["branch_manager_pairs"],
        "country_anomalies": Counter(normalize_text(r.get("Country")) for r in branches if normalize_text(r.get("Country")) in COUNTRY_ANOMALIES),
        "contact_classification": {"mlo_email": "INTERNAL_ONLY", "company_contact": "REVIEW_BEFORE_PUBLIC", "branch_manager": "REVIEW_REQUIRED"},
        "mldb7594_rows": mldb,
        "expected_publication_delta": 0,
        "expected_person_public_candidate_delta": 0,
        "ingest_fingerprint": report["ingest_fingerprint"],
    }
    if metrics["branches"]["parent_conflicts"] != 0 or len(set(mldb)) < 2:
        raise SystemExit("STOP conflict gate did not match audited source")
    if before["person_public_candidate"] != 0:
        raise SystemExit("STOP person_public_candidate baseline is not zero")
    return metrics


def transform_rows(loaded: dict[str, list[dict[str, str]]]) -> Iterable[list[Any]]:
    for filename, rows in loaded.items():
        scope = FILES[filename]["scope"]
        for row in rows:
            row_num = int(row["__row_number"])
            source_row = {key: value for key, value in row.items() if key != "__row_number"}
            norm = {key: normalize_text(value) for key, value in source_row.items()}
            company = norm.get("Company Id", "")
            branch = norm.get("Branch Id", "")
            person = norm.get("Individual Id", "")
            related = norm.get("Sponsoring Company ID", "") or norm.get("Branch Manager NMLS ID", "")
            license_number = norm.get("License Number", "")
            license_class = LICENSE_CLASS.get(norm.get("License Name", ""), "")
            if filename == "Loan Originators.csv": kind = "MLO_CREDENTIAL" if license_number else "MLO_PENDING"
            else: kind = "BRANCH_CREDENTIAL" if branch else "COMPANY_CREDENTIAL"
            native_status = norm.get("License Status", "")
            status_raw = norm.get("License Status Date", "")
            original_raw = norm.get("Original License Date", "")
            name_raw = source_row.get("Company Name", "") or " ".join(filter(None, [source_row.get("Individual First Name", ""), source_row.get("Individual Middle Name", ""), source_row.get("Individual Last Name", "")]))
            address = {k: source_row.get(k, "") for k in ("Street", "City", "State", "Country", "Postal Code") if k in source_row}
            contact = {k: v for k, v in source_row.items() if "Contact" in k or "Email" in k or "Phone" in k or "Manager" in k}
            row_fp = fingerprint({"file": filename, "row": source_row})
            record_id = f"FL|PRR141437|{filename.removesuffix('.csv').upper().replace(' ','_')}|{row_num}|{row_fp[:16]}"
            yield [DATASET, filename, row_num, kind, record_id, row_fp, scope, company or None, branch or None, person or None, related or None, license_number or None, license_class or None, native_status or None, normalize_status(native_status) or None, status_raw or None, parse_date(status_raw), original_raw or None, parse_date(original_raw), norm.get("Renewed Through Year") or None, name_raw or None, normalize_text(name_raw) or None, Json(address), Json(contact), Json(source_row), Json(norm), OBSERVED, FILES[filename]["generated"]]


STAGING_COLUMNS = ["source_dataset","source_file","source_row_number","record_kind","source_record_id","row_fingerprint","source_scope","company_nmls_id","branch_nmls_id","individual_nmls_id","related_nmls_id","license_number","license_class","source_native_status","normalized_status","status_date_raw","status_effective_on","original_date_raw","initial_approval_on","renewed_through_year","name_raw","name_normalized","address_raw","contact_raw","raw_record","normalized_record","report_current_as_of","report_generated_at"]


def apply_schema() -> None:
    conn = connect(); cur = conn.cursor()
    cur.execute(MIGRATION.read_text(encoding="utf-8")); conn.commit(); conn.close()


def stage(report: dict[str, Any], loaded: dict[str, list[dict[str, str]]]) -> dict[str, int]:
    conn = connect(); cur = conn.cursor()
    for name, meta in FILES.items():
        f = report["files"][name]
        cur.execute("""insert into lender_source_artifacts(source_dataset,request_number,reference_number,original_filename,byte_length,sha256,report_current_as_of,report_generated_at,source_scope,retrieved_at,ingest_fingerprint)
          values(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
          on conflict(source_dataset,original_filename) do nothing""", (DATASET,REQUEST,REFERENCE,name,f["bytes"],f["sha256"],OBSERVED,meta["generated"],meta["scope"],datetime.now(timezone.utc),report["ingest_fingerprint"]))
    conn.commit(); conn.close()
    chunks, prepared_count = prepare_copy_chunks(loaded)
    if prepared_count != 117155:
        raise SystemExit(f"STOP prepared {prepared_count} staging rows")
    inserted = 0
    for path in chunks:
        last_error = None
        for attempt in range(1, 6):
            try:
                with psycopg.connect(load_url()) as conn3:
                    with conn3.cursor() as cur3:
                        cur3.execute("create temporary table tmp_002f (like staging_fl_ofr_002f_records including defaults) on commit drop")
                        with cur3.copy(f"copy tmp_002f ({','.join(STAGING_COLUMNS)}) from stdin with (format csv)") as copy:
                            with path.open("rb") as handle:
                                while data := handle.read(256 * 1024):
                                    copy.write(data)
                        cur3.execute(f"insert into staging_fl_ofr_002f_records ({','.join(STAGING_COLUMNS)}) select {','.join(STAGING_COLUMNS)} from tmp_002f on conflict do nothing")
                        inserted += cur3.rowcount
                last_error = None
                break
            except psycopg.OperationalError as exc:
                last_error = exc
                print(f"RETRY {path.name} attempt={attempt}", flush=True)
                time.sleep(min(attempt, 3))
        if last_error:
            raise last_error
    conn=connect(); cur=conn.cursor(); cur.execute("select count(*) from staging_fl_ofr_002f_records where source_dataset=%s", (DATASET,)); total=cur.fetchone()[0]; conn.rollback(); conn.close()
    if total != 117155: raise SystemExit(f"STOP staging total {total} expected 117155")
    return {"inserted": inserted, "total": total, "chunks": len(chunks)}


def copy_records(cur, loaded: dict[str, list[dict[str, str]]], table: str) -> int:
    path, count = prepare_copy_file(loaded)
    with path.open("r", encoding="utf-8", newline="") as handle:
        cur.copy_expert(f"copy {table} ({','.join(STAGING_COLUMNS)}) from stdin with (format csv)", handle)
    return count


def prepare_copy_file(loaded: dict[str, list[dict[str, str]]]) -> tuple[Path, int]:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "staging-records.csv"
    count = 0
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        for values in transform_rows(loaded):
            writer.writerow([json.dumps(v.adapted, ensure_ascii=False) if isinstance(v, Json) else v for v in values])
            count += 1
    return path, count


def prepare_copy_chunks(loaded: dict[str, list[dict[str, str]]], chunk_size: int = 1_000) -> tuple[list[Path], int]:
    chunk_dir = OUT / "staging-chunks"
    chunk_dir.mkdir(parents=True, exist_ok=True)
    for old in chunk_dir.glob("*.csv"):
        old.unlink()
    paths: list[Path] = []
    count = 0
    handle = None
    writer = None
    try:
        for values in transform_rows(loaded):
            if count % chunk_size == 0:
                if handle:
                    handle.close()
                path = chunk_dir / f"chunk-{len(paths)+1:03d}.csv"
                paths.append(path)
                handle = path.open("w", encoding="utf-8", newline="")
                writer = csv.writer(handle, lineterminator="\n")
            assert writer is not None
            writer.writerow([json.dumps(v.adapted, ensure_ascii=False) if isinstance(v, Json) else v for v in values])
            count += 1
    finally:
        if handle:
            handle.close()
    return paths, count


APPLY_SQL = r"""
-- Exact company classification; no institution minting.
insert into lender_source_identity_resolutions(id,identifier_type,identifier_value,source_dataset,resolution_class,entity_id,match_method,notes,observed_at,raw_metadata)
select uuid_generate_v5(%(ns)s::uuid,'res:'||%(ds)s||':NMLS_INSTITUTION:'||s.company_nmls_id), 'NMLS_INSTITUTION',s.company_nmls_id,%(ds)s,
 case when s.company_nmls_id !~ '^[0-9]{3,12}$' then 'MALFORMED'
      when count(distinct i.entity_id) filter(where i.entity_id is not null)>1 then 'MULTI_ENTITY_CONFLICT'
      when count(distinct i.entity_id) filter(where i.entity_id is not null)=1 and min(e.entity_kind)='institution' then 'ATTACHED_EXISTING_EXACT_NMLS'
      when count(distinct i.entity_id) filter(where i.entity_id is not null)=1 then 'MULTI_ENTITY_CONFLICT'
      else 'UNRESOLVED_SOURCE_COMPANY_NMLS' end,
 case when count(distinct i.entity_id) filter(where i.entity_id is not null)=1 and min(e.entity_kind)='institution' then min(i.entity_id::text)::uuid end,
 case when count(distinct i.entity_id) filter(where i.entity_id is not null)=1 and min(e.entity_kind)='institution' then 'EXACT_NMLS_INSTITUTION' else 'HELD_NO_EXISTING_INSTITUTION' end,
 'PRR 141437 exact-NMLS classification; unresolved values are not minted.',date '2026-08-30',jsonb_build_object('prr','141437','reference','1341691')
from (select distinct company_nmls_id from staging_fl_ofr_002f_records where source_dataset=%(ds)s and company_nmls_id is not null) s
left join lender_identifiers i on i.identifier_type='NMLS_INSTITUTION' and i.identifier_value=s.company_nmls_id
left join lender_national_entities e on e.id=i.entity_id group by s.company_nmls_id
on conflict(identifier_type,identifier_value,source_dataset) do nothing;

-- Explicit collision quarantine.
insert into lender_identity_conflicts(id,conflict_class,identifier_type,identifier_value,related_values,disposition,notes)
values(uuid_generate_v5(%(ns)s::uuid,'conflict:STATE_LICENSE:MLDB7594'),'CREDENTIAL_MULTI_OWNER_COLLISION','STATE_LICENSE','MLDB7594',
 (select jsonb_agg(distinct jsonb_build_object('company_nmls_id',company_nmls_id,'branch_nmls_id',branch_nmls_id)) from staging_fl_ofr_002f_records where source_dataset=%(ds)s and license_number='MLDB7594'),
 'quarantined','FL-LEND-002F: two company/branch pairs; no heuristic attachment permitted')
on conflict(conflict_class,identifier_type,identifier_value) do update set related_values=excluded.related_values,disposition='quarantined',notes=excluded.notes;

insert into lender_identity_conflicts(id,conflict_class,identifier_type,identifier_value,related_values,disposition,notes)
select uuid_generate_v5(%(ns)s::uuid,'conflict:CREDENTIAL_SCOPE_COLLISION:'||license_number),'CREDENTIAL_SCOPE_COLLISION','STATE_LICENSE',license_number,
 jsonb_agg(distinct jsonb_build_object('company_nmls_id',company_nmls_id,'branch_nmls_id',branch_nmls_id)),'quarantined','Active source assigns one license number to company and branch scopes; observations retained, current credential unchanged.'
from staging_fl_ofr_002f_records where source_dataset=%(ds)s and source_file='Mortgage Businesses.csv' and license_number is not null
group by license_number having count(distinct coalesce(branch_nmls_id,'COMPANY:'||company_nmls_id))>1
on conflict(conflict_class,identifier_type,identifier_value) do update set related_values=excluded.related_values,disposition='quarantined',notes=excluded.notes;

insert into lender_identity_conflicts(id,conflict_class,identifier_type,identifier_value,related_values,disposition,notes)
select uuid_generate_v5(%(ns)s::uuid,'conflict:CREDENTIAL_MULTI_SUBJECT:'||license_number),'CREDENTIAL_MULTI_SUBJECT_COLLISION','STATE_LICENSE',license_number,
 jsonb_agg(distinct jsonb_build_object('company_nmls_id',company_nmls_id,'branch_nmls_id',branch_nmls_id,'individual_nmls_id',individual_nmls_id)),'quarantined','Active source assigns one license number to multiple exact subjects; current projection held, observations retained.'
from staging_fl_ofr_002f_records where source_dataset=%(ds)s and source_file in ('Mortgage Businesses.csv','Loan Originators.csv') and license_number is not null
group by license_number having count(distinct coalesce(individual_nmls_id,branch_nmls_id,'COMPANY:'||company_nmls_id))>1
on conflict(conflict_class,identifier_type,identifier_value) do update set related_values=excluded.related_values,disposition='quarantined',notes=excluded.notes;

-- Exact MLO person nodes, internal only (including pending applicants).
insert into lender_national_entities(id,entity_kind,stable_key,legal_name,display_name,identity_confidence,current_status,public_projection_status,notes)
select distinct uuid_generate_v5(%(ns)s::uuid,'person:'||individual_nmls_id),'person_mlo','nmls-person:'||individual_nmls_id,left(name_normalized,500),left(name_normalized,500),'confirmed','observed','internal_only','FL-LEND-002F exact NMLS individual; never public by this ingest'
from staging_fl_ofr_002f_records where source_dataset=%(ds)s and individual_nmls_id~'^[0-9]{3,12}$' on conflict(stable_key) do nothing;
insert into lender_identifiers(id,entity_id,identifier_type,identifier_value,jurisdiction,source_dataset,source_record_id,observed_at,status,confidence,raw_metadata)
select distinct uuid_generate_v5(%(ns)s::uuid,'ident:NMLS_PERSON:'||individual_nmls_id),uuid_generate_v5(%(ns)s::uuid,'person:'||individual_nmls_id),'NMLS_PERSON',individual_nmls_id,'FL',%(ds)s,'FL|PRR141437|NMLS_PERSON|'||individual_nmls_id,date '2026-08-30',source_native_status,'confirmed',jsonb_build_object('privacy','internal_only')
from staging_fl_ofr_002f_records where source_dataset=%(ds)s and individual_nmls_id~'^[0-9]{3,12}$' on conflict(identifier_type,identifier_value) do nothing;

-- Exact active branch nodes only when parent institution resolves; collision excluded.
insert into lender_national_entities(id,entity_kind,stable_key,legal_name,display_name,identity_confidence,current_status,public_projection_status,notes)
select distinct uuid_generate_v5(%(ns)s::uuid,'branch:'||s.branch_nmls_id),'branch','nmls-branch:'||s.branch_nmls_id,left(s.name_normalized,500),left(s.name_normalized,500),'confirmed','observed','internal_only','FL-LEND-002F exact branch + exact parent; not public'
from staging_fl_ofr_002f_records s join lender_source_identity_resolutions r on r.identifier_type='NMLS_INSTITUTION' and r.identifier_value=s.company_nmls_id and r.source_dataset=%(ds)s and r.resolution_class='ATTACHED_EXISTING_EXACT_NMLS'
where s.source_dataset=%(ds)s and s.source_file='Mortgage Businesses.csv' and s.branch_nmls_id~'^[0-9]{3,12}$' and s.license_number<>'MLDB7594' on conflict(stable_key) do nothing;
insert into lender_identifiers(id,entity_id,identifier_type,identifier_value,jurisdiction,source_dataset,source_record_id,observed_at,status,confidence,raw_metadata)
select distinct uuid_generate_v5(%(ns)s::uuid,'ident:NMLS_BRANCH:'||s.branch_nmls_id),uuid_generate_v5(%(ns)s::uuid,'branch:'||s.branch_nmls_id),'NMLS_BRANCH',s.branch_nmls_id,'FL',%(ds)s,'FL|PRR141437|NMLS_BRANCH|'||s.branch_nmls_id,date '2026-08-30',s.source_native_status,'confirmed',jsonb_build_object('parent_company_nmls',s.company_nmls_id,'public_eligible',false)
from staging_fl_ofr_002f_records s join lender_source_identity_resolutions r on r.identifier_type='NMLS_INSTITUTION' and r.identifier_value=s.company_nmls_id and r.source_dataset=%(ds)s and r.resolution_class='ATTACHED_EXISTING_EXACT_NMLS'
where s.source_dataset=%(ds)s and s.source_file='Mortgage Businesses.csv' and s.branch_nmls_id~'^[0-9]{3,12}$' and s.license_number<>'MLDB7594' on conflict(identifier_type,identifier_value) do nothing;

-- Immutable dated observations for every source row.
insert into lender_regulatory_observations(id,source_dataset,source_file,source_record_id,observation_family,subject_type,subject_identifier,entity_id,license_number,license_class,source_native_status,normalized_status,status_effective_on,source_effective_date_raw,observed_on,classification,raw_value,normalized_value,row_fingerprint)
select uuid_generate_v5(%(ns)s::uuid,'regobs:'||s.source_record_id),s.source_dataset,s.source_file,s.source_record_id,
 case when s.record_kind='MLO_PENDING' then 'PENDING_APPLICATION' else 'CREDENTIAL_SNAPSHOT' end,
 case when s.individual_nmls_id is not null then 'NMLS_PERSON' when s.branch_nmls_id is not null then 'NMLS_BRANCH' else 'NMLS_INSTITUTION' end,
 coalesce(s.individual_nmls_id,s.branch_nmls_id,s.company_nmls_id),i.entity_id,s.license_number,s.license_class,s.source_native_status,s.normalized_status,s.status_effective_on,s.status_date_raw,s.report_current_as_of,
 case when s.record_kind='MLO_PENDING' then 'INTERNAL_ONLY' when i.entity_id is not null then 'ATTACHED_EXACT' else 'UNRESOLVED' end,
 s.raw_record,s.normalized_record,s.row_fingerprint
from staging_fl_ofr_002f_records s left join lender_identifiers i on i.identifier_type=case when s.individual_nmls_id is not null then 'NMLS_PERSON' when s.branch_nmls_id is not null then 'NMLS_BRANCH' else 'NMLS_INSTITUTION' end and i.identifier_value=coalesce(s.individual_nmls_id,s.branch_nmls_id,s.company_nmls_id)
where s.source_dataset=%(ds)s on conflict(source_dataset,source_record_id,observation_family) do nothing;

insert into lender_regulatory_observations(id,source_dataset,source_file,source_record_id,observation_family,subject_type,subject_identifier,entity_id,observed_on,classification,raw_value,normalized_value,row_fingerprint)
select uuid_generate_v5(%(ns)s::uuid,'nameobs:'||s.source_record_id),s.source_dataset,s.source_file,s.source_record_id,'SOURCE_NAME_OBSERVATION',case when s.individual_nmls_id is not null then 'NMLS_PERSON' when s.branch_nmls_id is not null then 'NMLS_BRANCH' else 'NMLS_INSTITUTION' end,coalesce(s.individual_nmls_id,s.branch_nmls_id,s.company_nmls_id),i.entity_id,s.report_current_as_of,case when i.entity_id is null then 'UNRESOLVED' else 'ATTACHED_EXACT' end,jsonb_build_object('name',s.name_raw),jsonb_build_object('name',s.name_normalized),s.row_fingerprint
from staging_fl_ofr_002f_records s left join lender_identifiers i on i.identifier_type=case when s.individual_nmls_id is not null then 'NMLS_PERSON' when s.branch_nmls_id is not null then 'NMLS_BRANCH' else 'NMLS_INSTITUTION' end and i.identifier_value=coalesce(s.individual_nmls_id,s.branch_nmls_id,s.company_nmls_id)
where s.source_dataset=%(ds)s and name_raw is not null on conflict(source_dataset,source_record_id,observation_family) do nothing;

insert into lender_regulatory_observations(id,source_dataset,source_file,source_record_id,observation_family,subject_type,subject_identifier,entity_id,observed_on,classification,raw_value,normalized_value,row_fingerprint)
select uuid_generate_v5(%(ns)s::uuid,'geoobs:'||s.source_record_id),s.source_dataset,s.source_file,s.source_record_id,'SOURCE_GEOGRAPHY_ANOMALY',case when s.branch_nmls_id is null then 'NMLS_INSTITUTION' else 'NMLS_BRANCH' end,coalesce(s.branch_nmls_id,s.company_nmls_id),i.entity_id,s.report_current_as_of,'REVIEW_REQUIRED',jsonb_build_object('country',s.raw_record->>'Country'),jsonb_build_object('country',s.normalized_record->>'Country','guessed',false),s.row_fingerprint
from staging_fl_ofr_002f_records s left join lender_identifiers i on i.identifier_type=case when s.branch_nmls_id is null then 'NMLS_INSTITUTION' else 'NMLS_BRANCH' end and i.identifier_value=coalesce(s.branch_nmls_id,s.company_nmls_id)
where s.source_dataset=%(ds)s and source_file='Branches.csv' and raw_record->>'Country' in ('ABC','QCC','ZWB','BCC') on conflict(source_dataset,source_record_id,observation_family) do nothing;

insert into lender_regulatory_observations(id,source_dataset,source_file,source_record_id,observation_family,subject_type,subject_identifier,entity_id,observed_on,classification,raw_value,normalized_value,row_fingerprint)
select uuid_generate_v5(%(ns)s::uuid,'workobs:'||s.source_record_id),s.source_dataset,s.source_file,s.source_record_id,'WORK_CLASSIFICATION','NMLS_PERSON',s.individual_nmls_id,i.entity_id,s.report_current_as_of,'INTERNAL_ONLY',jsonb_build_object('worker_classification',s.raw_record->>'Worker Classification','remote_classification',s.raw_record->>'Remote Classification'),jsonb_build_object('worker_classification',s.normalized_record->>'Worker Classification','remote_classification',s.normalized_record->>'Remote Classification'),s.row_fingerprint
from staging_fl_ofr_002f_records s left join lender_identifiers i on i.identifier_type='NMLS_PERSON' and i.identifier_value=s.individual_nmls_id
where s.source_dataset=%(ds)s and source_file='Loan Originators.csv' on conflict(source_dataset,source_record_id,observation_family) do nothing;

-- Status-aware exact relationship history.
insert into lender_relationship_observations(id,source_dataset,source_file,source_record_id,relationship_class,from_identifier_type,from_identifier_value,to_identifier_type,to_identifier_value,from_entity_id,to_entity_id,source_native_status,normalized_status,relationship_effective_on,observed_on,classification,raw_value,fingerprint)
select uuid_generate_v5(%(ns)s::uuid,'relobs:BRANCH_PARENT:'||s.source_record_id),s.source_dataset,s.source_file,s.source_record_id,'BRANCH_PARENT','NMLS_BRANCH',s.branch_nmls_id,'NMLS_INSTITUTION',s.company_nmls_id,bi.entity_id,ci.entity_id,s.source_native_status,s.normalized_status,s.status_effective_on,s.report_current_as_of,
 case when s.license_number='MLDB7594' then 'QUARANTINED' when bi.entity_id is not null and ci.entity_id is not null then 'ATTACHED_EXACT' else 'UNRESOLVED' end,
 jsonb_build_object('license_number',s.license_number),encode(digest(s.source_dataset||'|BRANCH_PARENT|'||s.branch_nmls_id||'|'||s.company_nmls_id||'|'||s.source_record_id,'sha256'),'hex')
from staging_fl_ofr_002f_records s left join lender_identifiers bi on bi.identifier_type='NMLS_BRANCH' and bi.identifier_value=s.branch_nmls_id left join lender_identifiers ci on ci.identifier_type='NMLS_INSTITUTION' and ci.identifier_value=s.company_nmls_id
where s.source_dataset=%(ds)s and branch_nmls_id is not null on conflict do nothing;

insert into lender_relationship_observations(id,source_dataset,source_file,source_record_id,relationship_class,from_identifier_type,from_identifier_value,to_identifier_type,to_identifier_value,from_entity_id,to_entity_id,source_native_status,normalized_status,relationship_effective_on,observed_on,classification,raw_value,fingerprint)
select uuid_generate_v5(%(ns)s::uuid,'relobs:MLO_SPONSORSHIP:'||s.source_record_id),s.source_dataset,s.source_file,s.source_record_id,'MLO_SPONSORSHIP','NMLS_PERSON',s.individual_nmls_id,'NMLS_INSTITUTION',s.raw_record->>'Sponsoring Company ID',pi.entity_id,ci.entity_id,s.raw_record->>'Sponsorship Status',upper(replace(s.raw_record->>'Sponsorship Status',' ','_')),case when s.raw_record->>'Sponsorship Status Date'~'^\d{1,2}/\d{1,2}/\d{4}$' then to_date(s.raw_record->>'Sponsorship Status Date','MM/DD/YYYY') end,s.report_current_as_of,
 case when pi.entity_id is not null and ci.entity_id is not null then 'ATTACHED_EXACT' else 'UNRESOLVED' end,
 jsonb_build_object('worker_classification',s.raw_record->>'Worker Classification'),encode(digest(s.source_dataset||'|MLO_SPONSORSHIP|'||s.individual_nmls_id||'|'||(s.raw_record->>'Sponsoring Company ID')||'|'||s.source_record_id,'sha256'),'hex')
from staging_fl_ofr_002f_records s left join lender_identifiers pi on pi.identifier_type='NMLS_PERSON' and pi.identifier_value=s.individual_nmls_id left join lender_identifiers ci on ci.identifier_type='NMLS_INSTITUTION' and ci.identifier_value=s.raw_record->>'Sponsoring Company ID'
where s.source_dataset=%(ds)s and coalesce(raw_record->>'Sponsoring Company ID','')<>'' on conflict do nothing;

insert into lender_relationship_observations(id,source_dataset,source_file,source_record_id,relationship_class,from_identifier_type,from_identifier_value,to_identifier_type,to_identifier_value,from_entity_id,to_entity_id,observed_on,classification,raw_value,fingerprint)
select uuid_generate_v5(%(ns)s::uuid,'relobs:BRANCH_MANAGER:'||s.source_record_id),s.source_dataset,s.source_file,s.source_record_id,'BRANCH_MANAGER','NMLS_BRANCH',s.branch_nmls_id,'NMLS_PERSON',s.raw_record->>'Branch Manager NMLS ID',bi.entity_id,pi.entity_id,s.report_current_as_of,'REVIEW_REQUIRED',jsonb_build_object('privacy','internal_only','industry',s.raw_record->>'Branch Manager Industry'),encode(digest(s.source_dataset||'|BRANCH_MANAGER|'||s.branch_nmls_id||'|'||(s.raw_record->>'Branch Manager NMLS ID')||'|'||s.source_record_id,'sha256'),'hex')
from staging_fl_ofr_002f_records s left join lender_identifiers bi on bi.identifier_type='NMLS_BRANCH' and bi.identifier_value=s.branch_nmls_id left join lender_identifiers pi on pi.identifier_type='NMLS_PERSON' and pi.identifier_value=s.raw_record->>'Branch Manager NMLS ID'
where s.source_dataset=%(ds)s and s.source_file='Branches.csv' and s.branch_nmls_id is not null and coalesce(s.raw_record->>'Branch Manager NMLS ID','')<>'' on conflict do nothing;

-- Existing historical license ledger receives each issued credential row.
insert into lender_state_license_observations(id,jurisdiction,license_number,license_class,nmls_id,ofr_status,status_effective_on,initial_approval_on,source_clock,source_dataset,source_record_id,source_observed_on,entity_id,raw_metadata)
select uuid_generate_v5(%(ns)s::uuid,'obs:'||s.source_dataset||':'||s.source_record_id),'FL',s.license_number,s.license_class,coalesce(s.individual_nmls_id,s.branch_nmls_id,s.company_nmls_id),s.source_native_status,s.status_effective_on,s.initial_approval_on,case when s.source_scope='ALL_STATUS_LEDGER' then 'ofr_all_status' else 'nmls_active' end,s.source_dataset,s.source_record_id,s.report_current_as_of,i.entity_id,jsonb_build_object('source_file',s.source_file,'raw_status_date',s.status_date_raw,'renewed_through_year',s.renewed_through_year,'row_fingerprint',s.row_fingerprint)
from staging_fl_ofr_002f_records s left join lender_identifiers i on i.identifier_type=case when individual_nmls_id is not null then 'NMLS_PERSON' when branch_nmls_id is not null then 'NMLS_BRANCH' else 'NMLS_INSTITUTION' end and i.identifier_value=coalesce(individual_nmls_id,branch_nmls_id,company_nmls_id)
where s.source_dataset=%(ds)s and license_number is not null and license_number<>'MLDB7594' on conflict(source_dataset,source_record_id) do nothing;

-- Current credentials: active snapshot only, exact identity only, collision excluded.
insert into lender_state_licenses(id,jurisdiction,license_number,license_class,entity_class,nmls_id,ofr_status,status_effective_on,initial_approval_on,firm_name,institution_id,attribution_confidence,match_method,source_dataset,source_record_id,source_observed_on,raw_metadata,source_clock)
select uuid_generate_v5(%(ns)s::uuid,'lic:'||s.license_class||':'||s.license_number),'FL',s.license_number,s.license_class,case when s.individual_nmls_id is not null then 'person_mlo' when s.branch_nmls_id is not null then 'branch' else 'institution' end,coalesce(s.individual_nmls_id,s.branch_nmls_id,s.company_nmls_id),s.source_native_status,s.status_effective_on,s.initial_approval_on,s.name_normalized,
 case when s.company_nmls_id is not null then ci.entity_id end,'confirmed',case when s.individual_nmls_id is not null then 'EXACT_NMLS_PERSON' when s.branch_nmls_id is not null then 'EXACT_NMLS_BRANCH' else 'EXACT_NMLS_INSTITUTION' end,s.source_dataset,s.source_record_id,s.report_current_as_of,jsonb_build_object('prr','141437','row_fingerprint',s.row_fingerprint,'privacy',case when s.individual_nmls_id is not null then 'internal_only' else 'review_before_public' end),'nmls_active'
from (
  select distinct on (x.license_number) x.*
  from staging_fl_ofr_002f_records x
  where x.source_dataset=%(ds)s
    and x.source_file in ('Mortgage Businesses.csv','Loan Originators.csv')
    and x.license_number is not null
    and x.license_number<>'MLDB7594'
    and not exists (
      select 1 from staging_fl_ofr_002f_records d
      where d.source_dataset=x.source_dataset and d.source_file in ('Mortgage Businesses.csv','Loan Originators.csv') and d.license_number=x.license_number
      group by d.license_number
      having count(distinct coalesce(d.individual_nmls_id,d.branch_nmls_id,'COMPANY:'||d.company_nmls_id))>1
    )
  order by x.license_number,x.status_effective_on desc nulls last,x.source_row_number desc
) s
left join lender_identifiers si on si.identifier_type=case when individual_nmls_id is not null then 'NMLS_PERSON' when branch_nmls_id is not null then 'NMLS_BRANCH' else 'NMLS_INSTITUTION' end and si.identifier_value=coalesce(individual_nmls_id,branch_nmls_id,company_nmls_id)
left join lender_identifiers ci on ci.identifier_type='NMLS_INSTITUTION' and ci.identifier_value=company_nmls_id
where si.entity_id is not null and (s.company_nmls_id is null or ci.entity_id is not null)
on conflict(jurisdiction,license_number) do update set ofr_status=excluded.ofr_status,status_effective_on=coalesce(excluded.status_effective_on,lender_state_licenses.status_effective_on),source_dataset=excluded.source_dataset,source_record_id=excluded.source_record_id,source_observed_on=excluded.source_observed_on,source_clock='nmls_active',updated_at=now();

-- Current accepted sponsorship only; Requested remains observation-only.
insert into lender_entity_relationships(id,from_entity_id,to_entity_id,relationship_type,confidence,source_dataset,notes,valid_from,ofr_status,source_record_id)
select distinct uuid_generate_v5(%(ns)s::uuid,'rel:ASSOCIATED_WITH:'||pi.entity_id::text||':'||ci.entity_id::text),pi.entity_id,ci.entity_id,'ASSOCIATED_WITH','confirmed',%(ds)s,'Accepted sponsorship observed 2026-08-30; not ownership or publication eligibility',date '2026-08-30','Accepted','FL|PRR141437|SPONSOR|'||s.individual_nmls_id||'|'||(s.raw_record->>'Sponsoring Company ID')
from staging_fl_ofr_002f_records s join lender_identifiers pi on pi.identifier_type='NMLS_PERSON' and pi.identifier_value=s.individual_nmls_id join lender_identifiers ci on ci.identifier_type='NMLS_INSTITUTION' and ci.identifier_value=s.raw_record->>'Sponsoring Company ID'
where s.source_dataset=%(ds)s and s.raw_record->>'Sponsorship Status'='Accepted' on conflict(from_entity_id,to_entity_id,relationship_type) do update set source_dataset=excluded.source_dataset,ofr_status='Accepted',source_record_id=excluded.source_record_id;

-- Current active branch parent relationship, still internal-only branch identity.
insert into lender_entity_relationships(id,from_entity_id,to_entity_id,relationship_type,confidence,source_dataset,notes,valid_from,ofr_status,source_record_id)
select distinct uuid_generate_v5(%(ns)s::uuid,'rel:BELONGS_TO:'||bi.entity_id::text||':'||ci.entity_id::text),bi.entity_id,ci.entity_id,'BELONGS_TO','confirmed',%(ds)s,'Exact Branch NMLS + exact parent Company NMLS; not public eligibility',date '2026-08-30',s.source_native_status,'FL|PRR141437|BRANCH|'||s.branch_nmls_id
from staging_fl_ofr_002f_records s join lender_identifiers bi on bi.identifier_type='NMLS_BRANCH' and bi.identifier_value=s.branch_nmls_id join lender_identifiers ci on ci.identifier_type='NMLS_INSTITUTION' and ci.identifier_value=s.company_nmls_id
where s.source_dataset=%(ds)s and s.source_file='Mortgage Businesses.csv' and s.license_number<>'MLDB7594' on conflict(from_entity_id,to_entity_id,relationship_type) do update set source_dataset=excluded.source_dataset,ofr_status=excluded.ofr_status,source_record_id=excluded.source_record_id;

-- Privacy-classified contacts. No public_candidate insert exists here.
insert into lender_entity_contacts(id,entity_id,contact_kind,contact_role,classification,phone,email,source_dataset,source_record_id,observed_at,raw_metadata)
select uuid_generate_v5(%(ns)s::uuid,'ct002f:'||ci.entity_id::text||':company:'||s.source_record_id),ci.entity_id,case when coalesce(s.raw_record->>'Company Contact Email','')<>'' then 'email' else 'phone' end,'business','review_before_public',nullif(s.raw_record->>'Company Contact Phone',''),nullif(s.raw_record->>'Company Contact Email',''),%(ds)s,s.source_record_id||'|company_contact',s.report_current_as_of,jsonb_build_object('role','company_contact','source_file',s.source_file)
from staging_fl_ofr_002f_records s join lender_identifiers ci on ci.identifier_type='NMLS_INSTITUTION' and ci.identifier_value=s.company_nmls_id where s.source_dataset=%(ds)s and (coalesce(s.raw_record->>'Company Contact Email','')<>'' or coalesce(s.raw_record->>'Company Contact Phone','')<>'') on conflict(entity_id,contact_kind,source_record_id) do nothing;
insert into lender_entity_contacts(id,entity_id,contact_kind,contact_role,classification,email,source_dataset,source_record_id,observed_at,raw_metadata)
select uuid_generate_v5(%(ns)s::uuid,'ct002f:'||pi.entity_id::text||':notification:'||s.source_record_id),pi.entity_id,'email','professional','internal_only',s.raw_record->>'Individual Notification Email Address',%(ds)s,s.source_record_id||'|notification_email',s.report_current_as_of,jsonb_build_object('public_eligible',false,'role','notification')
from staging_fl_ofr_002f_records s join lender_identifiers pi on pi.identifier_type='NMLS_PERSON' and pi.identifier_value=s.individual_nmls_id where s.source_dataset=%(ds)s and coalesce(s.raw_record->>'Individual Notification Email Address','')<>'' on conflict(entity_id,contact_kind,source_record_id) do nothing;
insert into lender_entity_contacts(id,entity_id,contact_kind,contact_role,classification,email,source_dataset,source_record_id,observed_at,raw_metadata)
select uuid_generate_v5(%(ns)s::uuid,'ct002f:'||pi.entity_id::text||':filing:'||s.source_record_id),pi.entity_id,'email','professional','internal_only',s.raw_record->>'Individual Filing Email Address',%(ds)s,s.source_record_id||'|filing_email',s.report_current_as_of,jsonb_build_object('public_eligible',false,'role','filing')
from staging_fl_ofr_002f_records s join lender_identifiers pi on pi.identifier_type='NMLS_PERSON' and pi.identifier_value=s.individual_nmls_id where s.source_dataset=%(ds)s and coalesce(s.raw_record->>'Individual Filing Email Address','')<>'' on conflict(entity_id,contact_kind,source_record_id) do nothing;
"""


def execute_apply(report: dict[str, Any]) -> dict[str, Any]:
    conn=connect(); cur=conn.cursor(cursor_factory=RealDictCursor); before=baseline(cur); conn.rollback(); conn.close()
    steps=[]
    statements=[s.strip() for s in APPLY_SQL.split(";\n") if s.strip()]
    for number, statement in enumerate(statements, 1):
        conn=connect(); cur=conn.cursor()
        cur.execute(statement, {"ns": NAMESPACE, "ds": DATASET})
        steps.append({"step":number,"rowcount":cur.rowcount})
        conn.commit(); conn.close()
    conn=connect(); cur=conn.cursor(cursor_factory=RealDictCursor); after=baseline(cur)
    if after["institutions"] != before["institutions"] or after["profiles"] != before["profiles"] or after["state_profiles"] != before["state_profiles"] or after["person_public_candidate"] != before["person_public_candidate"]:
        conn.rollback(); conn.close(); raise SystemExit("STOP publication/identity invariant changed")
    cur.execute("""insert into lender_ingest_runs(source_dataset,ingest_fingerprint,mode,started_at,completed_at,status,metrics) values(%s,%s,'EXECUTE',now(),now(),'PASSED',%s) on conflict(source_dataset,ingest_fingerprint,mode) do update set completed_at=excluded.completed_at,status='PASSED',metrics=excluded.metrics""", (DATASET,report["ingest_fingerprint"],Json({"before":before,"after":after})))
    conn.commit(); conn.close(); return {"before":before,"after":after,"delta":{k:after[k]-before[k] for k in before},"steps":steps}


def simulate(loaded: dict[str, list[dict[str, str]]]) -> dict[str, Any]:
    """Execute the complete schema + ingest transaction and roll it back."""
    prepared, copied = prepare_copy_file(loaded)
    if copied != 117155:
        raise RuntimeError(f"simulation prepared {copied}, expected 117155")
    conn = connect(); cur = conn.cursor(cursor_factory=RealDictCursor)
    before = baseline(cur)
    try:
        cur.execute(MIGRATION.read_text(encoding="utf-8"))
        with prepared.open("r", encoding="utf-8", newline="") as handle:
            cur.copy_expert(f"copy staging_fl_ofr_002f_records ({','.join(STAGING_COLUMNS)}) from stdin with (format csv)", handle)
        cur.execute(APPLY_SQL, {"ns": NAMESPACE, "ds": DATASET})
        after = baseline(cur)
        cur.execute("select count(*) n from lender_regulatory_observations where source_dataset=%s", (DATASET,)); regulatory=cur.fetchone()["n"]
        cur.execute("select count(*) n from lender_relationship_observations where source_dataset=%s", (DATASET,)); relationships=cur.fetchone()["n"]
        cur.execute("select count(*) n from lender_identity_conflicts where identifier_value='MLDB7594' and disposition='quarantined'"); quarantine=cur.fetchone()["n"]
        if after["institutions"] != before["institutions"] or after["profiles"] != before["profiles"] or after["state_profiles"] != before["state_profiles"] or after["person_public_candidate"] != 0 or quarantine != 1:
            raise RuntimeError("simulation publication/identity invariant failed")
        result={"before":before,"after":after,"delta":{k:after[k]-before[k] for k in before},"staging":copied,"regulatory_observations":regulatory,"relationship_observations":relationships,"mldb7594_quarantined":quarantine,"rolled_back":True}
        conn.rollback(); return result
    except Exception:
        if not conn.closed:
            conn.rollback()
        raise
    finally:
        conn.close()


def verify() -> dict[str, Any]:
    conn=connect(read_only=True); cur=conn.cursor(cursor_factory=RealDictCursor); counts=baseline(cur)
    cur.execute("""select
      (select count(*) from lender_source_artifacts where source_dataset=%s) source_artifacts,
      (select count(*) from staging_fl_ofr_002f_records where source_dataset=%s) staging_rows,
      (select count(*) from lender_regulatory_observations where source_dataset=%s) regulatory_observations,
      (select count(*) from lender_relationship_observations where source_dataset=%s) relationship_observations,
      (select count(*) from lender_source_identity_resolutions where source_dataset=%s and resolution_class='ATTACHED_EXISTING_EXACT_NMLS') attached,
      (select count(*) from lender_source_identity_resolutions where source_dataset=%s and resolution_class='UNRESOLVED_SOURCE_COMPANY_NMLS') unresolved,
      (select count(*) from lender_identity_conflicts where conflict_class='CREDENTIAL_MULTI_OWNER_COLLISION' and identifier_value='MLDB7594' and disposition='quarantined') mldb7594_quarantined,
      (select count(*) from lender_entity_contacts c join lender_national_entities e on e.id=c.entity_id where c.source_dataset=%s and e.entity_kind='person_mlo' and c.classification<>'internal_only') mlo_contact_privacy_violations,
      (select count(*) from lender_national_entities where entity_kind='institution' and notes like '%%FL-LEND-002F%%') institutions_minted_002f,
      (select count(*) from lender_state_license_observations where source_dataset=%s) license_observations_002f
    """, (DATASET,)*7 + (DATASET,))
    detail=dict(cur.fetchone()); conn.rollback(); conn.close()
    if detail["source_artifacts"]!=3 or detail["staging_rows"]!=117155 or detail["mldb7594_quarantined"]!=1 or detail["mlo_contact_privacy_violations"]!=0 or detail["institutions_minted_002f"]!=0 or counts["person_public_candidate"]!=0:
        raise SystemExit("STOP verification invariant failed: "+json.dumps(detail,default=str))
    return {"counts":counts,"002f":detail}


def write_report(name: str, value: Any) -> None:
    OUT.mkdir(parents=True,exist_ok=True); (OUT/name).write_text(json.dumps(value,indent=2,default=str),encoding="utf-8")


def main() -> None:
    parser=argparse.ArgumentParser(); parser.add_argument("mode",choices=["check","dry-run","simulate","schema","stage","apply","verify","all"]); args=parser.parse_args()
    report,loaded=source_audit(); write_report("source-audit.json",report)
    if args.mode=="check": print(json.dumps(report,indent=2,default=str)); return
    metrics=dry_run(report,loaded); write_report("dry-run.json",metrics); print("DRY_RUN_PASS",json.dumps(metrics,default=str))
    if args.mode=="dry-run": return
    if args.mode=="simulate":
        result=simulate(loaded); write_report("simulation.json",result); print("SIMULATION_PASS",json.dumps(result,default=str)); return
    if args.mode in {"schema","all"}: apply_schema(); print("SCHEMA_PASS")
    if args.mode=="schema": return
    if args.mode in {"stage","all"}: result=stage(report,loaded); write_report("stage.json",result); print("STAGE_PASS",result)
    if args.mode=="stage": return
    if args.mode in {"apply","all"}: result=execute_apply(report); write_report("execute.json",result); print("APPLY_PASS",json.dumps(result,default=str))
    result=verify(); write_report("verify.json",result); print("VERIFY_PASS",json.dumps(result,default=str))


if __name__ == "__main__": main()
