#!/usr/bin/env python3
"""Parse FDIC bank list xlsx into lib/fdic/data/{state}.json

Usage:
  python scripts/parse-fdic-xlsx.py "florida FDIC insured Banks.xlsx" FL
"""
import json
import sys
from datetime import datetime
from pathlib import Path

import pandas as pd

STATE_NAMES = {
    "FL": "Florida",
    "CA": "California",
    "TX": "Texas",
    # extend as needed
}

PREFIXES = (
    "FDIC Insured Since:",
    "FDIC Cert #:",
    "Primary Regulator:",
    "Headquarters Address:",
    "Website:",
)


def is_name(line: str) -> bool:
    return bool(line) and line not in ("Florida Lenders", "FDIC-Insured Lenders List") and not any(
        line.startswith(p) for p in PREFIXES
    )


def parse_xlsx(path: Path) -> list[dict]:
    df = pd.read_excel(path, header=None)
    rows = ["" if pd.isna(df.iloc[i, 0]) else str(df.iloc[i, 0]).strip() for i in range(len(df))]
    banks = []
    i = 0
    while i < len(rows):
        if not is_name(rows[i]):
            i += 1
            continue
        record = {"name": rows[i]}
        j = i + 1
        got = 0
        while j < len(rows) and got < 5:
            if not rows[j]:
                j += 1
                continue
            line = rows[j]
            if is_name(line):
                break
            if line.startswith("FDIC Insured Since:"):
                record["fdic_insured_since"] = line.split(":", 1)[1].strip()
                got += 1
            elif line.startswith("FDIC Cert #:"):
                record["fdic_cert"] = line.split(":", 1)[1].strip()
                got += 1
            elif line.startswith("Primary Regulator:"):
                record["primary_regulator"] = line.split(":", 1)[1].strip()
                got += 1
            elif line.startswith("Headquarters Address:"):
                record["headquarters_address"] = line.split(":", 1)[1].strip()
                got += 1
            elif line.startswith("Website:"):
                w = line.split(":", 1)[1].strip()
                record["website"] = w if w.startswith("http") else "https://" + w
                got += 1
            j += 1
        if record.get("fdic_cert"):
            banks.append(record)
        i = j if j > i else i + 1
    return banks


def main():
    if len(sys.argv) < 3:
        print("Usage: python scripts/parse-fdic-xlsx.py <file.xlsx> <STATE_CODE>")
        sys.exit(1)
    src = Path(sys.argv[1])
    abbr = sys.argv[2].upper()
    out_dir = Path(__file__).resolve().parent.parent / "lib" / "fdic" / "data"
    out_dir.mkdir(parents=True, exist_ok=True)
    slug = abbr.lower() if abbr != "DC" else "district-of-columbia"
    banks = parse_xlsx(src)
    payload = {
        "fullName": STATE_NAMES.get(abbr, abbr),
        "abbr": abbr,
        "banks": banks,
        "updated": datetime.now().strftime("%Y-%m-%d"),
    }
    out_path = out_dir / f"{slug if abbr != 'FL' else 'florida'}.json"
    if abbr == "FL":
        out_path = out_dir / "florida.json"
    else:
        out_path = out_dir / f"{abbr.lower()}.json"
    out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {len(banks)} banks to {out_path}")


if __name__ == "__main__":
    main()