#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAP = json.loads((ROOT / "lib/ohio-intelligence/accepted-snapshot.json").read_text(encoding="utf-8"))
HMDA = ROOT / "data/hmda/by-state/OH/county_market_summary.csv"
LEI = ROOT / "data/hmda/by-state/OH/lender_activity_by_county.csv"
FDIC = json.loads((ROOT / "lib/fdic/data/ohio.json").read_text(encoding="utf-8"))
CFPB = json.loads((ROOT / "data/ohio/oh-lend-001/cfpb-2025-oh-mortgage-ids.json").read_text(encoding="utf-8"))
OHFA = json.loads((ROOT / "data/ohio/oh-lend-001/ohfa-county-lenders.json").read_text(encoding="utf-8"))


def n(row: dict, *keys: str) -> int:
    for key in keys:
        if row.get(key) not in (None, ""):
            return int(float(row[key]))
    return 0


def main() -> None:
    counties = list(csv.DictReader(HMDA.open(encoding="utf-8")))
    lei_rows = list(csv.DictReader(LEI.open(encoding="utf-8")))
    apps = sum(n(r, "total_applications") for r in counties)
    orig = sum(n(r, "total_originations") for r in counties)
    den = sum(n(r, "denial_count") for r in counties)
    lei_apps = sum(n(r, "applications") for r in lei_rows)
    leis = {r["lei"] for r in lei_rows if r.get("lei")}
    assert SNAP["hmda"]["applications"] == apps == 460825
    assert SNAP["hmda"]["originations"] == orig == 276279
    assert SNAP["hmda"]["denials"] == den == 80708
    assert SNAP["hmda"]["county_count"] == 88
    assert SNAP["hmda"]["lei_cell_applications"] == lei_apps == 456221
    assert SNAP["hmda"]["distinct_leis"] == len(leis) == 981
    assert SNAP["cfpb"]["OH_CFPB_2025_DISTINCT_COMPLAINT_IDS"] == CFPB["meta"]["distinct_ids"] == 610
    assert SNAP["ohfa"]["OH_OHFA_LENDER_OBSERVATION_ROWS"] == OHFA["meta"]["OH_OHFA_LENDER_OBSERVATION_ROWS"] == 2095
    assert SNAP["ohfa"]["OH_OHFA_DISTINCT_LENDER_NAMES"] == 85
    assert SNAP["fdic"]["OH_FDIC_DEPOSITORY_ROWS"] == len(FDIC["banks"]) == 157
    assert SNAP["current_roster"]["OH_RMLA_COMPANY_ROWS"] is None
    assert SNAP["expansion_ledger"]["GRAPH_WRITES"] == 0
    assert SNAP["crosswalks"]["EXACT_OHFA_NMLS_ATTACHMENTS"] == 0
    assert SNAP["fingerprint"] == "c2f9a94cb644a32ff91d98d5c4e338096ac23bdc3e0f2a18464b9b1bc0df3fb8"
    print("oh-lend-001 recon OK")


if __name__ == "__main__":
    main()
