#!/usr/bin/env python3
"""
Process raw HMDA LAR extract into website-ready summary tables.

**Prefer the national pipeline going forward:**
  python scripts/process_hmda_national.py year_2025.csv
  python scripts/extract_hmda_state.py FL

This multi-state script remains for reprocessing older regional extracts only.
Does not invent editorial metrics. Streams the raw CSV (does not modify it).
"""

from __future__ import annotations

import csv
import json
import os
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

RAW_DEFAULT = Path(__file__).resolve().parents[1] / (
    "state_FL-CA-MA-TX-NJ-NY-DC-PA-GA-SC-NC-TN.csv"
)
OUT_ROOT = Path(__file__).resolve().parents[1] / "data" / "hmda"
CLEAN_DIR = OUT_ROOT / "cleaned"
FL_DIR = OUT_ROOT / "florida"

# States we actively cover on the site (process thoroughly). CA is in the raw
# extract but secondary.
PRIORITY_STATES = {
    "FL",
    "GA",
    "NC",
    "SC",
    "TN",
    "TX",
    "NY",
    "NJ",
    "MA",
    "PA",
    "DC",
}
SECONDARY_STATES = {"CA"}  # present in file; included but not FL-first focus
KEEP_STATES = PRIORITY_STATES | SECONDARY_STATES

# HMDA action_taken codes
ACTION_ORIGINATED = "1"
ACTION_DENIED = "3"
ACTION_PURCHASED = "6"  # exclude from application/origination analysis

# loan_type
LOAN_TYPE_MAP = {
    "1": "conventional",
    "2": "fha",
    "3": "va",
    "4": "usda_other",
}

# loan_purpose — purchase vs refinance family
PURPOSE_PURCHASE = {"1"}
PURPOSE_REFINANCE = {"31", "32"}  # refinancing, cash-out refinancing


def loan_type_key(code: str) -> str:
    return LOAN_TYPE_MAP.get(str(code).strip(), "other")


def purpose_bucket(code: str) -> str:
    c = str(code).strip()
    if c in PURPOSE_PURCHASE:
        return "purchase"
    if c in PURPOSE_REFINANCE:
        return "refinance"
    return "other"


# Minimal FIPS → county name for priority states (common codes). Unknown → blank name.
# Full census list is large; we fill names when known, else leave county_name empty.
def load_county_names() -> dict[str, str]:
    """county_code (5-digit) → name."""
    names: dict[str, str] = {}
    # Florida (12xxx)
    fl = {
        "001": "Alachua",
        "003": "Baker",
        "005": "Bay",
        "007": "Bradford",
        "009": "Brevard",
        "011": "Broward",
        "013": "Calhoun",
        "015": "Charlotte",
        "017": "Citrus",
        "019": "Clay",
        "021": "Collier",
        "023": "Columbia",
        "027": "DeSoto",
        "029": "Dixie",
        "031": "Duval",
        "033": "Escambia",
        "035": "Flagler",
        "037": "Franklin",
        "039": "Gadsden",
        "041": "Gilchrist",
        "043": "Glades",
        "045": "Gulf",
        "047": "Hamilton",
        "049": "Hardee",
        "051": "Hendry",
        "053": "Hernando",
        "055": "Highlands",
        "057": "Hillsborough",
        "059": "Holmes",
        "061": "Indian River",
        "063": "Jackson",
        "065": "Jefferson",
        "067": "Lafayette",
        "069": "Lake",
        "071": "Lee",
        "073": "Leon",
        "075": "Levy",
        "077": "Liberty",
        "079": "Madison",
        "081": "Manatee",
        "083": "Marion",
        "085": "Martin",
        "086": "Miami-Dade",
        "087": "Monroe",
        "089": "Nassau",
        "091": "Okaloosa",
        "093": "Okeechobee",
        "095": "Orange",
        "097": "Osceola",
        "099": "Palm Beach",
        "101": "Pasco",
        "103": "Pinellas",
        "105": "Polk",
        "107": "Putnam",
        "109": "St. Johns",
        "111": "St. Lucie",
        "113": "Santa Rosa",
        "115": "Sarasota",
        "117": "Seminole",
        "119": "Sumter",
        "121": "Suwannee",
        "123": "Taylor",
        "125": "Union",
        "127": "Volusia",
        "129": "Wakulla",
        "131": "Walton",
        "133": "Washington",
    }
    for c, n in fl.items():
        names[f"12{c}"] = n

    # High-volume counties in other priority states (partial — enough for major markets)
    extra = {
        # GA
        "13121": "Fulton",
        "13089": "DeKalb",
        "13067": "Cobb",
        "13135": "Gwinnett",
        "13063": "Clayton",
        "13051": "Chatham",
        # NC
        "37119": "Mecklenburg",
        "37183": "Wake",
        "37063": "Durham",
        "37081": "Guilford",
        # SC
        "45019": "Charleston",
        "45045": "Greenville",
        "45051": "Horry",
        "45079": "Richland",
        # TN
        "47037": "Davidson",
        "47157": "Shelby",
        "47093": "Knox",
        "47149": "Rutherford",
        # TX
        "48201": "Harris",
        "48113": "Dallas",
        "48453": "Travis",
        "48029": "Bexar",
        "48439": "Tarrant",
        "48085": "Collin",
        # NY
        "36061": "New York",
        "36047": "Kings",
        "36081": "Queens",
        "36005": "Bronx",
        "36085": "Richmond",
        "36119": "Westchester",
        # NJ
        "34003": "Bergen",
        "34013": "Essex",
        "34017": "Hudson",
        "34023": "Middlesex",
        # MA
        "25017": "Middlesex",
        "25025": "Suffolk",
        "25021": "Norfolk",
        # PA
        "42101": "Philadelphia",
        "42003": "Allegheny",
        "42091": "Montgomery",
        # DC
        "11001": "District of Columbia",
        # CA (secondary)
        "06037": "Los Angeles",
        "06073": "San Diego",
        "06059": "Orange",
        "06075": "San Francisco",
        "06085": "Santa Clara",
    }
    names.update(extra)
    return names


