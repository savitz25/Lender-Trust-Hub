#!/usr/bin/env python3
"""Prove the Pennsylvania HMDA county vs LEI-cell application delta from committed files."""
from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COUNTY = ROOT / "data/hmda/by-state/PA/county_market_summary.csv"
LEI = ROOT / "data/hmda/by-state/PA/lender_activity_by_county.csv"


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
lei_apps = sum(n(r, "applications", "total_applications") for r in lei)
lei_orig = sum(n(r, "originations", "total_originations") for r in lei)
lei_den = sum(n(r, "denials", "denial_count") for r in lei)
check(len(county) == 67, "67 county rows")
check(county_apps == 444887, f"county apps {county_apps}")
check(county_orig == 271254, f"county orig {county_orig}")
check(county_den == 80570, f"county den {county_den}")
check(lei_apps == 441180, f"lei apps {lei_apps}")
check(lei_orig == 271254, f"lei orig {lei_orig}")
check(lei_den == 79217, f"lei den {lei_den}")
check(county_apps - lei_apps == 3707, "application delta")
check(county_orig - lei_orig == 0, "origination delta must stay 0")
check(county_den - lei_den == 1353, "denial delta")
check(county_apps != lei_apps, "grains must remain distinct in source files")
print("pa-lend-001-recon pass", {"page": county_apps, "lei_cells": lei_apps, "delta": county_apps - lei_apps})
