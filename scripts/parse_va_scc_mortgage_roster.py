"""Parse SCC BFI 2025 mortgage-company list from extracted annual-report text."""
from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEXT = ROOT / "data" / "raw" / "virginia" / "ar02-25.txt"
STAGE = ROOT / "data" / "virginia" / "va-lend-001"

HEADER_RE = re.compile(
    r"^("
    r"STATE CORPORATION COMMISSION.*|"
    r"2025 ANNUAL REPORT|"
    r"Mortgage Companies -- List by Name|"
    r"The above records represent filings.*|"
    r"The Bureau has not changed the format.*|"
    r"\d{1,3}"
    r")$",
    re.I,
)
LICENSE_RE = re.compile(
    r"Virginia license number:\s*(MC-?\d+)\s*[-–]\s*NMLS ID:\s*([0-9]+|N/?A|None|)$",
    re.I,
)
HELD_RE = re.compile(r"Mortgage license\(s\) held:\s*(.+)$", re.I)
OFFICE_RE = re.compile(r"Corporate office:\s*(.+)$", re.I)
TYPE_MAP = {
    "broker": "BROKER",
    "lender": "LENDER",
    "broker and lender": "LENDER_AND_BROKER",
    "lender and broker": "LENDER_AND_BROKER",
}


def clean_line(line: str) -> str:
    s = re.sub(r"[ \t]+", " ", (line or "").replace("\xa0", " ")).strip()
    return s


def normalize_address(addr: str) -> str:
    s = clean_line(addr)
    s = re.sub(r"\bV A\b", "VA", s)
    s = re.sub(r"\bM D\b", "MD", s)
    return s


def normalize_type(raw: str) -> str | None:
    key = re.sub(r"\s+", " ", (raw or "").strip().lower())
    key = key.replace("&", "and")
    return TYPE_MAP.get(key)


def extract_section(text: str) -> str:
    start = text.find("Mortgage Companies -- List by Name")
    end = text.find("Industrial Loan Associations -- List by Name")
    if start < 0 or end < 0 or end <= start:
        raise SystemExit("Could not bound mortgage-company list")
    return text[start:end]


def parse_mc(raw: str) -> str:
    digits = re.sub(r"\D", "", raw or "")
    return f"MC-{digits}" if digits else ""


