#!/usr/bin/env python3
"""
Build New Jersey HMDA product slice from multi-state cleaned tables + curated LEI maps.

  python scripts/build-hmda-new-jersey-slice.py

Reuses high-confidence FL / TX / GA / CA / NC / SC LEI→slug maps. Precision over coverage.
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLEAN = ROOT / "data" / "hmda" / "cleaned"
FL_MAP = ROOT / "data" / "hmda" / "florida" / "lei_to_nmls_mapping.csv"
TX_MAP = ROOT / "data" / "hmda" / "texas" / "lei_to_nmls_mapping.csv"
GA_MAP = ROOT / "data" / "hmda" / "georgia" / "lei_to_nmls_mapping.csv"
CA_MAP = ROOT / "data" / "hmda" / "california" / "lei_to_nmls_mapping.csv"
NC_MAP = ROOT / "data" / "hmda" / "north-carolina" / "lei_to_nmls_mapping.csv"
SC_MAP = ROOT / "data" / "hmda" / "south-carolina" / "lei_to_nmls_mapping.csv"
GLEIF_CACHE = ROOT / "data" / "hmda" / "florida" / "_gleif_name_cache.json"
OUT = ROOT / "data" / "hmda" / "new-jersey"

# Prefer company-level directory slugs when NMLS is known (NJ hosts when available).
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
    "6606": "new-american-funding-marlton-wayne",  # NJ directory host
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
    "39179": "movement-mortgage-charlotte",
    "3274": "guild-mortgage-nj-suburbs",  # NJ directory host
    "3029": "crosscountry-mortgage-nj-wayne-marlton",  # NJ directory host
    "1904": "union-home-mortgage-myrtle-beach",
    "1921": "primelending-greenville",
    "405455": "ameris-bank",
    "405461": "southstate-bank",
    "3277": "sun-west-mortgage",
    "237341": "american-financial-network",
    "3925": "kind-lending",
    "167441": "amwest-funding",
    "480004": "synovus-bank",
    "1561": "silverton-mortgage-wayne-nj",  # Vanderbilt dba Silverton — NJ host
    "72043": "atlantic-bay-mortgage-charleston",
    "7233": "gateway-mortgage-myrtle-beach",
    "503941": "first-citizens-bank",
    "1124061": "lower",
    "1127": "nvr-mortgage",
    "86548": "first-heritage-mortgage",
    "1043": "new-day-financial",
    "421841": "united-community-bank",
    "754127": "southern-first-bank",
    "1598647": "guaranteed-rate-affinity",
}

# High-confidence NJ-active LEIs only when GLEIF name + public NMLS + directory slug are solid.
# Do not invent low-confidence matches.
NJ_CURATED_LEI: dict[str, dict[str, str]] = {}

# Major New Jersey markets (FIPS → name) — high-volume North/Central/South Jersey
NJ_MAJOR_COUNTIES = {
    "34029": "Ocean",  # top volume in extract
    "34003": "Bergen",
    "34025": "Monmouth",
    "34023": "Middlesex",
    "34005": "Burlington",
    "34007": "Camden",
    "34013": "Essex",
    "34027": "Morris",
    "34039": "Union",
    "34015": "Gloucester",
    "34021": "Mercer",
    "34017": "Hudson",
    "34031": "Passaic",
    "34035": "Somerset",
    "34001": "Atlantic",
    "34009": "Cape May",
    "34037": "Sussex",
    "34019": "Hunterdon",
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
    """FL + TX + GA + CA + NC + SC curated maps."""
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

    ingest(FL_MAP, ["florida_originations", "total_originations"])
    ingest(TX_MAP, ["texas_originations", "total_originations"])
    ingest(GA_MAP, ["georgia_originations", "total_originations"])
    ingest(CA_MAP, ["california_originations", "total_originations"])
    ingest(NC_MAP, ["north_carolina_originations", "total_originations"])
    ingest(SC_MAP, ["south_carolina_originations", "total_originations"])
    return lei_to_map


def main() -> None:
    lei_to_map = load_lei_maps()
    gleif: dict[str, str] = {}
    if GLEIF_CACHE.exists():
        gleif = json.loads(GLEIF_CACHE.read_text(encoding="utf-8"))

    county_all = read_csv(CLEAN / "county_market_summary.csv")
    county_nj: list[dict[str, str]] = []
    for r in county_all:
        if r.get("state") != "NJ":
            continue
        fips = (r.get("county_fips") or "").strip()
        if not (r.get("county_name") or "").strip() and fips in NJ_MAJOR_COUNTIES:
            r = {**r, "county_name": NJ_MAJOR_COUNTIES[fips]}
        try:
            orig = float(r.get("total_originations") or 0)
        except ValueError:
            orig = 0
        name = (r.get("county_name") or "").strip()
        if name or orig >= 1500 or fips in NJ_MAJOR_COUNTIES:
            if not name and fips in NJ_MAJOR_COUNTIES:
                r = {**r, "county_name": NJ_MAJOR_COUNTIES[fips]}
            county_nj.append(r)

    state_all = read_csv(CLEAN / "lender_state_summary.csv")
    state_nj = [r for r in state_all if r.get("state") == "NJ"]

    act_all = read_csv(CLEAN / "lender_activity_by_county.csv")
    act_nj: list[dict[str, str]] = []
    for r in act_all:
        if r.get("state") != "NJ":
            continue
        fips = (r.get("county_fips") or "").strip()
        if not (r.get("county_name") or "").strip() and fips in NJ_MAJOR_COUNTIES:
            r = {**r, "county_name": NJ_MAJOR_COUNTIES[fips]}
        name = (r.get("county_name") or "").strip()
        if name and fips in NJ_MAJOR_COUNTIES:
            lei = (r.get("lei") or "").strip()
            if not (r.get("institution_name") or "").strip():
                nm = gleif.get(lei) or (lei_to_map.get(lei) or {}).get("institution_name_hmda")
                if not nm and lei in NJ_CURATED_LEI:
                    nm = NJ_CURATED_LEI[lei]["institution_name_hmda"]
                if nm:
                    r = {**r, "institution_name": nm}
            act_nj.append(r)

    cand_all = read_csv(CLEAN / "lei_mapping_candidates.csv")
    nj_leis = {r["lei"] for r in state_nj}
    cand_nj = [r for r in cand_all if r.get("lei") in nj_leis]

    state_by_lei = {r["lei"]: r for r in state_nj}
    mapping_by_lei: dict[str, dict[str, str]] = {}

    def add_mapping(lei: str, base: dict[str, str], method_prefix: str) -> None:
        st = state_by_lei.get(lei)
        if not st:
            return
        try:
            nj_orig = int(float(st.get("total_originations") or 0))
        except ValueError:
            nj_orig = 0
        if nj_orig <= 0:
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
            "new_jersey_originations": str(nj_orig),
            "florida_originations": base.get("florida_originations") or "0",
            "total_originations": st.get("total_originations") or str(nj_orig),
            "priority_match": "high" if nj_orig >= 400 else "medium",
            "notes": (
                f"{method_prefix.rstrip('+') or 'curated'} map for NJ activity "
                f"({nj_orig} NJ originations); slug={slug}."
            ),
        }
        prev = mapping_by_lei.get(lei)
        if prev and int(prev["new_jersey_originations"]) >= nj_orig and prev.get(
            "our_lender_slug"
        ):
            return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_fl_tx_ga_ca_nc_sc_curated_lei+")

    for lei, cur in NJ_CURATED_LEI.items():
        add_mapping(lei, cur, "nj_curated+")

    mapping_rows = sorted(
        mapping_by_lei.values(),
        key=lambda r: -int(float(r["new_jersey_originations"] or 0)),
    )

    if county_nj:
        write_csv(OUT / "county_market_summary_nj.csv", county_nj, list(county_nj[0].keys()))
    if act_nj:
        write_csv(OUT / "lender_activity_by_county_nj.csv", act_nj, list(act_nj[0].keys()))
    if state_nj:
        write_csv(OUT / "lender_state_summary_nj.csv", state_nj, list(state_nj[0].keys()))
    if cand_nj:
        write_csv(OUT / "lei_mapping_candidates_nj.csv", cand_nj, list(cand_nj[0].keys()))
    if mapping_rows:
        write_csv(OUT / "lei_to_nmls_mapping.csv", mapping_rows, list(mapping_rows[0].keys()))

    major_named = [
        r
        for r in county_nj
        if (r.get("county_fips") or "") in NJ_MAJOR_COUNTIES
        and (r.get("county_name") or "").strip()
    ]
    major_named.sort(key=lambda r: -float(r.get("total_originations") or 0))

    md = [
        "# New Jersey HMDA slice\n",
        f"- County market rows: **{len(county_nj)}**\n",
        f"- Lender–county activity (major counties): **{len(act_nj)}**\n",
        f"- LEI state summaries: **{len(state_nj)}**\n",
        f"- High-confidence LEI→directory mappings: **{len(mapping_rows)}**\n",
        f"- Major counties with names: **{len(major_named)}**\n\n",
        "## Top mapped LEIs by NJ originations\n\n",
    ]
    for r in mapping_rows[:25]:
        md.append(
            f"- `{r['our_lender_slug']}` — {r['institution_name_hmda']} "
            f"({r['new_jersey_originations']} NJ orig.)\n"
        )
    md.append("\n## Major counties (panel-ready)\n\n")
    for r in major_named:
        md.append(
            f"- **{r.get('county_name')}** (`{r.get('county_fips')}`) — "
            f"{r.get('total_originations')} originations\n"
        )
    md.append(
        "\n## Matching rules\n\n"
        "- Reuse FL / TX / GA / CA / NC / SC curated LEI maps when the LEI has NJ activity\n"
        "- National NMLS→slug overrides prefer company-level / NJ directory hosts\n"
        "- No fuzzy LEI inventing\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-new-jersey-slice.py\n"
        "```\n"
    )
    (OUT / "README.md").write_text("".join(md), encoding="utf-8")

    print(f"Wrote New Jersey slice → {OUT}")
    print(f"  mappings={len(mapping_rows)} counties={len(county_nj)} activity={len(act_nj)}")
    print(f"  major_named={len(major_named)}")


if __name__ == "__main__":
    main()
