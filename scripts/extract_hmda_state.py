#!/usr/bin/env python3
"""
Copy a pre-built state partition from data/hmda/by-state/{ST}/ to a target folder.

Usage:
  python scripts/extract_hmda_state.py FL
  python scripts/extract_hmda_state.py AZ --out data/hmda/arizona
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BY_STATE = ROOT / "data" / "hmda" / "by-state"

FILES = [
    "county_market_summary.csv",
    "lender_activity_by_county.csv",
    "lender_state_summary.csv",
    "lei_mapping_candidates.csv",
]


def main() -> int:
    ap = argparse.ArgumentParser(description="Extract HMDA state slice from national partitions")
    ap.add_argument("state", help="Two-letter state code, e.g. FL")
    ap.add_argument(
        "--out",
        default=None,
        help="Output directory (default: data/hmda/by-state/{ST} is source; copy to data/hmda/{state})",
    )
    args = ap.parse_args()
    st = args.state.strip().upper()
    src = BY_STATE / st
    if not src.is_dir():
        print(f"ERROR: no partition at {src}", file=sys.stderr)
        print("Run: python scripts/process_hmda_national.py year_2025.csv", file=sys.stderr)
        return 1

    out = Path(args.out) if args.out else ROOT / "data" / "hmda" / st.lower()
    if not out.is_absolute():
        out = ROOT / out
    out.mkdir(parents=True, exist_ok=True)

    for name in FILES:
        s = src / name
        if not s.is_file():
            print(f"WARN: missing {s}")
            continue
        d = out / name
        shutil.copy2(s, d)
        print(f"  {s.relative_to(ROOT)} → {d.relative_to(ROOT)}")

    # Convenience aliases matching florida/ naming for FL
    if st == "FL":
        aliases = {
            "county_market_summary.csv": "county_market_summary_fl.csv",
            "lender_activity_by_county.csv": "lender_activity_by_county_fl.csv",
            "lender_state_summary.csv": "lender_state_summary_fl.csv",
            "lei_mapping_candidates.csv": "lei_mapping_candidates_fl.csv",
        }
        for src_name, alias in aliases.items():
            s = src / src_name
            if s.is_file():
                shutil.copy2(s, out / alias)
                print(f"  alias {alias}")

    print(f"Done. State {st} ready under {out.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
