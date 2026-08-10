#!/usr/bin/env python3
"""
Build Virginia and Maryland HMDA product slices.

  python scripts/build-hmda-va-md-slices.py

Source: data/hmda/by-state/{VA,MD}/
Virginia includes independent cities as separate FIPS geographies.
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GLEIF_CACHE = ROOT / "data" / "hmda" / "florida" / "_gleif_name_cache.json"

MAP_PATHS = list(
    (ROOT / "data" / "hmda").glob("*/lei_to_nmls_mapping.csv")
)
# Prefer product folders only (not by-state)
MAP_PATHS = [p for p in MAP_PATHS if "by-state" not in str(p)]

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
    "3094": "primary-residential-mortgage",
    "86548": "first-heritage-mortgage",
    "1904": "atlantic-bay-mortgage-charleston",
    "405461": "southstate-bank",
    "405455": "ameris-bank",
    "467341": "regions-bank",
    "766529": "first-national-bank-of-pennsylvania",
    # VA / MD curated
    "40508": "alcova-mortgage",
    "643114": "atlantic-coast-mortgage",
    "551889": "atlantic-union-bank",
    "71603": "first-home-mortgage",
    "586147": "tower-federal-credit-union",
    "512138": "townebank",
    # VA / MD deepen
    "407552": "virginia-credit-union",
    "402897": "langley-federal-credit-union",
    "147312": "cf-mortgage",
    "476890": "bayport-credit-union",
    "2921": "southern-trust-mortgage",
    "56323": "intercoastal-mortgage",
    "522399": "united-bank",
    "832799": "direct-mortgage-loans",
    "480340": "apg-federal-credit-union",
}

VA_MD_CURATED_LEI: dict[str, dict[str, str]] = {
    "549300RYBJHWWDENV610": {
        "institution_name_hmda": "Alcova Mortgage LLC",
        "nmls_id": "40508",
        "our_lender_slug": "alcova-mortgage",
        "legal_name": "Alcova Mortgage LLC",
        "match_confidence": "high",
        "match_method": "va_md_curated_gleif+public_nmls",
    },
    "54930095UWUUXAWASB02": {
        "institution_name_hmda": "Atlantic Coast Mortgage, LLC",
        "nmls_id": "643114",
        "our_lender_slug": "atlantic-coast-mortgage",
        "legal_name": "Atlantic Coast Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "va_md_curated_gleif+public_nmls",
    },
    "549300ZTT08EKQRVTR15": {
        "institution_name_hmda": "Atlantic Union Bank",
        "nmls_id": "551889",
        "our_lender_slug": "atlantic-union-bank",
        "legal_name": "Atlantic Union Bank",
        "match_confidence": "high",
        "match_method": "va_md_curated_gleif+public_nmls",
    },
    "549300GPO6DWUZR4UY30": {
        "institution_name_hmda": "FIRST HOME MORTGAGE CORPORATION",
        "nmls_id": "71603",
        "our_lender_slug": "first-home-mortgage",
        "legal_name": "First Home Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "va_md_curated_gleif+public_nmls",
    },
    "54930080168VA6Z8UX21": {
        "institution_name_hmda": "TOWER Federal Credit Union",
        "nmls_id": "586147",
        "our_lender_slug": "tower-federal-credit-union",
        "legal_name": "Tower Federal Credit Union",
        "match_confidence": "high",
        "match_method": "va_md_curated_gleif+public_nmls",
    },
    "54930039UO39UJGI7078": {
        "institution_name_hmda": "TowneBank",
        "nmls_id": "512138",
        "our_lender_slug": "townebank",
        "legal_name": "TowneBank / TowneBank Mortgage",
        "match_confidence": "high",
        "match_method": "va_md_curated_gleif+public_nmls",
    },
    # Deepen
    "5493009LKZIV63KY6458": {
        "institution_name_hmda": "VIRGINIA FEDERAL CREDIT UNION",
        "nmls_id": "407552",
        "our_lender_slug": "virginia-credit-union",
        "legal_name": "Virginia Credit Union (Virginia Federal Credit Union)",
        "match_confidence": "high",
        "match_method": "va_md_deepen_gleif+public_nmls",
    },
    "549300CHR7TPQ6LLXG47": {
        "institution_name_hmda": "LANGLEY FEDERAL CREDIT UNION",
        "nmls_id": "402897",
        "our_lender_slug": "langley-federal-credit-union",
        "legal_name": "Langley Federal Credit Union",
        "match_confidence": "high",
        "match_method": "va_md_deepen_gleif+public_nmls",
    },
    "549300BWFA5UY7H4WJ62": {
        "institution_name_hmda": "C & F Mortgage Corporation",
        "nmls_id": "147312",
        "our_lender_slug": "cf-mortgage",
        "legal_name": "C&F Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "va_md_deepen_gleif+public_nmls",
    },
    "5493000E527OH5Y8TR73": {
        "institution_name_hmda": "NEWPORT NEWS SHIPBUILDING EMPLOYEES CREDIT UNION, INC. DBA BAYPORT CREDIT UNION",
        "nmls_id": "476890",
        "our_lender_slug": "bayport-credit-union",
        "legal_name": "BayPort Credit Union",
        "match_confidence": "high",
        "match_method": "va_md_deepen_gleif+public_nmls",
    },
    "549300FOXIQQV5UZD367": {
        "institution_name_hmda": "SOUTHERN TRUST MORTGAGE, LLC",
        "nmls_id": "2921",
        "our_lender_slug": "southern-trust-mortgage",
        "legal_name": "Southern Trust Mortgage LLC",
        "match_confidence": "high",
        "match_method": "va_md_deepen_gleif+public_nmls",
    },
    "549300BM4NS8HDJT3X28": {
        "institution_name_hmda": "INTERCOASTAL MORTGAGE, LLC",
        "nmls_id": "56323",
        "our_lender_slug": "intercoastal-mortgage",
        "legal_name": "Intercoastal Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "va_md_deepen_gleif+public_nmls",
    },
    "549300MKOZ81ZWTNKB12": {
        "institution_name_hmda": "United Bank",
        "nmls_id": "522399",
        "our_lender_slug": "united-bank",
        "legal_name": "United Bank",
        "match_confidence": "high",
        "match_method": "va_md_deepen_gleif+public_nmls",
    },
    "549300I0ICF6REKHOC74": {
        "institution_name_hmda": "DIRECT MORTGAGE LOANS, LLC",
        "nmls_id": "832799",
        "our_lender_slug": "direct-mortgage-loans",
        "legal_name": "Direct Mortgage Loans, LLC",
        "match_confidence": "high",
        "match_method": "va_md_deepen_gleif+public_nmls",
    },
    "5493004XJV6Y8XQYPX87": {
        "institution_name_hmda": "ABERDEEN PROVING GROUND FEDERAL CREDIT UNION",
        "nmls_id": "480340",
        "our_lender_slug": "apg-federal-credit-union",
        "legal_name": "APG Federal Credit Union",
        "match_confidence": "high",
        "match_method": "va_md_deepen_gleif+public_nmls",
    },
}

# High-volume VA counties + independent cities (panel wave 1)
VA_COUNTIES: dict[str, str] = {
    "51003": "Albemarle",
    "51013": "Arlington",
    "51015": "Augusta",
    "51019": "Bedford",
    "51041": "Chesterfield",
    "51059": "Fairfax",
    "51069": "Frederick",
    "51085": "Hanover",
    "51087": "Henrico",
    "51095": "James City",
    "51107": "Loudoun",
    "51153": "Prince William",
    "51161": "Roanoke",
    "51177": "Spotsylvania",
    "51179": "Stafford",
    "51510": "Alexandria",
    "51550": "Chesapeake",
    "51650": "Hampton",
    "51700": "Newport News",
    "51710": "Norfolk",
    "51740": "Portsmouth",
    "51760": "Richmond",
    "51770": "Roanoke City",
    "51800": "Suffolk",
    "51810": "Virginia Beach",
    # Additional meaningful markets often in top tier
    "51036": "Charles City",
    "51053": "Dinwiddie",
    "51061": "Fauquier",
    "51065": "Fluvanna",
    "51073": "Gloucester",
    "51075": "Goochland",
    "51093": "Isle of Wight",
    "51001": "Accomack",
    "51009": "Amherst",
    "51023": "Botetourt",
    "51031": "Campbell",
    "51033": "Caroline",
    "51035": "Carroll",
    "51036": "Charles City",
    "51053": "Dinwiddie",
    "51061": "Fauquier",
    "51065": "Fluvanna",
    "51067": "Franklin",
    "51073": "Gloucester",
    "51075": "Goochland",
    "51079": "Greene",
    "51089": "Henry",
    "51093": "Isle of Wight",
    "51099": "King George",
    "51101": "King William",
    "51109": "Louisa",
    "51117": "Mecklenburg",
    "51121": "Montgomery",
    "51127": "New Kent",
    "51137": "Orange",
    "51139": "Page",
    "51143": "Pittsylvania",
    "51145": "Powhatan",
    "51147": "Prince Edward",
    "51149": "Prince George",
    "51155": "Pulaski",
    "51163": "Rockbridge",
    "51165": "Rockingham",
    "51169": "Scott",
    "51171": "Shenandoah",
    "51185": "Tazewell",
    "51187": "Warren",
    "51191": "Washington",
    "51193": "Westmoreland",
    "51197": "Wythe",
    "51199": "York",
    "51520": "Bristol",
    "51540": "Charlottesville",
    "51590": "Danville",
    "51600": "Fairfax City",
    "51630": "Fredericksburg",
    "51660": "Harrisonburg",
    "51670": "Hopewell",
    "51680": "Lynchburg",
    "51683": "Manassas",
    "51685": "Manassas Park",
    "51730": "Petersburg",
    "51735": "Poquoson",
    "51750": "Radford",
    "51775": "Salem",
    "51790": "Staunton",
    "51820": "Waynesboro",
    "51840": "Winchester",
}

MD_COUNTIES: dict[str, str] = {
    "24001": "Allegany",
    "24003": "Anne Arundel",
    "24005": "Baltimore",
    "24009": "Calvert",
    "24011": "Caroline",
    "24013": "Carroll",
    "24015": "Cecil",
    "24017": "Charles",
    "24019": "Dorchester",
    "24021": "Frederick",
    "24023": "Garrett",
    "24025": "Harford",
    "24027": "Howard",
    "24029": "Kent",
    "24031": "Montgomery",
    "24033": "Prince Georges",
    "24035": "Queen Annes",
    "24037": "St. Marys",
    "24039": "Somerset",
    "24041": "Talbot",
    "24043": "Washington",
    "24045": "Wicomico",
    "24047": "Worcester",
    "24510": "Baltimore City",
}

STATES = [
    {
        "code": "VA",
        "name": "Virginia",
        "folder": "virginia",
        "suffix": "_va",
        "col": "virginia_originations",
        "alias_col": "va_originations",
        "counties": VA_COUNTIES,
        # Deepen: lower threshold for panel-ready markets
        "min_orig": 700,
    },
    {
        "code": "MD",
        "name": "Maryland",
        "folder": "maryland",
        "suffix": "_md",
        "col": "maryland_originations",
        "alias_col": "md_originations",
        "counties": MD_COUNTIES,
        # Full state panels (all 24 counties/city)
        "min_orig": 300,
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
            for k, v in r.items():
                if k.endswith("_originations") or k == "total_originations":
                    try:
                        vol = max(vol, float(v or 0))
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
    suffix = cfg["suffix"]
    col = cfg["col"]
    alias = cfg["alias_col"]
    min_orig = float(cfg["min_orig"])

    county_rows = [fill_county(r, counties_map) for r in read_csv(src / "county_market_summary.csv")]
    county_out: list[dict[str, str]] = []
    majors: set[str] = set()
    for r in county_rows:
        fips = (r.get("county_fips") or "").strip()
        try:
            orig = float(r.get("total_originations") or 0)
        except ValueError:
            orig = 0
        name = (r.get("county_name") or "").strip()
        if not name and fips in counties_map:
            r = {**r, "county_name": counties_map[fips]}
            name = counties_map[fips]
        if name or orig >= 200:
            county_out.append(r)
        # Panel majors: meaningful volume + known name
        if name and orig >= min_orig:
            majors.add(fips)
        # Always include named priority FIPS even if slightly under threshold
        if fips in counties_map and orig >= min_orig * 0.85:
            majors.add(fips)

    # Ensure user-priority markets are in majors if present with any material volume
    priority_va = {
        "51059", "51107", "51153", "51810", "51041", "51087", "51013", "51760",
        "51550", "51710", "51510", "51177", "51179",
    }
    priority_md = {
        "24031", "24033", "24005", "24003", "24510", "24027", "24021", "24025",
    }
    priority = priority_va if code == "VA" else priority_md
    for r in county_out:
        fips = (r.get("county_fips") or "").strip()
        try:
            orig = float(r.get("total_originations") or 0)
        except ValueError:
            orig = 0
        if fips in priority and orig >= 500:
            majors.add(fips)

    state_rows = read_csv(src / "lender_state_summary.csv")
    act_out: list[dict[str, str]] = []
    for r in read_csv(src / "lender_activity_by_county.csv"):
        r = fill_county(r, counties_map)
        fips = (r.get("county_fips") or "").strip()
        if not (r.get("county_name") or "").strip() or fips not in majors:
            continue
        lei = (r.get("lei") or "").strip()
        if not (r.get("institution_name") or "").strip():
            nm = gleif.get(lei) or (lei_to_map.get(lei) or {}).get("institution_name_hmda")
            if not nm and lei in VA_MD_CURATED_LEI:
                nm = VA_MD_CURATED_LEI[lei]["institution_name_hmda"]
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
            "priority_match": "high" if st_orig >= 400 else "medium",
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
    for lei, cur in VA_MD_CURATED_LEI.items():
        add_mapping(lei, cur, "va_md_curated+")

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

    # Persist majors list for TypeScript config sync (human-readable slugs)
    major_named = [
        r
        for r in county_out
        if (r.get("county_fips") or "") in majors and (r.get("county_name") or "").strip()
    ]
    major_named.sort(key=lambda r: -float(r.get("total_originations") or 0))
    major_slugs = []
    for r in major_named:
        name = (r.get("county_name") or "").strip().lower()
        slug = (
            name.replace(".", "")
            .replace("'", "")
            .replace(" ", "-")
        )
        # Prince Georges → prince-georges already; St. Marys → st-marys
        major_slugs.append(slug)

    md = [
        f"# {cfg['name']} HMDA slice\n\n",
        f"**Source:** `data/hmda/by-state/{code}/` (national 2025 foundation)\n\n",
        f"- County market rows: **{len(county_out)}**\n",
        f"- Lender–county activity (major markets): **{len(act_out)}**\n",
        f"- LEI state summaries: **{len(state_rows)}**\n",
        f"- High-confidence LEI→directory mappings: **{len(mapping_rows)}**\n",
        f"- Major markets with names: **{len(major_named)}**\n\n",
        f"## Top mapped LEIs by {code} originations\n\n",
    ]
    for r in mapping_rows[:20]:
        md.append(
            f"- `{r['our_lender_slug']}` — {r['institution_name_hmda']} "
            f"({r[col]} {code} orig.)\n"
        )
    md.append("\n## Major markets (panel-ready)\n\n")
    for r in major_named:
        md.append(
            f"- **{r.get('county_name')}** (`{r.get('county_fips')}`) — "
            f"{r.get('total_originations')} originations\n"
        )
    md.append(
        "\n## Major slugs (for states.ts)\n\n```\n"
        + ", ".join(f"'{s}'" for s in major_slugs)
        + "\n```\n"
        "\n## Matching rules\n\n"
        "- Reuse prior product-state curated LEI maps when the LEI has state activity\n"
        "- VA/MD curated wave 1 + deepen (VACU, Langley, C&F, BayPort, Southern Trust, "
        "Intercoastal, United Bank, Direct Mortgage, APG FCU, …)\n"
        "- No fuzzy LEI inventing\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-va-md-slices.py\n"
        "```\n"
    )
    (out / "README.md").write_text("".join(md), encoding="utf-8")
    # Write majors sidecar for wiring
    (out / "major_county_slugs.txt").write_text("\n".join(major_slugs) + "\n", encoding="utf-8")
    print(
        f"Wrote {cfg['name']} → {out} "
        f"mappings={len(mapping_rows)} counties={len(county_out)} "
        f"activity={len(act_out)} majors={len(major_named)}"
    )
    print(f"  major slugs: {major_slugs[:12]}{'...' if len(major_slugs)>12 else ''}")


def main() -> None:
    lei_to_map = load_lei_maps()
    gleif: dict[str, str] = {}
    if GLEIF_CACHE.exists():
        gleif = json.loads(GLEIF_CACHE.read_text(encoding="utf-8"))
    for lei, cur in VA_MD_CURATED_LEI.items():
        gleif.setdefault(lei, cur["institution_name_hmda"])

    for cfg in STATES:
        build_state(cfg, lei_to_map, gleif)


if __name__ == "__main__":
    main()
