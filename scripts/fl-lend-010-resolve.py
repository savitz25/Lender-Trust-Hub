#!/usr/bin/env python3
"""FL-LEND-010 — official FLAIO identifier mining + relationship source audit.

Downloads person/branch/mixed FLAIO PDFs from DOAH (official). No NMLS CA scrape.
No name/address inference. No OCR.

  python scripts/fl-lend-010-resolve.py --audit
  python scripts/fl-lend-010-resolve.py --download
  python scripts/fl-lend-010-resolve.py --apply
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import time
import urllib.request
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
import importlib.util

from pypdf import PdfReader
import psycopg2
from psycopg2.extras import Json, RealDictCursor

ROOT = Path(r"C:\Users\makei\lender-trust-hub-ask-search-009")
SRC = ROOT / "data" / "florida" / "fl-lend-004-source"
PDF_DIR = SRC / "pdfs"
INDEX = SRC / "flaio-index.json"
CSV_DIR = ROOT / "data" / "florida" / "fl-lend-001-source" / "unzipped"
OUT_DIR = ROOT / "docs"
UA = "LenderTrustHub research ingest (FL-LEND-010; official OFR FLAIO documents)"
NMLS_RE = re.compile(r"\bNMLS(?:\s*(?:ID|No\.?|Number|#))?\s*[:#]?\s*(\d{3,12})\b", re.I)
LIC_RE = re.compile(r"\b(MBRB|MLDB|MBR|MLD|LO)\s*[-]?\s*(\d{2,8})\b", re.I)
COLLIDE_LO = "LO93058"
REF = "hidcrbexurginnuqgipx"


def fetch(url: str, timeout: int = 90) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def load_g():
    spec = importlib.util.spec_from_file_location("g", ROOT / "scripts" / "fl-lend-006-generate.py")
    g = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(g)
    return g


def nmls_norm(v) -> str | None:
    s = re.sub(r"[^0-9]", "", str(v or "").strip())
    return s if re.fullmatch(r"[0-9]{3,12}", s) else None


def extract_text(pdf_bytes: bytes) -> str:
    reader = PdfReader(BytesIO(pdf_bytes))
    parts = []
    for page in reader.pages[:16]:
        try:
            parts.append(page.extract_text() or "")
        except Exception:
            continue
    return "\n".join(parts)


def extract_ids(text: str) -> dict:
    nmls = list(dict.fromkeys(NMLS_RE.findall(text or "")))
    lic = [(a.upper(), b) for a, b in LIC_RE.findall(text or "")]
    fmt = list(dict.fromkeys(f"{a}{b}" for a, b in lic))
    lo = [x for x in fmt if x.startswith("LO")]
    mbrb = [x for x in fmt if x.startswith("MBRB")]
    mldb = [x for x in fmt if x.startswith("MLDB")]
    mbr = [x for x in fmt if x.startswith("MBR") and not x.startswith("MBRB")]
    mld = [x for x in fmt if x.startswith("MLD") and not x.startswith("MLDB")]
    return {
        "nmls": nmls,
        "licenses": fmt,
        "lo": lo,
        "mbrb": mbrb,
        "mldb": mldb,
        "mbr": mbr,
        "mld": mld,
        "text_chars": len(text or ""),
        "text_extractable": bool((text or "").strip()),
        "sponsor_language": bool(re.search(r"\b(sponsor(?:ed|ing)?|employ(?:ed|er|ing)|associated with)\b", text or "", re.I)),
    }


def csv_rows(path: Path):
    with path.open("r", encoding="utf-8-sig", errors="replace", newline="") as f:
        yield from csv.DictReader(f)


def license_collision_audit() -> dict:
    lo, mbrb, mldb = [], [], []
    for p in [
        CSV_DIR / "lo-ai" / "LoanOrignators_AI_Monthly.csv",
        CSV_DIR / "lo-jr" / "LoanOrignators_JR_Monthly.csv",
        CSV_DIR / "lo-sz" / "LoanOrignators_SZ_Monthly.csv",
    ]:
        lo.extend(csv_rows(p))
    firms = list(csv_rows(CSV_DIR / "mbr-mbrb" / "MortgageFirms_MBR-MBRB_Monthly.csv")) + list(
        csv_rows(CSV_DIR / "mld-mldb" / "MortgageFirms_MLD-MLDB_Monthly.csv")
    )

    def groups(rows, klass):
        typed = [r for r in rows if (r.get("LICENSE TYPE") or "").strip() == klass]
        by = defaultdict(list)
        for r in typed:
            lic = (r.get("LICENSE NUMBER") or "").strip().upper()
            if lic:
                by[lic].append(r)
        dups = {k: v for k, v in by.items() if len(v) > 1}
        appr_dups = {
            k: v
            for k, v in dups.items()
            if sum(1 for x in v if (x.get("STATUS") or "").strip() == "Approved") > 1
        }
        return {
            "rows": len(typed),
            "unique_licenses": len(by),
            "duplicate_license_groups": len(dups),
            "approved_duplicate_groups": len(appr_dups),
            "approved_dup_licenses": sorted(appr_dups)[:50],
        }

    lo930 = [
        {
            "nmls": (r.get("NMLS ID") or "").strip(),
            "status": (r.get("STATUS") or "").strip(),
            "last": (r.get("LAST NAME") or "").strip(),
            "first": (r.get("FIRST NAME") or "").strip(),
            "initial": (r.get("INTIAL APPROVAL") or "").strip(),
            "status_eff": (r.get("STATUS EFFECTIVE DATE") or "").strip(),
        }
        for r in lo
        if (r.get("LICENSE NUMBER") or "").strip().upper() == COLLIDE_LO
    ]
    return {"LO": groups(lo, "LO"), "MBRB": groups(firms, "MBRB"), "MLDB": groups(firms, "MLDB"), "LO93058": lo930}


def target_rows(index: dict) -> dict[str, list[dict]]:
    out = {"person_mlo": [], "branch": [], "mixed_company_person": []}
    seen = {k: set() for k in out}
    for r in index["rows"]:
        b = r.get("entity_bucket")
        if b not in out:
            continue
        key = r.get("source_record_id") or r.get("document_url")
        if key in seen[b]:
            continue
        seen[b].add(key)
        out[b].append(r)
    return out


def download_one(row: dict) -> dict:
    url = row.get("document_url") or ""
    fn = re.sub(r"[^A-Za-z0-9._-]+", "_", url.rsplit("/", 1)[-1] if url else row["source_record_id"])[:180]
    dest = PDF_DIR / fn
    meta = {
        "source_record_id": row["source_record_id"],
        "subject_raw": row.get("subject_raw"),
        "entity_bucket": row.get("entity_bucket"),
        "document_url": url,
        "filename": fn,
        "url_available": bool(url),
        "ok": False,
        "downloaded": False,
        "text_extractable": False,
        "scanned": False,
        "missing": False,
    }
    if not url:
        meta["missing"] = True
        return meta
    try:
        if dest.exists() and dest.stat().st_size > 1000:
            b = dest.read_bytes()
        else:
            b = fetch(url, timeout=120)
            dest.write_bytes(b)
        meta["downloaded"] = True
        meta["bytes"] = len(b)
        meta["sha256"] = sha256(b)
        text = extract_text(b)
        ids = extract_ids(text)
        meta.update(ids)
        meta["ok"] = True
        if not ids["text_extractable"] and len(b) > 1000:
            meta["scanned"] = True
        meta["text_sample"] = re.sub(r"\s+", " ", text)[:500]
    except Exception as e:
        meta["missing"] = True
        meta["error"] = str(e)[:300]
    return meta


def run_download(wanted: list[dict]) -> list[dict]:
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = {ex.submit(download_one, r): r["source_record_id"] for r in wanted}
        n = 0
        for fut in as_completed(futs):
            rec = fut.result()
            results.append(rec)
            n += 1
            if n % 50 == 0:
                print("PDF", n, "/", len(wanted), "ok", sum(1 for x in results if x.get("ok")), flush=True)
    return results


def match_extracts(extracts: list[dict], cur) -> dict:
    cur.execute("select identifier_value, entity_id from lender_identifiers where identifier_type='NMLS_PERSON'")
    person_nmls = {r["identifier_value"]: str(r["entity_id"]) for r in cur.fetchall()}
    cur.execute("select identifier_value, entity_id from lender_identifiers where identifier_type='NMLS_BRANCH'")
    branch_nmls = {r["identifier_value"]: str(r["entity_id"]) for r in cur.fetchall()}
    cur.execute("select identifier_value, entity_id from lender_identifiers where identifier_type='NMLS_INSTITUTION' and entity_id is not null")
    inst_nmls = {r["identifier_value"]: str(r["entity_id"]) for r in cur.fetchall()}
    cur.execute("select license_number, nmls_id from lender_state_licenses where license_class='LO'")
    lo_lic = defaultdict(set)
    for r in cur.fetchall():
        if r["license_number"] and r["nmls_id"]:
            lo_lic[r["license_number"]].add(r["nmls_id"])
    cur.execute("select license_number, nmls_id, license_class from lender_state_licenses where license_class in ('MBRB','MLDB')")
    br_lic = defaultdict(set)
    for r in cur.fetchall():
        if r["license_number"] and r["nmls_id"]:
            br_lic[r["license_number"]].add(r["nmls_id"])

    out = []
    for e in extracts:
        nmls_hits_p = [n for n in e.get("nmls") or [] if n in person_nmls]
        nmls_hits_b = [n for n in e.get("nmls") or [] if n in branch_nmls]
        nmls_hits_i = [n for n in e.get("nmls") or [] if n in inst_nmls]
        lo_hits = []
        for lic in e.get("lo") or []:
            owners = lo_lic.get(lic) or set()
            lo_hits.append({"license": lic, "owners": sorted(owners)})
        br_hits = []
        for lic in (e.get("mbrb") or []) + (e.get("mldb") or []):
            owners = br_lic.get(lic) or set()
            br_hits.append({"license": lic, "owners": sorted(owners)})

        bucket = e.get("entity_bucket")
        conf = "unresolved"
        method = None
        entity_id = None
        review_reason = None
        if bucket == "person_mlo":
            unique_lo = [h for h in lo_hits if len(h["owners"]) == 1 and h["license"] != COLLIDE_LO]
            collide = [h for h in lo_hits if h["license"] == COLLIDE_LO]
            amb_lo = [h for h in lo_hits if len(h["owners"]) > 1 and h["license"] != COLLIDE_LO]
            if len(nmls_hits_p) == 1:
                conf = "confirmed"
                method = "EXACT_NMLS_PERSON_IN_ORDER"
                entity_id = person_nmls[nmls_hits_p[0]]
            elif collide:
                conf = "review_required"
                method = "LO93058_COLLISION"
                review_reason = "LO93058 maps to two Approved individual NMLS"
            elif len(unique_lo) == 1 and not amb_lo and len(nmls_hits_p) == 0:
                conf = "confirmed"
                method = "EXACT_UNIQUE_LO_LICENSE_IN_ORDER"
                entity_id = person_nmls[next(iter(unique_lo[0]["owners"]))]
            elif amb_lo or len(nmls_hits_p) > 1 or len(unique_lo) > 1:
                conf = "review_required"
                method = "AMBIGUOUS_IDENTIFIER"
        elif bucket == "branch":
            unique_br = [h for h in br_hits if len(h["owners"]) == 1]
            amb_br = [h for h in br_hits if len(h["owners"]) != 1]
            if len(nmls_hits_b) == 1:
                conf = "confirmed"
                method = "EXACT_NMLS_BRANCH_IN_ORDER"
                entity_id = branch_nmls[nmls_hits_b[0]]
            elif len(unique_br) == 1 and not amb_br and len(nmls_hits_b) == 0:
                conf = "confirmed"
                method = "EXACT_UNIQUE_BRANCH_LICENSE_IN_ORDER"
                entity_id = branch_nmls[next(iter(unique_br[0]["owners"]))]
            elif amb_br or len(nmls_hits_b) > 1 or len(unique_br) > 1:
                conf = "review_required"
                method = "AMBIGUOUS_IDENTIFIER"
        elif bucket == "mixed_company_person":
            conf = "unresolved"
            method = "MIXED_SUBJECT"
            if nmls_hits_p or nmls_hits_i:
                conf = "review_required"
                method = "MIXED_EXPLICIT_IDS"

        rec = {
            **{k: e.get(k) for k in ("source_record_id", "entity_bucket", "document_url", "ok", "downloaded", "text_extractable", "scanned", "missing", "url_available")},
            "nmls": e.get("nmls") or [],
            "lo": e.get("lo") or [],
            "mbrb": e.get("mbrb") or [],
            "mldb": e.get("mldb") or [],
            "person_nmls_hits": nmls_hits_p,
            "branch_nmls_hits": nmls_hits_b,
            "institution_nmls_hits": nmls_hits_i,
            "lo_hits": lo_hits,
            "branch_lic_hits": br_hits,
            "confidence": conf,
            "match_method": method,
            "respondent_entity_id": entity_id,
            "review_reason": review_reason,
            "multi_nmls": len((e.get("nmls") or [])) > 1,
            "sponsor_language": e.get("sponsor_language"),
        }
        out.append(rec)
    return {
        "rows": out,
        "person": Counter(r["confidence"] for r in out if r["entity_bucket"] == "person_mlo"),
        "branch": Counter(r["confidence"] for r in out if r["entity_bucket"] == "branch"),
        "mixed": [r for r in out if r["entity_bucket"] == "mixed_company_person"],
    }


def summarize_docs(rows: list[dict], extracts: list[dict]) -> dict:
    by = {e["source_record_id"]: e for e in extracts}
    url_ok = sum(1 for r in rows if r.get("document_url"))
    dl = sum(1 for e in extracts if e.get("downloaded"))
    tx = sum(1 for e in extracts if e.get("text_extractable"))
    sc = sum(1 for e in extracts if e.get("scanned"))
    miss = sum(1 for e in extracts if e.get("missing") or not e.get("ok"))
    return {
        "index_rows": len(rows),
        "url_available": url_ok,
        "downloaded": dl,
        "text_extractable": tx,
        "scanned_or_empty_text": sc,
        "missing_or_error": miss,
        "with_nmls_pattern": sum(1 for e in extracts if e.get("nmls")),
        "with_lo": sum(1 for e in extracts if e.get("lo")),
        "with_mbrb": sum(1 for e in extracts if e.get("mbrb")),
        "with_mldb": sum(1 for e in extracts if e.get("mldb")),
    }


def apply_matches(cur, matches: list[dict], apply: bool) -> dict:
    updates = [m for m in matches if m["confidence"] in ("confirmed", "review_required") and m.get("source_record_id")]
    if not apply:
        return {"would_update": len(updates), "confirmed": sum(1 for m in matches if m["confidence"] == "confirmed")}
    n = 0
    for m in updates:
        cur.execute(
            """
            update lender_state_regulatory_events
            set respondent_entity_id = %s,
                nmls_id = coalesce(nmls_id, %s),
                license_number = coalesce(license_number, %s),
                attribution_confidence = %s,
                match_method = %s,
                raw_metadata = coalesce(raw_metadata, '{}'::jsonb) || %s::jsonb,
                updated_at = now()
            where source_dataset='FL_OFR_FLAIO' and source_record_id=%s
              and respondent_kind in ('person_mlo','branch','mixed')
              and (
                attribution_confidence is distinct from %s
                or match_method is distinct from %s
                or respondent_entity_id is distinct from %s::uuid
              )
            """,
            (
                m.get("respondent_entity_id"),
                (m.get("person_nmls_hits") or m.get("branch_nmls_hits") or [None])[0],
                ((m.get("lo") or m.get("mbrb") or m.get("mldb") or [None])[0]),
                m["confidence"],
                m.get("match_method"),
                json.dumps(
                    {
                        "fl_lend_010": {
                            "nmls": m.get("nmls"),
                            "lo": m.get("lo"),
                            "mbrb": m.get("mbrb"),
                            "mldb": m.get("mldb"),
                            "review_reason": m.get("review_reason"),
                            "multi_nmls": m.get("multi_nmls"),
                        }
                    }
                ),
                m["source_record_id"],
                m["confidence"],
                m.get("match_method"),
                m.get("respondent_entity_id"),
            ),
        )
        n += cur.rowcount
    return {"updated": n}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--audit", action="store_true")
    ap.add_argument("--download", action="store_true")
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    buckets = target_rows(index)
    # unique person/branch to match DB grain
    print("INDEX_BUCKETS", {k: len(v) for k, v in buckets.items()}, flush=True)
    collisions = license_collision_audit()
    (OUT_DIR / "fl-lend-010-license-collisions.json").write_text(json.dumps(collisions, indent=2, default=str), encoding="utf-8")

    wanted = buckets["person_mlo"] + buckets["branch"] + buckets["mixed_company_person"]
    extract_path = SRC / "flaio-person-branch-extract.json"
    if args.download or not extract_path.exists():
        extracts = run_download(wanted)
        extract_path.write_text(json.dumps(extracts, indent=2), encoding="utf-8")
    else:
        extracts = json.loads(extract_path.read_text(encoding="utf-8"))
        missing = [r for r in wanted if r["source_record_id"] not in {e.get("source_record_id") for e in extracts}]
        if missing:
            extra = run_download(missing)
            extracts.extend(extra)
            extract_path.write_text(json.dumps(extracts, indent=2), encoding="utf-8")

    g = load_g()
    conn = psycopg2.connect(g.lender_dsn())
    conn.set_session(autocommit=True)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    matched = match_extracts(extracts, cur)
    person_docs = summarize_docs(buckets["person_mlo"], [e for e in extracts if e.get("entity_bucket") == "person_mlo"])
    branch_docs = summarize_docs(buckets["branch"], [e for e in extracts if e.get("entity_bucket") == "branch"])
    mixed_docs = summarize_docs(buckets["mixed_company_person"], [e for e in extracts if e.get("entity_bucket") == "mixed_company_person"])

    prewrite = {
        "task": "FL-LEND-010",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "relationship_sources": {
            "ofr_monthly_lo_company_nmls_column": False,
            "ofr_monthly_branch_parent_nmls_column": False,
            "nmls_consumer_access_scraped": False,
            "predicted_confirmed_person_company": 0,
            "predicted_confirmed_branch_company": 0,
        },
        "person_docs": person_docs,
        "branch_docs": branch_docs,
        "mixed_docs": mixed_docs,
        "person_confidence": dict(matched["person"]),
        "branch_confidence": dict(matched["branch"]),
        "mixed": matched["mixed"],
        "lo93058": collisions["LO93058"],
        "license_collisions": {k: {kk: collisions[k][kk] for kk in collisions[k] if kk != "approved_dup_licenses"} for k in ("LO", "MBRB", "MLDB")},
    }
    (OUT_DIR / "fl-lend-010-prewrite.json").write_text(json.dumps(prewrite, indent=2, default=str), encoding="utf-8")
    print(json.dumps({k: prewrite[k] for k in prewrite if k != "mixed"}, indent=2, default=str)[:6000], flush=True)

    if args.apply:
        conn.autocommit = False
        cur = conn.cursor(cursor_factory=RealDictCursor)
        stats = apply_matches(cur, matched["rows"], True)
        conn.commit()
        print("APPLY", stats, flush=True)
        (OUT_DIR / "fl-lend-010-post.json").write_text(json.dumps({"apply": stats, "prewrite": prewrite}, indent=2, default=str), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
