"""FL-LEND-001/002 source audit. Read-only of originals. No Production write.

Copies originals immutably into data/raw/florida/ofr-prr-141420/originals/
Extracts zip members next to them under extracted/.
"""
from __future__ import annotations

import csv
import hashlib
import json
import re
import shutil
import zipfile
from collections import Counter, defaultdict
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(r"C:\Users\Michael.Savitsky\Lender Trust Hub")
RAW = ROOT / "data" / "raw" / "florida" / "ofr-prr-141420"
ORIG = RAW / "originals"
EXTR = RAW / "extracted"
OUT = ROOT / "data" / "reports"
PRR = "141420"
REF = "1341691"
RECEIVED = "2026-08-28"

NMLS_RE = re.compile(r"^\d{3,12}$")


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def dump(name: str, obj) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / name).write_text(json.dumps(obj, indent=2, default=str), encoding="utf-8")
    print("WROTE", OUT / name, flush=True)


def copy_originals() -> list[Path]:
    ORIG.mkdir(parents=True, exist_ok=True)
    EXTR.mkdir(parents=True, exist_ok=True)
    copied = []
    for p in sorted(SRC.iterdir()):
        if not p.is_file():
            continue
        dest = ORIG / p.name
        if not dest.exists() or dest.stat().st_size != p.stat().st_size:
            shutil.copy2(p, dest)
        copied.append(dest)
    return copied


def extract_zips(paths: list[Path]) -> dict[str, list[dict]]:
    members = {}
    for zpath in paths:
        if zpath.suffix.lower() != ".zip":
            continue
        with zipfile.ZipFile(zpath) as zf:
            info = []
            for i in zf.infolist():
                target = EXTR / Path(i.filename).name
                if not target.exists() or target.stat().st_size != i.file_size:
                    with zf.open(i) as src, target.open("wb") as dst:
                        shutil.copyfileobj(src, dst)
                info.append(
                    {
                        "member": i.filename,
                        "bytes": i.file_size,
                        "zip_datetime": "%04d-%02d-%02dT%02d:%02d:%02d" % i.date_time,
                        "extracted_path": str(target),
                        "extracted_sha256": sha256_file(target),
                    }
                )
            members[zpath.name] = info
    return members


def sniff_encoding(path: Path) -> str:
    head = path.read_bytes()[:8]
    if head.startswith(b"\xff\xfe") or head.startswith(b"\xfe\xff"):
        return "utf-16"
    if head.startswith(b"\xef\xbb\xbf"):
        return "utf-8-sig"
    return "utf-8"


def open_csv(path: Path):
    enc = sniff_encoding(path)
    return path.open("r", encoding=enc, errors="replace", newline=""), enc


def is_meta_row(row: list[str]) -> bool:
    if not row:
        return False
    return row[0].startswith("Report Name:")


def iter_rows(path: Path, skip_meta: bool = False):
    f, enc = open_csv(path)
    with f:
        reader = csv.reader(f)
        header = next(reader, None)
        if header and skip_meta and is_meta_row(header):
            header = next(reader, None)
        if not header:
            return enc, [], []
        header = [h.strip() for h in header]
        rows = []
        for raw in reader:
            if not raw or all(not (c or "").strip() for c in raw):
                continue
            if len(raw) < len(header):
                raw = raw + [""] * (len(header) - len(raw))
            rows.append(raw[: len(header)])
        return enc, header, rows


def col_idx(header: list[str], *names: str) -> int | None:
    lower = {h.lower(): i for i, h in enumerate(header)}
    for n in names:
        if n.lower() in lower:
            return lower[n.lower()]
    return None


def get(row: list[str], i: int | None) -> str:
    if i is None or i >= len(row):
        return ""
    return (row[i] or "").strip()


def digits(s: str) -> str:
    return re.sub(r"\D", "", s or "")


def nmls_ok(s: str) -> bool:
    d = digits(s)
    return bool(NMLS_RE.match(d)) and d != "0" * len(d)


def profile_table(path: Path, skip_meta: bool, label: str) -> dict:
    enc, header, rows = iter_rows(path, skip_meta=skip_meta)
    n = len(rows)
    cols = len(header)
    nulls = [0] * cols
    uniques: list[set[str]] = [set() for _ in range(cols)]
    for row in rows:
        for i, val in enumerate(row):
            v = (val or "").strip()
            if not v:
                nulls[i] += 1
            elif len(uniques[i]) < 50000:
                uniques[i].add(v)
    col_stats = []
    for i, h in enumerate(header):
        col_stats.append(
            {
                "column": h,
                "null_pct": round(100.0 * nulls[i] / n, 2) if n else None,
                "unique_approx": len(uniques[i]),
                "unique_capped": len(uniques[i]) >= 50000,
            }
        )
    return {
        "label": label,
        "path": str(path),
        "encoding": enc,
        "rows": n,
        "columns": cols,
        "headers": header,
        "column_stats": col_stats,
        "_rows": rows,
        "_header": header,
    }


