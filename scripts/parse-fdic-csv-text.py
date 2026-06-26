#!/usr/bin/env python3
"""Parse tab-separated FDIC bank lists from pasted text into lib/fdic/data/*.json"""
import csv
import json
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "fdic-import-raw.txt"
MS_SRC = ROOT / "data" / "mississippi-import.txt"
TX_SRC = ROOT / "data" / "texas-import.txt"
TX_PROMPT = Path(
    r"C:\Users\makei\.grok\sessions\C%3A%5CUsers%5Cmakei\019efc5b-cf82-7612-8aff-b4ae0767aaa7\prompts\prompt_4.txt"
)
OK_SRC = ROOT / "data" / "oklahoma-import.txt"
AR_SRC = ROOT / "data" / "arkansas-import.txt"
OK_AR_PROMPT = Path(
    r"C:\Users\makei\.grok\sessions\C%3A%5CUsers%5Cmakei\019efc5b-cf82-7612-8aff-b4ae0767aaa7\prompts\prompt_5.txt"
)
KS_SRC = ROOT / "data" / "kansas-import.txt"
MO_SRC = ROOT / "data" / "missouri-import.txt"
KS_MO_PROMPT = Path(
    r"C:\Users\makei\.grok\sessions\C%3A%5CUsers%5Cmakei\019efc5b-cf82-7612-8aff-b4ae0767aaa7\prompts\prompt_6.txt"
)
IA_SRC = ROOT / "data" / "iowa-import.txt"
IA_PROMPT = Path(
    r"C:\Users\makei\.grok\sessions\C%3A%5CUsers%5Cmakei\019efc5b-cf82-7612-8aff-b4ae0767aaa7\prompts\prompt_7.txt"
)
MN_SRC = ROOT / "data" / "minnesota-import.txt"
MN_PROMPT = Path(
    r"C:\Users\makei\.grok\sessions\C%3A%5CUsers%5Cmakei\019efc5b-cf82-7612-8aff-b4ae0767aaa7\prompts\prompt_8.txt"
)
WI_SRC = ROOT / "data" / "wisconsin-import.txt"
WI_PROMPT = Path(
    r"C:\Users\makei\.grok\sessions\C%3A%5CUsers%5Cmakei\019efc5b-cf82-7612-8aff-b4ae0767aaa7\prompts\prompt_9.txt"
)
CSV_SOURCES = {
    "IL": ROOT / "data" / "illinois-import.csv",
    "MI": ROOT / "data" / "michigan-import.csv",
}
REGIONAL_CSV_SOURCES: dict[str, tuple[Path, set[str]]] = {
    "northeast": (
        ROOT / "data" / "northeast-import.csv",
        {
            "CT",
            "DE",
            "DC",
            "IN",
            "ME",
            "MD",
            "MA",
            "NH",
            "NJ",
            "NY",
            "OH",
            "PA",
            "RI",
            "VT",
        },
    ),
    "kentucky-tennessee": (
        ROOT / "data" / "kentucky-tennessee-import.csv",
        {"KY", "TN"},
    ),
}
OUT_DIR = ROOT / "lib" / "fdic" / "data"

