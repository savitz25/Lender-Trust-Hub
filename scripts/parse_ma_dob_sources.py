#!/usr/bin/env python3
"""MA-LEND-001 — parse Massachusetts Division of Banks sources into derived research files.

Inputs (official, free, no NMLS scrape):
  data/raw/massachusetts/dob-mortgage-lender-2026-06-30.xlsx   (committed; company grain)
  data/raw/massachusetts/dob-mortgage-broker-2026-06-30.xlsx   (committed; company grain)
  data/raw/massachusetts/private/dob-mlo-2026-06-30.xlsx       (NOT committed; person grain)
  data/raw/massachusetts/private/dob-enforcement-actions.html  (NOT committed; names individuals)

Outputs (committed):
  data/massachusetts/ma-lend-001/dob-company-credentials.json  one canonical NMLS company -> MA credential rows
  data/massachusetts/ma-lend-001/dob-license-stats.json        per-file grain counts
  data/massachusetts/ma-lend-001/dob-mlo-population.json       person-grain counts only (no names, no IDs)
  data/massachusetts/ma-lend-001/dob-enforcement-events.json   2021-2026 mortgage-related DOB table rows;
                                                               person respondents are not named

Rules: NMLS Company ID is the company key. Lender and broker licenses stay separate credential
relationships on one company. Branch rows are branch grain (NMLS Branch ID). "Other Trade Name" rows
are trade-name rows, not companies or branches. No name-only joins. MLO sponsor company names are
never joined to company NMLS IDs.
"""
from __future__ import annotations

import hashlib
import html as htmllib
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "massachusetts"
PRIVATE = RAW / "private"
STAGE = ROOT / "data" / "massachusetts" / "ma-lend-001"

LENDER_XLSX = RAW / "dob-mortgage-lender-2026-06-30.xlsx"
BROKER_XLSX = RAW / "dob-mortgage-broker-2026-06-30.xlsx"
MLO_XLSX = PRIVATE / "dob-mlo-2026-06-30.xlsx"
ENF_HTML = PRIVATE / "dob-enforcement-actions.html"

SOURCE_AS_OF = "2026-06-30"
RETRIEVED_AT = "2026-09-24T14:43:49Z"
ENF_RETRIEVED_AT = "2026-09-24T14:45:46Z"
LICENSEE_PAGE = "https://www.mass.gov/lists/download-a-list-of-approved-licensees"
ENF_PAGE = "https://www.mass.gov/info-details/enforcement-actions-issued-by-the-division-of-banks"
ENF_YEARS = ("2021", "2022", "2023", "2024", "2025", "2026")

