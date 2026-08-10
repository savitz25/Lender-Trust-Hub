#!/usr/bin/env python3
"""
Process nationwide HMDA LAR (year_2025.csv) into national + by-state summary tables.

Source of truth for state rollout. Does not invent editorial metrics.
Does not modify the raw file. Keeps existing legacy folders intact.
"""

from __future__ import annotations

import csv
import json
import sys
import time
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parents[1]
RAW_DEFAULT = ROOT / "year_2025.csv"
OUT_ROOT = ROOT / "data" / "hmda"
NAT_DIR = OUT_ROOT / "national"
BY_STATE_DIR = OUT_ROOT / "by-state"

# Site markets already live / in pipeline (for priority flags only)
LIVE_ROLLOUT_STATES = {"FL", "TX", "GA", "CA", "NC", "SC", "NJ", "TN", "NY", "MA", "PA", "DC"}

ACTION_ORIGINATED = "1"
ACTION_DENIED = "3"
ACTION_PURCHASED = "6"

LOAN_TYPE_MAP = {
    "1": "conventional",
    "2": "fha",
    "3": "va",
    "4": "usda_other",
}
PURPOSE_PURCHASE = {"1"}
PURPOSE_REFINANCE = {"31", "32"}

# US state + DC + common territories that may appear in HMDA
VALID_STATE_CODES = {
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL",
    "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE",
    "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD",
    "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
    "PR", "GU", "VI", "AS", "MP",
}


def loan_type_key(code: str) -> str:
    return LOAN_TYPE_MAP.get(str(code).strip(), "other")


def purpose_bucket(code: str) -> str:
    c = str(code).strip()
    if c in PURPOSE_PURCHASE:
        return "purchase"
    if c in PURPOSE_REFINANCE:
        return "refinance"
    return "other"


def norm_county_fips(raw: str) -> str:
    s = str(raw).strip()
    if not s or s.upper() in {"NA", "EXEMPT", "NULL", ""}:
        return ""
    if "." in s:
        s = s.split(".", 1)[0]
    s = "".join(ch for ch in s if ch.isdigit())
    if not s:
        return ""
    s = s.zfill(5)
    if len(s) > 5:
        s = s[-5:]
    return s


def load_county_names() -> dict[str, str]:
    """Optional FIPS name map; blank name if unknown."""
    names: dict[str, str] = {}
    # Prefer a local census-style file if present
    for candidate in (
        ROOT / "data" / "hmda" / "ref" / "county_fips_names.csv",
        ROOT / "data" / "hmda" / "county_fips_names.csv",
    ):
        if candidate.is_file():
            with candidate.open(encoding="utf-8", newline="") as f:
                for row in csv.DictReader(f):
                    fips = norm_county_fips(row.get("county_fips") or row.get("fips") or "")
                    name = (row.get("county_name") or row.get("name") or "").strip()
                    if fips and name:
                        names[fips] = name
            print(f"Loaded {len(names):,} county names from {candidate.name}")
            return names

    # Built-in FL full set + major metros (same as prior pipeline)
    fl = {
        "001": "Alachua", "003": "Baker", "005": "Bay", "007": "Bradford", "009": "Brevard",
        "011": "Broward", "013": "Calhoun", "015": "Charlotte", "017": "Citrus", "019": "Clay",
        "021": "Collier", "023": "Columbia", "027": "DeSoto", "029": "Dixie", "031": "Duval",
        "033": "Escambia", "035": "Flagler", "037": "Franklin", "039": "Gadsden", "041": "Gilchrist",
        "043": "Glades", "045": "Gulf", "047": "Hamilton", "049": "Hardee", "051": "Hendry",
        "053": "Hernando", "055": "Highlands", "057": "Hillsborough", "059": "Holmes",
        "061": "Indian River", "063": "Jackson", "065": "Jefferson", "067": "Lafayette",
        "069": "Lake", "071": "Lee", "073": "Leon", "075": "Levy", "077": "Liberty",
        "079": "Madison", "081": "Manatee", "083": "Marion", "085": "Martin", "086": "Miami-Dade",
        "087": "Monroe", "089": "Nassau", "091": "Okaloosa", "093": "Okeechobee", "095": "Orange",
        "097": "Osceola", "099": "Palm Beach", "101": "Pasco", "103": "Pinellas", "105": "Polk",
        "107": "Putnam", "109": "St. Johns", "111": "St. Lucie", "113": "Santa Rosa",
        "115": "Sarasota", "117": "Seminole", "119": "Sumter", "121": "Suwannee", "123": "Taylor",
        "125": "Union", "127": "Volusia", "129": "Wakulla", "131": "Walton", "133": "Washington",
    }
    for c, n in fl.items():
        names[f"12{c}"] = n
    names.update(
        {
            "13121": "Fulton", "13089": "DeKalb", "13067": "Cobb", "13135": "Gwinnett",
            "37119": "Mecklenburg", "37183": "Wake", "45019": "Charleston", "45045": "Greenville",
            "47037": "Davidson", "47157": "Shelby", "48201": "Harris", "48113": "Dallas",
            "48453": "Travis", "48029": "Bexar", "36061": "New York", "36047": "Kings",
            "34003": "Bergen", "25017": "Middlesex", "42101": "Philadelphia", "11001": "District of Columbia",
            "06037": "Los Angeles", "06073": "San Diego", "06059": "Orange", "06075": "San Francisco",
            "06085": "Santa Clara", "17031": "Cook", "26163": "Wayne", "39035": "Cuyahoga",
            "04013": "Maricopa", "32003": "Clark", "53033": "King", "08031": "Denver",
        }
    )
    return names