def value_counts(rows, header, col, limit=30):
    i = col_idx(header, col)
    if i is None:
        return {}
    c = Counter(get(r, i) or "(blank)" for r in rows)
    return dict(c.most_common(limit))


def unique_set(rows, header, col) -> set[str]:
    i = col_idx(header, col)
    if i is None:
        return set()
    return {get(r, i) for r in rows if get(r, i)}


def nmls_stats(rows, header, col) -> dict:
    i = col_idx(header, col)
    if i is None:
        return {"column_present": False}
    vals = [get(r, i) for r in rows]
    nonempty = [v for v in vals if v]
    ok = [digits(v) for v in nonempty if nmls_ok(v)]
    bad = [v for v in nonempty if not nmls_ok(v)]
    return {
        "column_present": True,
        "filled": len(nonempty),
        "blank": len(vals) - len(nonempty),
        "valid_nmls": len(ok),
        "distinct_valid": len(set(ok)),
        "malformed": len(bad),
        "malformed_samples": bad[:8],
    }


def email_phone(rows, header, email_cols, phone_cols) -> dict:
    out = {}
    for col in email_cols:
        i = col_idx(header, col)
        if i is None:
            continue
        filled = sum(1 for r in rows if "@" in get(r, i))
        out[col] = {"filled_email_like": filled, "pct": round(100.0 * filled / len(rows), 2) if rows else 0}
    for col in phone_cols:
        i = col_idx(header, col)
        if i is None:
            continue
        filled = sum(1 for r in rows if len(digits(get(r, i))) >= 10)
        out[col] = {"filled_phone_like": filled, "pct": round(100.0 * filled / len(rows), 2) if rows else 0}
    return out


def parse_legacy_florida() -> list[dict]:
    text = (ROOT / "lib" / "mortgage" / "floridaLenders.ts").read_text(encoding="utf-8")
    rows = []
    for m in re.finditer(
        r"id:\s*'([^']+)'.*?slug:\s*'([^']+)'.*?name:\s*'((?:\\'|[^'])*)'.*?nmlsId:\s*'([^']*)'.*?type:\s*'([^']+)'.*?city:\s*'([^']+)'.*?county:\s*'([^']+)'",
        text,
        re.S,
    ):
        rows.append(
            {
                "id": m.group(1),
                "slug": m.group(2),
                "name": m.group(3).replace("\\'", "'"),
                "nmlsId": m.group(4),
                "type": m.group(5),
                "city": m.group(6),
                "county": m.group(7),
            }
        )
    return rows