FILES = {
    "lender": {
        "path": LENDER_XLSX,
        "url": "https://www.mass.gov/doc/mortgage-lender-licensee-list/download",
        "license_name": "MA Mortgage Lender License",
        "title": "Mortgage Lender licensee data as of June 30, 2026",
    },
    "broker": {
        "path": BROKER_XLSX,
        "url": "https://www.mass.gov/doc/mortgage-broker-licensee-list/download",
        "license_name": "MA Mortgage Broker License",
        "title": "Mortgage Broker licensee data as of June 30, 2026",
    },
}
COMPANY_HEADER = ["Company ID", "Company Name", "Branch ID", "Street Address", "City", "State", "Postal Code", "License Number", "License Name"]
MLO_HEADER = ["Company Name (if applicable)", "Loan Originator Last Name", "Loan Originator First Name", "Loan Originator Middle Name", "NMLS ID", "License Number"]
TRADE_RE = re.compile(r"Other Trade Name #(\d+)$")
COMPANY_SUFFIX_RE = re.compile(
    r"\b(LLC|L\.L\.C\.|Inc\.?|Incorporated|Corp\.?|Corporation|Company|Co\.|Bank|Bancorp|L\.?P\.?|Ltd\.?|Limited|Group|Mortgage|Lending|Loans|Financial|Services|Solutions|Trust)\b",
    re.I,
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def clean(v) -> str:
    return re.sub(r"\s+", " ", str(v if v is not None else "")).strip()


def zip5(v) -> str:
    if v is None:
        return ""
    if isinstance(v, (int, float)):
        return str(int(v)).zfill(5)
    s = clean(v)
    return s.zfill(5) if s.isdigit() and len(s) < 5 else s


def read_sheet(path: Path):
    ws = openpyxl.load_workbook(path, read_only=True).worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    return clean(rows[0][0]), [clean(h) for h in rows[1]], [r for r in rows[2:] if any(c is not None and clean(c) for c in r)]


def license_digits(raw: str) -> str:
    return re.sub(r"\D", "", raw or "")


def parse_company_file(kind: str) -> tuple[list[dict], dict]:
    spec = FILES[kind]
    title, header, rows = read_sheet(spec["path"])
    if header[: len(COMPANY_HEADER)] != COMPANY_HEADER:
        raise SystemExit(f"{kind} header drifted: {header}")
    if title != spec["title"]:
        raise SystemExit(f"{kind} title drifted: {title}")
    out = []
    for r in rows:
        nmls = str(int(r[0])) if r[0] is not None else ""
        branch = str(int(r[2])) if r[2] is not None else ""
        lic_raw = clean(r[7])
        lic_name = clean(r[8])
        trade = TRADE_RE.search(lic_name)
        if not lic_name.startswith(spec["license_name"]):
            raise SystemExit(f"{kind} unexpected license name {lic_name}")
        if trade and branch:
            raise SystemExit(f"{kind} trade-name row with branch id {r}")
        grain = "TRADE_NAME_ROW" if trade else ("BRANCH_LICENSE_ROW" if branch else "COMPANY_LICENSE_ROW")
        prefix = re.match(r"[A-Za-z]*", lic_raw).group(0)
        anomalies = []
        if prefix and prefix != prefix.upper():
            anomalies.append("LOWERCASE_LICENSE_PREFIX")
        if prefix.upper() == "MLO":
            anomalies.append("MLO_PREFIX_ON_COMPANY_FILE_ROW")
        if license_digits(lic_raw) != nmls and grain != "BRANCH_LICENSE_ROW":
            anomalies.append("LICENSE_DIGITS_NE_COMPANY_NMLS")
        out.append(
            {
                "file": kind,
                "grain": grain,
                "nmls_company_id": nmls,
                "company_name": clean(r[1]),
                "nmls_branch_id": branch or None,
                "street": clean(r[3]),
                "city": clean(r[4]),
                "state": clean(r[5]),
                "postal_code": zip5(r[6]),
                "license_number_raw": lic_raw,
                "license_number_normalized": (prefix.upper() + license_digits(lic_raw)) if lic_raw else "",
                "license_name_raw": lic_name,
                "trade_name_ordinal": int(trade.group(1)) if trade else None,
                "source_anomalies": anomalies,
            }
        )
    base = [x for x in out if x["grain"] == "COMPANY_LICENSE_ROW"]
    br = [x for x in out if x["grain"] == "BRANCH_LICENSE_ROW"]
    tn = [x for x in out if x["grain"] == "TRADE_NAME_ROW"]
    names = defaultdict(set)
    for x in out:
        names[x["nmls_company_id"]].add(x["company_name"])
    if any(not x["nmls_company_id"] for x in out):
        raise SystemExit(f"{kind} row without NMLS Company ID")
    if len({x["nmls_company_id"] for x in base}) != len(base):
        raise SystemExit(f"{kind} company appears on more than one main license row")
    if {x["nmls_company_id"] for x in out} != {x["nmls_company_id"] for x in base}:
        raise SystemExit(f"{kind} branch/trade-name row without a company license row")
    if len({x["nmls_branch_id"] for x in br}) != len(br):
        raise SystemExit(f"{kind} duplicate NMLS branch id")
    stats = {
        "source_title": title,
        "source_url": spec["url"],
        "source_sha256": sha256(spec["path"]),
        "source_file": str(spec["path"].relative_to(ROOT)).replace("\\", "/"),
        "source_as_of": SOURCE_AS_OF,
        "retrieved_at": RETRIEVED_AT,
        "columns": header,
        "total_rows": len(out),
        "company_license_rows": len(base),
        "distinct_company_nmls_ids": len({x["nmls_company_id"] for x in out}),
        "branch_license_rows": len(br),
        "distinct_nmls_branch_ids": len({x["nmls_branch_id"] for x in br}),
        "trade_name_rows": len(tn),
        "distinct_license_numbers_raw": len({x["license_number_raw"] for x in out}),
        "company_rows_main_office_in_ma": sum(1 for x in base if x["state"] == "MA"),
        "branch_rows_in_ma": sum(1 for x in br if x["state"] == "MA"),
        "companies_with_multiple_names": sum(1 for v in names.values() if len(v) > 1),
        "license_prefix_counts": dict(sorted(Counter(re.match(r"[A-Za-z]*", x["license_number_raw"]).group(0) for x in out).items())),
        "source_anomaly_rows": {
            k: v for k, v in sorted(Counter(a for x in out for a in x["source_anomalies"]).items())
        },
        "fields_not_in_source": ["issue_date", "expiration_date", "license_status", "dba_text"],
    }
    return out, stats


def build_companies(lender: list[dict], broker: list[dict]) -> list[dict]:
    by: dict[str, dict] = {}
    for rows, kind in ((lender, "lender"), (broker, "broker")):
        for x in rows:
            c = by.setdefault(
                x["nmls_company_id"],
                {
                    "identity": f"NMLS:{x['nmls_company_id']}",
                    "nmls_company_id": x["nmls_company_id"],
                    "company_name": x["company_name"],
                    "credentials": {},
                },
            )
            if c["company_name"] != x["company_name"]:
                raise SystemExit(f"NMLS {x['nmls_company_id']} name differs across files")
            cred = c["credentials"].setdefault(
                kind,
                {
                    "license_name": FILES[kind]["license_name"],
                    "license_numbers": [],
                    "main_office": None,
                    "branches": [],
                    "trade_name_rows": 0,
                },
            )
            if x["grain"] == "COMPANY_LICENSE_ROW":
                cred["main_office"] = {
                    "street": x["street"],
                    "city": x["city"],
                    "state": x["state"],
                    "postal_code": x["postal_code"],
                }
                cred["license_numbers"].insert(0, x["license_number_raw"])
            elif x["grain"] == "BRANCH_LICENSE_ROW":
                cred["branches"].append(
                    {
                        "nmls_branch_id": x["nmls_branch_id"],
                        "city": x["city"],
                        "state": x["state"],
                        "postal_code": x["postal_code"],
                        "license_number_raw": x["license_number_raw"],
                        "source_anomalies": x["source_anomalies"],
                    }
                )
            else:
                cred["trade_name_rows"] += 1
    out = []
    for nmls in sorted(by, key=lambda n: (by[n]["company_name"].lower(), int(n))):
        c = by[nmls]
        for cred in c["credentials"].values():
            main = cred["license_numbers"][:1]
            extra = sorted({b["license_number_raw"] for b in cred["branches"]} - set(main))
            cred["license_numbers"] = main
            cred["branch_license_numbers_other_than_main"] = extra
            cred["branches"].sort(key=lambda b: int(b["nmls_branch_id"]))
        c["holds"] = sorted(c["credentials"])
        out.append(c)
    return out


def mlo_population() -> dict:
    title, header, rows = read_sheet(MLO_XLSX)
    if header[: len(MLO_HEADER)] != MLO_HEADER:
        raise SystemExit(f"MLO header drifted: {header}")
    nmls = [int(r[4]) for r in rows]
    counts = Counter(nmls)
    lic_mismatch = sum(1 for r in rows if license_digits(clean(r[5])) != str(int(r[4])))
    return {
        "grain": "PERSON_LICENSE_ROW",
        "source_title": title,
        "source_url": "https://www.mass.gov/doc/mortgage-loan-originator-licensee-list/download",
        "source_sha256": sha256(MLO_XLSX),
        "source_file_committed": False,
        "source_file_note": "Person-grain file names individuals; kept out of the public repository. Re-download from DOB and compare SHA-256.",
        "source_as_of": SOURCE_AS_OF,
        "retrieved_at": RETRIEVED_AT,
        "columns": header,
        "rows": len(rows),
        "distinct_person_nmls_ids": len(counts),
        "nmls_ids_on_more_than_one_row": sum(1 for v in counts.values() if v > 1),
        "rows_missing_nmls_id": 0,
        "rows_with_sponsoring_company_name": sum(1 for r in rows if clean(r[0])),
        "rows_without_sponsoring_company_name": sum(1 for r in rows if not clean(r[0])),
        "distinct_sponsoring_company_names": len({clean(r[0]) for r in rows if clean(r[0])}),
        "rows_license_digits_ne_nmls_id": lic_mismatch,
        "rows_license_number_with_internal_space": sum(1 for r in rows if " " in clean(r[5])),
        "rows_lowercase_license_prefix": sum(1 for r in rows if re.match(r"mlo", clean(r[5]))),
        "fields_not_in_source": ["issue_date", "expiration_date", "license_status", "sponsoring_company_nmls_id"],
        "sponsor_company_join": "UNSUPPORTED — the file gives a company NAME, not a company NMLS ID; no name join to companies",
        "public_person_pages": "NONE — person grain is preserved as a research population, not published",
        "_person_nmls_set": sorted(counts),
    }


def parse_enforcement_rows() -> list[dict]:
    t = ENF_HTML.read_text(encoding="utf-8")
    parts = re.split(r"<h2[^>]*>\s*(?:<[^>]+>\s*)*(20\d\d)\s*(?:<[^>]+>\s*)*</h2>", t)
    rows = []
    for i in range(1, len(parts), 2):
        year, body = parts[i], parts[i + 1]
        for tb in re.findall(r"<table.*?</table>", body, re.S):
            for tr in re.findall(r"<tr.*?</tr>", tb, re.S):
                cells = re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S)
                if not cells:
                    continue
                txt = [" ".join(htmllib.unescape(re.sub(r"<[^>]+>", " ", c)).split()) for c in cells]
                links = re.findall(r'href="([^"]+)"', tr)
                rows.append({"section_year": year, "cells": txt, "links": links})
    return rows