STATE_META = {
    "GA": ("Georgia", "georgia"),
    "SC": ("South Carolina", "south-carolina"),
    "TN": ("Tennessee", "tennessee"),
    "NC": ("North Carolina", "north-carolina"),
    "VA": ("Virginia", "virginia"),
    "WV": ("West Virginia", "west-virginia"),
    "AL": ("Alabama", "alabama"),
    "MS": ("Mississippi", "mississippi"),
    "LA": ("Louisiana", "louisiana"),
    "TX": ("Texas", "texas"),
    "OK": ("Oklahoma", "oklahoma"),
    "AR": ("Arkansas", "arkansas"),
    "KS": ("Kansas", "kansas"),
    "KY": ("Kentucky", "kentucky"),
    "MO": ("Missouri", "missouri"),
    "IA": ("Iowa", "iowa"),
    "MN": ("Minnesota", "minnesota"),
    "WI": ("Wisconsin", "wisconsin"),
    "IL": ("Illinois", "illinois"),
    "IN": ("Indiana", "indiana"),
    "MI": ("Michigan", "michigan"),
    "OH": ("Ohio", "ohio"),
    "CT": ("Connecticut", "connecticut"),
    "DE": ("Delaware", "delaware"),
    "DC": ("District of Columbia", "district-of-columbia"),
    "ME": ("Maine", "maine"),
    "MD": ("Maryland", "maryland"),
    "MA": ("Massachusetts", "massachusetts"),
    "NH": ("New Hampshire", "new-hampshire"),
    "NJ": ("New Jersey", "new-jersey"),
    "NY": ("New York", "new-york"),
    "PA": ("Pennsylvania", "pennsylvania"),
    "RI": ("Rhode Island", "rhode-island"),
    "VT": ("Vermont", "vermont"),
}

BULK_MIN_COLS = 133
BULK_COL_STREET = 1
BULK_COL_SUITE = 2
BULK_COL_CITY = 22
BULK_COL_CERT = 37
BULK_COL_INSURED = 54
BULK_COL_NAME = 67
BULK_COL_REGULATOR = 84
BULK_COL_STALP = 99
BULK_COL_WEBSITE = 131
BULK_COL_ZIP = 132

REGULATOR_MAP = {
    "OCC": "Comptroller of the Currency",
    "FDIC": "Federal Deposit Insurance Corporation",
    "FED": "Federal Reserve Board",
}

VALID_STALP = {
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID",
    "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO",
    "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA",
    "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
}

# Use anchored line markers so intro text and bank names do not false-match.
SECTION_MARKERS = [
    ("GA", re.compile(r"^Bank Name,FDIC Insured Since", re.I), re.compile(r"^South Carolina Banks\s*$", re.I)),
    ("SC", re.compile(r"^South Carolina Banks\s*$", re.I), re.compile(r"^North Carolina Banks\s*$", re.I)),
    ("NC", re.compile(r"^North Carolina Banks\s*$", re.I), re.compile(r"^virginia\s*$", re.I)),
    ("VA", re.compile(r"^virginia\s*$", re.I), re.compile(r"^west virginia\s*$", re.I)),
    ("WV", re.compile(r"^west virginia\s*$", re.I), re.compile(r"^Alabama\s*$", re.I)),
    ("AL", re.compile(r"^Alabama\s*$", re.I), re.compile(r"^Mississippi\s*$", re.I)),
    ("MS", re.compile(r"^Mississippi\s*$", re.I), re.compile(r"^lousiana\s*$", re.I)),
    ("LA", re.compile(r"^lousiana\s*$", re.I), None),
]

DATE_RE = re.compile(r"^\d{2}/\d{2}/\d{4}$")
BULK_DATE_RE = re.compile(r"^\d{1,2}/\d{1,2}/\d{4}$")


def normalize_bulk_date(value: str) -> str:
    match = BULK_DATE_RE.match(value.strip())
    if not match:
        return value.strip()
    month, day, year = value.strip().split("/")
    return f"{int(month):02d}/{int(day):02d}/{year}"


def normalize_website(url: str) -> str:
    url = url.strip()
    if not url or url.lower() in ("not listed", "*not listed*", "n/a", ""):
        return ""
    if url.startswith("http"):
        return url
    return "https://" + url.lstrip("/")


def address_state(address: str) -> str | None:
    match = re.search(r",\s*([A-Z]{2})\s+\d{5}", address)
    return match.group(1) if match else None