COUNTY_NAMES = load_county_names()


@dataclass
class LoanMix:
    conventional: int = 0
    fha: int = 0
    va: int = 0
    usda_other: int = 0
    other: int = 0

    def add(self, key: str, n: int = 1) -> None:
        if key == "conventional":
            self.conventional += n
        elif key == "fha":
            self.fha += n
        elif key == "va":
            self.va += n
        elif key == "usda_other":
            self.usda_other += n
        else:
            self.other += n

    def as_dict(self) -> dict[str, int]:
        return {
            "conventional": self.conventional,
            "fha": self.fha,
            "va": self.va,
            "usda_other": self.usda_other,
            "other_loan_type": self.other,
        }


@dataclass
class CountyAgg:
    applications: int = 0
    originations: int = 0
    denials: int = 0
    purchase: int = 0
    refinance: int = 0
    purpose_other: int = 0
    mix: LoanMix = field(default_factory=LoanMix)
    orig_mix: LoanMix = field(default_factory=LoanMix)


@dataclass
class LenderCountyAgg:
    applications: int = 0
    originations: int = 0
    denials: int = 0
    mix: LoanMix = field(default_factory=LoanMix)
    orig_mix: LoanMix = field(default_factory=LoanMix)


def pct(n: int, d: int) -> float:
    return round(100.0 * n / d, 2) if d > 0 else 0.0


