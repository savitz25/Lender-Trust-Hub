#!/usr/bin/env python3
"""
Build Georgia HMDA product slice from multi-state cleaned tables + curated LEI maps.

  python scripts/build-hmda-georgia-slice.py

Does not invent metrics — filters cleaned HMDA and reuses high-confidence LEI→slug maps.
Deepen pass: more major counties + GA-curated LEIs that already have directory slugs.
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLEAN = ROOT / "data" / "hmda" / "cleaned"
FL_MAP = ROOT / "data" / "hmda" / "florida" / "lei_to_nmls_mapping.csv"
TX_MAP = ROOT / "data" / "hmda" / "texas" / "lei_to_nmls_mapping.csv"
GLEIF_CACHE = ROOT / "data" / "hmda" / "florida" / "_gleif_name_cache.json"
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
    "2250": "carrington-mortgage",
    "1904": "union-home-mortgage-reeves-team",  # company UHM → GA team listing
    "17022": "planet-home-lending",
    "1025894": "mutual-of-omaha-mortgage",
    "1027871": "zillow-home-loans",
    "480004": "synovus-bank",
    "179119": "synovus-bank",
}

# High-confidence GA-active LEIs not always present in FL map (GLEIF name + public NMLS).
# Do not add fuzzy / low-confidence rows.
GA_CURATED_LEI: dict[str, dict[str, str]] = {
    "DX0JX77PRMOELF7VG772": {
        "institution_name_hmda": "Synovus Bank",
        "nmls_id": "480004",
        "our_lender_slug": "synovus-bank",
        "legal_name": "Synovus Bank",
        "match_confidence": "high",
        "match_method": "ga_curated_gleif+public_nmls",
    },
    "549300RPOGWJRH63HS39": {
        "institution_name_hmda": "UNION HOME MORTGAGE CORP.",
        "nmls_id": "1904",
        "our_lender_slug": "union-home-mortgage-reeves-team",
        "legal_name": "Union Home Mortgage Corp.",
        "match_confidence": "high",
        "match_method": "ga_curated_gleif+company_nmls+ga_directory",
    },
    "54930021WPEXNHYZUL09": {
        "institution_name_hmda": "PLANET HOME LENDING, LLC",
        "nmls_id": "17022",
        "our_lender_slug": "planet-home-lending",
        "legal_name": "Planet Home Lending, LLC",
        "match_confidence": "high",
        "match_method": "ga_curated_gleif+public_nmls",
    },
    "549300OPCWU6E72WUT29": {
        "institution_name_hmda": "MUTUAL OF OMAHA MORTGAGE, INC.",
        "nmls_id": "1025894",
        "our_lender_slug": "mutual-of-omaha-mortgage",
        "legal_name": "Mutual of Omaha Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "ga_curated_gleif+public_nmls",
    },
    "549300370QILXLFUWD20": {
        "institution_name_hmda": "ZILLOW HOME LOANS, LLC",
        "nmls_id": "1027871",
        "our_lender_slug": "zillow-home-loans",
        "legal_name": "Zillow Home Loans, LLC",
        "match_confidence": "high",
        "match_method": "ga_curated_gleif+public_nmls",
    },
    # Alternate LEIs for companies already mapped via FL (same company NMLS → national slug)
    "254900HA4DQWAE0W3342": {
        "institution_name_hmda": "AMERIHOME MORTGAGE COMPANY, LLC",
        "nmls_id": "1120271",
        "our_lender_slug": "amerihome-mortgage",
        "legal_name": "AmeriHome Mortgage Company, LLC",
        "match_confidence": "high",
        "match_method": "ga_curated_alt_lei+company_nmls",
    },
    "549300R9S3MVDV4MGF56": {
        "institution_name_hmda": "CARRINGTON MORTGAGE SERVICES, LLC",
        "nmls_id": "2250",
        "our_lender_slug": "carrington-mortgage",
        "legal_name": "Carrington Mortgage Services, LLC",
        "match_confidence": "high",
        "match_method": "ga_curated_alt_lei+company_nmls",
    },
}

# Major Georgia markets for county intelligence (FIPS → name)
# Deepen: metro-adjacent + secondary metros with meaningful volume
GA_MAJOR_COUNTIES = {
    # Core metro Atlanta
    "13121": "Fulton",
    "13135": "Gwinnett",
    "13067": "Cobb",
    "13089": "DeKalb",
    "13057": "Cherokee",
    "13117": "Forsyth",
    "13151": "Henry",
    "13223": "Paulding",
    "13063": "Clayton",
    "13097": "Douglas",
    "13077": "Coweta",
    "13113": "Fayette",
    "13015": "Bartow",
    "13157": "Jackson",
    "13045": "Carroll",
    "13013": "Barrow",
    "13217": "Newton",
    "13297": "Walton",
    "13247": "Rockdale",
    # Coastal / Savannah / Brunswick
    "13051": "Chatham",
    "13103": "Effingham",
    "13029": "Bryan",
    "13127": "Glynn",
    # North / NE Georgia
    "13139": "Hall",
    "13059": "Clarke",
    "13047": "Catoosa",
    "13313": "Whitfield",
    "13115": "Floyd",
    # Middle Georgia / military
    "13153": "Houston",
    "13073": "Columbia",
    "13245": "Richmond",
    "13215": "Muscogee",
    "13021": "Bibb",
    "13255": "Spalding",
    # South Georgia
    "13185": "Lowndes",
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
    """FL + TX curated maps (prefer higher FL/TX originations when duplicate LEI)."""
    lei_to_map: dict[str, dict[str, str]] = {}

    def ingest(path: Path, vol_key: str) -> None:
        if not path.exists():
            return
        for r in read_csv(path):
            lei = (r.get("lei") or "").strip()
            if not lei or not (r.get("our_lender_slug") or "").strip():
                continue
            prev = lei_to_map.get(lei)
            try:
                vol = float(r.get(vol_key) or r.get("florida_originations") or r.get("texas_originations") or 0)
            except ValueError:
                vol = 0.0
            if prev:
                try:
                    prev_vol = float(
                        prev.get("florida_originations")
                        or prev.get("texas_originations")
                        or prev.get("_vol")
                        or 0
                    )
                except ValueError:
                    prev_vol = 0.0
                if vol <= prev_vol:
                    continue
            row = dict(r)
            row["_vol"] = str(vol)
            lei_to_map[lei] = row

    ingest(FL_MAP, "florida_originations")
    ingest(TX_MAP, "texas_originations")
    return lei_to_map


def main() -> None:
    lei_to_map = load_lei_maps()
    gleif: dict[str, str] = {}
    if GLEIF_CACHE.exists():
        gleif = json.loads(GLEIF_CACHE.read_text(encoding="utf-8"))

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
        # Keep named majors + any high-volume unnamed for analytics, but only majors get activity filter
        if name or orig >= 2500 or fips in GA_MAJOR_COUNTIES:
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
            # Enrich empty institution names from GLEIF / curated maps when available
            lei = (r.get("lei") or "").strip()
            if not (r.get("institution_name") or "").strip():
                nm = gleif.get(lei) or (lei_to_map.get(lei) or {}).get("institution_name_hmda")
                if not nm and lei in GA_CURATED_LEI:
                    nm = GA_CURATED_LEI[lei]["institution_name_hmda"]
                if nm:
                    r = {**r, "institution_name": nm}
            act_ga.append(r)

    cand_all = read_csv(CLEAN / "lei_mapping_candidates.csv")
    ga_leis = {r["lei"] for r in state_ga}
    cand_ga = [r for r in cand_all if r.get("lei") in ga_leis]

    state_by_lei = {r["lei"]: r for r in state_ga}
    mapping_by_lei: dict[str, dict[str, str]] = {}

    def add_mapping(lei: str, base: dict[str, str], method_prefix: str) -> None:
        st = state_by_lei.get(lei)
        if not st:
            return
        try:
            ga_orig = int(float(st.get("total_originations") or 0))
        except ValueError:
            ga_orig = 0
        if ga_orig <= 0:
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
            "georgia_originations": str(ga_orig),
            "florida_originations": base.get("florida_originations") or "0",
            "total_originations": st.get("total_originations") or str(ga_orig),
            "priority_match": "high" if ga_orig >= 400 else "medium",
            "notes": f"{method_prefix.rstrip('+')} map for GA activity ({ga_orig} GA originations); slug={slug}.",
        }
        prev = mapping_by_lei.get(lei)
        if prev and int(prev["georgia_originations"]) >= ga_orig and prev.get("our_lender_slug"):
            return
        mapping_by_lei[lei] = row

    for lei, fl in lei_to_map.items():
        add_mapping(lei, fl, "reuse_fl_tx_curated_lei+")

    for lei, cur in GA_CURATED_LEI.items():
        add_mapping(lei, cur, "")

    mapping_rows = sorted(
        mapping_by_lei.values(),
        key=lambda r: -int(float(r["georgia_originations"] or 0)),
    )

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
    for r in mapping_rows[:25]:
        md.append(
            f"- `{r['our_lender_slug']}` — {r['institution_name_hmda']} "
            f"({r['georgia_originations']} GA orig.)\n"
        )
    md.append("\n## Major counties (panel-ready)\n\n")
    for r in major_named:
        md.append(
            f"- **{r.get('county_name')}** (`{r.get('county_fips')}`) — "
            f"{r.get('total_originations')} originations\n"
        )
    md.append(
        "\n## Matching rules\n\n"
        "- Reuse FL/TX curated LEI maps when the LEI has GA activity\n"
        "- GA-curated LEIs only when GLEIF/legal name + public NMLS are high-confidence\n"
        "- No fuzzy LEI inventing\n"
    )
    (OUT / "README.md").write_text("".join(md), encoding="utf-8")

    print(f"Wrote Georgia slice → {OUT}")
    print(f"  mappings={len(mapping_rows)} counties={len(county_ga)} activity={len(act_ga)}")
    print(f"  major_named={len(major_named)}")


if __name__ == "__main__":
    main()