def normalize_input_line(line: str) -> str:
    """Convert tab-separated rows (no quoted address) into comma-quoted CSV lines."""
    line = line.strip().rstrip("\t")
    if not line:
        return line

    if ',"' in line:
        return line.replace("\t", "")

    if "\t" not in line:
        return line

    parts = [p.strip() for p in line.split("\t") if p.strip()]
    if len(parts) < 6:
        return line.replace("\t", "")

    website = parts[-1]
    address = parts[-2]
    regulator = parts[-3]
    cert = parts[-4]
    insured_since = parts[-5]
    name = ", ".join(parts[:-5])

    if not cert.isdigit() or not DATE_RE.match(insured_since):
        return line.replace("\t", "")

    return (
        f'{name},{insured_since},{cert},{regulator},'
        f'"{address}",{website}'
    )


def repair_line(line: str) -> str:
    if "Extraco Banks, National Association" in line and ",4756," in line:
        return (
            'First National Bank and Trust,01/01/1934,4756,Comptroller of the Currency,'
            '"225 State St, Phillipsburg, KS 67661",www.agbank.bank'
        )
    if "Extraco Banks, National Association" in line and ",12139," in line:
        return (
            'Ford County State Bank,01/01/1934,12139,Federal Deposit Insurance Corporation,'
            '"322 N Main St, Spearville, KS 67876",fordcountystatebank.com'
        )
    return line


def parse_line(line: str) -> dict | None:
    line = repair_line(normalize_input_line(line))
    if not line or line.lower().startswith("bank name,"):
        return None

    tail = re.search(r',"([^"]+)"\s*,\s*(.+)$', line)
    if not tail:
        return None

    address = tail.group(1).strip()
    website = tail.group(2).strip()
    prefix = line[: tail.start()]

    parts = prefix.rsplit(",", 2)
    if len(parts) != 3:
        return None

    name_date, cert, regulator = (p.strip() for p in parts)
    if not cert.isdigit():
        return None

    name_parts = name_date.rsplit(",", 1)
    if len(name_parts) != 2:
        return None

    name, insured_since = (p.strip() for p in name_parts)
    if not name or not DATE_RE.match(insured_since):
        return None

    return {
        "name": name,
        "fdic_insured_since": insured_since,
        "fdic_cert": cert,
        "primary_regulator": regulator,
        "headquarters_address": address,
        "website": normalize_website(website),
    }


def parse_bulk_line(line: str) -> dict | None:
    parts = line.split("\t")
    if len(parts) < BULK_MIN_COLS:
        return None

    cert = parts[BULK_COL_CERT].strip()
    name = parts[BULK_COL_NAME].strip()
    insured_since = parts[BULK_COL_INSURED].strip()
    regulator_code = parts[BULK_COL_REGULATOR].strip().upper()

    if not cert.isdigit() or not name or not BULK_DATE_RE.match(insured_since):
        return None

    insured_since = normalize_bulk_date(insured_since)

    street = parts[BULK_COL_STREET].strip()
    suite = parts[BULK_COL_SUITE].strip()
    city = parts[BULK_COL_CITY].strip()
    state = parts[BULK_COL_STALP].strip()
    zip_code = parts[BULK_COL_ZIP].strip()

    address_parts = [p for p in (street, suite, city) if p]
    if state and zip_code:
        address_parts.append(f"{state} {zip_code}")
    elif state:
        address_parts.append(state)

    regulator = REGULATOR_MAP.get(regulator_code, regulator_code)

    return {
        "name": name,
        "fdic_insured_since": insured_since,
        "fdic_cert": cert,
        "primary_regulator": regulator,
        "headquarters_address": ", ".join(address_parts),
        "website": normalize_website(parts[BULK_COL_WEBSITE].strip()),
    }


def build_csv_address(row: dict) -> str:
    street = (row.get("ADDRESS") or "").strip()
    suite = (row.get("ADDRESS2") or "").strip()
    city = (row.get("CITY") or "").strip()
    state = (row.get("STALP") or "").strip()
    zip_code = (row.get("ZIP") or "").strip()

    address_parts = [p for p in (street, suite, city) if p]
    if state and zip_code:
        address_parts.append(f"{state} {zip_code}")
    elif state:
        address_parts.append(state)

    return ", ".join(address_parts)


