#!/usr/bin/env python3
"""Prove the 3,702 Illinois application delta from committed HMDA files."""
from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COUNTY = ROOT / "data/hmda/by-state/IL/county_market_summary.csv"
LEI = ROOT / "data/hmda/by-state/IL/lender_activity_by_county.csv"


def n(row: dict[str, str], *keys: str) -> int:
    for key in keys:
        if row.get(key) not in (None, ""):
            return int(float(row[key]))
    return 0


def check(cond: bool, msg: str) -> None:
    if not cond:
        raise SystemExit(f"FAIL {msg}")


county = list(csv.DictReader(COUNTY.open(encoding="utf-8")))
lei = list(csv.DictReader(LEI.open(encoding="utf-8")))
county_apps = sum(n(r, "total_applications") for r in county)
county_orig = sum(n(r, "total_originations") for r in county)
county_den = sum(n(r, "denial_count") for r in county)
lei_apps = sum(n(r, "applications") for r in lei)
lei_orig = sum(n(r, "originations") for r in lei)
lei_den = sum(n(r, "denials") for r in lei)
check(len(county) == 102, "102 county rows")
check(county_apps == 394488, f"county apps {county_apps}")
check(county_orig == 231788, f"county orig {county_orig}")
check(county_den == 66742, f"county den {county_den}")
check(lei_apps == 390786, f"lei apps {lei_apps}")
check(lei_orig == 231788, f"lei orig {lei_orig}")
check(lei_den == 65185, f"lei den {lei_den}")
check(county_apps - lei_apps == 3702, "application delta")
check(county_orig - lei_orig == 0, "origination delta must stay 0")
check(county_den - lei_den == 1557, "denial delta")
check(county_apps != lei_apps, "grains must remain distinct in source files")
print("il-lend-001c-recon pass", {"page": county_apps, "lei_cells": lei_apps, "delta": county_apps - lei_apps})