def write_csv(path: Path, rows: Iterable[dict[str, Any]], fieldnames: list[str]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    n = 0
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow(r)
            n += 1
    print(f"  wrote {path.relative_to(ROOT)} ({n:,} rows)")
    return n


def main() -> int:
    raw_path = Path(sys.argv[1]) if len(sys.argv) > 1 else RAW_DEFAULT
    if not raw_path.is_file():
        print(f"ERROR: raw file not found: {raw_path}", file=sys.stderr)
        return 1

    size_gb = raw_path.stat().st_size / (1024**3)
    print(f"Raw file: {raw_path}")
    print(f"Size: {size_gb:.2f} GB")
    t0 = time.time()

    county: dict[tuple[str, str, str], CountyAgg] = defaultdict(CountyAgg)
    lender_county: dict[tuple[str, str, str, str], LenderCountyAgg] = defaultdict(LenderCountyAgg)
    lei_apps: dict[str, int] = defaultdict(int)
    lei_orig: dict[str, int] = defaultdict(int)
    lei_by_state_orig: dict[tuple[str, str], int] = defaultdict(int)
    lei_by_state_apps: dict[tuple[str, str], int] = defaultdict(int)
    lei_county_orig: dict[tuple[str, str, str], int] = defaultdict(int)
    state_lei_orig_mix: dict[tuple[str, str], LoanMix] = defaultdict(LoanMix)

    years: set[str] = set()
    states_seen: set[str] = set()
    total_rows = 0
    kept = 0
    skipped_purchased = 0
    skipped_incomplete = 0
    skipped_state = 0
    report_every = 500_000

    with raw_path.open("r", encoding="utf-8", errors="replace", newline="") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            print("ERROR: no header", file=sys.stderr)
            return 1
        columns = list(reader.fieldnames)
        print(f"Columns: {len(columns)}")
        for c in columns[:15]:
            print(f"  - {c}")
        print(f"  … (+{max(0, len(columns)-15)} more)")

        for row in reader:
            total_rows += 1
            if total_rows % report_every == 0:
                elapsed = time.time() - t0
                print(f"  … {total_rows:,} scanned | kept {kept:,} | {elapsed:.0f}s")

            state = (row.get("state_code") or "").strip().upper()
            if state not in VALID_STATE_CODES:
                # Still count unknown codes separately
                if state:
                    skipped_state += 1
                else:
                    skipped_incomplete += 1
                continue

            action = (row.get("action_taken") or "").strip()
            if action == ACTION_PURCHASED:
                skipped_purchased += 1
                continue

            year = (row.get("activity_year") or "").strip()
            lei = (row.get("lei") or "").strip().upper()
            fips = norm_county_fips(row.get("county_code") or "")
            if not year or not lei or not fips:
                skipped_incomplete += 1
                continue

            is_orig = action == ACTION_ORIGINATED
            is_denial = action == ACTION_DENIED
            lt = loan_type_key(row.get("loan_type") or "")
            pb = purpose_bucket(row.get("loan_purpose") or "")

            years.add(year)
            states_seen.add(state)
            kept += 1

            ca = county[(year, state, fips)]
            ca.applications += 1
            ca.mix.add(lt)
            if is_orig:
                ca.originations += 1
                ca.orig_mix.add(lt)
            if is_denial:
                ca.denials += 1
            if pb == "purchase":
                ca.purchase += 1
            elif pb == "refinance":
                ca.refinance += 1
            else:
                ca.purpose_other += 1

            la = lender_county[(year, state, fips, lei)]
            la.applications += 1
            la.mix.add(lt)
            lei_apps[lei] += 1
            lei_by_state_apps[(lei, state)] += 1
            if is_orig:
                la.originations += 1
                la.orig_mix.add(lt)
                lei_orig[lei] += 1
                lei_by_state_orig[(lei, state)] += 1
                lei_county_orig[(lei, state, fips)] += 1
                om = state_lei_orig_mix[(lei, state)]
                om.add(lt)
            if is_denial:
                la.denials += 1

    elapsed = time.time() - t0
    print()
    print("=== Inspection summary ===")
    print(f"Total rows scanned:     {total_rows:,}")
    print(f"Kept for analysis:      {kept:,}")
    print(f"Skipped purchased (6):  {skipped_purchased:,}")
    print(f"Skipped incomplete:     {skipped_incomplete:,}")
    print(f"Skipped invalid state:  {skipped_state:,}")
    print(f"Years: {sorted(years)}")
    print(f"States/territories: {len(states_seen)} → {', '.join(sorted(states_seen))}")
    print(f"Unique counties: {len(county):,}")
    print(f"Unique LEIs: {len(lei_apps):,}")
    print(f"Lender×county cells: {len(lender_county):,}")
    print(f"Elapsed scan: {elapsed:.1f}s")

    NAT_DIR.mkdir(parents=True, exist_ok=True)
    BY_STATE_DIR.mkdir(parents=True, exist_ok=True)

    # --- A. County market summary ---
    county_rows: list[dict[str, Any]] = []
    for (year, state, fips), ca in county.items():
        apps, orig, den = ca.applications, ca.originations, ca.denials
        county_rows.append(
            {
                "year": year,
                "state": state,
                "county_fips": fips,
                "county_name": COUNTY_NAMES.get(fips, ""),
                "total_applications": apps,
                "total_originations": orig,
                "denial_count": den,
                "denial_rate_pct": pct(den, apps),
                "purchase_count": ca.purchase,
                "refinance_count": ca.refinance,
                "purpose_other_count": ca.purpose_other,
                "purchase_pct_of_apps": pct(ca.purchase, apps),
                "refinance_pct_of_apps": pct(ca.refinance, apps),
                **{f"apps_{k}": v for k, v in ca.mix.as_dict().items()},
                "apps_conventional_pct": pct(ca.mix.conventional, apps),
                "apps_fha_pct": pct(ca.mix.fha, apps),
                "apps_va_pct": pct(ca.mix.va, apps),
                **{f"orig_{k}": v for k, v in ca.orig_mix.as_dict().items()},
                "orig_conventional_pct": pct(ca.orig_mix.conventional, orig),
                "orig_fha_pct": pct(ca.orig_mix.fha, orig),
                "orig_va_pct": pct(ca.orig_mix.va, orig),
                "priority_market": "yes" if state in LIVE_ROLLOUT_STATES else "national",
            }
        )
    county_rows.sort(key=lambda r: (r["state"], -r["total_originations"], r["county_fips"]))
    county_fields = list(county_rows[0].keys()) if county_rows else []
    write_csv(NAT_DIR / "county_market_summary.csv", county_rows, county_fields)

    county_orig_total = {
        (y, s, f): county[(y, s, f)].originations for (y, s, f) in county
    }

    # --- B. Lender activity by county (material rows only) ---
    lc_rows: list[dict[str, Any]] = []
    for (year, state, fips, lei), la in lender_county.items():
        if la.originations < 1 and la.applications < 5:
            continue
        ctot = county_orig_total.get((year, state, fips), 0)
        lc_rows.append(
            {
                "year": year,
                "state": state,
                "county_fips": fips,
                "county_name": COUNTY_NAMES.get(fips, ""),
                "lei": lei,
                "institution_name": "",
                "applications": la.applications,
                "originations": la.originations,
                "denials": la.denials,
                "market_share_orig_pct": pct(la.originations, ctot),
                **{f"apps_{k}": v for k, v in la.mix.as_dict().items()},
                **{f"orig_{k}": v for k, v in la.orig_mix.as_dict().items()},
                "priority_market": "yes" if state in LIVE_ROLLOUT_STATES else "national",
            }
        )
    lc_rows.sort(
        key=lambda r: (r["state"], r["county_fips"], -r["originations"], r["lei"])
    )
    lc_fields = list(lc_rows[0].keys()) if lc_rows else []
    write_csv(NAT_DIR / "lender_activity_by_county.csv", lc_rows, lc_fields)

    # --- C. Lender state summary ---
    top_counties: dict[tuple[str, str], list[tuple[str, int]]] = defaultdict(list)
    for (lei, state, fips), n in lei_county_orig.items():
        if n > 0:
            top_counties[(lei, state)].append((fips, n))
    for k in top_counties:
        top_counties[k].sort(key=lambda x: -x[1])

    lss_rows: list[dict[str, Any]] = []
    year_label = ",".join(sorted(years))
    for (lei, state), orig in lei_by_state_orig.items():
        apps = lei_by_state_apps.get((lei, state), 0)
        if orig < 1 and apps < 5:
            continue
        tops = top_counties.get((lei, state), [])[:5]
        top_str = "; ".join(
            f"{COUNTY_NAMES.get(f) or f}:{n}" for f, n in tops
        )
        mix = state_lei_orig_mix[(lei, state)]
        lss_rows.append(
            {
                "year": year_label,
                "state": state,
                "lei": lei,
                "institution_name": "",
                "total_applications": apps,
                "total_originations": orig,
                "top_counties_served": top_str,
                **{f"orig_{k}": v for k, v in mix.as_dict().items()},
                "orig_conventional_pct": pct(mix.conventional, orig),
                "orig_fha_pct": pct(mix.fha, orig),
                "orig_va_pct": pct(mix.va, orig),
                "priority_market": "yes" if state in LIVE_ROLLOUT_STATES else "national",
            }
        )
    lss_rows.sort(key=lambda r: (r["state"], -r["total_originations"], r["lei"]))
    lss_fields = list(lss_rows[0].keys()) if lss_rows else []
    write_csv(NAT_DIR / "lender_state_summary.csv", lss_rows, lss_fields)

    # --- D. LEI mapping candidates (national) ---
    lei_rows: list[dict[str, Any]] = []
    for lei, apps in lei_apps.items():
        orig = lei_orig.get(lei, 0)
        st_orig = {
            s: n for (l, s), n in lei_by_state_orig.items() if l == lei and n > 0
        }
        top_states = sorted(st_orig.items(), key=lambda x: -x[1])[:10]
        # Priority: high volume nationally or in live markets
        live_orig = sum(st_orig.get(s, 0) for s in LIVE_ROLLOUT_STATES)
        if orig >= 5000 or live_orig >= 500:
            prio = "high"
        elif orig >= 500 or live_orig >= 50:
            prio = "medium"
        else:
            prio = "low"
        lei_rows.append(
            {
                "lei": lei,
                "institution_name": "",
                "nmls_id": "",
                "our_lender_slug": "",
                "match_status": "unmatched",
                "total_applications": apps,
                "total_originations": orig,
                "live_market_originations": live_orig,
                "states_with_originations": ";".join(f"{s}:{n}" for s, n in top_states),
                "priority_match": prio,
            }
        )
    lei_rows.sort(
        key=lambda r: (
            0 if r["priority_match"] == "high" else 1 if r["priority_match"] == "medium" else 2,
            -r["live_market_originations"],
            -r["total_originations"],
            r["lei"],
        )
    )
    lei_fields = list(lei_rows[0].keys()) if lei_rows else []
    write_csv(NAT_DIR / "lei_mapping_candidates.csv", lei_rows, lei_fields)

    # --- State partitions (same schemas) ---
    print("Writing by-state partitions…")
    by_state_counts: dict[str, dict[str, int]] = {}
    for st in sorted(states_seen):
        st_dir = BY_STATE_DIR / st
        c_rows = [r for r in county_rows if r["state"] == st]
        l_rows = [r for r in lc_rows if r["state"] == st]
        s_rows = [r for r in lss_rows if r["state"] == st]
        # LEIs active in state
        leis_in_state = {r["lei"] for r in s_rows}
        lei_st = [r for r in lei_rows if r["lei"] in leis_in_state]
        # recompute fl_originations-style field for state file compatibility
        for r in lei_st:
            # parse state count from states_with_originations
            st_orig = 0
            for part in (r.get("states_with_originations") or "").split(";"):
                if part.startswith(f"{st}:"):
                    try:
                        st_orig = int(part.split(":", 1)[1])
                    except ValueError:
                        st_orig = 0
            r = dict(r)
        # Build state-specific LEI candidates with state originations column
        lei_st_out = []
        for r in lei_st:
            st_orig = 0
            for part in (r.get("states_with_originations") or "").split(";"):
                if part.startswith(f"{st}:"):
                    try:
                        st_orig = int(part.split(":", 1)[1])
                    except ValueError:
                        pass
            lei_st_out.append(
                {
                    "lei": r["lei"],
                    "institution_name": "",
                    "nmls_id": "",
                    "our_lender_slug": "",
                    "match_status": "unmatched",
                    "total_applications": r["total_applications"],
                    "total_originations": r["total_originations"],
                    f"{st.lower()}_originations": st_orig,
                    "states_with_originations": r["states_with_originations"],
                    "priority_match": r["priority_match"],
                }
            )
        lei_st_out.sort(key=lambda x: -x[f"{st.lower()}_originations"])
        lei_st_fields = list(lei_st_out[0].keys()) if lei_st_out else [
            "lei", "institution_name", "nmls_id", "our_lender_slug", "match_status",
            "total_applications", "total_originations", f"{st.lower()}_originations",
            "states_with_originations", "priority_match",
        ]

        write_csv(st_dir / "county_market_summary.csv", c_rows, county_fields)
        write_csv(st_dir / "lender_activity_by_county.csv", l_rows, lc_fields)
        write_csv(st_dir / "lender_state_summary.csv", s_rows, lss_fields)
        write_csv(st_dir / "lei_mapping_candidates.csv", lei_st_out, lei_st_fields)
        by_state_counts[st] = {
            "counties": len(c_rows),
            "lender_county_rows": len(l_rows),
            "lei_state_rows": len(s_rows),
            "lei_candidates": len(lei_st_out),
            "originations": sum(r["total_originations"] for r in c_rows),
            "applications": sum(r["total_applications"] for r in c_rows),
        }

    # State index for fast rollout lookup
    index = {
        "year": sorted(years),
        "states": sorted(states_seen),
        "live_rollout_states": sorted(LIVE_ROLLOUT_STATES),
        "by_state": by_state_counts,
        "paths": {
            "national": "data/hmda/national/",
            "by_state_template": "data/hmda/by-state/{ST}/",
            "state_files": [
                "county_market_summary.csv",
                "lender_activity_by_county.csv",
                "lender_state_summary.csv",
                "lei_mapping_candidates.csv",
            ],
        },
    }
    index_path = BY_STATE_DIR / "index.json"
    index_path.write_text(json.dumps(index, indent=2), encoding="utf-8")
    print(f"  wrote {index_path.relative_to(ROOT)}")

    # Manifest
    vintage = ",".join(sorted(years)) if years else "unknown"
    manifest = {
        "source_of_truth": True,
        "source_file": raw_path.name,
        "data_vintage_years": sorted(years),
        "data_vintage_label": f"HMDA {vintage}",
        "file_size_gb": round(size_gb, 2),
        "states_territories": sorted(states_seen),
        "row_counts": {
            "raw_scanned": total_rows,
            "kept": kept,
            "skipped_purchased_action_6": skipped_purchased,
            "skipped_incomplete": skipped_incomplete,
            "skipped_invalid_state": skipped_state,
            "counties": len(county),
            "unique_leis": len(lei_apps),
            "lender_county_cells_material": len(lc_rows),
        },
        "filters": {
            "excluded_action_taken": [6],
            "excluded_action_taken_meaning": "Purchased loan",
            "required_fields": ["activity_year", "lei", "state_code", "county_code"],
            "valid_state_codes": sorted(VALID_STATE_CODES),
        },
        "column_compatibility": "Matches prior multi-state cleaned schema (county_market_summary, lender_activity_by_county, lender_state_summary, lei_mapping_candidates)",
        "outputs": {
            "national": [
                "county_market_summary.csv",
                "lender_activity_by_county.csv",
                "lender_state_summary.csv",
                "lei_mapping_candidates.csv",
            ],
            "by_state": "data/hmda/by-state/{ST}/*.csv",
        },
        "extract_state": "python scripts/extract_hmda_state.py FL",
        "notes": [
            "National year_2025.csv is the source of truth going forward.",
            "Legacy multi-state extract and florida/ folders remain for compatibility; prefer national/ + by-state/.",
            "LAR has no institution name; LEI mapping candidates leave name/NMLS blank.",
            "Do not use as Trust Scores.",
        ],
    }
    (NAT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"  wrote national/manifest.json")

    # README
    readme = f"""# HMDA data foundation (national)

**Source of truth:** `year_2025.csv` (nationwide HMDA LAR, **{vintage}**)  
**Raw size:** ~{size_gb:.2f} GB (gitignored)  
**Processed:** streaming LAR → national summaries + by-state partitions  

## Filters (same standard as prior state slices)

| Filter | Rule |
|--------|------|
| Purchased loans | Drop `action_taken = 6` |
| Incomplete geo | Drop missing year, LEI, state, or county FIPS |
| Invalid state | Drop codes outside US states/DC/territories |
| Applications | All kept non-purchase rows with valid geo |
| Originations | `action_taken = 1` |
| Denials | `action_taken = 3` |

**Scan stats:** {total_rows:,} rows → **{kept:,} kept** | states/territories: **{len(states_seen)}**

## Layout

```text
data/hmda/
  national/                 # full US aggregates
    county_market_summary.csv
    lender_activity_by_county.csv
    lender_state_summary.csv
    lei_mapping_candidates.csv
    manifest.json
  by-state/
    index.json              # quick stats per state
    FL/  TX/  GA/  …        # same 4 files per state
  florida/                  # legacy FL work (LEI mapping etc.) — do not delete
  cleaned/                  # legacy multi-state slice — superseded by national/
  README.md                 # this file
```

## Extract / activate a state

```bash
# Rebuild everything from raw national file
python scripts/process_hmda_national.py year_2025.csv

# Copy a state partition into a convenient folder (optional)
python scripts/extract_hmda_state.py FL
python scripts/extract_hmda_state.py AZ --out data/hmda/arizona
```

State folders under `by-state/{{ST}}/` already contain the same schemas used by evidence panels.

## Live rollout states (priority flag)

{', '.join(sorted(LIVE_ROLLOUT_STATES))}

These get `priority_market=yes` in national files. Other states are `national` until activated on the site.

## Compatibility

Column names align with the earlier multi-state pipeline so existing FL/TX/GA loaders and LEI mapping scripts continue to work when pointed at:

- `data/hmda/by-state/FL/…` or
- `data/hmda/national/…` with a state filter

## Do not

- Commit `year_2025.csv` (too large)
- Invent Trust Scores or force LEI→NMLS matches
- Delete working legacy slices until you confirm the national pipeline in product code
"""
    (OUT_ROOT / "README.md").write_text(readme, encoding="utf-8")
    print(f"  wrote data/hmda/README.md")

    # Small extract helper is separate script
    print()
    print("=== Done ===")
    print(f"National counties: {len(county_rows):,}")
    print(f"National LEIs: {len(lei_rows):,}")
    print(f"High-priority LEIs: {sum(1 for r in lei_rows if r['priority_match']=='high'):,}")
    print(f"Total time: {time.time()-t0:.1f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