def parse_fdic_csv_row(row: dict) -> dict | None:
    cert = (row.get("CERT") or "").strip()
    name = (row.get("NAME") or "").strip()
    insured_since = (row.get("INSDATE") or "").strip()
    regulator_code = (row.get("REGAGNT") or "").strip().upper()

    if not cert.isdigit() or not name or not BULK_DATE_RE.match(insured_since):
        return None

    regulator = REGULATOR_MAP.get(regulator_code, regulator_code)

    return {
        "name": name,
        "fdic_insured_since": normalize_bulk_date(insured_since),
        "fdic_cert": cert,
        "primary_regulator": regulator,
        "headquarters_address": build_csv_address(row),
        "website": normalize_website((row.get("WEBADDR") or "").strip()),
    }


def parse_fdic_csv(path: Path) -> list[dict]:
    banks = []
    seen_certs = set()

    with path.open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            bank = parse_fdic_csv_row(row)
            if not bank:
                continue
            if bank["fdic_cert"] in seen_certs:
                continue
            seen_certs.add(bank["fdic_cert"])
            banks.append(bank)

    return banks


def extract_fdic_csv_sections(content: str) -> list[tuple[list[str], list[list[str]]]]:
    """Split a pasted FDIC export that may contain repeated header rows."""
    sections: list[tuple[list[str], list[list[str]]]] = []
    current_header: list[str] | None = None
    current_rows: list[list[str]] = []

    for line in content.splitlines():
        if line.startswith("ACTIVE,ADDRESS"):
            if current_header is not None:
                sections.append((current_header, current_rows))
            current_header = next(csv.reader([line]))
            current_rows = []
            continue
        if current_header is None or not line.strip():
            continue
        current_rows.append(next(csv.reader([line])))

    if current_header is not None:
        sections.append((current_header, current_rows))

    return sections


def normalize_csv_row(fields: list[str], row: list[str]) -> dict:
    if len(row) < len(fields):
        row = row + [""] * (len(fields) - len(row))
    elif len(row) > len(fields):
        row = row[: len(fields)]
    return dict(zip(fields, row))


def parse_fdic_csv_sections(path: Path) -> list[dict]:
    """Parse multi-section FDIC CSV exports with varying header layouts."""
    content = path.read_text(encoding="utf-8")
    banks = []
    seen_certs = set()

    for fields, rows in extract_fdic_csv_sections(content):
        for row in rows:
            bank = parse_fdic_csv_row(normalize_csv_row(fields, row))
            if not bank:
                continue
            stalp = normalize_csv_row(fields, row).get("STALP", "").strip()
            if stalp not in VALID_STALP:
                continue
            if bank["fdic_cert"] in seen_certs:
                continue
            seen_certs.add(bank["fdic_cert"])
            bank["stalp"] = stalp
            banks.append(bank)

    return banks


def group_banks_by_state(banks: list[dict]) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = {}
    for bank in banks:
        code = bank.pop("stalp", None)
        if not code:
            continue
        grouped.setdefault(code, []).append(bank)
    return grouped


def parse_bulk_section(text: str) -> list[dict]:
    banks = []
    seen_certs = set()

    for raw_line in text.splitlines():
        bank = parse_bulk_line(raw_line)
        if not bank:
            continue
        if bank["fdic_cert"] in seen_certs:
            continue
        seen_certs.add(bank["fdic_cert"])
        banks.append(bank)

    return banks


def parse_section(text: str, *, filter_state: str | None = None) -> list[dict]:
    banks = []
    seen_certs = set()

    for raw_line in text.splitlines():
        bank = parse_line(raw_line)
        if not bank:
            continue
        if filter_state and address_state(bank["headquarters_address"]) != filter_state:
            continue
        if bank["fdic_cert"] in seen_certs:
            continue
        seen_certs.add(bank["fdic_cert"])
        banks.append(bank)

    return banks


