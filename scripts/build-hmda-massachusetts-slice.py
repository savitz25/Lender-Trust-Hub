#!/usr/bin/env python3
"""
Build Massachusetts HMDA product slice from national by-state partition + curated LEI maps.

  python scripts/build-hmda-massachusetts-slice.py

Source: data/hmda/by-state/MA/ (from process_hmda_national.py)
Reuses prior product-state LEI→slug maps. Precision over coverage.
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MA_SRC = ROOT / "data" / "hmda" / "by-state" / "MA"
OUT = ROOT / "data" / "hmda" / "massachusetts"

MAP_PATHS = [
    ROOT / "data" / "hmda" / "florida" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "texas" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "georgia" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "california" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "north-carolina" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "south-carolina" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "new-jersey" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "new-york" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "pennsylvania" / "lei_to_nmls_mapping.csv",
]
GLEIF_CACHE = ROOT / "data" / "hmda" / "florida" / "_gleif_name_cache.json"

# Prefer company-level / MA-relevant directory slugs when NMLS is known.
NATIONAL_SLUG_BY_NMLS: dict[str, str] = {
    "3038": "united-wholesale-mortgage",
    "3030": "rocket-mortgage",
    "2767": "freedom-mortgage",
    "174457": "loandepot",
    "2611": "guaranteed-rate",
    "35953": "pennymac",
    "399798": "jpmorgan-chase-bank",
    "405457": "truist-bank",
    "467341": "regions-bank",
    "2289": "newrez",
    "1120271": "amerihome-mortgage",
    "66247": "cardinal-financial",
    "6606": "new-american-funding",
    "2104": "mr-cooper",
    "2925": "eagle-home-mortgage",
    "446038": "pnc-bank",
    "399801": "wells-fargo-bank",
    "330511": "better-mortgage",
    "181005": "ally-bank",
    "481428": "td-bank",
    "3113": "academy-mortgage",
    "2250": "carrington-mortgage",
    "17022": "planet-home-lending",
    "1025894": "mutual-of-omaha-mortgage",
    "1027871": "zillow-home-loans",
    "433960": "citizens-bank",  # Top MA volume bank
    "402216": "us-bank",
    "399809": "usaa-federal-savings-bank",
    "1121636": "sofi-bank",
    "399797": "flagstar-bank",
    "39179": "movement-mortgage-myrtle-beach",
    # MA directory hosts
    "3274": "guild-mortgage-metrowest",
    "3029": "crosscountry-mortgage-metrowest",
    "414078": "dcu-metrowest",
    "399802": "bank-of-america-mortgage-boston-neighborhoods",
    "399807": "navy-federal-jacksonville",
    "412915": "citibank",
    "381076": "mt-bank",
    "2184": "embrace-home-loans",
    "2893": "nfm-lending",
    "411254": "valley-national-bank",
    "338923": "anniemac-home-mortgage",
    "75164": "prosperity-home-mortgage",
    "1124061": "lower",
    "1127": "nvr-mortgage",
    "1043": "new-day-financial",
    "1598647": "guaranteed-rate-affinity",
    "3277": "sun-west-mortgage",
    "237341": "american-financial-network",
    "503941": "first-citizens-bank",
    "405455": "ameris-bank",
    "405461": "southstate-bank",
    # MA curated NMLS → hosts
    "449250": "leader-bank",
    "451827": "eastern-bank",
    "401447": "rockland-trust",
    "4662": "salem-five-mortgage",
    "2764": "total-mortgage-services",
    # MA deepen
    "401717": "cape-cod-five",
    "440578": "middlesex-savings-bank",
    "543370": "cambridge-savings-bank",
    "472618": "workers-credit-union",
    "1515": "northpoint-mortgage",
    "2561": "harborone-mortgage",
    "1082048": "baycoast-mortgage",
    "1846": "radius-financial-group",
    "2141744": "needham-bank",
}

# High-confidence MA-active LEIs (GLEIF + published company NMLS). No inventing.
MA_CURATED_LEI: dict[str, dict[str, str]] = {
    "549300FK3AFCFVAPH234": {
        "institution_name_hmda": "Leader Bank, National Association",
        "nmls_id": "449250",
        "our_lender_slug": "leader-bank",
        "legal_name": "Leader Bank, National Association",
        "match_confidence": "high",
        "match_method": "ma_curated_gleif+public_nmls",
    },
    "X8V2II80XTQHRH7NCB19": {
        "institution_name_hmda": "Eastern Bank",
        "nmls_id": "451827",
        "our_lender_slug": "eastern-bank",
        "legal_name": "Eastern Bank",
        "match_confidence": "high",
        "match_method": "ma_curated_gleif+public_nmls",
    },
    "TKT6FH38184ZYBTPKS77": {
        "institution_name_hmda": "Rockland Trust Company",
        "nmls_id": "401447",
        "our_lender_slug": "rockland-trust",
        "legal_name": "Rockland Trust Company",
        "match_confidence": "high",
        "match_method": "ma_curated_gleif+public_nmls",
    },
    "549300H8H31LPYGJEW50": {
        "institution_name_hmda": "SALEM FIVE MORTGAGE COMPANY, LLC",
        "nmls_id": "4662",
        "our_lender_slug": "salem-five-mortgage",
        "legal_name": "Salem Five Mortgage Company, LLC",
        "match_confidence": "high",
        "match_method": "ma_curated_gleif+public_nmls",
    },
    "549300VJQJVZKJBDWS17": {
        "institution_name_hmda": "TOTAL MORTGAGE SERVICES, LLC",
        "nmls_id": "2764",
        "our_lender_slug": "total-mortgage-services",
        "legal_name": "Total Mortgage Services, LLC",
        "match_confidence": "high",
        "match_method": "ma_curated_gleif+public_nmls",
    },
    # Deepen — high MA volume + published company NMLS
    "5493007XQ02VMXYJYJ21": {
        "institution_name_hmda": "The Cape Cod Five Cents Savings Bank",
        "nmls_id": "401717",
        "our_lender_slug": "cape-cod-five",
        "legal_name": "The Cape Cod Five Cents Savings Bank",
        "match_confidence": "high",
        "match_method": "ma_curated_gleif+public_nmls",
    },
    "VMDPCBOQ43W3PZTYZL93": {
        "institution_name_hmda": "Middlesex Savings Bank",
        "nmls_id": "440578",
        "our_lender_slug": "middlesex-savings-bank",
        "legal_name": "Middlesex Savings Bank",
        "match_confidence": "high",
        "match_method": "ma_curated_gleif+public_nmls",
    },
    "549300FHGNOLF14HHS09": {
        "institution_name_hmda": "Cambridge Savings Bank",
        "nmls_id": "543370",
        "our_lender_slug": "cambridge-savings-bank",
        "legal_name": "Cambridge Savings Bank",
        "match_confidence": "high",
        "match_method": "ma_curated_gleif+public_nmls",
    },
    "254900MSO8KVQ05D2J27": {
        "institution_name_hmda": "Workers Federal Credit Union",
        "nmls_id": "472618",
        "our_lender_slug": "workers-credit-union",
        "legal_name": "Workers Credit Union (Workers Federal Credit Union)",
        "match_confidence": "high",
        "match_method": "ma_curated_gleif+public_nmls",
    },
    "549300JI0UWY4QIWDV89": {
        "institution_name_hmda": "NORTHPOINT MORTGAGE, INC.",
        "nmls_id": "1515",
        "our_lender_slug": "northpoint-mortgage",
        "legal_name": "Northpoint Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "ma_curated_gleif+public_nmls",
    },
    "549300DAUXQ2DCY4H838": {
        "institution_name_hmda": "HARBORONE MORTGAGE, LLC",
        "nmls_id": "2561",
        "our_lender_slug": "harborone-mortgage",
        "legal_name": "HarborOne Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "ma_curated_gleif+public_nmls",
    },
    "549300SYR11CYON0JE74": {
        "institution_name_hmda": "BAYCOAST MORTGAGE COMPANY, LLC",
        "nmls_id": "1082048",
        "our_lender_slug": "baycoast-mortgage",
        "legal_name": "BayCoast Mortgage Company, LLC",
        "match_confidence": "high",
        "match_method": "ma_curated_gleif+public_nmls",
    },
    "549300GCEUZLVML1J263": {
        "institution_name_hmda": "RADIUS FINANCIAL GROUP INC.",
        "nmls_id": "1846",
        "our_lender_slug": "radius-financial-group",
        "legal_name": "Radius Financial Group Inc.",
        "match_confidence": "high",
        "match_method": "ma_curated_gleif+public_nmls",
    },
    "5493000NZZZU3GFIYL71": {
        "institution_name_hmda": "Needham Bank",
        "nmls_id": "2141744",
        "our_lender_slug": "needham-bank",
        "legal_name": "Needham Bank",
        "match_confidence": "high",
        "match_method": "ma_curated_gleif+public_nmls",
    },
}

# All MA counties (FIPS → name)
MA_COUNTIES: dict[str, str] = {
    "25001": "Barnstable",
    "25003": "Berkshire",
    "25005": "Bristol",
    "25007": "Dukes",
    "25009": "Essex",
    "25011": "Franklin",
    "25013": "Hampden",
    "25015": "Hampshire",
    "25017": "Middlesex",
    "25019": "Nantucket",
    "25021": "Norfolk",
    "25023": "Plymouth",
    "25025": "Suffolk",
    "25027": "Worcester",
}

# Wave 1 + deepen — all 14 Massachusetts counties (islands included for full-state panels)
MA_MAJOR_FIPS = {
    "25017",  # Middlesex
    "25027",  # Worcester
    "25009",  # Essex
    "25021",  # Norfolk
    "25023",  # Plymouth
    "25005",  # Bristol
    "25025",  # Suffolk (Boston)
    "25013",  # Hampden
    "25001",  # Barnstable
    "25003",  # Berkshire
    "25015",  # Hampshire
    "25011",  # Franklin
    "25007",  # Dukes (Martha's Vineyard)
    "25019",  # Nantucket
}


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow(r)


def load_lei_maps() -> dict[str, dict[str, str]]:
    lei_to_map: dict[str, dict[str, str]] = {}

    def ingest(path: Path, vol_keys: list[str]) -> None:
        if not path.exists():
            return
        for r in read_csv(path):
            lei = (r.get("lei") or "").strip()
            if not lei or not (r.get("our_lender_slug") or "").strip():
                continue
            vol = 0.0
            for k in vol_keys:
                try:
                    vol = max(vol, float(r.get(k) or 0))
                except ValueError:
                    pass
            prev = lei_to_map.get(lei)
            if prev:
                try:
                    prev_vol = float(prev.get("_vol") or 0)
                except ValueError:
                    prev_vol = 0.0
                if vol <= prev_vol:
                    continue
            row = dict(r)
            row["_vol"] = str(vol)
            lei_to_map[lei] = row

    for p in MAP_PATHS:
        ingest(
            p,
            [
                "florida_originations",
                "texas_originations",
                "georgia_originations",
                "california_originations",
                "north_carolina_originations",
                "south_carolina_originations",
                "new_jersey_originations",
                "new_york_originations",
                "pennsylvania_originations",
                "massachusetts_originations",
                "total_originations",
            ],
        )
    return lei_to_map


def fill_county_name(r: dict[str, str]) -> dict[str, str]:
    fips = (r.get("county_fips") or "").strip()
    if not (r.get("county_name") or "").strip() and fips in MA_COUNTIES:
        return {**r, "county_name": MA_COUNTIES[fips]}
    return r


def main() -> None:
    if not MA_SRC.is_dir():
        raise SystemExit(
            f"Missing {MA_SRC} — run: python scripts/process_hmda_national.py year_2025.csv"
        )

    lei_to_map = load_lei_maps()
    gleif: dict[str, str] = {}
    if GLEIF_CACHE.exists():
        gleif = json.loads(GLEIF_CACHE.read_text(encoding="utf-8"))

    # Prefer GLEIF names for MA curated LEIs in activity fill
    for lei, cur in MA_CURATED_LEI.items():
        gleif.setdefault(lei, cur["institution_name_hmda"])

    county_ma = [fill_county_name(r) for r in read_csv(MA_SRC / "county_market_summary.csv")]
    county_out: list[dict[str, str]] = []
    for r in county_ma:
        fips = (r.get("county_fips") or "").strip()
        try:
            orig = float(r.get("total_originations") or 0)
        except ValueError:
            orig = 0
        name = (r.get("county_name") or "").strip()
        if name or orig >= 400 or fips in MA_MAJOR_FIPS:
            if not name and fips in MA_COUNTIES:
                r = {**r, "county_name": MA_COUNTIES[fips]}
            county_out.append(r)

    state_ma = read_csv(MA_SRC / "lender_state_summary.csv")

    act_all = read_csv(MA_SRC / "lender_activity_by_county.csv")
    act_ma: list[dict[str, str]] = []
    for r in act_all:
        r = fill_county_name(r)
        fips = (r.get("county_fips") or "").strip()
        name = (r.get("county_name") or "").strip()
        if not name or fips not in MA_MAJOR_FIPS:
            continue
        lei = (r.get("lei") or "").strip()
        if not (r.get("institution_name") or "").strip():
            nm = gleif.get(lei) or (lei_to_map.get(lei) or {}).get("institution_name_hmda")
            if not nm and lei in MA_CURATED_LEI:
                nm = MA_CURATED_LEI[lei]["institution_name_hmda"]
            if nm:
                r = {**r, "institution_name": nm}
        act_ma.append(r)

    cand_ma = read_csv(MA_SRC / "lei_mapping_candidates.csv")
    for r in cand_ma:
        if "ma_originations" in r and "massachusetts_originations" not in r:
            r["massachusetts_originations"] = r["ma_originations"]

    state_by_lei = {r["lei"]: r for r in state_ma}
    mapping_by_lei: dict[str, dict[str, str]] = {}

    def add_mapping(lei: str, base: dict[str, str], method_prefix: str) -> None:
        st = state_by_lei.get(lei)
        if not st:
            return
        try:
            ma_orig = int(float(st.get("total_originations") or 0))
        except ValueError:
            ma_orig = 0
        if ma_orig <= 0:
            return
        nmls = (base.get("nmls_id") or "").strip()
        slug = NATIONAL_SLUG_BY_NMLS.get(nmls) or (base.get("our_lender_slug") or "").strip()
        if not slug:
            return
        row = {
            "lei": lei,
            "institution_name_hmda": base.get("institution_name_hmda")
            or base.get("legal_name")
            or gleif.get(lei)
            or st.get("institution_name")
            or "",
            "nmls_id": nmls,
            "our_lender_slug": slug,
            "legal_name": base.get("legal_name") or "",
            "match_confidence": base.get("match_confidence") or "high",
            "match_method": method_prefix + (base.get("match_method") or "curated"),
            "massachusetts_originations": str(ma_orig),
            "florida_originations": base.get("florida_originations") or "0",
            "total_originations": st.get("total_originations") or str(ma_orig),
            "priority_match": "high" if ma_orig >= 400 else "medium",
            "notes": (
                f"{method_prefix.rstrip('+') or 'curated'} map for MA activity "
                f"({ma_orig} MA originations); slug={slug}."
            ),
        }
        prev = mapping_by_lei.get(lei)
        if prev and int(prev["massachusetts_originations"]) >= ma_orig and prev.get(
            "our_lender_slug"
        ):
            return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_prior_state_curated_lei+")

    for lei, cur in MA_CURATED_LEI.items():
        add_mapping(lei, cur, "ma_curated+")

    mapping_rows = sorted(
        mapping_by_lei.values(),
        key=lambda r: -int(float(r["massachusetts_originations"] or 0)),
    )

    if county_out:
        write_csv(OUT / "county_market_summary_ma.csv", county_out, list(county_out[0].keys()))
    if act_ma:
        write_csv(OUT / "lender_activity_by_county_ma.csv", act_ma, list(act_ma[0].keys()))
    if state_ma:
        write_csv(OUT / "lender_state_summary_ma.csv", state_ma, list(state_ma[0].keys()))
    if cand_ma:
        for r in cand_ma:
            if "massachusetts_originations" not in r:
                r["massachusetts_originations"] = r.get("ma_originations") or "0"
        write_csv(OUT / "lei_mapping_candidates_ma.csv", cand_ma, list(cand_ma[0].keys()))
    if mapping_rows:
        write_csv(OUT / "lei_to_nmls_mapping.csv", mapping_rows, list(mapping_rows[0].keys()))

    major_named = [
        r
        for r in county_out
        if (r.get("county_fips") or "") in MA_MAJOR_FIPS
        and (r.get("county_name") or "").strip()
    ]
    major_named.sort(key=lambda r: -float(r.get("total_originations") or 0))

    md = [
        "# Massachusetts HMDA slice\n\n",
        f"**Source:** `data/hmda/by-state/MA/` (national 2025 foundation)\n\n",
        f"- County market rows: **{len(county_out)}**\n",
        f"- Lender–county activity (major counties): **{len(act_ma)}**\n",
        f"- LEI state summaries: **{len(state_ma)}**\n",
        f"- High-confidence LEI→directory mappings: **{len(mapping_rows)}**\n",
        f"- Major counties with names: **{len(major_named)}**\n\n",
        "## Top mapped LEIs by MA originations\n\n",
    ]
    for r in mapping_rows[:25]:
        md.append(
            f"- `{r['our_lender_slug']}` — {r['institution_name_hmda']} "
            f"({r['massachusetts_originations']} MA orig.)\n"
        )
    md.append("\n## Major counties (panel-ready)\n\n")
    for r in major_named:
        md.append(
            f"- **{r.get('county_name')}** (`{r.get('county_fips')}`) — "
            f"{r.get('total_originations')} originations\n"
        )
    md.append(
        "\n## Matching rules\n\n"
        "- Reuse prior product-state curated LEI maps when the LEI has MA activity\n"
        "- National NMLS→slug overrides prefer MA directory hosts when known\n"
        "- MA curated wave 1 + deepen regionals (GLEIF + published company NMLS)\n"
        "- No fuzzy LEI inventing\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/process_hmda_national.py year_2025.csv  # if partition missing\n"
        "python scripts/build-hmda-massachusetts-slice.py\n"
        "```\n"
    )
    (OUT / "README.md").write_text("".join(md), encoding="utf-8")

    print(f"Wrote Massachusetts slice → {OUT}")
    print(f"  mappings={len(mapping_rows)} counties={len(county_out)} activity={len(act_ma)}")
    print(f"  major_named={len(major_named)}")


if __name__ == "__main__":
    main()