def iso_date(raw: str) -> str:
    m = re.match(r"(\d{1,2})/(\d{1,2})/(\d{4})$", raw.strip())
    if not m:
        raise SystemExit(f"Unparseable DOB action date {raw!r}")
    return date(int(m.group(3)), int(m.group(1)), int(m.group(2))).isoformat()


ACTION_FAMILIES = [
    ("TEMPORARY_ORDER_TO_CEASE_AND_DESIST", r"temporary (?:order to )?cease and desist"),
    ("CEASE_DIRECTIVE", r"cease directive"),
    ("CONSENT_ORDER", r"consent orde\s?r"),
    ("SETTLEMENT_AGREEMENT", r"settlement agreement"),
    ("ORDER_OF_SUSPENSION", r"order of suspension"),
    ("ORDER_OF_REVOCATION", r"order of revocation"),
    ("ORDER_TO_SHOW_CAUSE", r"order to show cause"),
    ("NOTICE_OF_ADMINISTRATIVE_PENALTY", r"notice of administrative penalty"),
    ("FINDINGS_OF_FACT", r"findings of fact"),
    ("FINAL_ORDER", r"\bfinal (?:decision and )?order\b"),
]
ENTITY_CLASSES = [
    ("MORTGAGE_LENDER", r"mortgage lender"),
    ("MORTGAGE_BROKER", r"mortgage broker"),
    ("MORTGAGE_LOAN_ORIGINATOR", r"mortgage loan originator"),
    ("MORTGAGE_SERVICER", r"mortgage servicer|third party loan servicer"),
    ("DEBT_COLLECTOR", r"debt collector"),
]