def extract_sections(content: str) -> dict[str, str]:
    lines = content.splitlines()
    sections: dict[str, str] = {}

    for code, start_pat, end_pat in SECTION_MARKERS:
        start_idx = None
        for i, line in enumerate(lines):
            if start_pat.match(line.strip()):
                start_idx = i
                break
        if start_idx is None:
            continue

        end_idx = len(lines)
        if end_pat:
            for j in range(start_idx + 1, len(lines)):
                if end_pat.match(lines[j].strip()):
                    end_idx = j
                    break

        block_lines = []
        for j in range(start_idx + 1, end_idx):
            line = lines[j].strip()
            if not line:
                continue
            if code == "GA" and line.startswith("Bank Name,FDIC"):
                if block_lines:
                    block_lines = []
                continue
            block_lines.append(lines[j].rstrip("\t").replace("\t", ""))

        sections[code] = "\n".join(block_lines)

    return sections


def extract_texas_lines(content: str) -> str:
    """Merge all Texas bank rows from a pasted prompt (skips duplicate headers)."""
    if "<user_query>" in content:
        content = content.split("<user_query>", 1)[1]

    block_lines: list[str] = []
    for raw in content.splitlines():
        line = raw.strip().rstrip("\t").replace("\t", "")
        if not line or line.startswith("<"):
            continue
        if re.match(r"^lets do texas", line, re.I) or line.strip().lower() == "texas":
            continue
        if line.lower().startswith("bank name,fdic"):
            continue
        block_lines.append(line)

    return "\n".join(block_lines)


def ensure_texas_import() -> None:
    if TX_SRC.exists():
        return
    if not TX_PROMPT.exists():
        return
    raw = TX_PROMPT.read_text(encoding="utf-8")
    TX_SRC.parent.mkdir(parents=True, exist_ok=True)
    TX_SRC.write_text(extract_texas_lines(raw), encoding="utf-8")


def extract_oklahoma_lines(content: str) -> str:
    if "<user_query>" in content:
        content = content.split("<user_query>", 1)[1]

    block_lines: list[str] = []
    for raw in content.splitlines():
        line = raw.strip().rstrip("\t").replace("\t", "")
        if re.match(r"^arkansas\s*$", line, re.I):
            break
        if not line or line.startswith("<"):
            continue
        if re.match(r"^ok now arkansas", line, re.I):
            continue
        if line.lower().startswith("bank name,fdic"):
            continue
        block_lines.append(line)

    return "\n".join(block_lines)


def extract_arkansas_lines(content: str) -> str:
    if "<user_query>" in content:
        content = content.split("<user_query>", 1)[1]

    lines = content.splitlines()
    ar_start = None
    for i, line in enumerate(lines):
        if re.match(r"^arkansas\s*$", line.strip(), re.I):
            ar_start = i
            break
    if ar_start is None:
        return ""

    last_header = ar_start
    for j in range(ar_start + 1, len(lines)):
        if lines[j].strip().lower().startswith("bank name,fdic"):
            last_header = j

    block_lines: list[str] = []
    for raw in lines[last_header + 1 :]:
        line = raw.strip().rstrip("\t").replace("\t", "")
        if not line or line.startswith("<"):
            continue
        block_lines.append(line)

    return "\n".join(block_lines)


def ensure_ok_ar_imports() -> None:
    if not OK_AR_PROMPT.exists():
        return
    raw = OK_AR_PROMPT.read_text(encoding="utf-8")
    OK_SRC.parent.mkdir(parents=True, exist_ok=True)
    if not OK_SRC.exists():
        OK_SRC.write_text(extract_oklahoma_lines(raw), encoding="utf-8")
    if not AR_SRC.exists():
        AR_SRC.write_text(extract_arkansas_lines(raw), encoding="utf-8")


