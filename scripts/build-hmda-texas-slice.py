#!/usr/bin/env python3
"""
Build Texas HMDA product slice from multi-state cleaned tables + FL LEI mappings.

  python scripts/build-hmda-texas-slice.py

Does not invent metrics — filters cleaned HMDA and reuses high-confidence LEI→slug maps.
"""
from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLEAN = ROOT / "data" / "hmda" / "cleaned"
FL_MAP = ROOT / "data" / "hmda" / "florida" / "lei_to_nmls_mapping.csv"
OUT = ROOT / "data" / "hmda" / "texas"

# Prefer company-level directory slugs over geo branch rows when NMLS is known.
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
}

# Major Texas markets for county intelligence panels (FIPS → name)
TX_MAJOR_COUNTIES = {
    "48201": "Harris",  # Houston
    "48113": "Dallas",
    "48439": "Tarrant",  # Fort Worth
    "48029": "Bexar",  # San Antonio
    "48085": "Collin",  # Plano / McKinney
    "48453": "Travis",  # Austin
    "48121": "Denton",
    "48339": "Montgomery",  # The Woodlands area
    "48157": "Fort Bend",
    "48491": "Williamson",  # North Austin
    "48141": "El Paso",
    "48027": "Bell",  # Temple / Killeen
    "48215": "Hidalgo",  # McAllen
    "48039": "Brazoria",
    "48167": "Galveston",
    "48209": "Hays",
    "48303": "Lubbock",
    "48139": "Ellis",
    "48257": "Kaufman",
    "48355": "Nueces",  # Corpus Christi
    "48041": "Brazos",  # College Station
    "48061": "Cameron",  # Brownsville
    "48423": "Smith",  # Tyler
    "48479": "Webb",  # Laredo
    "48367": "Parker",
    "48291": "Liberty",
    "48091": "Comal",
    "48135": "Ector",  # Odessa
    "48329": "Midland",
    "48441": "Taylor",  # Abilene
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


def main() -> None:
    fl_maps = read_csv(FL_MAP)
    lei_to_map: dict[str, dict[str, str]] = {}
    for r in fl_maps:
        lei = (r.get("lei") or "").strip()
        if not lei or not (r.get("our_lender_slug") or "").strip():
            continue
        # Prefer higher florida_originations if duplicate LEI
        prev = lei_to_map.get(lei)
        if prev:
            try:
                if float(r.get("florida_originations") or 0) <= float(
                    prev.get("florida_originations") or 0
                ):
                    continue
            except ValueError:
                pass
        lei_to_map[lei] = r

    # County markets TX
    county_all = read_csv(CLEAN / "county_market_summary.csv")
    county_tx = []
    for r in county_all:
        if r.get("state") != "TX":
            continue
        fips = (r.get("county_fips") or "").strip()
        if not r.get("county_name") and fips in TX_MAJOR_COUNTIES:
            r = {**r, "county_name": TX_MAJOR_COUNTIES[fips]}
        elif not r.get("county_name") and fips:
            # leave blank only if unknown — skip unnamed for product slice quality
            pass
        county_tx.append(r)

    # Prefer named counties; keep unnamed only if high volume
    county_tx_named = []
    for r in county_tx:
        name = (r.get("county_name") or "").strip()
        fips = (r.get("county_fips") or "").strip()
        if not name and fips in TX_MAJOR_COUNTIES:
            r = {**r, "county_name": TX_MAJOR_COUNTIES[fips]}
            name = r["county_name"]
        try:
            orig = float(r.get("total_originations") or 0)
        except ValueError:
            orig = 0
        if name or orig >= 5000:
            if not name and fips in TX_MAJOR_COUNTIES:
                r["county_name"] = TX_MAJOR_COUNTIES[fips]
            county_tx_named.append(r)

    # Lender state summary TX
    state_all = read_csv(CLEAN / "lender_state_summary.csv")
    state_tx = [r for r in state_all if r.get("state") == "TX"]

    # Activity by county TX — attach names
    act_all = read_csv(CLEAN / "lender_activity_by_county.csv")
    act_tx = []
    for r in act_all:
        if r.get("state") != "TX":
            continue
        fips = (r.get("county_fips") or "").strip()
        if not (r.get("county_name") or "").strip() and fips in TX_MAJOR_COUNTIES:
            r = {**r, "county_name": TX_MAJOR_COUNTIES[fips]}
        # Only keep activity in named major markets for panel size / clarity
        name = (r.get("county_name") or "").strip()
        if name and fips in TX_MAJOR_COUNTIES:
            act_tx.append(r)

    # LEI mapping candidates TX (from cleaned) for reference
    cand_all = read_csv(CLEAN / "lei_mapping_candidates.csv")
    # candidates file may not have state — skip or filter via state_tx leis
    tx_leis = {r["lei"] for r in state_tx}
    cand_tx = [r for r in cand_all if r.get("lei") in tx_leis]

    # Build lei_to_nmls_mapping for TX: high-confidence reuse of FL maps for LEIs active in TX
    state_by_lei = {r["lei"]: r for r in state_tx}
    mapping_rows = []
    for lei, fl in lei_to_map.items():
        st = state_by_lei.get(lei)
        if not st:
            continue
        try:
            tx_orig = int(float(st.get("total_originations") or 0))
        except ValueError:
            tx_orig = 0
        if tx_orig <= 0:
            continue
        nmls = (fl.get("nmls_id") or "").strip()
        slug = NATIONAL_SLUG_BY_NMLS.get(nmls) or (fl.get("our_lender_slug") or "").strip()
        if not slug:
            continue
        mapping_rows.append(
            {
                "lei": lei,
                "institution_name_hmda": fl.get("institution_name_hmda")
                or fl.get("legal_name")
                or st.get("institution_name")
                or "",
                "nmls_id": nmls,
                "our_lender_slug": slug,
                "legal_name": fl.get("legal_name") or "",
                "match_confidence": fl.get("match_confidence") or "high",
                "match_method": "reuse_fl_curated_lei+"
                + (fl.get("match_method") or "curated"),
                "texas_originations": str(tx_orig),
                "florida_originations": fl.get("florida_originations") or "0",
                "total_originations": st.get("total_originations") or str(tx_orig),
                "priority_match": "high" if tx_orig >= 500 else "medium",
                "notes": f"Reused FL LEI→slug map for TX activity ({tx_orig} TX originations); slug={slug}.",
            }
        )

    mapping_rows.sort(key=lambda r: -int(float(r["texas_originations"] or 0)))

    # Write outputs
    if county_tx_named:
        write_csv(OUT / "county_market_summary_tx.csv", county_tx_named, list(county_tx_named[0].keys()))
    if act_tx:
        write_csv(OUT / "lender_activity_by_county_tx.csv", act_tx, list(act_tx[0].keys()))
    if state_tx:
        write_csv(OUT / "lender_state_summary_tx.csv", state_tx, list(state_tx[0].keys()))
    if cand_tx:
        write_csv(OUT / "lei_mapping_candidates_tx.csv", cand_tx, list(cand_tx[0].keys()))
    if mapping_rows:
        write_csv(
            OUT / "lei_to_nmls_mapping.csv",
            mapping_rows,
            list(mapping_rows[0].keys()),
        )

    # Summary markdown
    major_named = [
        r
        for r in county_tx_named
        if (r.get("county_fips") or "") in TX_MAJOR_COUNTIES
        and (r.get("county_name") or "").strip()
    ]
    major_named.sort(key=lambda r: -float(r.get("total_originations") or 0))

    md = []
    md.append("# Texas HMDA slice\n")
    md.append(f"- County market rows: **{len(county_tx_named)}**\n")
    md.append(f"- Lender–county activity (major counties): **{len(act_tx)}**\n")
    md.append(f"- LEI state summaries: **{len(state_tx)}**\n")
    md.append(f"- High-confidence LEI→directory mappings: **{len(mapping_rows)}**\n")
    md.append(f"- Major counties with names: **{len(major_named)}**\n\n")
    md.append("## Top mapped LEIs by TX originations\n\n")
    for r in mapping_rows[:20]:
        md.append(
            f"- `{r['our_lender_slug']}` — {r['institution_name_hmda']} "
            f"({r['texas_originations']} TX orig.)\n"
        )
    md.append("\n## Major counties (panel-ready)\n\n")
    for r in major_named[:25]:
        md.append(
            f"- **{r.get('county_name')}** (`{r.get('county_fips')}`) — "
            f"{r.get('total_originations')} originations\n"
        )
    (OUT / "README.md").write_text("".join(md), encoding="utf-8")

    print(f"Wrote Texas slice → {OUT}")
    print(f"  mappings={len(mapping_rows)} counties={len(county_tx_named)} activity={len(act_tx)}")


if __name__ == "__main__":
    main()
