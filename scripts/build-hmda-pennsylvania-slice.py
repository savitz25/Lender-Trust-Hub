#!/usr/bin/env python3
"""
Build Pennsylvania HMDA product slice from multi-state cleaned tables + curated LEI maps.

  python scripts/build-hmda-pennsylvania-slice.py

Reuses high-confidence FL / TX / GA / CA / NC / SC / NJ LEI→slug maps.
Precision over coverage — no low-confidence inventing.
Does not touch New York product folders.
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLEAN = ROOT / "data" / "hmda" / "cleaned"
BY_STATE = ROOT / "data" / "hmda" / "by-state" / "PA"
FL_MAP = ROOT / "data" / "hmda" / "florida" / "lei_to_nmls_mapping.csv"
TX_MAP = ROOT / "data" / "hmda" / "texas" / "lei_to_nmls_mapping.csv"
GA_MAP = ROOT / "data" / "hmda" / "georgia" / "lei_to_nmls_mapping.csv"
CA_MAP = ROOT / "data" / "hmda" / "california" / "lei_to_nmls_mapping.csv"
NC_MAP = ROOT / "data" / "hmda" / "north-carolina" / "lei_to_nmls_mapping.csv"
SC_MAP = ROOT / "data" / "hmda" / "south-carolina" / "lei_to_nmls_mapping.csv"
NJ_MAP = ROOT / "data" / "hmda" / "new-jersey" / "lei_to_nmls_mapping.csv"
NY_MAP = ROOT / "data" / "hmda" / "new-york" / "lei_to_nmls_mapping.csv"
GLEIF_CACHE = ROOT / "data" / "hmda" / "florida" / "_gleif_name_cache.json"
OUT = ROOT / "data" / "hmda" / "pennsylvania"

# Prefer company-level directory slugs when NMLS is known (PA hosts when available).
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
    "446038": "pnc-bank",  # PNC HQ Pittsburgh — critical for PA
    "399801": "wells-fargo-bank",
    "330511": "better-mortgage",
    "181005": "ally-bank",
    "481428": "td-bank",
    "3113": "academy-mortgage",
    "2250": "carrington-mortgage",
    "17022": "planet-home-lending",
    "1025894": "mutual-of-omaha-mortgage",
    "1027871": "zillow-home-loans",
    "433960": "citizens-bank",  # Major PA retail bank
    "402216": "us-bank",
    "399809": "usaa-federal-savings-bank",
    "1121636": "sofi-bank",
    "399797": "flagstar-bank",
    "39179": "movement-mortgage-charlotte",
    # Regional hosts only — bare company slugs do not exist in the directory catalog
    "3274": "guild-mortgage-nj-suburbs",
    "3029": "crosscountry-mortgage-nj-wayne-marlton",
    "1904": "union-home-mortgage-myrtle-beach",
    "1921": "primelending-greenville",
    "405455": "ameris-bank",
    "405461": "southstate-bank",
    "3277": "sun-west-mortgage",
    "237341": "american-financial-network",
    "3925": "kind-lending",
    "167441": "amwest-funding",
    "480004": "synovus-bank",
    "503941": "first-citizens-bank",
    "1124061": "lower",
    "1127": "nvr-mortgage",
    "86548": "first-heritage-mortgage",
    "1043": "new-day-financial",
    "381076": "mt-bank",
    "412915": "citibank",
    "2184": "embrace-home-loans",
    "2893": "nfm-lending",
    "75164": "prosperity-home-mortgage",
    "338923": "anniemac-home-mortgage",
    "411254": "valley-national-bank",
    "399804": "bank-of-america",
    # PA deepen — company NMLS published on official / Zillow company pages
    "485401": "fulton-bank",  # Fulton Bank, N.A.
    "766529": "first-national-bank-of-pennsylvania",  # FNB PA (fnb-online.com)
    "479240": "first-commonwealth-bank",  # First Commonwealth Bank (fcbanking.com)
    "419814": "northwest-bank",  # Northwest Bank, Warren PA
    "402436": "huntington-national-bank",  # Huntington National Bank
    "415882": "univest-bank",  # Univest Bank and Trust Co.
    "417673": "wsfs-bank",  # WSFS Bank
    "800659": "police-fire-federal-credit-union",  # PFFCU (pffcu.org mortgages)
    "128501": "mortgage-america",  # Mortgage America, Inc. (Whitehall)
    "2926": "emm-loans",  # EMM Loans LLC
    "139164": "hma-mortgage",  # Affordable Mortgage Advisors dba HMA
    "433838": "american-heritage-federal-credit-union",  # American Heritage FCU
}

# High-confidence PA-active LEIs only (GLEIF legal name + published company NMLS).
# Do not invent low-confidence matches.
PA_CURATED_LEI: dict[str, dict[str, str]] = {
    "DZC62HF6UIZYJ08V1J90": {
        "institution_name_hmda": "Fulton Bank, National Association",
        "nmls_id": "485401",
        "our_lender_slug": "fulton-bank",
        "legal_name": "Fulton Bank, National Association",
        "match_confidence": "high",
        "match_method": "gleif+public_nmls_zillow_company",
    },
    "N8T7HW55LK5D2ORCKP39": {
        "institution_name_hmda": "First National Bank of Pennsylvania",
        "nmls_id": "766529",
        "our_lender_slug": "first-national-bank-of-pennsylvania",
        "legal_name": "First National Bank of Pennsylvania",
        "match_confidence": "high",
        "match_method": "gleif+fnb_online_nmls",
    },
    "VN1JLT1F3FLLVN3FZG89": {
        "institution_name_hmda": "First Commonwealth Bank",
        "nmls_id": "479240",
        "our_lender_slug": "first-commonwealth-bank",
        "legal_name": "First Commonwealth Bank",
        "match_confidence": "high",
        "match_method": "gleif+fcbanking_nmls",
    },
    "LVR1UQE8OOCO93IHEB52": {
        "institution_name_hmda": "Northwest Bank",
        "nmls_id": "419814",
        "our_lender_slug": "northwest-bank",
        "legal_name": "Northwest Bank",
        "match_confidence": "high",
        "match_method": "gleif+public_nmls_company",
    },
    "2WHM8VNJH63UN14OL754": {
        "institution_name_hmda": "The Huntington National Bank",
        "nmls_id": "402436",
        "our_lender_slug": "huntington-national-bank",
        "legal_name": "The Huntington National Bank",
        "match_confidence": "high",
        "match_method": "gleif+huntington_nmls",
    },
    "549300LBK5BTNFKZJD14": {
        "institution_name_hmda": "Univest Bank and Trust Co.",
        "nmls_id": "415882",
        "our_lender_slug": "univest-bank",
        "legal_name": "Univest Bank and Trust Co.",
        "match_confidence": "high",
        "match_method": "gleif+univest_nmls",
    },
    "5493005DKMV1IHIM8E20": {
        "institution_name_hmda": "Wilmington Savings Fund Society, FSB",
        "nmls_id": "417673",
        "our_lender_slug": "wsfs-bank",
        "legal_name": "Wilmington Savings Fund Society, FSB",
        "match_confidence": "high",
        "match_method": "gleif+wsfs_nmls",
    },
    "54930063XGNMIXS57091": {
        "institution_name_hmda": "POLICE & FIRE FEDERAL CREDIT UNION",
        "nmls_id": "800659",
        "our_lender_slug": "police-fire-federal-credit-union",
        "legal_name": "Police & Fire Federal Credit Union",
        "match_confidence": "high",
        "match_method": "gleif+pffcu_mortgage_nmls",
    },
    "5493000GQ5D5YW5QID32": {
        "institution_name_hmda": "MORTGAGE AMERICA, INC.",
        "nmls_id": "128501",
        "our_lender_slug": "mortgage-america",
        "legal_name": "Mortgage America, Inc.",
        "match_confidence": "high",
        "match_method": "gleif+mortgage_america_nmls",
    },
    "549300EMNDEK4BA8WB53": {
        "institution_name_hmda": "EMM LOANS LLC",
        "nmls_id": "2926",
        "our_lender_slug": "emm-loans",
        "legal_name": "EMM Loans LLC",
        "match_confidence": "high",
        "match_method": "gleif+emm_loans_nmls",
    },
    "549300DE8TS4EYTPX729": {
        "institution_name_hmda": "AFFORDABLE MORTGAGE ADVISORS, LLC",
        "nmls_id": "139164",
        "our_lender_slug": "hma-mortgage",
        "legal_name": "Affordable Mortgage Advisors, LLC dba HMA Mortgage",
        "match_confidence": "high",
        "match_method": "gleif+hma_mortgage_nmls",
    },
    "549300N5GF79IZ5Y7G10": {
        "institution_name_hmda": "AMERICAN HERITAGE FCU",
        "nmls_id": "433838",
        "our_lender_slug": "american-heritage-federal-credit-union",
        "legal_name": "American Heritage Federal Credit Union",
        "match_confidence": "high",
        "match_method": "gleif+ahfcu_nmls",
    },
}

# Major Pennsylvania markets (FIPS → name)
# Wave 1: Philly metro, Pittsburgh, mid-state / Lehigh / NE PA
# Deepen: next-volume SE PA, Pittsburgh ring, central/north counties
PA_MAJOR_COUNTIES = {
    # Wave 1
    "42101": "Philadelphia",
    "42003": "Allegheny",
    "42091": "Montgomery",
    "42017": "Bucks",
    "42045": "Delaware",
    "42071": "Lancaster",
    "42029": "Chester",
    "42133": "York",
    "42011": "Berks",
    "42077": "Lehigh",
    "42095": "Northampton",
    "42043": "Dauphin",
    "42041": "Cumberland",
    "42129": "Westmoreland",
    "42069": "Lackawanna",
    "42079": "Luzerne",
    "42049": "Erie",
    "42019": "Butler",
    "42007": "Beaver",
    "42125": "Washington",
    "42089": "Monroe",
    "42055": "Franklin",
    "42075": "Lebanon",
    "42051": "Fayette",
    "42027": "Centre",
    "42001": "Adams",
    "42021": "Cambria",
    "42081": "Lycoming",
    "42107": "Schuylkill",
    "42085": "Mercer",
    # Deepen — next volume / regional
    "42013": "Blair",
    "42103": "Pike",
    "42025": "Carbon",
    "42073": "Lawrence",
    "42097": "Northumberland",
    "42033": "Clearfield",
    "42127": "Wayne",
    "42111": "Somerset",
    "42039": "Crawford",
    "42063": "Indiana",
    "42037": "Columbia",
    "42005": "Armstrong",
    "42099": "Perry",
    "42009": "Bedford",
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


def source_path(name: str) -> Path:
    """Prefer cleaned multi-state extract; fall back to by-state/PA partition."""
    cleaned = CLEAN / name
    if cleaned.exists():
        return cleaned
    return BY_STATE / name


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

    ingest(FL_MAP, ["florida_originations", "total_originations"])
    ingest(TX_MAP, ["texas_originations", "total_originations"])
    ingest(GA_MAP, ["georgia_originations", "total_originations"])
    ingest(CA_MAP, ["california_originations", "total_originations"])
    ingest(NC_MAP, ["north_carolina_originations", "total_originations"])
    ingest(SC_MAP, ["south_carolina_originations", "total_originations"])
    ingest(NJ_MAP, ["new_jersey_originations", "total_originations"])
    ingest(NY_MAP, ["new_york_originations", "total_originations"])
    return lei_to_map


def main() -> None:
    lei_to_map = load_lei_maps()
    gleif: dict[str, str] = {}
    if GLEIF_CACHE.exists():
        gleif = json.loads(GLEIF_CACHE.read_text(encoding="utf-8"))

    county_all = read_csv(source_path("county_market_summary.csv"))
    county_pa: list[dict[str, str]] = []
    for r in county_all:
        if r.get("state") != "PA":
            continue
        fips = (r.get("county_fips") or "").strip()
        if not (r.get("county_name") or "").strip() and fips in PA_MAJOR_COUNTIES:
            r = {**r, "county_name": PA_MAJOR_COUNTIES[fips]}
        try:
            orig = float(r.get("total_originations") or 0)
        except ValueError:
            orig = 0
        name = (r.get("county_name") or "").strip()
        if name or orig >= 1500 or fips in PA_MAJOR_COUNTIES:
            if not name and fips in PA_MAJOR_COUNTIES:
                r = {**r, "county_name": PA_MAJOR_COUNTIES[fips]}
            county_pa.append(r)

    state_all = read_csv(source_path("lender_state_summary.csv"))
    state_pa = [r for r in state_all if r.get("state") == "PA"]

    act_all = read_csv(source_path("lender_activity_by_county.csv"))
    act_pa: list[dict[str, str]] = []
    for r in act_all:
        if r.get("state") != "PA":
            continue
        fips = (r.get("county_fips") or "").strip()
        if not (r.get("county_name") or "").strip() and fips in PA_MAJOR_COUNTIES:
            r = {**r, "county_name": PA_MAJOR_COUNTIES[fips]}
        name = (r.get("county_name") or "").strip()
        if name and fips in PA_MAJOR_COUNTIES:
            lei = (r.get("lei") or "").strip()
            if not (r.get("institution_name") or "").strip():
                nm = gleif.get(lei) or (lei_to_map.get(lei) or {}).get(
                    "institution_name_hmda"
                )
                if not nm and lei in PA_CURATED_LEI:
                    nm = PA_CURATED_LEI[lei]["institution_name_hmda"]
                if nm:
                    r = {**r, "institution_name": nm}
            act_pa.append(r)

    cand_path = source_path("lei_mapping_candidates.csv")
    cand_pa: list[dict[str, str]] = []
    if cand_path.exists():
        cand_all = read_csv(cand_path)
        pa_leis = {r["lei"] for r in state_pa}
        cand_pa = [r for r in cand_all if r.get("lei") in pa_leis]

    state_by_lei = {r["lei"]: r for r in state_pa}
    mapping_by_lei: dict[str, dict[str, str]] = {}

    def add_mapping(lei: str, base: dict[str, str], method_prefix: str) -> None:
        st = state_by_lei.get(lei)
        if not st:
            return
        try:
            pa_orig = int(float(st.get("total_originations") or 0))
        except ValueError:
            pa_orig = 0
        if pa_orig <= 0:
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
            "pennsylvania_originations": str(pa_orig),
            "florida_originations": base.get("florida_originations") or "0",
            "total_originations": st.get("total_originations") or str(pa_orig),
            "priority_match": "high" if pa_orig >= 400 else "medium",
            "notes": (
                f"{method_prefix.rstrip('+') or 'curated'} map for PA activity "
                f"({pa_orig} PA originations); slug={slug}."
            ),
        }
        prev = mapping_by_lei.get(lei)
        if prev and int(prev["pennsylvania_originations"]) >= pa_orig and prev.get(
            "our_lender_slug"
        ):
            return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_fl_tx_ga_ca_nc_sc_nj_ny_curated_lei+")

    for lei, cur in PA_CURATED_LEI.items():
        add_mapping(lei, cur, "pa_curated+")

    # High-volume PA LEIs with known national NMLS in candidates (precision only)
    for r in cand_pa:
        lei = (r.get("lei") or "").strip()
        nmls = (r.get("nmls_id") or "").strip()
        if not lei or not nmls or nmls not in NATIONAL_SLUG_BY_NMLS:
            continue
        if lei in mapping_by_lei:
            continue
        add_mapping(
            lei,
            {
                "nmls_id": nmls,
                "our_lender_slug": NATIONAL_SLUG_BY_NMLS[nmls],
                "institution_name_hmda": r.get("institution_name")
                or r.get("legal_name")
                or "",
                "legal_name": r.get("legal_name") or "",
                "match_confidence": "high",
                "match_method": "pa_candidate_nmls_national_slug",
            },
            "pa_nmls_national+",
        )

    mapping_rows = sorted(
        mapping_by_lei.values(),
        key=lambda r: -int(float(r["pennsylvania_originations"] or 0)),
    )

    if county_pa:
        write_csv(
            OUT / "county_market_summary_pa.csv", county_pa, list(county_pa[0].keys())
        )
    if act_pa:
        write_csv(
            OUT / "lender_activity_by_county_pa.csv", act_pa, list(act_pa[0].keys())
        )
    if state_pa:
        write_csv(
            OUT / "lender_state_summary_pa.csv", state_pa, list(state_pa[0].keys())
        )
    if cand_pa:
        write_csv(
            OUT / "lei_mapping_candidates_pa.csv", cand_pa, list(cand_pa[0].keys())
        )
    if mapping_rows:
        write_csv(
            OUT / "lei_to_nmls_mapping.csv", mapping_rows, list(mapping_rows[0].keys())
        )

    major_named = [
        r
        for r in county_pa
        if (r.get("county_fips") or "") in PA_MAJOR_COUNTIES
        and (r.get("county_name") or "").strip()
    ]
    major_named.sort(key=lambda r: -float(r.get("total_originations") or 0))

    md = [
        "# Pennsylvania HMDA slice\n",
        f"- County market rows: **{len(county_pa)}**\n",
        f"- Lender–county activity (major counties): **{len(act_pa)}**\n",
        f"- LEI state summaries: **{len(state_pa)}**\n",
        f"- High-confidence LEI→directory mappings: **{len(mapping_rows)}**\n",
        f"- Major counties with names: **{len(major_named)}**\n\n",
        "## Top mapped LEIs by PA originations\n\n",
    ]
    for r in mapping_rows[:25]:
        md.append(
            f"- `{r['our_lender_slug']}` — {r['institution_name_hmda']} "
            f"({r['pennsylvania_originations']} PA orig.)\n"
        )
    md.append("\n## Major counties (panel-ready)\n\n")
    for r in major_named:
        md.append(
            f"- **{r.get('county_name')}** (`{r.get('county_fips')}`) — "
            f"{r.get('total_originations')} originations\n"
        )
    md.append(
        "\n## Matching rules\n\n"
        "- Reuse FL / TX / GA / CA / NC / SC / NJ / NY curated LEI maps when the LEI has PA activity\n"
        "- PA-curated LEIs: GLEIF name + published company NMLS only\n"
        "- National NMLS→slug overrides prefer company-level directory hosts\n"
        "- No fuzzy LEI inventing; does not modify New York product folders\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-pennsylvania-slice.py\n"
        "```\n"
    )
    (OUT / "README.md").write_text("".join(md), encoding="utf-8")

    print(f"Wrote Pennsylvania slice → {OUT}")
    print(
        f"  mappings={len(mapping_rows)} counties={len(county_pa)} activity={len(act_pa)}"
    )
    print(f"  major_named={len(major_named)}")


if __name__ == "__main__":
    main()
