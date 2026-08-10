#!/usr/bin/env python3
"""
Build North Carolina HMDA product slice from multi-state cleaned tables + curated LEI maps.

  python scripts/build-hmda-north-carolina-slice.py

Reuses high-confidence FL / TX / GA / CA LEI→slug maps. Precision over coverage.
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
GLEIF_CACHE = ROOT / "data" / "hmda" / "florida" / "_gleif_name_cache.json"
OUT = ROOT / "data" / "hmda" / "north-carolina"

# Prefer company-level directory slugs when NMLS is known.
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
    "39179": "movement-mortgage-charlotte",
    "3274": "guild-mortgage-charlotte",
    "3029": "crosscountry-mortgage-charlotte",
}

# No low-confidence inventing — empty unless we have verified NC-only LEIs later.
NC_CURATED_LEI: dict[str, dict[str, str]] = {}

# Major North Carolina markets (FIPS → name)
NC_MAJOR_COUNTIES = {
    "37183": "Wake",  # Raleigh
    "37119": "Mecklenburg",  # Charlotte
    "37081": "Guilford",  # Greensboro
    "37067": "Forsyth",  # Winston-Salem
    "37063": "Durham",
    "37051": "Cumberland",  # Fayetteville
    "37179": "Union",
    "37019": "Brunswick",
    "37101": "Johnston",
    "37025": "Cabarrus",
    "37133": "Onslow",  # Jacksonville NC
    "37071": "Gaston",
    "37129": "New Hanover",  # Wilmington
    "37097": "Iredell",
    "37021": "Buncombe",  # Asheville
    "37085": "Harnett",
    "37035": "Catawba",
    "37001": "Alamance",
    "37057": "Davidson",
    "37159": "Rowan",
    "37147": "Pitt",  # Greenville
    "37125": "Moore",
    "37151": "Randolph",
    "37089": "Henderson",
    "37049": "Craven",
    "37109": "Lincoln",
    "37135": "Orange",  # Chapel Hill area
    "37191": "Wayne",
    "37141": "Pender",
    "37069": "Franklin",
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
    """FL + TX + GA + CA curated maps."""
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
    return lei_to_map


def main() -> None:
    lei_to_map = load_lei_maps()
    gleif: dict[str, str] = {}
    if GLEIF_CACHE.exists():
        gleif = json.loads(GLEIF_CACHE.read_text(encoding="utf-8"))

    county_all = read_csv(CLEAN / "county_market_summary.csv")
    county_nc: list[dict[str, str]] = []
    for r in county_all:
        if r.get("state") != "NC":
            continue
        fips = (r.get("county_fips") or "").strip()
        if not (r.get("county_name") or "").strip() and fips in NC_MAJOR_COUNTIES:
            r = {**r, "county_name": NC_MAJOR_COUNTIES[fips]}
        try:
            orig = float(r.get("total_originations") or 0)
        except ValueError:
            orig = 0
        name = (r.get("county_name") or "").strip()
        if name or orig >= 2500 or fips in NC_MAJOR_COUNTIES:
            if not name and fips in NC_MAJOR_COUNTIES:
                r = {**r, "county_name": NC_MAJOR_COUNTIES[fips]}
            county_nc.append(r)

    state_all = read_csv(CLEAN / "lender_state_summary.csv")
    state_nc = [r for r in state_all if r.get("state") == "NC"]

    act_all = read_csv(CLEAN / "lender_activity_by_county.csv")
    act_nc: list[dict[str, str]] = []
    for r in act_all:
        if r.get("state") != "NC":
            continue
        fips = (r.get("county_fips") or "").strip()
        if not (r.get("county_name") or "").strip() and fips in NC_MAJOR_COUNTIES:
            r = {**r, "county_name": NC_MAJOR_COUNTIES[fips]}
        name = (r.get("county_name") or "").strip()
        if name and fips in NC_MAJOR_COUNTIES:
            lei = (r.get("lei") or "").strip()
            if not (r.get("institution_name") or "").strip():
                nm = gleif.get(lei) or (lei_to_map.get(lei) or {}).get("institution_name_hmda")
                if not nm and lei in NC_CURATED_LEI:
                    nm = NC_CURATED_LEI[lei]["institution_name_hmda"]
                if nm:
                    r = {**r, "institution_name": nm}
            act_nc.append(r)

    cand_all = read_csv(CLEAN / "lei_mapping_candidates.csv")
    nc_leis = {r["lei"] for r in state_nc}
    cand_nc = [r for r in cand_all if r.get("lei") in nc_leis]

    state_by_lei = {r["lei"]: r for r in state_nc}
    mapping_by_lei: dict[str, dict[str, str]] = {}

    def add_mapping(lei: str, base: dict[str, str], method_prefix: str) -> None:
        st = state_by_lei.get(lei)
        if not st:
            return
        try:
            nc_orig = int(float(st.get("total_originations") or 0))
        except ValueError:
            nc_orig = 0
        if nc_orig <= 0:
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
            "north_carolina_originations": str(nc_orig),
            "florida_originations": base.get("florida_originations") or "0",
            "total_originations": st.get("total_originations") or str(nc_orig),
            "priority_match": "high" if nc_orig >= 400 else "medium",
            "notes": (
                f"{method_prefix.rstrip('+') or 'curated'} map for NC activity "
                f"({nc_orig} NC originations); slug={slug}."
            ),
        }
        prev = mapping_by_lei.get(lei)
        if prev and int(prev["north_carolina_originations"]) >= nc_orig and prev.get(
            "our_lender_slug"
        ):
            return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_fl_tx_ga_ca_curated_lei+")

    for lei, cur in NC_CURATED_LEI.items():
        add_mapping(lei, cur, "nc_curated+")

    mapping_rows = sorted(
        mapping_by_lei.values(),
        key=lambda r: -int(float(r["north_carolina_originations"] or 0)),
    )

    if county_nc:
        write_csv(OUT / "county_market_summary_nc.csv", county_nc, list(county_nc[0].keys()))
    if act_nc:
        write_csv(OUT / "lender_activity_by_county_nc.csv", act_nc, list(act_nc[0].keys()))
    if state_nc:
        write_csv(OUT / "lender_state_summary_nc.csv", state_nc, list(state_nc[0].keys()))
    if cand_nc:
        write_csv(OUT / "lei_mapping_candidates_nc.csv", cand_nc, list(cand_nc[0].keys()))
    if mapping_rows:
        write_csv(OUT / "lei_to_nmls_mapping.csv", mapping_rows, list(mapping_rows[0].keys()))

    major_named = [
        r
        for r in county_nc
        if (r.get("county_fips") or "") in NC_MAJOR_COUNTIES
        and (r.get("county_name") or "").strip()
    ]
    major_named.sort(key=lambda r: -float(r.get("total_originations") or 0))

    md = [
        "# North Carolina HMDA slice\n",
        f"- County market rows: **{len(county_nc)}**\n",
        f"- Lender–county activity (major counties): **{len(act_nc)}**\n",
        f"- LEI state summaries: **{len(state_nc)}**\n",
        f"- High-confidence LEI→directory mappings: **{len(mapping_rows)}**\n",
        f"- Major counties with names: **{len(major_named)}**\n\n",
        "## Top mapped LEIs by NC originations\n\n",
    ]
    for r in mapping_rows[:25]:
        md.append(
            f"- `{r['our_lender_slug']}` — {r['institution_name_hmda']} "
            f"({r['north_carolina_originations']} NC orig.)\n"
        )
    md.append("\n## Major counties (panel-ready)\n\n")
    for r in major_named:
        md.append(
            f"- **{r.get('county_name')}** (`{r.get('county_fips')}`) — "
            f"{r.get('total_originations')} originations\n"
        )
    md.append(
        "\n## Matching rules\n\n"
        "- Reuse FL / TX / GA / CA curated LEI maps when the LEI has NC activity\n"
        "- National NMLS→slug overrides prefer company-level directory hosts\n"
        "- No fuzzy LEI inventing\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-north-carolina-slice.py\n"
        "```\n"
    )
    (OUT / "README.md").write_text("".join(md), encoding="utf-8")

    print(f"Wrote North Carolina slice → {OUT}")
    print(f"  mappings={len(mapping_rows)} counties={len(county_nc)} activity={len(act_nc)}")
    print(f"  major_named={len(major_named)}")


if __name__ == "__main__":
    main()