def extract_kansas_lines(content: str) -> str:
    if "<user_query>" in content:
        content = content.split("<user_query>", 1)[1]

    block_lines: list[str] = []
    for raw in content.splitlines():
        line = raw.strip().rstrip("\t").replace("\t", "")
        if re.match(r"^missouri\s*$", line, re.I):
            break
        if not line or line.startswith("<"):
            continue
        if re.match(r"^kansas\s*$", line, re.I):
            continue
        if line.lower().startswith("bank name,fdic"):
            continue
        block_lines.append(repair_line(line))

    return "\n".join(block_lines)


def extract_missouri_lines(content: str) -> str:
    if "<user_query>" in content:
        content = content.split("<user_query>", 1)[1]

    block_lines: list[str] = []
    in_missouri = False
    for raw in content.splitlines():
        line = raw.strip().rstrip("\t").replace("\t", "")
        if re.match(r"^missouri\s*$", line, re.I):
            in_missouri = True
            continue
        if not in_missouri:
            continue
        if not line or line.startswith("<"):
            continue
        if line.lower().startswith("bank name,fdic"):
            continue
        block_lines.append(line)

    return "\n".join(block_lines)


def ensure_ks_mo_imports() -> None:
    if not KS_MO_PROMPT.exists():
        return
    raw = KS_MO_PROMPT.read_text(encoding="utf-8")
    KS_SRC.parent.mkdir(parents=True, exist_ok=True)
    if not KS_SRC.exists():
        KS_SRC.write_text(extract_kansas_lines(raw), encoding="utf-8")
    if not MO_SRC.exists():
        MO_SRC.write_text(extract_missouri_lines(raw), encoding="utf-8")


def extract_iowa_lines(content: str) -> str:
    if "<user_query>" in content:
        content = content.split("<user_query>", 1)[1]

    block_lines: list[str] = []
    for raw in content.splitlines():
        line = raw.strip().rstrip("\t").replace("\t", "")
        if not line or line.startswith("<"):
            continue
        if re.match(r"^iowa\s*$", line, re.I):
            continue
        if line.lower().startswith("bank name,fdic"):
            continue
        block_lines.append(line)

    return "\n".join(block_lines)


def ensure_iowa_import() -> None:
    if IA_SRC.exists() or not IA_PROMPT.exists():
        return
    raw = IA_PROMPT.read_text(encoding="utf-8")
    IA_SRC.parent.mkdir(parents=True, exist_ok=True)
    IA_SRC.write_text(extract_iowa_lines(raw), encoding="utf-8")


def extract_minnesota_lines(content: str) -> str:
    if "<user_query>" in content:
        content = content.split("<user_query>", 1)[1]

    block_lines: list[str] = []
    for raw in content.splitlines():
        line = raw.strip().rstrip("\t")
        if not line or line.startswith("<"):
            continue
        if re.match(r"^MN\s*$", line, re.I):
            continue
        if line.lower().startswith("bank name,fdic"):
            continue
        if ',"' in line:
            block_lines.append(line.replace("\t", ""))
        else:
            block_lines.append(line)

    return "\n".join(block_lines)


def ensure_minnesota_import() -> None:
    if MN_SRC.exists() or not MN_PROMPT.exists():
        return
    raw = MN_PROMPT.read_text(encoding="utf-8")
    MN_SRC.parent.mkdir(parents=True, exist_ok=True)
    MN_SRC.write_text(extract_minnesota_lines(raw), encoding="utf-8")


def extract_wisconsin_lines(content: str) -> str:
    if "<user_query>" in content:
        content = content.split("<user_query>", 1)[1]

    block_lines: list[str] = []
    for raw in content.splitlines():
        line = raw.strip()
        if not line or line.startswith("<"):
            continue
        if "\t" not in line:
            continue
        block_lines.append(line)

    return "\n".join(block_lines)


def ensure_wisconsin_import() -> None:
    if not WI_PROMPT.exists():
        return
    raw = WI_PROMPT.read_text(encoding="utf-8")
    WI_SRC.parent.mkdir(parents=True, exist_ok=True)
    WI_SRC.write_text(extract_wisconsin_lines(raw), encoding="utf-8")


