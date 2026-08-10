#!/usr/bin/env python3
"""
Build Rhode Island, Vermont, and Maine HMDA product slices.

  python scripts/build-hmda-ri-vt-me-slices.py

Source: data/hmda/by-state/{RI,VT,ME}/
Reuses prior product-state LEI→slug maps. Precision over coverage.
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GLEIF_CACHE = ROOT / "data" / "hmda" / "florida" / "_gleif_name_cache.json"

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
    ROOT / "data" / "hmda" / "massachusetts" / "lei_to_nmls_mapping.csv",
]

NATIONAL_SLUG_BY_NMLS: dict[str, str] = {
    "3038": "united-wholesale-mortgage",
    "3030": "rocket-mortgage",
    "2767": "freedom-mortgage",
    "174457": "loandepot",
    "2611": "guaranteed-rate",
    "35953": "pennymac",
    "399798": "jpmorgan-chase-bank",
    "405457": "truist-bank",
    "2289": "newrez",
    "1120271": "amerihome-mortgage",
    "66247": "cardinal-financial",
    "6606": "new-american-funding",
    "2104": "mr-cooper",
    "446038": "pnc-bank",
    "399801": "wells-fargo-bank",
    "330511": "better-mortgage",
    "181005": "ally-bank",
    "481428": "td-bank",
    "433960": "citizens-bank",
    "402216": "us-bank",
    "399809": "usaa-federal-savings-bank",
    "1121636": "sofi-bank",
    "399797": "flagstar-bank",
    "39179": "movement-mortgage-myrtle-beach",
    "3274": "guild-mortgage-metrowest",
    "3029": "crosscountry-mortgage-metrowest",
    "399807": "navy-federal-jacksonville",
    "412915": "citibank",
    "381076": "mt-bank",
    "2184": "embrace-home-loans",
    "2893": "nfm-lending",
    "338923": "anniemac-home-mortgage",
    "75164": "prosperity-home-mortgage",
    "1124061": "lower",
    "1127": "nvr-mortgage",
    "1598647": "guaranteed-rate-affinity",
    "503941": "first-citizens-bank",
    "1082048": "baycoast-mortgage",
    "2764": "total-mortgage-services",
    "1515": "northpoint-mortgage",
    "2561": "harborone-mortgage",
    "2926": "emm-loans",
    "3094": "primary-residential-mortgage",  # PRMI company host
    # NE curated
    "901927": "washington-trust-mortgage",
    "407964": "banknewport",
    "449200": "bangor-savings-bank",
    "486887": "camden-national-bank",
}

# High-confidence LEIs (GLEIF + published company NMLS). Shared across NE small states.
NE_CURATED_LEI: dict[str, dict[str, str]] = {
    "549300HKYBSATM44Q425": {
        "institution_name_hmda": "The Washington Trust Company, of Westerly",
        "nmls_id": "901927",
        "our_lender_slug": "washington-trust-mortgage",
        "legal_name": "The Washington Trust Company / Washington Trust Mortgage Company LLC",
        "match_confidence": "high",
        "match_method": "ne_curated_gleif+public_nmls",
    },
    "549300RYJCJ7JPQ4RF20": {
        "institution_name_hmda": "BankNewport",
        "nmls_id": "407964",
        "our_lender_slug": "banknewport",
        "legal_name": "BankNewport",
        "match_confidence": "high",
        "match_method": "ne_curated_gleif+public_nmls",
    },
    "54930052M48FOD3CWA54": {
        "institution_name_hmda": "PRIMARY RESIDENTIAL MORTGAGE, INC.",
        "nmls_id": "3094",
        "our_lender_slug": "primary-residential-mortgage",
        "legal_name": "Primary Residential Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "ne_curated_gleif+public_nmls",
    },
    "549300JEBULFT3BSU682": {
        "institution_name_hmda": "Bangor Savings Bank",
        "nmls_id": "449200",
        "our_lender_slug": "bangor-savings-bank",
        "legal_name": "Bangor Savings Bank",
        "match_confidence": "high",
        "match_method": "ne_curated_gleif+public_nmls",
    },
    "549300VMVKSQE1B7DD43": {
        "institution_name_hmda": "The Camden National Bank",
        "nmls_id": "486887",
        "our_lender_slug": "camden-national-bank",
        "legal_name": "Camden National Bank",
        "match_confidence": "high",
        "match_method": "ne_curated_gleif+public_nmls",
    },
}

STATES = [
    {
        "code": "RI",
        "name": "Rhode Island",
        "folder": "rhode-island",
        "suffix": "_ri",
        "col": "rhode_island_originations",
        "alias_col": "ri_originations",
        "counties": {
            "44001": "Bristol",
            "44003": "Kent",
            "44005": "Newport",
            "44007": "Providence",
            "44009": "Washington",
        },
        # All 5 counties are meaningful volume
        "majors": {"44001", "44003", "44005", "44007", "44009"},
    },
    {
        "code": "VT",
        "name": "Vermont",
        "folder": "vermont",
        "suffix": "_vt",
        "col": "vermont_originations",
        "alias_col": "vt_originations",
        "counties": {
            "50001": "Addison",
            "50003": "Bennington",
            "50005": "Caledonia",
            "50007": "Chittenden",
            "50009": "Essex",
            "50011": "Franklin",
            "50013": "Grand Isle",
            "50015": "Lamoille",
            "50017": "Orange",
            "50019": "Orleans",
            "50021": "Rutland",
            "50023": "Washington",
            "50025": "Windham",
            "50027": "Windsor",
        },
        # Higher-activity counties (exclude thinnest: Essex, Grand Isle)
        "majors": {
            "50007",  # Chittenden
            "50023",  # Washington
            "50011",  # Franklin
            "50027",  # Windsor
            "50021",  # Rutland
            "50025",  # Windham
            "50015",  # Lamoille
            "50001",  # Addison
            "50019",  # Orleans
            "50003",  # Bennington
            "50005",  # Caledonia
            "50017",  # Orange
        },
    },
    {
        "code": "ME",
        "name": "Maine",
        "folder": "maine",
        "suffix": "_me",
        "col": "maine_originations",
        "alias_col": "me_originations",
        "counties": {
            "23001": "Androscoggin",
            "23003": "Aroostook",
            "23005": "Cumberland",
            "23007": "Franklin",
            "23009": "Hancock",
            "23011": "Kennebec",
            "23013": "Knox",
            "23015": "Lincoln",
            "23017": "Oxford",
            "23019": "Penobscot",
            "23021": "Piscataquis",
            "23023": "Sagadahoc",
            "23025": "Somerset",
            "23027": "Waldo",
            "23029": "Washington",
            "23031": "York",
        },
        # Meaningful volume counties (exclude thinnest if needed — include all with >= ~500)
        "majors": {
            "23005",  # Cumberland
            "23031",  # York
            "23019",  # Penobscot
            "23011",  # Kennebec
            "23001",  # Androscoggin
            "23017",  # Oxford
            "23009",  # Hancock
            "23025",  # Somerset
            "23003",  # Aroostook
            "23027",  # Waldo
            "23013",  # Knox
            "23015",  # Lincoln
            "23023",  # Sagadahoc
            "23029",  # Washington
            "23007",  # Franklin
            "23021",  # Piscataquis
        },
    },
]


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

    def ingest(path: Path) -> None:
        if not path.exists():
            return
        for r in read_csv(path):
            lei = (r.get("lei") or "").strip()
            if not lei or not (r.get("our_lender_slug") or "").strip():
                continue
            vol = 0.0
            for k in (
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
                "rhode_island_originations",
                "vermont_originations",
                "maine_originations",
                "total_originations",
            ):
                try:
                    vol = max(vol, float(r.get(k) or 0))
                except ValueError:
                    pass
            prev = lei_to_map.get(lei)
            if prev:
                try:
                    if vol <= float(prev.get("_vol") or 0):
                        continue
                except ValueError:
                    pass
            row = dict(r)
            row["_vol"] = str(vol)
            lei_to_map[lei] = row

    for p in MAP_PATHS:
        ingest(p)
    return lei_to_map


def fill_county(r: dict[str, str], counties: dict[str, str]) -> dict[str, str]:
    fips = (r.get("county_fips") or "").strip()
    if not (r.get("county_name") or "").strip() and fips in counties:
        return {**r, "county_name": counties[fips]}
    return r


def build_state(
    cfg: dict,
    lei_to_map: dict[str, dict[str, str]],
    gleif: dict[str, str],
) -> None:
    code = cfg["code"]
    src = ROOT / "data" / "hmda" / "by-state" / code
    out = ROOT / "data" / "hmda" / cfg["folder"]
    if not src.is_dir():
        raise SystemExit(f"Missing {src}")

    counties_map: dict[str, str] = cfg["counties"]
    majors: set[str] = cfg["majors"]
    suffix = cfg["suffix"]
    col = cfg["col"]
    alias = cfg["alias_col"]

    county_rows = [fill_county(r, counties_map) for r in read_csv(src / "county_market_summary.csv")]
    county_out: list[dict[str, str]] = []
    for r in county_rows:
        fips = (r.get("county_fips") or "").strip()
        try:
            orig = float(r.get("total_originations") or 0)
        except ValueError:
            orig = 0
        name = (r.get("county_name") or "").strip()
        if name or orig >= 100 or fips in majors:
            if not name and fips in counties_map:
                r = {**r, "county_name": counties_map[fips]}
            county_out.append(r)

    state_rows = read_csv(src / "lender_state_summary.csv")
    act_all = read_csv(src / "lender_activity_by_county.csv")
    act_out: list[dict[str, str]] = []
    for r in act_all:
        r = fill_county(r, counties_map)
        fips = (r.get("county_fips") or "").strip()
        if not (r.get("county_name") or "").strip() or fips not in majors:
            continue
        lei = (r.get("lei") or "").strip()
        if not (r.get("institution_name") or "").strip():
            nm = gleif.get(lei) or (lei_to_map.get(lei) or {}).get("institution_name_hmda")
            if not nm and lei in NE_CURATED_LEI:
                nm = NE_CURATED_LEI[lei]["institution_name_hmda"]
            if nm:
                r = {**r, "institution_name": nm}
        act_out.append(r)

    cand = read_csv(src / "lei_mapping_candidates.csv")
    for r in cand:
        if alias in r and col not in r:
            r[col] = r[alias]

    state_by_lei = {r["lei"]: r for r in state_rows}
    mapping_by_lei: dict[str, dict[str, str]] = {}

    def add_mapping(lei: str, base: dict[str, str], method_prefix: str) -> None:
        st = state_by_lei.get(lei)
        if not st:
            return
        try:
            st_orig = int(float(st.get("total_originations") or 0))
        except ValueError:
            st_orig = 0
        if st_orig <= 0:
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
            col: str(st_orig),
            "florida_originations": base.get("florida_originations") or "0",
            "total_originations": st.get("total_originations") or str(st_orig),
            "priority_match": "high" if st_orig >= 200 else "medium",
            "notes": (
                f"{method_prefix.rstrip('+') or 'curated'} map for {code} activity "
                f"({st_orig} {code} originations); slug={slug}."
            ),
        }
        prev = mapping_by_lei.get(lei)
        if prev and int(float(prev[col] or 0)) >= st_orig and prev.get("our_lender_slug"):
            return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_prior_state_curated_lei+")
    for lei, cur in NE_CURATED_LEI.items():
        add_mapping(lei, cur, "ne_curated+")

    mapping_rows = sorted(
        mapping_by_lei.values(),
        key=lambda r: -int(float(r.get(col) or 0)),
    )

    if county_out:
        write_csv(out / f"county_market_summary{suffix}.csv", county_out, list(county_out[0].keys()))
    if act_out:
        write_csv(out / f"lender_activity_by_county{suffix}.csv", act_out, list(act_out[0].keys()))
    if state_rows:
        write_csv(out / f"lender_state_summary{suffix}.csv", state_rows, list(state_rows[0].keys()))
    if cand:
        for r in cand:
            if col not in r:
                r[col] = r.get(alias) or "0"
        write_csv(out / f"lei_mapping_candidates{suffix}.csv", cand, list(cand[0].keys()))
    if mapping_rows:
        write_csv(out / "lei_to_nmls_mapping.csv", mapping_rows, list(mapping_rows[0].keys()))

    major_named = [
        r
        for r in county_out
        if (r.get("county_fips") or "") in majors and (r.get("county_name") or "").strip()
    ]
    major_named.sort(key=lambda r: -float(r.get("total_originations") or 0))

    md = [
        f"# {cfg['name']} HMDA slice\n\n",
        f"**Source:** `data/hmda/by-state/{code}/` (national 2025 foundation)\n\n",
        f"- County market rows: **{len(county_out)}**\n",
        f"- Lender–county activity (major counties): **{len(act_out)}**\n",
        f"- LEI state summaries: **{len(state_rows)}**\n",
        f"- High-confidence LEI→directory mappings: **{len(mapping_rows)}**\n",
        f"- Major counties with names: **{len(major_named)}**\n\n",
        f"## Top mapped LEIs by {code} originations\n\n",
    ]
    for r in mapping_rows[:20]:
        md.append(
            f"- `{r['our_lender_slug']}` — {r['institution_name_hmda']} "
            f"({r[col]} {code} orig.)\n"
        )
    md.append("\n## Major counties (panel-ready)\n\n")
    for r in major_named:
        md.append(
            f"- **{r.get('county_name')}** (`{r.get('county_fips')}`) — "
            f"{r.get('total_originations')} originations\n"
        )
    md.append(
        "\n## Matching rules\n\n"
        "- Reuse prior product-state curated LEI maps when the LEI has state activity\n"
        "- NE curated: Washington Trust, BankNewport, PRMI, Bangor Savings, Camden National\n"
        "- No fuzzy LEI inventing\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-ri-vt-me-slices.py\n"
        "```\n"
    )
    (out / "README.md").write_text("".join(md), encoding="utf-8")
    print(
        f"Wrote {cfg['name']} → {out} "
        f"mappings={len(mapping_rows)} counties={len(county_out)} "
        f"activity={len(act_out)} majors={len(major_named)}"
    )


def main() -> None:
    lei_to_map = load_lei_maps()
    gleif: dict[str, str] = {}
    if GLEIF_CACHE.exists():
        gleif = json.loads(GLEIF_CACHE.read_text(encoding="utf-8"))
    for lei, cur in NE_CURATED_LEI.items():
        gleif.setdefault(lei, cur["institution_name_hmda"])

    for cfg in STATES:
        build_state(cfg, lei_to_map, gleif)


if __name__ == "__main__":
    main()