def split_parties(entity: str) -> list[str]:
    depth = 0
    buf = ""
    out = []
    tokens = re.split(r"(\(|\)|,?\s+and\s+|,\s+(?=[A-Z][a-z]+ [A-Z]))", entity)
    for tok in tokens:
        if tok is None or tok == "":
            continue
        if tok == "(":
            depth += 1
        elif tok == ")":
            depth -= 1
        if depth == 0 and re.fullmatch(r",?\s+and\s+|,\s+", tok):
            out.append(buf.strip(" ,"))
            buf = ""
            continue
        buf += tok
    if buf.strip(" ,"):
        out.append(buf.strip(" ,"))
    return out


def enforcement_events(company_ids: set[str], lender_ids: set[str], broker_ids: set[str], person_ids: set[int]) -> list[dict]:
    raw_rows = parse_enforcement_rows()
    events = []
    per_day = Counter()
    for r in raw_rows:
        if r["section_year"] not in ENF_YEARS:
            continue
        c = r["cells"]
        if len(c) < 4 or not re.search(r"mortgage|loan originator", c[3], re.I):
            continue
        action_raw, entity_raw, etype_raw = c[1], c[2], c[3]
        related_raw = c[4] if len(c) > 4 else ""
        d = iso_date(c[0])
        per_day[d] += 1
        dockets = re.findall(r"\b(20\d\d-\d{3})\b", action_raw)
        families = [k for k, rx in ACTION_FAMILIES if re.search(rx, action_raw, re.I)]
        classes = [k for k, rx in ENTITY_CLASSES if re.search(rx, etype_raw, re.I)]
        segments = split_parties(entity_raw)
        seg_ids = [[m for m in re.findall(r"NMLS\s*(?:#|No\.?|ID)?\s*:?\s*(\d+)", s, re.I)] for s in segments]
        total_ids = sum(len(x) for x in seg_ids)
        multi = len(segments) > 1
        ambiguous = multi and any(len(x) == 0 for x in seg_ids) and total_ids > 0
        parties = []
        for seg, ids in zip(segments, seg_ids):
            name = re.sub(r",?\s*NMLS\s*(?:#|No\.?|ID)?\s*:?\s*\d+", "", seg, flags=re.I).strip(" ,")
            nm = ids[0] if len(ids) == 1 else None
            is_company = bool(COMPANY_SUFFIX_RE.search(name)) and not re.search(r"\bindividually\b", seg, re.I)
            if nm and nm in company_ids:
                is_company = True
            if nm and int(nm) in person_ids and nm not in company_ids:
                is_company = False
            if "Mortgage Loan Originator" == etype_raw.strip():
                is_company = False
            if ambiguous:
                attach = "AMBIGUOUS_MULTI_PARTY_NMLS"
            elif nm:
                attach = "EXACT_NMLS_PRINTED"
            elif len(ids) > 1:
                attach = "AMBIGUOUS_MULTI_PARTY_NMLS"
            else:
                attach = "NO_NMLS_PRINTED"
            if is_company:
                parties.append(
                    {
                        "respondent_class": "COMPANY",
                        "name_as_published": name,
                        "nmls_printed": nm if attach == "EXACT_NMLS_PRINTED" else None,
                        "nmls_printed_raw": ids,
                        "attachment": attach,
                        "attached_identity": f"NMLS:{nm}" if attach == "EXACT_NMLS_PRINTED" else None,
                        "in_dob_lender_file_2026_06_30": bool(nm and nm in lender_ids),
                        "in_dob_broker_file_2026_06_30": bool(nm and nm in broker_ids),
                    }
                )
            else:
                parties.append(
                    {
                        "respondent_class": "PERSON",
                        "name_as_published": None,
                        "name_withheld": True,
                        "nmls_printed": None,
                        "nmls_printed_present": bool(ids),
                        "attachment": attach,
                        "attached_identity": None,
                        "person_identity_withheld": True,
                        "in_dob_mlo_file_2026_06_30": bool(nm and int(nm) in person_ids),
                    }
                )
        rel = related_raw
        events.append(
            {
                "event_id": f"MA-DOB-ENF:{d}:{per_day[d]}",
                "grain": "DOB_ENFORCEMENT_TABLE_ROW",
                "section_year": r["section_year"],
                "action_date": d,
                "action_date_raw": c[0],
                "regulatory_action_raw": action_raw,
                "docket_numbers": dockets,
                "action_families": families,
                "entity_type_raw": etype_raw,
                "entity_type_classes": classes,
                "respondent_text_withheld": any(p["respondent_class"] == "PERSON" for p in parties),
                "respondent_text_as_published": None if any(p["respondent_class"] == "PERSON" for p in parties) else entity_raw,
                "parties": parties,
                "related_raw": rel,
                "status_semantics": {
                    "temporary_order": "TEMPORARY_ORDER_TO_CEASE_AND_DESIST" in families,
                    "became_final_note": bool(re.search(r"became final", rel, re.I)),
                    "superseded_note": bool(re.search(r"superseded", rel, re.I)),
                    "supersedes_note": bool(re.search(r"supersedes", rel, re.I)),
                    "terminated_note": bool(re.search(r"terminated", rel, re.I)),
                },
                "order_url": ("https://www.mass.gov" + r["links"][0]) if r["links"] and r["links"][0].startswith("/") else (r["links"][0] if r["links"] else None),
                "source_page": ENF_PAGE,
                "legal_semantics": "DOB table metadata only. Order text not parsed; admission, denial, and settlement-only language is UNKNOWN at this layer. Not a TrustHub finding.",
            }
        )
    events.sort(key=lambda e: (e["action_date"], e["event_id"]), reverse=True)
    return events


