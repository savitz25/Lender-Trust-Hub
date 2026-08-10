#!/usr/bin/env python3
"""
Build Georgia HMDA product slice from multi-state cleaned tables + FL LEI mappings.

  python scripts/build-hmda-georgia-slice.py

Does not invent metrics — filters cleaned HMDA and reuses high-confidence LEI→slug maps.
"""
from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLEAN = ROOT / "data" / "hmda" / "cleaned"
FL_MAP = ROOT / "data" / "hmda" / "florida" / "lei_to_nmls_mapping.csv"
OUT = ROOT / "data" / "hmda" / "georgia"

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

# Major Georgia markets for county intelligence (FIPS → name)
GA_MAJOR_COUNTIES = {
    "13121": "Fulton",  # Atlanta
    "13135": "Gwinnett",
    "13067": "Cobb",
    "13089": "DeKalb",
    "13057": "Cherokee",
    "13117": "Forsyth",
    "13051": "Chatham",  # Savannah
    "13151": "Henry",
    "13223": "Paulding",
    "13139": "Hall",  # Gainesville
    "13153": "Houston",  # Warner Robins
    "13063": "Clayton",
    "13073": "Columbia",  # Augusta area
    "13077": "Coweta",
    "13245": "Richmond",  # Augusta
    "13215": "Muscogee",  # Columbus
    "13097": "Douglas",
    "13015": "Bartow",
    "13157": "Jackson",
    "13113": "Fayette",
    "13045": "Carroll",
    "13013": "Barrow",
    "13021": "Bibb",  # Macon
    "13217": "Newton",
    "13297": "Walton",
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

    county_all = read_csv(CLEAN / "county_market_summary.csv")
    county_ga: list[dict[str, str]] = []
    for r in county_all:
        if r.get("state") != "GA":
            continue
        fips = (r.get("county_fips") or "").strip()
        if not (r.get("county_name") or "").strip() and fips in GA_MAJOR_COUNTIES:
            r = {**r, "county_name": GA_MAJOR_COUNTIES[fips]}
        try:
            orig = float(r.get("total_originations") or 0)
        except ValueError:
            orig = 0
        name = (r.get("county_name") or "").strip()
        if name or orig >= 3000:
            if not name and fips in GA_MAJOR_COUNTIES:
                r = {**r, "county_name": GA_MAJOR_COUNTIES[fips]}
            county_ga.append(r)

    state_all = read_csv(CLEAN / "lender_state_summary.csv")
    state_ga = [r for r in state_all if r.get("state") == "GA"]

    act_all = read_csv(CLEAN / "lender_activity_by_county.csv")
    act_ga: list[dict[str, str]] = []
    for r in act_all:
        if r.get("state") != "GA":
            continue
        fips = (r.get("county_fips") or "").strip()
        if not (r.get("county_name") or "").strip() and fips in GA_MAJOR_COUNTIES:
            r = {**r, "county_name": GA_MAJOR_COUNTIES[fips]}
        name = (r.get("county_name") or "").strip()
        if name and fips in GA_MAJOR_COUNTIES:
            act_ga.append(r)

    cand_all = read_csv(CLEAN / "lei_mapping_candidates.csv")
    ga_leis = {r["lei"] for r in state_ga}
    cand_ga = [r for r in cand_all if r.get("lei") in ga_leis]

    state_by_lei = {r["lei"]: r for r in state_ga}
    mapping_rows: list[dict[str, str]] = []
    for lei, fl in lei_to_map.items():
        st = state_by_lei.get(lei)
        if not st:
            continue
        try:
            ga_orig = int(float(st.get("total_originations") or 0))
        except ValueError:
            ga_orig = 0
        if ga_orig <= 0:
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
                "georgia_originations": str(ga_orig),
                "florida_originations": fl.get("florida_originations") or "0",
                "total_originations": st.get("total_originations") or str(ga_orig),
                "priority_match": "high" if ga_orig >= 400 else "medium",
                "notes": f"Reused FL LEI→slug map for GA activity ({ga_orig} GA originations); slug={slug}.",
            }
        )

    mapping_rows.sort(key=lambda r: -int(float(r["georgia_originations"] or 0)))

    if county_ga:
        write_csv(OUT / "county_market_summary_ga.csv", county_ga, list(county_ga[0].keys()))
    if act_ga:
        write_csv(OUT / "lender_activity_by_county_ga.csv", act_ga, list(act_ga[0].keys()))
    if state_ga:
        write_csv(OUT / "lender_state_summary_ga.csv", state_ga, list(state_ga[0].keys()))
    if cand_ga:
        write_csv(OUT / "lei_mapping_candidates_ga.csv", cand_ga, list(cand_ga[0].keys()))
    if mapping_rows:
        write_csv(OUT / "lei_to_nmls_mapping.csv", mapping_rows, list(mapping_rows[0].keys()))

    major_named = [
        r
        for r in county_ga
        if (r.get("county_fips") or "") in GA_MAJOR_COUNTIES
        and (r.get("county_name") or "").strip()
    ]
    major_named.sort(key=lambda r: -float(r.get("total_originations") or 0))

    md = [
        "# Georgia HMDA slice\n",
        f"- County market rows: **{len(county_ga)}**\n",
        f"- Lender–county activity (major counties): **{len(act_ga)}**\n",
        f"- LEI state summaries: **{len(state_ga)}**\n",
        f"- High-confidence LEI→directory mappings: **{len(mapping_rows)}**\n",
        f"- Major counties with names: **{len(major_named)}**\n\n",
        "## Top mapped LEIs by GA originations\n\n",
    ]
    for r in mapping_rows[:20]:
        md.append(
            f"- `{r['our_lender_slug']}` — {r['institution_name_hmda']} "
            f"({r['georgia_originations']} GA orig.)\n"
        )
    md.append("\n## Major counties (panel-ready)\n\n")
    for r in major_named[:25]:
        md.append(
            f"- **{r.get('county_name')}** (`{r.get('county_fips')}`) — "
            f"{r.get('total_originations')} originations\n"
        )
    (OUT / "README.md").write_text("".join(md), encoding="utf-8")

    print(f"Wrote Georgia slice → {OUT}")
    print(f"  mappings={len(mapping_rows)} counties={len(county_ga)} activity={len(act_ga)}")


if __name__ == "__main__":
    main()