def parse_records(text: str) -> list[dict]:
    section = extract_section(text)
    lines = [clean_line(x) for x in section.splitlines()]
    lines = [ln for ln in lines if ln and not HEADER_RE.match(ln)]
    records: list[dict] = []
    i = 0
    while i < len(lines):
        ln = lines[i]
        if ln.endswith("(Continued)"):
            extras: list[str] = []
            i += 1
            while i < len(lines) and not LICENSE_RE.match(lines[i]) and not lines[i].endswith("(Continued)"):
                if lines[i].lower().startswith("additional licensed locations"):
                    rest = lines[i].split(":", 1)[-1].strip()
                    if rest:
                        extras.append(rest)
                elif not HELD_RE.match(lines[i]) and not OFFICE_RE.match(lines[i]):
                    extras.append(lines[i])
                i += 1
            if records:
                records[-1]["additional_locations"].extend(normalize_address(x) for x in extras if x)
            continue
        m = LICENSE_RE.match(ln)
        if not m:
            i += 1
            continue
        name = lines[i - 1] if i else ""
        if name.endswith("(Continued)"):
            name = re.sub(r"\s*\(Continued\)\s*$", "", name).strip()
        nmls_raw = (m.group(2) or "").strip()
        nmls = "" if re.match(r"^(N/?A|None)?$", nmls_raw, re.I) else re.sub(r"\D", "", nmls_raw)
        held = ""
        office = ""
        extras = []
        i += 1
        while i < len(lines):
            nxt = lines[i]
            if LICENSE_RE.match(nxt) or nxt.endswith("(Continued)"):
                break
            hm = HELD_RE.match(nxt)
            om = OFFICE_RE.match(nxt)
            if hm:
                held = hm.group(1).strip()
                i += 1
                continue
            if om:
                office = om.group(1).strip()
                i += 1
                # wrapped office: next line is not a field and not a following company name
                # (company names sit immediately before a license line). Keep wrapping
                # only while the following line is not a start-of-record marker and looks
                # like an address fragment.
                while i < len(lines):
                    peek = lines[i]
                    if LICENSE_RE.match(peek) or peek.endswith("(Continued)") or HELD_RE.match(peek) or OFFICE_RE.match(peek):
                        break
                    if peek.lower().startswith("additional licensed locations"):
                        break
                    if i + 1 < len(lines) and LICENSE_RE.match(lines[i + 1]):
                        break
                    office = f"{office} {peek}".strip()
                    i += 1
                continue
            if nxt.lower().startswith("additional licensed locations"):
                rest = nxt.split(":", 1)[-1].strip()
                if rest:
                    extras.append(rest)
                i += 1
                while i < len(lines):
                    peek = lines[i]
                    if LICENSE_RE.match(peek) or peek.endswith("(Continued)") or HELD_RE.match(peek) or OFFICE_RE.match(peek):
                        break
                    if i + 1 < len(lines) and LICENSE_RE.match(lines[i + 1]):
                        break
                    extras.append(peek)
                    i += 1
                continue
            i += 1
        license_type = normalize_type(held)
        records.append(
            {
                "name": name,
                "virginia_mc": parse_mc(m.group(1)),
                "nmls_id": nmls or None,
                "license_held_raw": held,
                "license_type": license_type,
                "corporate_office": normalize_address(office),
                "additional_locations": [normalize_address(x) for x in extras if x],
                "identity": f"VA-SCC-BFI:{parse_mc(m.group(1))}",
                "nmls_identity": f"NMLS:{nmls}" if nmls else None,
                "exact_va_to_nmls": bool(parse_mc(m.group(1)) and nmls),
            }
        )
    return records


def stats(records: list[dict]) -> dict:
    types = Counter(r.get("license_type") or "UNKNOWN" for r in records)
    mcs = [(r.get("virginia_mc") or "") for r in records]
    nmls_ids = [r.get("nmls_id") for r in records if r.get("nmls_id")]
    mc_counts = Counter(mcs)
    nmls_counts = Counter(nmls_ids)
    extra_offices = sum(len(r.get("additional_locations") or []) for r in records)
    return {
        "rows": len(records),
        "by_type": dict(types),
        "distinct_mc": len({m for m in mcs if m}),
        "duplicate_mc": sorted(k for k, n in mc_counts.items() if n > 1),
        "missing_mc": sum(1 for m in mcs if not m),
        "distinct_nmls": len(set(nmls_ids)),
        "duplicate_nmls": sorted(k for k, n in nmls_counts.items() if n > 1),
        "missing_nmls": sum(1 for r in records if not r.get("nmls_id")),
        "exact_crosswalks": sum(1 for r in records if r.get("exact_va_to_nmls")),
        "unknown_type": types.get("UNKNOWN", 0),
        "corporate_offices": sum(1 for r in records if r.get("corporate_office")),
        "additional_location_rows": extra_offices,
        "blank_names": sum(1 for r in records if not r.get("name")),
    }


def main() -> None:
    text = TEXT.read_text(encoding="utf-8")
    records = parse_records(text)
    summary = stats(records)
    STAGE.mkdir(parents=True, exist_ok=True)
    (STAGE / "scc-mortgage-companies.json").write_text(
        json.dumps(records, indent=2) + "\n", encoding="utf-8"
    )
    (STAGE / "scc-mortgage-parse-stats.json").write_text(
        json.dumps(summary, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(summary, indent=2))
    print("first", records[0]["name"] if records else None)
    print("last", records[-1]["name"] if records else None)


if __name__ == "__main__":
    main()