def main() -> int:
    for p in (LENDER_XLSX, BROKER_XLSX, MLO_XLSX, ENF_HTML):
        if not p.exists():
            raise SystemExit(f"Missing raw source {p}. Re-acquire from {LICENSEE_PAGE} / {ENF_PAGE}.")
    lender, lstats = parse_company_file("lender")
    broker, bstats = parse_company_file("broker")
    companies = build_companies(lender, broker)
    mlo = mlo_population()
    person_ids = set(mlo.pop("_person_nmls_set"))
    lender_ids = {x["nmls_company_id"] for x in lender}
    broker_ids = {x["nmls_company_id"] for x in broker}
    lb = {x["nmls_branch_id"] for x in lender if x["nmls_branch_id"]}
    bb = {x["nmls_branch_id"] for x in broker if x["nmls_branch_id"]}
    cross = {
        "distinct_company_nmls_ids_any_file": len(lender_ids | broker_ids),
        "companies_holding_lender_and_broker": len(lender_ids & broker_ids),
        "companies_lender_only": len(lender_ids - broker_ids),
        "companies_broker_only": len(broker_ids - lender_ids),
        "distinct_nmls_branch_ids_any_file": len(lb | bb),
        "nmls_branch_ids_on_both_files": len(lb & bb),
        "company_nmls_ids_also_on_mlo_file": len({int(n) for n in lender_ids | broker_ids} & person_ids),
        "same_license_number_on_lender_and_broker_main_rows": len(
            {x["license_number_raw"] for x in lender if x["grain"] == "COMPANY_LICENSE_ROW"}
            & {x["license_number_raw"] for x in broker if x["grain"] == "COMPANY_LICENSE_ROW"}
        ),
    }
    events = enforcement_events(lender_ids | broker_ids, lender_ids, broker_ids, person_ids)
    STAGE.mkdir(parents=True, exist_ok=True)
    (STAGE / "dob-company-credentials.json").write_text(json.dumps(companies, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    (STAGE / "dob-license-stats.json").write_text(
        json.dumps({"lender": lstats, "broker": bstats, "cross_file": cross}, indent=2) + "\n", encoding="utf-8"
    )
    (STAGE / "dob-mlo-population.json").write_text(json.dumps(mlo, indent=2) + "\n", encoding="utf-8")
    (STAGE / "dob-enforcement-events.json").write_text(
        json.dumps(
            {
                "source_page": ENF_PAGE,
                "source_sha256": sha256(ENF_HTML),
                "source_file_committed": False,
                "retrieved_at": ENF_RETRIEVED_AT,
                "window_section_years": list(ENF_YEARS),
                "filter": "Entity Type mentions Mortgage Lender, Mortgage Broker, Mortgage Loan Originator, or Mortgage Servicer",
                "all_table_rows_on_page": len(parse_enforcement_rows()),
                "events": events,
            },
            indent=1,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print("lender", lstats["total_rows"], lstats["distinct_company_nmls_ids"], lstats["branch_license_rows"], lstats["trade_name_rows"])
    print("broker", bstats["total_rows"], bstats["distinct_company_nmls_ids"], bstats["branch_license_rows"], bstats["trade_name_rows"])
    print("cross", cross)
    print("mlo", mlo["rows"], mlo["distinct_person_nmls_ids"])
    print("events", len(events), Counter(p["attachment"] for e in events for p in e["parties"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