COUNTY_NAMES = load_county_names()


def norm_county_fips(raw: str) -> str:
    """Normalize to 5-digit county FIPS string."""
    s = str(raw).strip()
    if not s or s.upper() == "NA" or s == "Exempt":
        return ""
    # may be float-like
    if "." in s:
        s = s.split(".", 1)[0]
    s = s.zfill(5)
    if len(s) > 5:
        s = s[-5:]
    return s


def county_name_for(fips: str) -> str:
    return COUNTY_NAMES.get(fips, "")


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

    def as_dict(self, prefix: str = "") -> dict[str, int]:
        p = f"{prefix}_" if prefix else ""
        return {
            f"{p}conventional": self.conventional,
            f"{p}fha": self.fha,
            f"{p}va": self.va,
            f"{p}usda_other": self.usda_other,
            f"{p}other_loan_type": self.other,
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
    # originations by loan type
    orig_mix: LoanMix = field(default_factory=LoanMix)


@dataclass
class LenderCountyAgg:
    applications: int = 0
    originations: int = 0
    denials: int = 0
    mix: LoanMix = field(default_factory=LoanMix)
    orig_mix: LoanMix = field(default_factory=LoanMix)


def pct(n: int, d: int) -> float:
    if d <= 0:
        return 0.0
    return round(100.0 * n / d, 2)


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow(r)
    print(f"  wrote {path} ({len(rows):,} rows)")


def main() -> int:
    raw_path = Path(sys.argv[1]) if len(sys.argv) > 1 else RAW_DEFAULT
    if not raw_path.is_file():
        print(f"ERROR: raw file not found: {raw_path}", file=sys.stderr)
        return 1

    size_mb = raw_path.stat().st_size / (1024 * 1024)
    print(f"Raw file: {raw_path}")
    print(f"Size: {size_mb:.1f} MB")

    # county_key = (year, state, county_fips)
    county: dict[tuple[str, str, str], CountyAgg] = defaultdict(CountyAgg)
    # lender_county_key = (year, state, county_fips, lei)
    lender_county: dict[tuple[str, str, str, str], LenderCountyAgg] = defaultdict(
        LenderCountyAgg
    )
    # lei totals for ranking
    lei_apps: dict[str, int] = defaultdict(int)
    lei_orig: dict[str, int] = defaultdict(int)
    lei_by_state_orig: dict[tuple[str, str], int] = defaultdict(int)  # (lei, state)
    lei_county_orig: dict[tuple[str, str, str], int] = defaultdict(
        int
    )  # (lei, state, county)

    years: set[str] = set()
    states_seen: set[str] = set()
    total_rows = 0
    kept_rows = 0
    skipped_purchased = 0
    skipped_incomplete = 0
    skipped_state = 0

    # Progress
    report_every = 250_000

    with raw_path.open("r", encoding="utf-8", errors="replace", newline="") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            print("ERROR: no header", file=sys.stderr)
            return 1
        columns = list(reader.fieldnames)
        print(f"Columns ({len(columns)}):")
        for c in columns:
            print(f"  - {c}")

        for row in reader:
            total_rows += 1
            if total_rows % report_every == 0:
                print(f"  … scanned {total_rows:,} rows (kept {kept_rows:,})")

            state = (row.get("state_code") or "").strip().upper()
            if state not in KEEP_STATES:
                skipped_state += 1
                continue

            action = (row.get("action_taken") or "").strip()
            if action == ACTION_PURCHASED:
                skipped_purchased += 1
                continue

            year = (row.get("activity_year") or "").strip()
            lei = (row.get("lei") or "").strip().upper()
            county_fips = norm_county_fips(row.get("county_code") or "")

            if not year or not lei or not county_fips or not state:
                skipped_incomplete += 1
                continue

            # Count applications for decisions that are part of the application funnel
            # (exclude purchased). All non-purchase rows with valid geo are "applications"
            # for market volume; originations = action 1; denials = action 3.
            is_app = True
            is_orig = action == ACTION_ORIGINATED
            is_denial = action == ACTION_DENIED

            lt = loan_type_key(row.get("loan_type") or "")
            pb = purpose_bucket(row.get("loan_purpose") or "")

            years.add(year)
            states_seen.add(state)
            kept_rows += 1

            ck = (year, state, county_fips)
            ca = county[ck]
            if is_app:
                ca.applications += 1
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
            ca.mix.add(lt)

            lck = (year, state, county_fips, lei)
            la = lender_county[lck]
            if is_app:
                la.applications += 1
            if is_orig:
                la.originations += 1
                la.orig_mix.add(lt)
                lei_orig[lei] += 1
                lei_by_state_orig[(lei, state)] += 1
                lei_county_orig[(lei, state, county_fips)] += 1
            if is_denial:
                la.denials += 1
            la.mix.add(lt)
            if is_app:
                lei_apps[lei] += 1

    print()
    print("=== Inspection summary ===")
    print(f"Total rows scanned:     {total_rows:,}")
    print(f"Kept for analysis:      {kept_rows:,}")
    print(f"Skipped purchased (6):  {skipped_purchased:,}")
    print(f"Skipped incomplete geo: {skipped_incomplete:,}")
    print(f"Skipped other states:   {skipped_state:,}")
    print(f"Years: {sorted(years)}")
    print(f"States kept: {sorted(states_seen)}")
    print(f"Unique counties: {len(county):,}")
    print(f"Unique LEIs: {len(lei_apps):,}")
    print(f"Lender×county cells: {len(lender_county):,}")

    CLEAN_DIR.mkdir(parents=True, exist_ok=True)
    FL_DIR.mkdir(parents=True, exist_ok=True)

    # --- A. County market summary ---
    county_rows: list[dict[str, Any]] = []
    for (year, state, fips), ca in county.items():
        apps = ca.applications
        orig = ca.originations
        den = ca.denials
        row = {
            "year": year,
            "state": state,
            "county_fips": fips,
            "county_name": county_name_for(fips),
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
            "priority_market": "yes" if state in PRIORITY_STATES else "secondary",
        }
        county_rows.append(row)

    county_rows.sort(
        key=lambda r: (
            0 if r["state"] == "FL" else 1,
            r["state"],
            -r["total_originations"],
            r["county_fips"],
        )
    )

    county_fields = list(county_rows[0].keys()) if county_rows else []
    write_csv(CLEAN_DIR / "county_market_summary.csv", county_rows, county_fields)
    fl_county = [r for r in county_rows if r["state"] == "FL"]
    write_csv(FL_DIR / "county_market_summary_fl.csv", fl_county, county_fields)

    # County origination totals for market share
    county_orig_total: dict[tuple[str, str, str], int] = {
        (y, s, f): county[(y, s, f)].originations for (y, s, f) in county
    }

    # --- B. Lender activity by county ---
    lc_rows: list[dict[str, Any]] = []
    for (year, state, fips, lei), la in lender_county.items():
        ctot = county_orig_total.get((year, state, fips), 0)
        share = pct(la.originations, ctot) if ctot else 0.0
        lc_rows.append(
            {
                "year": year,
                "state": state,
                "county_fips": fips,
                "county_name": county_name_for(fips),
                "lei": lei,
                "institution_name": "",  # LAR has no name — fill via LEI mapping later
                "applications": la.applications,
                "originations": la.originations,
                "denials": la.denials,
                "market_share_orig_pct": share,
                **{f"apps_{k}": v for k, v in la.mix.as_dict().items()},
                **{f"orig_{k}": v for k, v in la.orig_mix.as_dict().items()},
                "priority_market": "yes" if state in PRIORITY_STATES else "secondary",
            }
        )

    # Keep material rows only: at least 1 origination OR 5+ applications (reduce noise)
    lc_rows = [r for r in lc_rows if r["originations"] >= 1 or r["applications"] >= 5]
    lc_rows.sort(
        key=lambda r: (
            0 if r["state"] == "FL" else 1,
            r["state"],
            r["county_fips"],
            -r["originations"],
            r["lei"],
        )
    )
    lc_fields = list(lc_rows[0].keys()) if lc_rows else []
    write_csv(CLEAN_DIR / "lender_activity_by_county.csv", lc_rows, lc_fields)
    fl_lc = [r for r in lc_rows if r["state"] == "FL"]
    write_csv(FL_DIR / "lender_activity_by_county_fl.csv", fl_lc, lc_fields)

    # --- C. Lender overall summary by state ---
    state_lei_apps: dict[tuple[str, str], int] = defaultdict(int)
    state_lei_mix: dict[tuple[str, str], LoanMix] = defaultdict(LoanMix)
    for (year, state, fips, lei), la in lender_county.items():
        state_lei_apps[(lei, state)] += la.applications
        m = state_lei_mix[(lei, state)]
        m.conventional += la.orig_mix.conventional
        m.fha += la.orig_mix.fha
        m.va += la.orig_mix.va
        m.usda_other += la.orig_mix.usda_other
        m.other += la.orig_mix.other

    # Top counties per LEI×state
    top_counties: dict[tuple[str, str], list[tuple[str, int]]] = defaultdict(list)
    for (lei, state, fips), n in lei_county_orig.items():
        if n <= 0:
            continue
        top_counties[(lei, state)].append((fips, n))
    for k in top_counties:
        top_counties[k].sort(key=lambda x: -x[1])

    lss_rows: list[dict[str, Any]] = []
    for (lei, state), orig in lei_by_state_orig.items():
        if orig < 1 and state_lei_apps.get((lei, state), 0) < 5:
            continue
        tops = top_counties.get((lei, state), [])[:5]
        top_str = "; ".join(
            f"{county_name_for(f) or f}:{n}" for f, n in tops
        )
        mix = state_lei_mix[(lei, state)]
        apps = state_lei_apps.get((lei, state), 0)
        lss_rows.append(
            {
                "year": ",".join(sorted(years)),
                "state": state,
                "lei": lei,
                "institution_name": "",
                "total_applications": apps,
                "total_originations": orig,
                "top_counties_served": top_str,
                **mix.as_dict("orig"),
                "orig_conventional_pct": pct(mix.conventional, orig),
                "orig_fha_pct": pct(mix.fha, orig),
                "orig_va_pct": pct(mix.va, orig),
                "priority_market": "yes" if state in PRIORITY_STATES else "secondary",
            }
        )

    lss_rows.sort(
        key=lambda r: (
            0 if r["state"] == "FL" else 1,
            r["state"],
            -r["total_originations"],
            r["lei"],
        )
    )
    lss_fields = list(lss_rows[0].keys()) if lss_rows else []
    write_csv(CLEAN_DIR / "lender_state_summary.csv", lss_rows, lss_fields)
    fl_lss = [r for r in lss_rows if r["state"] == "FL"]
    write_csv(FL_DIR / "lender_state_summary_fl.csv", fl_lss, lss_fields)

    # --- 4. LEI mapping candidates ---
    lei_rows: list[dict[str, Any]] = []
    for lei, apps in lei_apps.items():
        orig = lei_orig.get(lei, 0)
        # states where this LEI originated
        st_orig = {
            s: n for (l, s), n in lei_by_state_orig.items() if l == lei and n > 0
        }
        top_states = sorted(st_orig.items(), key=lambda x: -x[1])[:8]
        fl_orig = st_orig.get("FL", 0)
        lei_rows.append(
            {
                "lei": lei,
                "institution_name": "",  # fill from HMDA institution panel / NMLS match later
                "nmls_id": "",  # manual / future match
                "our_lender_slug": "",
                "match_status": "unmatched",
                "total_applications": apps,
                "total_originations": orig,
                "fl_originations": fl_orig,
                "states_with_originations": ";".join(f"{s}:{n}" for s, n in top_states),
                "priority_match": "high"
                if fl_orig >= 50 or orig >= 200
                else ("medium" if fl_orig >= 10 or orig >= 50 else "low"),
            }
        )

    lei_rows.sort(
        key=lambda r: (
            0 if r["priority_match"] == "high" else 1 if r["priority_match"] == "medium" else 2,
            -r["fl_originations"],
            -r["total_originations"],
            r["lei"],
        )
    )
    lei_fields = list(lei_rows[0].keys()) if lei_rows else []
    write_csv(CLEAN_DIR / "lei_mapping_candidates.csv", lei_rows, lei_fields)
    fl_lei = [r for r in lei_rows if r["fl_originations"] > 0]
    write_csv(FL_DIR / "lei_mapping_candidates_fl.csv", fl_lei, lei_fields)

    # Manifest JSON
    vintage = ",".join(sorted(years)) if years else "unknown"
    manifest = {
        "source_file": str(raw_path.name),
        "source_path_relative": raw_path.name,
        "data_vintage_years": sorted(years),
        "states_in_output": sorted(states_seen),
        "priority_states": sorted(PRIORITY_STATES),
        "secondary_states": sorted(SECONDARY_STATES),
        "row_counts": {
            "raw_scanned": total_rows,
            "kept": kept_rows,
            "skipped_purchased_action_6": skipped_purchased,
            "skipped_incomplete": skipped_incomplete,
            "skipped_other_states": skipped_state,
        },
        "filters": {
            "excluded_action_taken": [6],
            "excluded_action_taken_meaning": "Purchased loan",
            "required_fields": ["activity_year", "lei", "state_code", "county_code"],
        },
        "outputs": {
            "cleaned": [
                "county_market_summary.csv",
                "lender_activity_by_county.csv",
                "lender_state_summary.csv",
                "lei_mapping_candidates.csv",
            ],
            "florida": [
                "county_market_summary_fl.csv",
                "lender_activity_by_county_fl.csv",
                "lender_state_summary_fl.csv",
                "lei_mapping_candidates_fl.csv",
            ],
        },
        "notes": [
            "HMDA LAR does not include institution legal name; lei_mapping_candidates.institution_name is blank for LEI→NMLS matching.",
            "County names filled for all FL counties and selected high-volume counties in other states; otherwise county_name is blank (use county_fips).",
            "Denial rate = denials / applications (action_taken 3 / non-purchase rows with valid geo).",
            "Market share = lender originations / county originations in same year+state+county.",
            "Do not use these tables as Trust Scores or editorial rankings.",
        ],
        "data_vintage_label": f"HMDA {vintage}",
    }
    manifest_path = CLEAN_DIR / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"  wrote {manifest_path}")

    # README
    readme = f"""# HMDA cleaned datasets

**Data vintage:** HMDA activity year(s) **{vintage}**  
**Source file (raw, unchanged):** `{raw_path.name}` (~{size_mb:.0f} MB)  
**Processed:** streaming LAR → summary tables only  

## What was filtered out

- `action_taken = 6` (purchased loans) — not used for origination market stats  
- Rows missing year, LEI, state, or county  
- States outside: {", ".join(sorted(KEEP_STATES))}

Priority site markets: **{", ".join(sorted(PRIORITY_STATES))}** (Florida sorted first in multi-state files).  
Secondary in extract: **{", ".join(sorted(SECONDARY_STATES))}**.

## Files in `cleaned/`

| File | Description |
|------|-------------|
| `county_market_summary.csv` | County-level applications, originations, denials, loan-type mix, purchase vs refinance |
| `lender_activity_by_county.csv` | LEI activity per county + market share of originations |
| `lender_state_summary.csv` | LEI totals per state + top counties served |
| `lei_mapping_candidates.csv` | Unique LEIs ranked for NMLS/slug matching (`priority_match` high/medium/low) |
| `manifest.json` | Machine-readable run stats and notes |

## Files in `florida/`

Florida-only subsets of the same schemas (faster for FL-first product work).

## Column notes

- **Applications:** non-purchase HMDA rows with valid geography (includes originated, denied, withdrawn, etc.)  
- **Originations:** `action_taken = 1`  
- **Denials:** `action_taken = 3`  
- **Loan types:** Conventional / FHA / VA / USDA+other from HMDA `loan_type`  
- **Purchase vs refinance:** from `loan_purpose` (1 vs 31/32)  
- **institution_name / nmls_id:** empty placeholders for future LEI mapping  

## Do not

- Publish these as “Trust Scores” or invent ranking metrics  
- Delete the raw CSV — keep it for reprocessing  

## Re-run

```bash
python scripts/process_hmda.py path/to/raw.csv
```
"""
    (OUT_ROOT / "README.md").write_text(readme, encoding="utf-8")
    print(f"  wrote {OUT_ROOT / 'README.md'}")

    print()
    print("=== Done ===")
    print(f"FL counties: {len(fl_county):,}")
    print(f"FL lender×county rows: {len(fl_lc):,}")
    print(f"FL LEIs with originations: {len(fl_lei):,}")
    print(f"High-priority LEIs (overall): {sum(1 for r in lei_rows if r['priority_match']=='high'):,}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
