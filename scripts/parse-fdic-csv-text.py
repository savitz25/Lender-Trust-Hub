#!/usr/bin/env python3
"""Parse tab-separated FDIC bank lists from pasted text into lib/fdic/data/*.json"""
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
OUT_DIR = ROOT / "lib" / "fdic" / "data"

STATE_META = {
    "GA": ("Georgia", "georgia"),
    "SC": ("South Carolina", "south-carolina"),
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
    "MO": ("Missouri", "missouri"),
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
    line = repair_line(line.strip().rstrip("\t"))
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

    print("Done.")


if __name__ == "__main__":
    main()