def parse_hmda_nmls() -> dict[str, str]:
    path = ROOT / "data" / "hmda" / "florida" / "lei_to_nmls_mapping.csv"
    mapping = {}
    if not path.exists():
        return mapping
    with path.open(encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            nmls = digits(row.get("nmls_id") or "")
            lei = (row.get("lei") or "").strip()
            if nmls and lei:
                mapping[lei] = nmls
    return mapping


def parse_hmda_fl_leis() -> set[str]:
    path = ROOT / "data" / "hmda" / "florida" / "lender_state_summary_fl.csv"
    leis = set()
    if not path.exists():
        return leis
    with path.open(encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            lei = (row.get("lei") or "").strip()
            if lei:
                leis.add(lei)
    return leis


def fdic_profile(path: Path) -> dict:
    try:
        import pandas as pd
    except ImportError:
        return {"error": "pandas not available", "path": str(path)}
    df = pd.read_excel(path, header=None)
    lines = ["" if pd.isna(df.iloc[i, 0]) else str(df.iloc[i, 0]).strip() for i in range(len(df))]
    certs = []
    for line in lines:
        m = re.search(r"FDIC Cert\s*#:\s*(\d+)", line, re.I)
        if m:
            certs.append(m.group(1))
    return {
        "path": str(path),
        "bytes": path.stat().st_size,
        "sha256": sha256_file(path),
        "last_write": datetime.fromtimestamp(path.stat().st_mtime).isoformat(),
        "nonempty_cells": sum(1 for x in lines if x),
        "distinct_cert": len(set(certs)),
        "cert_mentions": len(certs),
        "sample_lines": [x for x in lines if x][:12],
        "prr_141420": False,
        "note": "Last-write 2026-06-26. Not part of OFR PRR #141420 (2026-08-28).",
    }


def main() -> int:
    copied = copy_originals()
    zips = [p for p in copied if p.suffix.lower() == ".zip"]
    zip_members = extract_zips(zips)

    manifest = []
    for p in copied:
        rec = {
            "source_file_id": "raw-" + hashlib.sha256(p.name.encode()).hexdigest()[:12],
            "original_filename": p.name,
            "local_path": str(p),
            "file_type": p.suffix.lower(),
            "compressed_or_extracted": "compressed" if p.suffix.lower() == ".zip" else "extracted_or_plain",
            "file_size": p.stat().st_size,
            "sha256": sha256_file(p),
            "received_date": RECEIVED if "FDIC" not in p.name else "2026-06-26",
            "public_records_request_number": PRR if "FDIC" not in p.name else None,
            "public_records_reference_number": REF if "FDIC" not in p.name else None,
            "source_authority": "Florida Office of Financial Regulation" if "FDIC" not in p.name else "FDIC (separate file)",
        }
        if p.name.startswith("LoanOriginators_") or p.name.startswith("MortgageFirms_"):
            rec.update(
                {
                    "source_family": "ofr_website_monthly_download",
                    "source_url_if_standard_download": "https://flofr.gov (registration data download / REAL monthly zip)",
                    "classification": "OFR_WEBSITE_MONTHLY",
                }
            )
        elif p.name in {"Loan Originators.csv", "Mortgage Businesses.csv"}:
            rec.update(
                {
                    "source_family": "ofr_prr_141420_nmls_derived_roster",
                    "classification": "NMLS_DERIVED_OFR_PRODUCTION",
                    "notes": "NMLS Individual/Company roster exported for Florida regulator. Contains emails. As-of 2026-08-27, generated 2026-08-28.",
                }
            )
        elif "FDIC" in p.name:
            rec.update({"source_family": "fdic_insured_banks_list", "classification": "NOT_PRR_141420"})
        manifest.append(rec)

    lo_ai = profile_table(EXTR / "LoanOrignators_AI_Monthly.csv", False, "ofr_monthly_lo_ai")
    lo_jr = profile_table(EXTR / "LoanOrignators_JR_Monthly.csv", False, "ofr_monthly_lo_jr")
    lo_sz = profile_table(EXTR / "LoanOrignators_SZ_Monthly.csv", False, "ofr_monthly_lo_sz")
    mbr = profile_table(EXTR / "MortgageFirms_MBR-MBRB_Monthly.csv", False, "ofr_monthly_mbr_mbrb")
    mld = profile_table(EXTR / "MortgageFirms_MLD-MLDB_Monthly.csv", False, "ofr_monthly_mld_mldb")
    nmls_lo = profile_table(ORIG / "Loan Originators.csv", True, "nmls_individual_roster_fl")
    nmls_co = profile_table(ORIG / "Mortgage Businesses.csv", True, "nmls_company_branch_roster_fl")

    sources_profiled = [lo_ai, lo_jr, lo_sz, mbr, mld, nmls_lo, nmls_co]
    source_counts = []
    for s in sources_profiled:
        header, rows = s["_header"], s["_rows"]
        lic_i = col_idx(header, "LICENSE NUMBER", "License Number")
        nmls_col = "NMLS ID" if col_idx(header, "NMLS ID") is not None else (
            "Individual Id" if col_idx(header, "Individual Id") is not None else "Company Id"
        )
        source_counts.append(
            {
                "source": s["label"],
                "rows": s["rows"],
                "headers": s["headers"],
                "distinct_license": len(unique_set(rows, header, "LICENSE NUMBER" if lic_i is not None and header[lic_i] == "LICENSE NUMBER" else "License Number")),
                "license_type": value_counts(rows, header, "LICENSE TYPE") or value_counts(rows, header, "License Name"),
                "status": value_counts(rows, header, "STATUS") or value_counts(rows, header, "License Status"),
                "nmls": nmls_stats(rows, header, nmls_col),
                "prim_state": value_counts(rows, header, "PRIM STATE") or value_counts(rows, header, "State"),
                "date": "monthly zip inner 2026-08-28 06:03; NMLS as-of 2026-08-27 generated 2026-08-28",
            }
        )

    def cred_slice(prof, types):
        header, rows = prof["_header"], prof["_rows"]
        ti = col_idx(header, "LICENSE TYPE")
        si = col_idx(header, "STATUS")
        li = col_idx(header, "LICENSE NUMBER")
        ni = col_idx(header, "NMLS ID")
        out = {}
        for t in types:
            sub = [r for r in rows if get(r, ti) == t]
            statuses = Counter(get(r, si) or "(blank)" for r in sub)
            active = sum(statuses[k] for k in statuses if k.upper() in {"APPROVED", "ACTIVE"})
            nmls = {digits(get(r, ni)) for r in sub if nmls_ok(get(r, ni))}
            lics = {get(r, li) for r in sub if get(r, li)}
            out[t] = {
                "rows": len(sub),
                "distinct_license": len(lics),
                "distinct_nmls": len(nmls),
                "status": dict(statuses),
                "active_status_rows": active,
                "other_status_rows": len(sub) - active,
            }
        return out

    monthly_universe = {}
    monthly_universe.update(cred_slice(mld, ["MLD", "MLDB"]))
    monthly_universe.update(cred_slice(mbr, ["MBR", "MBRB"]))
    monthly_universe.update(cred_slice(lo_ai, ["LO"]))
    # combine LO monthly
    lo_all_rows = lo_ai["_rows"] + lo_jr["_rows"] + lo_sz["_rows"]
    lo_header = lo_ai["_header"]
    ti = col_idx(lo_header, "LICENSE TYPE")
    si = col_idx(lo_header, "STATUS")
    li = col_idx(lo_header, "LICENSE NUMBER")
    ni = col_idx(lo_header, "NMLS ID")
    lo_sub = [r for r in lo_all_rows if get(r, ti) == "LO"]
    lo_status = Counter(get(r, si) or "(blank)" for r in lo_sub)
    monthly_universe["LO"] = {
        "rows": len(lo_sub),
        "distinct_license": len({get(r, li) for r in lo_sub if get(r, li)}),
        "distinct_nmls": len({digits(get(r, ni)) for r in lo_sub if nmls_ok(get(r, ni))}),
        "status": dict(lo_status),
        "active_status_rows": sum(lo_status[k] for k in lo_status if k.upper() in {"APPROVED", "ACTIVE"}),
        "other_status_rows": len(lo_sub) - sum(lo_status[k] for k in lo_status if k.upper() in {"APPROVED", "ACTIVE"}),
        "ai_jr_sz_rows": [lo_ai["rows"], lo_jr["rows"], lo_sz["rows"]],
    }

    # NMLS company roster: company vs branch by Branch Id + License Name
    nh, nr = nmls_co["_header"], nmls_co["_rows"]
    bi = col_idx(nh, "Branch Id")
    ci = col_idx(nh, "Company Id")
    lni = col_idx(nh, "License Name")
    lnum = col_idx(nh, "License Number")
    lst = col_idx(nh, "License Status")
    nmls_license_names = value_counts(nr, nh, "License Name", 40)
    company_rows = [r for r in nr if not get(r, bi)]
    branch_rows = [r for r in nr if get(r, bi)]
    nmls_co_split = {
        "company_rows_blank_branch_id": len(company_rows),
        "branch_rows_with_branch_id": len(branch_rows),
        "distinct_company_id": len({digits(get(r, ci)) for r in nr if nmls_ok(get(r, ci))}),
        "distinct_branch_id": len({digits(get(r, bi)) for r in branch_rows if nmls_ok(get(r, bi))}),
        "license_name": nmls_license_names,
        "status": value_counts(nr, nh, "License Status"),
        "contact": email_phone(
            nr,
            nh,
            ["Company Contact Email", "Complaint Contact Email"],
            ["Company Contact Phone", "Complaint Contact Phone"],
        ),
    }

    lh, lr = nmls_lo["_header"], nmls_lo["_rows"]
    nmls_lo_prof = {
        "rows": len(lr),
        "distinct_individual_id": len(unique_set(lr, lh, "Individual Id")),
        "distinct_license": len(unique_set(lr, lh, "License Number")),
        "status": value_counts(lr, lh, "License Status"),
        "sponsorship_status": value_counts(lr, lh, "Sponsorship Status"),
        "worker_class": value_counts(lr, lh, "Worker Classification"),
        "remote": value_counts(lr, lh, "Remote Classification"),
        "distinct_sponsoring_company_id": len({digits(x) for x in unique_set(lr, lh, "Sponsoring Company ID") if nmls_ok(x)}),
        "sponsor_filled": sum(1 for r in lr if get(r, col_idx(lh, "Sponsoring Company ID"))),
        "contact": email_phone(
            lr,
            lh,
            ["Individual Notification Email Address", "Individual Filing Email Address"],
            [],
        ),
        "license_name": value_counts(lr, lh, "License Name"),
        "as_of": value_counts(lr, lh, "Report Current As Of", 5),
        "generated": value_counts(lr, lh, "Report Generated Time", 5),
    }

    # Cross-file ID reconciliation
    monthly_lo_lic = {get(r, li) for r in lo_sub if get(r, li)}
    nmls_lo_lic = unique_set(lr, lh, "License Number")
    monthly_lo_nmls = {digits(get(r, ni)) for r in lo_sub if nmls_ok(get(r, ni))}
    nmls_lo_nmls = {digits(x) for x in unique_set(lr, lh, "Individual Id") if nmls_ok(x)}

    mld_nmls = {digits(get(r, col_idx(mld["_header"], "NMLS ID"))) for r in mld["_rows"] if get(r, col_idx(mld["_header"], "LICENSE TYPE")) == "MLD" and nmls_ok(get(r, col_idx(mld["_header"], "NMLS ID")))}
    mbr_nmls = {digits(get(r, col_idx(mbr["_header"], "NMLS ID"))) for r in mbr["_rows"] if get(r, col_idx(mbr["_header"], "LICENSE TYPE")) == "MBR" and nmls_ok(get(r, col_idx(mbr["_header"], "NMLS ID")))}
    mldb_nmls = {digits(get(r, col_idx(mld["_header"], "NMLS ID"))) for r in mld["_rows"] if get(r, col_idx(mld["_header"], "LICENSE TYPE")) == "MLDB" and nmls_ok(get(r, col_idx(mld["_header"], "NMLS ID")))}
    mbrb_nmls = {digits(get(r, col_idx(mbr["_header"], "NMLS ID"))) for r in mbr["_rows"] if get(r, col_idx(mbr["_header"], "LICENSE TYPE")) == "MBRB" and nmls_ok(get(r, col_idx(mbr["_header"], "NMLS ID")))}
    nmls_company_ids = {digits(get(r, ci)) for r in company_rows if nmls_ok(get(r, ci))}
    nmls_branch_ids = {digits(get(r, bi)) for r in branch_rows if nmls_ok(get(r, bi))}
    both_mld_mbr = mld_nmls & mbr_nmls

    cross = {
        "lo_license_monthly_only": len(monthly_lo_lic - nmls_lo_lic),
        "lo_license_nmls_only": len(nmls_lo_lic - monthly_lo_lic),
        "lo_license_both": len(monthly_lo_lic & nmls_lo_lic),
        "lo_nmls_both": len(monthly_lo_nmls & nmls_lo_nmls),
        "mld_nmls_in_nmls_company_roster": len(mld_nmls & nmls_company_ids),
        "mbr_nmls_in_nmls_company_roster": len(mbr_nmls & nmls_company_ids),
        "mldb_nmls_in_nmls_branch_ids": len(mldb_nmls & nmls_branch_ids),
        "mbrb_nmls_in_nmls_branch_ids": len(mbrb_nmls & nmls_branch_ids),
        "companies_with_both_mld_and_mbr_nmls": len(both_mld_mbr),
        "note": "NMLS-derived rosters are Active-only as of 2026-08-27. Monthly OFR zips include all statuses. Intersection gaps are expected.",
    }

    # Branch parent from NMLS roster: Branch Id -> Company Id
    parents = defaultdict(set)
    for r in branch_rows:
        b = digits(get(r, bi))
        c = digits(get(r, ci))
        if nmls_ok(b) and nmls_ok(c):
            parents[b].add(c)
    multi_parent = {b: sorted(list(ps)) for b, ps in parents.items() if len(ps) > 1}
    branch_graph = {
        "mlldb_monthly_rows": monthly_universe.get("MLDB", {}).get("rows"),
        "mbrb_monthly_rows": monthly_universe.get("MBRB", {}).get("rows"),
        "nmls_branch_rows": len(branch_rows),
        "distinct_branch_nmls_nmls_file": len(nmls_branch_ids),
        "distinct_branch_nmls_monthly_mldb": len(mldb_nmls),
        "distinct_branch_nmls_monthly_mbrb": len(mbrb_nmls),
        "parent_links_from_nmls_roster": len(parents),
        "multi_parent_collisions": len(multi_parent),
        "multi_parent_samples": dict(list(multi_parent.items())[:8]),
        "self_parent": sum(1 for b, ps in parents.items() if b in ps),
        "relationship_authority": "NMLS Company/Branch roster Company Id + Branch Id (PRR #141420). Stronger than name similarity.",
    }

    # LO -> company from NMLS LO roster
    lo_co = 0
    lo_co_ids = set()
    sci = col_idx(lh, "Sponsoring Company ID")
    for r in lr:
        sid = digits(get(r, sci))
        if nmls_ok(sid):
            lo_co += 1
            lo_co_ids.add(sid)
    mlo_graph = {
        "nmls_lo_rows": len(lr),
        "with_sponsoring_company_id": lo_co,
        "distinct_sponsor_company_nmls": len(lo_co_ids),
        "sponsor_in_mld_nmls": len(lo_co_ids & mld_nmls),
        "sponsor_in_mbr_nmls": len(lo_co_ids & mbr_nmls),
        "sponsor_in_nmls_company_ids": len(lo_co_ids & nmls_company_ids),
        "branch_relationship_column_present": col_idx(lh, "Branch Id") is not None or col_idx(lh, "Branch") is not None,
        "email_notification": nmls_lo_prof["contact"].get("Individual Notification Email Address"),
        "email_filing": nmls_lo_prof["contact"].get("Individual Filing Email Address"),
        "phone_in_nmls_lo_file": False,
        "phone_in_ofr_monthly_lo": None,
    }
    phi = col_idx(lo_header, "PHONE")
    if phi is not None:
        ph = sum(1 for r in lo_sub if len(digits(get(r, phi))) >= 10)
        mlo_graph["phone_in_ofr_monthly_lo"] = {"filled": ph, "pct": round(100.0 * ph / len(lo_sub), 2) if lo_sub else 0}

    # Legacy catalog
    legacy = parse_legacy_florida()
    legacy_nmls = []
    for row in legacy:
        d = digits(row["nmlsId"])
        if nmls_ok(d):
            legacy_nmls.append(d)
        row["nmls_clean"] = d if nmls_ok(d) else None
    company_plus_branch = nmls_company_ids | nmls_branch_ids | mld_nmls | mbr_nmls | mldb_nmls | mbrb_nmls
    legacy_found = [r for r in legacy if r["nmls_clean"] and r["nmls_clean"] in company_plus_branch]
    legacy_not = [r for r in legacy if not r["nmls_clean"] or r["nmls_clean"] not in company_plus_branch]
    nmls_to_slugs = defaultdict(list)
    for r in legacy:
        if r["nmls_clean"]:
            nmls_to_slugs[r["nmls_clean"]].append(r["slug"])
    dup_slugs = {k: v for k, v in nmls_to_slugs.items() if len(v) > 1}

    # HMDA
    lei_nmls = parse_hmda_nmls()
    fl_leis = parse_hmda_fl_leis()
    fl_hmda_nmls = {lei_nmls[lei] for lei in fl_leis if lei in lei_nmls}
    ofr_company_nmls = mld_nmls | mbr_nmls | nmls_company_ids
    hmda_xwalk = {
        "florida_hmda_leis_2025": len(fl_leis),
        "lei_with_nmls_mapping": len(fl_hmda_nmls),
        "ofr_company_nmls_with_fl_hmda_nmls": len(ofr_company_nmls & fl_hmda_nmls),
        "ofr_company_nmls_without_mapped_fl_hmda": len(ofr_company_nmls - fl_hmda_nmls),
        "fl_hmda_nmls_without_ofr_mld_mbr_company": len(fl_hmda_nmls - ofr_company_nmls),
        "wording": "no attached OFR MLD/MBR credential — not 'unlicensed lender'. Banks/CUs and exemptions remain separate.",
        "note": "HMDA uses LEI. Only LEIs with an existing lei_to_nmls_mapping.csv row can join OFR NMLS. Unmapped HMDA LEIs are not counted as unmatched OFR.",
    }

    # Dry-run attachment vs legacy catalog NMLS (existing graph is listing-grain)
    ofr_company_rows_nmls = ofr_company_nmls
    attached_existing = ofr_company_rows_nmls & set(legacy_nmls)
    # Also national HMDA mapped NMLS as "existing identifier"
    attached_existing |= ofr_company_rows_nmls & fl_hmda_nmls
    net_new = ofr_company_rows_nmls - attached_existing
    malformed_company = []
    for r in mld["_rows"] + mbr["_rows"]:
        t = get(r, col_idx(mld["_header"] if r in mld["_rows"] else mbr["_header"], "LICENSE TYPE"))
        if t in {"MLD", "MBR"}:
            nid = get(r, col_idx(mld["_header"] if r in mld["_rows"] else mbr["_header"], "NMLS ID"))
            if nid and not nmls_ok(nid):
                malformed_company.append(nid)

    collisions = {
        "one_nmls_many_legacy_slugs": {k: v for k, v in list(dup_slugs.items())[:20]},
        "dup_slug_count": len(dup_slugs),
        "legacy_empty_nmls": [r["slug"] for r in legacy if not r["nmls_clean"]],
        "nmls_lo_one_person_many_licenses": None,
        "branch_multi_parent": len(multi_parent),
        "companies_mld_and_mbr": len(both_mld_mbr),
        "monthly_vs_nmls_active_only_gap": cross,
        "execution_blockers": [
            "public.lenders is listing/geo grain (slug+county), not canonical institution + credential + branch + person.",
            "No additive credential/relationship tables exist yet. Mapping proposed; not applied.",
            "User requested review of source/count/schema audit before the next ingest prompt.",
            "NMLS-derived rosters are Active-only; monthly files include other statuses — do not collapse clocks.",
        ],
    }
    # person NMLS -> licenses
    person_lic = defaultdict(set)
    for r in lr:
        pid = digits(get(r, col_idx(lh, "Individual Id")))
        lic = get(r, col_idx(lh, "License Number"))
        if nmls_ok(pid) and lic:
            person_lic[pid].add(lic)
    many_lic = {k: sorted(v) for k, v in person_lic.items() if len(v) > 1}
    collisions["nmls_lo_one_person_many_licenses"] = len(many_lic)
    collisions["person_multi_license_samples"] = dict(list(many_lic.items())[:8])

    fdic = fdic_profile(ORIG / "florida FDIC insured Banks.xlsx")

    # Strip _rows from profiles for JSON
    slim = []
    for s in sources_profiled:
        slim.append({k: v for k, v in s.items() if not k.startswith("_")})

    seven = [
        {
            "file": "LoanOriginators_AI_Monthly (4).zip → LoanOrignators_AI_Monthly.csv",
            "origin": "OFR website monthly download",
            "class": "LO A-I",
            "raw_rows": lo_ai["rows"],
            "distinct_ids": source_counts[0]["distinct_license"],
            "date": "zip member 2026-08-28 06:03:28",
            "notes": "Standard OFR columns. Typo INTIAL APPROVAL. No email. Has PHONE, COUNTY, STATUS.",
        },
        {
            "file": "LoanOriginators_JR_Monthly (3).zip → LoanOrignators_JR_Monthly.csv",
            "origin": "OFR website monthly download",
            "class": "LO J-R",
            "raw_rows": lo_jr["rows"],
            "distinct_ids": source_counts[1]["distinct_license"],
            "date": "zip member 2026-08-28 06:03:42",
            "notes": "Same schema as AI. Inner filename misspells Originators.",
        },
        {
            "file": "LoanOriginators_SZ_Monthly (4).zip → LoanOrignators_SZ_Monthly.csv",
            "origin": "OFR website monthly download",
            "class": "LO S-Z",
            "raw_rows": lo_sz["rows"],
            "distinct_ids": source_counts[2]["distinct_license"],
            "date": "zip member 2026-08-28 06:03:50",
            "notes": "Same schema.",
        },
        {
            "file": "MortgageFirms_MBR-MBRB_Monthly (8).zip",
            "origin": "OFR website monthly download",
            "class": "MBR/MBRB",
            "raw_rows": mbr["rows"],
            "distinct_ids": source_counts[3]["distinct_license"],
            "date": "zip member 2026-08-28 06:03:54",
            "notes": "LICENSE TYPE MBR vs MBRB. No SERVICER column. No email.",
        },
        {
            "file": "MortgageFirms_MLD-MLDB_Monthly (7).zip",
            "origin": "OFR website monthly download",
            "class": "MLD/MLDB",
            "raw_rows": mld["rows"],
            "distinct_ids": source_counts[4]["distinct_license"],
            "date": "zip member 2026-08-28 06:05:00",
            "notes": "Adds SERVICER column. LICENSE TYPE MLD vs MLDB. No email.",
        },
        {
            "file": "Loan Originators.csv",
            "origin": "NMLS-derived OFR PRR #141420 production",
            "class": "Individual Roster (Regulator) — relationship/contact",
            "raw_rows": nmls_lo["rows"],
            "distinct_ids": nmls_lo_prof["distinct_individual_id"],
            "date": "As Of Date 8/27/2026; generated 8/28/2026 7:52; Active license only",
            "notes": "Emails, sponsoring company + company NMLS, sponsorship status/dates, worker classification. No individual phone. No branch id.",
        },
        {
            "file": "Mortgage Businesses.csv",
            "origin": "NMLS-derived OFR PRR #141420 production",
            "class": "Company/Branch Roster by License Type — relationship/contact",
            "raw_rows": nmls_co["rows"],
            "distinct_ids": nmls_co_split["distinct_company_id"],
            "date": "As Of Date 8/27/2026; generated 8/28/2026 7:53; Active license only",
            "notes": "Company Id + Branch Id parent link. Company/complaint emails and phones. Blank Branch Id = company credential.",
        },
    ]

    attachment = {
        "existing_graph": "TypeScript FLORIDA_LENDERS listing catalog + HMDA lei_to_nmls_mapping. public.lenders is listing grain, not institution grain.",
        "source_company_nmls": len(ofr_company_nmls),
        "attached_existing_nmls_in_legacy_or_hmda_map": len(attached_existing),
        "net_new_high_confidence_candidates": len(net_new),
        "review_required": "not scored this pass — no name/address matching executed",
        "malformed_nmls_samples": malformed_company[:10],
        "malformed_count": len(malformed_company),
        "conflicts": collisions["dup_slug_count"],
        "attachment_pct_vs_legacy_or_hmda_map": round(100.0 * len(attached_existing) / len(ofr_company_nmls), 2) if ofr_company_nmls else None,
        "execute": False,
        "reason": "Audit-only. Additive credential schema not present. Unexplained listing-grain collisions (one NMLS, many FL slugs) are expected locality clones, not institution duplicates — must not be ingested as extra institutions.",
    }

    report = {
        "generated_at": datetime.now(UTC).isoformat(),
        "task": "FL-LEND-001/002 source audit",
        "execute": False,
        "prr": {"number": PRR, "reference": REF, "produced": RECEIVED, "analyst_note": "7 files: 2 NMLS (emails), 5 OFR website downloads."},
        "manifest": manifest,
        "zip_members": zip_members,
        "seven_ofr_records": seven,
        "source_counts": [{k: v for k, v in s.items() if k != "headers"} for s in source_counts],
        "monthly_universe": monthly_universe,
        "nmls_lo": nmls_lo_prof,
        "nmls_company_branch": nmls_co_split,
        "nmls_coverage": {
            "institution_nmls_mld_mbr_company": len(ofr_company_nmls),
            "branch_nmls_monthly_mldb_mbrb": len(mldb_nmls | mbrb_nmls),
            "branch_nmls_nmls_roster": len(nmls_branch_ids),
            "individual_nmls_monthly_lo": len(monthly_lo_nmls),
            "individual_nmls_nmls_roster": len(nmls_lo_nmls),
        },
        "cross_file": cross,
        "branch_graph": branch_graph,
        "mlo_graph": mlo_graph,
        "legacy_catalog": {
            "listings": len(legacy),
            "distinct_nmls": len(set(legacy_nmls)),
            "found_in_ofr_company_or_branch_nmls": len(legacy_found),
            "not_found_or_empty": [{"slug": r["slug"], "name": r["name"], "nmls": r["nmls_clean"]} for r in legacy_not],
            "duplicate_nmls_slugs": dup_slugs,
            "note": "Listings include geo clones (same NMLS, different city). Those are locality rows, not extra institutions.",
        },
        "hmda_crosswalk": hmda_xwalk,
        "fdic": fdic,
        "canonical_attachment_dry_run": attachment,
        "collisions": collisions,
        "schema_inspection": {
            "public.lenders": "id/slug/name/nmls_id/county — directory listing grain. trust_score present historically. Not credential grain.",
            "migrations": [
                "20260701120000_initial_lender_schema.sql",
                "20260805120000_network_auth_handoffs.sql",
                "20260809120000_my_lending_workspaces.sql",
            ],
            "proposed_additive": [
                "source_datasets / ofr_prr_141420 provenance",
                "institution_identifiers namespace nmls_company (reuse nmls_id where unique)",
                "regulatory_credentials (namespace fl_mld, fl_mbr, fl_mldb, fl_mbrb, fl_lo)",
                "mortgage_branches + branch_identifiers nmls_branch",
                "mortgage_people + person_identifiers nmls_individual",
                "person_institution_relationships SPONSORED_BY with dates; publication_allowed default false for person contact",
            ],
            "applied": False,
        },
        "profiles_slim": slim,
        "forbidden_not_done": [
            "no NMLS scrape",
            "no Trust Scores",
            "no rankings",
            "no /florida",
            "no county pages",
            "no MLO pages",
            "no Production ingest",
            "no HMDA/licensure inference",
        ],
    }
    dump("fl-lend-001-source-manifest.json", {"manifest": manifest, "zip_members": zip_members, "seven": seven})
    dump("fl-lend-001-source-counts.json", report["source_counts"])
    dump("fl-lend-001-universe.json", monthly_universe)
    dump("fl-lend-001-nmls-coverage.json", report["nmls_coverage"])
    dump("fl-lend-001-crosswalk.json", cross)
    dump("fl-lend-001-branch-graph.json", branch_graph)
    dump("fl-lend-001-mlo-graph.json", mlo_graph)
    dump("fl-lend-001-legacy-reconciliation.json", report["legacy_catalog"])
    dump("fl-lend-001-hmda-crosswalk.json", hmda_xwalk)
    dump("fl-lend-001-fdic-audit.json", fdic)
    dump("fl-lend-001-collisions.json", collisions)
    dump("fl-lend-001-attachment-dry-run.json", attachment)
    dump("fl-lend-001-full-audit.json", {k: v for k, v in report.items() if k != "profiles_slim"})
    print(json.dumps({"seven": [(x["file"], x["origin"], x["raw_rows"]) for x in seven], "execute": False}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
