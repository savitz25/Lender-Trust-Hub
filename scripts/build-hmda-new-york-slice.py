#!/usr/bin/env python3
"""
Build New York HMDA product slice from national by-state partition + curated LEI maps.

  python scripts/build-hmda-new-york-slice.py

Source: data/hmda/by-state/NY/ (from process_hmda_national.py)
Reuses FL/TX/GA/CA/NC/SC/NJ LEI→slug maps. Precision over coverage.
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NY_SRC = ROOT / "data" / "hmda" / "by-state" / "NY"
OUT = ROOT / "data" / "hmda" / "new-york"

MAP_PATHS = [
    ROOT / "data" / "hmda" / "florida" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "texas" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "georgia" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "california" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "north-carolina" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "south-carolina" / "lei_to_nmls_mapping.csv",
    ROOT / "data" / "hmda" / "new-jersey" / "lei_to_nmls_mapping.csv",
]
GLEIF_CACHE = ROOT / "data" / "hmda" / "florida" / "_gleif_name_cache.json"

# Prefer company-level / NY-relevant directory slugs when NMLS is known.
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
    "433960": "citizens-bank",
    "402216": "us-bank",
    "399809": "usaa-federal-savings-bank",
    "1121636": "sofi-bank",
    "399797": "flagstar-bank",
    "39179": "movement-mortgage-myrtle-beach",
    # Regional hosts only — bare company slugs do not exist in the directory catalog
    "3274": "guild-mortgage-nyc-boroughs",
    "3029": "crosscountry-mortgage-western-ny",
    "399807": "navy-federal-jacksonville",
    "412915": "citibank",
    "381076": "mt-bank",
    "2184": "embrace-home-loans",
    "2893": "nfm-lending",
    "411254": "valley-national-bank",
    "409701": "oceanfirst-bank",
    "338923": "anniemac-home-mortgage",
    "75164": "prosperity-home-mortgage",
    "1124061": "lower",
    "1127": "nvr-mortgage",
    "1043": "new-day-financial",
    "1598647": "guaranteed-rate-affinity",
    "3277": "sun-west-mortgage",
    "237341": "american-financial-network",
    "3925": "kind-lending",
    "167441": "amwest-funding",
    "480004": "synovus-bank",
    "503941": "first-citizens-bank",
    "405455": "ameris-bank",
    "405461": "southstate-bank",
}

# High-confidence NY-active LEIs (GLEIF name + public NMLS). No inventing.
NY_CURATED_LEI: dict[str, dict[str, str]] = {
    # Many national LEIs already come from FL/NJ maps; add NY-relevant when known:
    "E57ODZWZ7FF32TWEFA76": {
        "institution_name_hmda": "Citibank, National Association",
        "nmls_id": "412915",
        "our_lender_slug": "citibank",
        "legal_name": "Citibank, National Association",
        "match_confidence": "high",
        "match_method": "ny_curated_gleif+public_nmls",
    },
    "WWB2V0FCW3A0EE3ZJN75": {
        "institution_name_hmda": "Manufacturers and Traders Trust Company",
        "nmls_id": "381076",
        "our_lender_slug": "mt-bank",
        "legal_name": "Manufacturers and Traders Trust Company (M&T Bank)",
        "match_confidence": "high",
        "match_method": "ny_curated_gleif+public_nmls",
    },
    "549300MCIFZSDHUT8X63": {
        "institution_name_hmda": "NFM, INC.",
        "nmls_id": "2893",
        "our_lender_slug": "nfm-lending",
        "legal_name": "NFM, Inc. (dba NFM Lending)",
        "match_confidence": "high",
        "match_method": "ny_curated_gleif+public_nmls",
    },
    "213800QUAI2VH5YM6310": {
        "institution_name_hmda": "EMBRACE HOME LOANS, INC.",
        "nmls_id": "2184",
        "our_lender_slug": "embrace-home-loans",
        "legal_name": "Embrace Home Loans, Inc.",
        "match_confidence": "high",
        "match_method": "ny_curated_gleif+public_nmls",
    },
}

# All NY counties (FIPS → name) for panel labels — major markets prioritized in config
NY_COUNTIES: dict[str, str] = {
    "36001": "Albany",
    "36003": "Allegany",
    "36005": "Bronx",
    "36007": "Broome",
    "36009": "Cattaraugus",
    "36011": "Cayuga",
    "36013": "Chautauqua",
    "36015": "Chemung",
    "36017": "Chenango",
    "36019": "Clinton",
    "36021": "Columbia",
    "36023": "Cortland",
    "36025": "Delaware",
    "36027": "Dutchess",
    "36029": "Erie",
    "36031": "Essex",
    "36033": "Franklin",
    "36035": "Fulton",
    "36037": "Genesee",
    "36039": "Greene",
    "36041": "Hamilton",
    "36043": "Herkimer",
    "36045": "Jefferson",
    "36047": "Kings",
    "36049": "Lewis",
    "36051": "Livingston",
    "36053": "Madison",
    "36055": "Monroe",
    "36057": "Montgomery",
    "36059": "Nassau",
    "36061": "New York",
    "36063": "Niagara",
    "36065": "Oneida",
    "36067": "Onondaga",
    "36069": "Ontario",
    "36071": "Orange",
    "36073": "Orleans",
    "36075": "Oswego",
    "36077": "Otsego",
    "36079": "Putnam",
    "36081": "Queens",
    "36083": "Rensselaer",
    "36085": "Richmond",
    "36087": "Rockland",
    "36089": "St. Lawrence",
    "36091": "Saratoga",
    "36093": "Schenectady",
    "36095": "Schoharie",
    "36097": "Schuyler",
    "36099": "Seneca",
    "36101": "Steuben",
    "36103": "Suffolk",
    "36105": "Sullivan",
    "36107": "Tioga",
    "36109": "Tompkins",
    "36111": "Ulster",
    "36113": "Warren",
    "36115": "Washington",
    "36117": "Wayne",
    "36119": "Westchester",
    "36121": "Wyoming",
    "36123": "Yates",
}

# Wave 1 majors for activity filtering (high volume / metro)
NY_MAJOR_FIPS = {
    "36103",  # Suffolk
    "36059",  # Nassau
    "36029",  # Erie
    "36055",  # Monroe
    "36081",  # Queens
    "36047",  # Kings
    "36119",  # Westchester
    "36067",  # Onondaga
    "36061",  # New York (Manhattan)
    "36071",  # Orange
    "36001",  # Albany
    "36085",  # Richmond
    "36027",  # Dutchess
    "36091",  # Saratoga
    "36087",  # Rockland
    "36005",  # Bronx
    "36063",  # Niagara
    "36065",  # Oneida
    "36093",  # Schenectady
    "36083",  # Rensselaer
    "36111",  # Ulster
    "36007",  # Broome
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
                "total_originations",
            ],
        )
    return lei_to_map


def fill_county_name(r: dict[str, str]) -> dict[str, str]:
    fips = (r.get("county_fips") or "").strip()
    if not (r.get("county_name") or "").strip() and fips in NY_COUNTIES:
        return {**r, "county_name": NY_COUNTIES[fips]}
    return r


def main() -> None:
    if not NY_SRC.is_dir():
        raise SystemExit(
            f"Missing {NY_SRC} — run: python scripts/process_hmda_national.py year_2025.csv"
        )

    lei_to_map = load_lei_maps()
    gleif: dict[str, str] = {}
    if GLEIF_CACHE.exists():
        gleif = json.loads(GLEIF_CACHE.read_text(encoding="utf-8"))

    county_ny = [fill_county_name(r) for r in read_csv(NY_SRC / "county_market_summary.csv")]
    # Keep counties with names or material volume
    county_out: list[dict[str, str]] = []
    for r in county_ny:
        fips = (r.get("county_fips") or "").strip()
        try:
            orig = float(r.get("total_originations") or 0)
        except ValueError:
            orig = 0
        name = (r.get("county_name") or "").strip()
        if name or orig >= 800 or fips in NY_MAJOR_FIPS:
            if not name and fips in NY_COUNTIES:
                r = {**r, "county_name": NY_COUNTIES[fips]}
            county_out.append(r)

    state_ny = read_csv(NY_SRC / "lender_state_summary.csv")

    act_all = read_csv(NY_SRC / "lender_activity_by_county.csv")
    act_ny: list[dict[str, str]] = []
    for r in act_all:
        r = fill_county_name(r)
        fips = (r.get("county_fips") or "").strip()
        name = (r.get("county_name") or "").strip()
        if not name or fips not in NY_MAJOR_FIPS:
            continue
        lei = (r.get("lei") or "").strip()
        if not (r.get("institution_name") or "").strip():
            nm = gleif.get(lei) or (lei_to_map.get(lei) or {}).get("institution_name_hmda")
            if not nm and lei in NY_CURATED_LEI:
                nm = NY_CURATED_LEI[lei]["institution_name_hmda"]
            if nm:
                r = {**r, "institution_name": nm}
        act_ny.append(r)

    cand_ny = read_csv(NY_SRC / "lei_mapping_candidates.csv")
    # Normalize state-volume column name for loader
    for r in cand_ny:
        if "ny_originations" in r and "new_york_originations" not in r:
            r["new_york_originations"] = r["ny_originations"]

    state_by_lei = {r["lei"]: r for r in state_ny}
    mapping_by_lei: dict[str, dict[str, str]] = {}

    def add_mapping(lei: str, base: dict[str, str], method_prefix: str) -> None:
        st = state_by_lei.get(lei)
        if not st:
            return
        try:
            ny_orig = int(float(st.get("total_originations") or 0))
        except ValueError:
            ny_orig = 0
        if ny_orig <= 0:
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
            "new_york_originations": str(ny_orig),
            "florida_originations": base.get("florida_originations") or "0",
            "total_originations": st.get("total_originations") or str(ny_orig),
            "priority_match": "high" if ny_orig >= 400 else "medium",
            "notes": (
                f"{method_prefix.rstrip('+') or 'curated'} map for NY activity "
                f"({ny_orig} NY originations); slug={slug}."
            ),
        }
        prev = mapping_by_lei.get(lei)
        if prev and int(prev["new_york_originations"]) >= ny_orig and prev.get(
            "our_lender_slug"
        ):
            return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_fl_tx_ga_ca_nc_sc_nj_curated_lei+")

    for lei, cur in NY_CURATED_LEI.items():
        add_mapping(lei, cur, "ny_curated+")

    mapping_rows = sorted(
        mapping_by_lei.values(),
        key=lambda r: -int(float(r["new_york_originations"] or 0)),
    )

    if county_out:
        write_csv(OUT / "county_market_summary_ny.csv", county_out, list(county_out[0].keys()))
    if act_ny:
        write_csv(OUT / "lender_activity_by_county_ny.csv", act_ny, list(act_ny[0].keys()))
    if state_ny:
        write_csv(OUT / "lender_state_summary_ny.csv", state_ny, list(state_ny[0].keys()))
    if cand_ny:
        # Ensure new_york_originations column for load.ts
        for r in cand_ny:
            if "new_york_originations" not in r:
                r["new_york_originations"] = r.get("ny_originations") or "0"
        write_csv(OUT / "lei_mapping_candidates_ny.csv", cand_ny, list(cand_ny[0].keys()))
    if mapping_rows:
        write_csv(OUT / "lei_to_nmls_mapping.csv", mapping_rows, list(mapping_rows[0].keys()))

    major_named = [
        r
        for r in county_out
        if (r.get("county_fips") or "") in NY_MAJOR_FIPS
        and (r.get("county_name") or "").strip()
    ]
    major_named.sort(key=lambda r: -float(r.get("total_originations") or 0))

    md = [
        "# New York HMDA slice\n\n",
        f"**Source:** `data/hmda/by-state/NY/` (national 2025 foundation)\n\n",
        f"- County market rows: **{len(county_out)}**\n",
        f"- Lender–county activity (major counties): **{len(act_ny)}**\n",
        f"- LEI state summaries: **{len(state_ny)}**\n",
        f"- High-confidence LEI→directory mappings: **{len(mapping_rows)}**\n",
        f"- Major counties with names: **{len(major_named)}**\n\n",
        "## Top mapped LEIs by NY originations\n\n",
    ]
    for r in mapping_rows[:25]:
        md.append(
            f"- `{r['our_lender_slug']}` — {r['institution_name_hmda']} "
            f"({r['new_york_originations']} NY orig.)\n"
        )
    md.append("\n## Major counties (panel-ready)\n\n")
    for r in major_named:
        md.append(
            f"- **{r.get('county_name')}** (`{r.get('county_fips')}`) — "
            f"{r.get('total_originations')} originations\n"
        )
    md.append(
        "\n## Matching rules\n\n"
        "- Reuse FL / TX / GA / CA / NC / SC / NJ curated LEI maps when the LEI has NY activity\n"
        "- National NMLS→slug overrides prefer company-level hosts\n"
        "- No fuzzy LEI inventing\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/process_hmda_national.py year_2025.csv  # if partition missing\n"
        "python scripts/build-hmda-new-york-slice.py\n"
        "```\n"
    )
    (OUT / "README.md").write_text("".join(md), encoding="utf-8")

    print(f"Wrote New York slice → {OUT}")
    print(f"  mappings={len(mapping_rows)} counties={len(county_out)} activity={len(act_ny)}")
    print(f"  major_named={len(major_named)}")


if __name__ == "__main__":
    main()