def main():
    if not SRC.exists():
        prompt = Path(
            r"C:\Users\makei\.grok\sessions\C%3A%5CUsers%5Cmakei\019efc5b-cf82-7612-8aff-b4ae0767aaa7\prompts\prompt_2.txt"
        )
        raw = prompt.read_text(encoding="utf-8")
        if "<user_query>" in raw:
            raw = raw.split("<user_query>", 1)[1]
        SRC.parent.mkdir(parents=True, exist_ok=True)
        SRC.write_text(raw, encoding="utf-8")

    content = SRC.read_text(encoding="utf-8")
    sections = extract_sections(content)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    updated = datetime.now().strftime("%Y-%m-%d")

    if MS_SRC.exists():
        sections["MS"] = MS_SRC.read_text(encoding="utf-8")

    ensure_texas_import()
    if TX_SRC.exists():
        sections["TX"] = TX_SRC.read_text(encoding="utf-8")

    ensure_ok_ar_imports()
    if OK_SRC.exists():
        sections["OK"] = OK_SRC.read_text(encoding="utf-8")
    if AR_SRC.exists():
        sections["AR"] = AR_SRC.read_text(encoding="utf-8")

    ensure_ks_mo_imports()
    if KS_SRC.exists():
        sections["KS"] = KS_SRC.read_text(encoding="utf-8")
    if MO_SRC.exists():
        sections["MO"] = MO_SRC.read_text(encoding="utf-8")

    ensure_iowa_import()
    if IA_SRC.exists():
        sections["IA"] = IA_SRC.read_text(encoding="utf-8")

    ensure_minnesota_import()
    if MN_SRC.exists():
        sections["MN"] = MN_SRC.read_text(encoding="utf-8")

    ensure_wisconsin_import()
    bulk_sections: dict[str, str] = {}
    if WI_SRC.exists():
        bulk_sections["WI"] = WI_SRC.read_text(encoding="utf-8")

    for code, text in sections.items():
        full_name, slug = STATE_META[code]
        banks = parse_section(text)
        payload = {
            "fullName": full_name,
            "abbr": code,
            "banks": banks,
            "updated": updated,
        }
        out_path = OUT_DIR / f"{slug}.json"
        out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        print(f"{code}: {len(banks)} banks -> {out_path.name}")

    for code, text in bulk_sections.items():
        full_name, slug = STATE_META[code]
        banks = parse_bulk_section(text)
        payload = {
            "fullName": full_name,
            "abbr": code,
            "banks": banks,
            "updated": updated,
        }
        out_path = OUT_DIR / f"{slug}.json"
        out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        print(f"{code}: {len(banks)} banks -> {out_path.name}")

    for code, csv_path in CSV_SOURCES.items():
        if not csv_path.exists():
            continue
        full_name, slug = STATE_META[code]
        banks = parse_fdic_csv(csv_path)
        payload = {
            "fullName": full_name,
            "abbr": code,
            "banks": banks,
            "updated": updated,
        }
        out_path = OUT_DIR / f"{slug}.json"
        out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        print(f"{code}: {len(banks)} banks -> {out_path.name}")

    for regional_name, (csv_path, state_codes) in REGIONAL_CSV_SOURCES.items():
        if not csv_path.exists():
            continue
        grouped = group_banks_by_state(parse_fdic_csv_sections(csv_path))
        for code in sorted(state_codes):
            banks = grouped.get(code, [])
            full_name, slug = STATE_META[code]
            payload = {
                "fullName": full_name,
                "abbr": code,
                "banks": banks,
                "updated": updated,
            }
            out_path = OUT_DIR / f"{slug}.json"
            out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
            print(f"{code}: {len(banks)} banks -> {out_path.name} ({regional_name})")

    print("Done.")


if __name__ == "__main__":
    main()