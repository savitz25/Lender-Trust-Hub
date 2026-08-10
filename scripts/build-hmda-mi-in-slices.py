#!/usr/bin/env python3
"""
Build Michigan and Indiana HMDA product slices.

  python scripts/build-hmda-mi-in-slices.py

Source: data/hmda/by-state/{MI,IN}/
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GLEIF_CACHE = ROOT / "data" / "hmda" / "florida" / "_gleif_name_cache.json"

MAP_PATHS = list((ROOT / "data" / "hmda").glob("*/lei_to_nmls_mapping.csv"))
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
    "1921": "primelending-columbus",
    "2909": "fairway-mortgage-augusta-sheppard",
    "1168": "amerisave",
    "467341": "regions-bank",
    "480004": "synovus-bank",
    "1820": "cmg-home-loans-dennis-vo",
    "141868": "ruoff-mortgage",
    "459308": "old-national-bank",
    "619717": "first-financial-bank-ohio",
    "446047": "union-savings-bank",
    # MI / IN curated
    "442967": "lake-michigan-credit-union",
    "129386": "mortgage-1",
    "409709": "dfcu-financial",
    "409008": "genisys-credit-union",
    "405297": "msufcu",
    "2334": "gvc-mortgage",
    "556303": "three-rivers-federal-credit-union",
    "645641": "first-source-bank",
    "446859": "german-american-bank",
    "408076": "centier-bank",
    "431669": "lake-city-bank",
    # MI / IN deepen
    "423037": "msgcu",
    "406384": "dart-bank",
    "419813": "mercantile-bank-michigan",
    "140012": "staunton-financial",
    "402492": "indiana-members-credit-union",
    "686706": "everwise-credit-union",
    "409733": "centra-credit-union",
    "518136": "liberty-federal-credit-union",
}

MI_IN_CURATED_LEI: dict[str, dict[str, str]] = {
    # Michigan — wave 1
    "549300YB1H2FRI6JPM51": {
        "institution_name_hmda": "LAKE MICHIGAN CREDIT UNION",
        "nmls_id": "442967",
        "our_lender_slug": "lake-michigan-credit-union",
        "legal_name": "Lake Michigan Credit Union",
        "match_confidence": "high",
        "match_method": "mi_in_curated_gleif+public_nmls",
    },
    "549300IWE0Y507LPF493": {
        "institution_name_hmda": "MORTGAGE 1 INCORPORATED",
        "nmls_id": "129386",
        "our_lender_slug": "mortgage-1",
        "legal_name": "Mortgage 1 Incorporated",
        "match_confidence": "high",
        "match_method": "mi_in_curated_gleif+public_nmls",
    },
    "549300W6K140RN8NQB93": {
        "institution_name_hmda": "DFCU FINANCIAL",
        "nmls_id": "409709",
        "our_lender_slug": "dfcu-financial",
        "legal_name": "DFCU Financial",
        "match_confidence": "high",
        "match_method": "mi_in_curated_gleif+public_nmls",
    },
    "549300QIUZLVR1OLDH55": {
        "institution_name_hmda": "Genisys Credit Union",
        "nmls_id": "409008",
        "our_lender_slug": "genisys-credit-union",
        "legal_name": "Genisys Credit Union",
        "match_confidence": "high",
        "match_method": "mi_in_curated_gleif+public_nmls",
    },
    "54930053SM8COVIPIY54": {
        "institution_name_hmda": "MICHIGAN STATE UNIVERSITY Federal Credit Union",
        "nmls_id": "405297",
        "our_lender_slug": "msufcu",
        "legal_name": "Michigan State University Federal Credit Union (MSUFCU)",
        "match_confidence": "high",
        "match_method": "mi_in_curated_gleif+public_nmls",
    },
    # Michigan — deepen
    "549300WWLOUWIJ1Q0H29": {
        "institution_name_hmda": "MICHIGAN SCHOOLS AND GOVERNMENT",
        "nmls_id": "423037",
        "our_lender_slug": "msgcu",
        "legal_name": "Michigan Schools and Government Credit Union (MSGCU)",
        "match_confidence": "high",
        "match_method": "mi_in_deepen_gleif+public_nmls",
    },
    "5493008P6YO2KM3EO556": {
        "institution_name_hmda": "The Dart Bank",
        "nmls_id": "406384",
        "our_lender_slug": "dart-bank",
        "legal_name": "Dart Bank",
        "match_confidence": "high",
        "match_method": "mi_in_deepen_gleif+public_nmls",
    },
    "RM2F4G3WBQ8R9OKYRH19": {
        "institution_name_hmda": "Mercantile Bank",
        "nmls_id": "419813",
        "our_lender_slug": "mercantile-bank-michigan",
        "legal_name": "Mercantile Bank of Michigan",
        "match_confidence": "high",
        "match_method": "mi_in_deepen_gleif+public_nmls",
    },
    "549300KQQRECSLK8ID57": {
        "institution_name_hmda": "STAUNTON FINANCIAL, INC.",
        "nmls_id": "140012",
        "our_lender_slug": "staunton-financial",
        "legal_name": "Staunton Financial, Inc. (Total Home Lending / John Adams Mortgage)",
        "match_confidence": "high",
        "match_method": "mi_in_deepen_gleif+public_nmls",
    },
    # Indiana — wave 1
    "S0Q3AHZRL5K6VQE35M07": {
        "institution_name_hmda": "First Merchants Bank",
        "nmls_id": "",
        "our_lender_slug": "first-merchants-bank",
        "legal_name": "First Merchants Bank",
        "match_confidence": "high",
        "match_method": "mi_in_curated_gleif+lei_identity",
    },
    "54930077D8KXQADF5Q23": {
        "institution_name_hmda": "GVC MORTGAGE, INC.",
        "nmls_id": "2334",
        "our_lender_slug": "gvc-mortgage",
        "legal_name": "GVC Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "mi_in_curated_gleif+public_nmls",
    },
    "549300ZBBGOL4MIK0L71": {
        "institution_name_hmda": "Three Rivers Federal Credit Union",
        "nmls_id": "556303",
        "our_lender_slug": "three-rivers-federal-credit-union",
        "legal_name": "3Rivers Federal Credit Union",
        "match_confidence": "high",
        "match_method": "mi_in_curated_gleif+public_nmls",
    },
    "LCUAWMT4M5H8DJ8DFH49": {
        "institution_name_hmda": "1st Source Bank",
        "nmls_id": "645641",
        "our_lender_slug": "first-source-bank",
        "legal_name": "1st Source Bank",
        "match_confidence": "high",
        "match_method": "mi_in_curated_gleif+public_nmls",
    },
    "5493002JDOI3GTNVUD76": {
        "institution_name_hmda": "German American Bank",
        "nmls_id": "446859",
        "our_lender_slug": "german-american-bank",
        "legal_name": "German American Bank",
        "match_confidence": "high",
        "match_method": "mi_in_curated_gleif+public_nmls",
    },
    "549300SKTBTC2QFDKG02": {
        "institution_name_hmda": "Centier Bank",
        "nmls_id": "408076",
        "our_lender_slug": "centier-bank",
        "legal_name": "Centier Bank",
        "match_confidence": "high",
        "match_method": "mi_in_curated_gleif+public_nmls",
    },
    "8Q77SW3KZ88P3GNX0T60": {
        "institution_name_hmda": "Lake City Bank",
        "nmls_id": "431669",
        "our_lender_slug": "lake-city-bank",
        "legal_name": "Lake City Bank",
        "match_confidence": "high",
        "match_method": "mi_in_curated_gleif+public_nmls",
    },
    # Indiana — deepen
    "549300S99IK3EU11AS13": {
        "institution_name_hmda": "INDIANA MEMBERS CREDIT UNION",
        "nmls_id": "402492",
        "our_lender_slug": "indiana-members-credit-union",
        "legal_name": "Indiana Members Credit Union",
        "match_confidence": "high",
        "match_method": "mi_in_deepen_gleif+public_nmls",
    },
    "549300SXT4VBB68QCC26": {
        "institution_name_hmda": "EVERWISE CREDIT UNION",
        "nmls_id": "686706",
        "our_lender_slug": "everwise-credit-union",
        "legal_name": "Everwise Credit Union",
        "match_confidence": "high",
        "match_method": "mi_in_deepen_gleif+public_nmls",
    },
    "5493007LUU2DLS755O60": {
        "institution_name_hmda": "Centra Credit Union",
        "nmls_id": "409733",
        "our_lender_slug": "centra-credit-union",
        "legal_name": "Centra Credit Union",
        "match_confidence": "high",
        "match_method": "mi_in_deepen_gleif+public_nmls",
    },
    "54930072OCHTUJOZQB56": {
        "institution_name_hmda": "Liberty Credit Union",
        "nmls_id": "518136",
        "our_lender_slug": "liberty-federal-credit-union",
        "legal_name": "Liberty Federal Credit Union",
        "match_confidence": "high",
        "match_method": "mi_in_deepen_gleif+public_nmls",
    },
}

MI_COUNTIES: dict[str, str] = {
    "26005": "Allegan",
    "26015": "Barry",
    "26017": "Bay",
    "26021": "Berrien",
    "26025": "Calhoun",
    "26027": "Cass",
    "26037": "Clinton",
    "26045": "Eaton",
    "26049": "Genesee",
    "26055": "Grand Traverse",
    "26065": "Ingham",
    "26067": "Ionia",
    "26073": "Isabella",
    "26075": "Jackson",
    "26077": "Kalamazoo",
    "26081": "Kent",
    "26087": "Lapeer",
    "26091": "Lenawee",
    "26093": "Livingston",
    "26099": "Macomb",
    "26107": "Mecosta",
    "26111": "Midland",
    "26115": "Monroe",
    "26117": "Montcalm",
    "26121": "Muskegon",
    "26123": "Newaygo",
    "26125": "Oakland",
    "26139": "Ottawa",
    "26145": "Saginaw",
    "26147": "St. Clair",
    "26149": "St. Joseph",
    "26155": "Shiawassee",
    "26159": "Van Buren",
    "26161": "Washtenaw",
    "26163": "Wayne",
}

MI_MAJORS: set[str] = {
    # Wave 1
    "26163",  # Wayne
    "26125",  # Oakland
    "26099",  # Macomb
    "26081",  # Kent
    "26049",  # Genesee
    "26139",  # Ottawa
    "26161",  # Washtenaw
    "26077",  # Kalamazoo
    "26093",  # Livingston
    "26065",  # Ingham
    "26121",  # Muskegon
    "26147",  # St. Clair
    "26115",  # Monroe
    "26021",  # Berrien
    "26075",  # Jackson
    "26145",  # Saginaw
    "26005",  # Allegan
    "26025",  # Calhoun
    "26055",  # Grand Traverse
    "26045",  # Eaton
    # Deepen — next volume band (~1,000+ originations)
    "26091",  # Lenawee
    "26087",  # Lapeer
    "26017",  # Bay
    "26159",  # Van Buren
    "26037",  # Clinton
    "26015",  # Barry
    "26111",  # Midland
    "26155",  # Shiawassee
    "26067",  # Ionia
    "26149",  # St. Joseph
    "26027",  # Cass
    "26073",  # Isabella
    "26107",  # Mecosta
    "26117",  # Montcalm
    "26123",  # Newaygo
}

IN_COUNTIES: dict[str, str] = {
    "18003": "Allen",
    "18005": "Bartholomew",
    "18011": "Boone",
    "18019": "Clark",
    "18029": "Dearborn",
    "18033": "DeKalb",
    "18035": "Delaware",
    "18039": "Elkhart",
    "18043": "Floyd",
    "18053": "Grant",
    "18057": "Hamilton",
    "18059": "Hancock",
    "18061": "Harrison",
    "18063": "Hendricks",
    "18065": "Henry",
    "18067": "Howard",
    "18081": "Johnson",
    "18085": "Kosciusko",
    "18089": "Lake",
    "18091": "LaPorte",
    "18093": "Lawrence",
    "18095": "Madison",
    "18097": "Marion",
    "18099": "Marshall",
    "18105": "Monroe",
    "18109": "Morgan",
    "18113": "Noble",
    "18127": "Porter",
    "18141": "St. Joseph",
    "18145": "Shelby",
    "18157": "Tippecanoe",
    "18163": "Vanderburgh",
    "18167": "Vigo",
    "18173": "Warrick",
    "18177": "Wayne",
}

IN_MAJORS: set[str] = {
    # Wave 1
    "18097",  # Marion
    "18057",  # Hamilton
    "18089",  # Lake
    "18003",  # Allen
    "18141",  # St. Joseph
    "18063",  # Hendricks
    "18081",  # Johnson
    "18039",  # Elkhart
    "18127",  # Porter
    "18163",  # Vanderburgh
    "18157",  # Tippecanoe
    "18019",  # Clark
    "18095",  # Madison
    "18059",  # Hancock
    "18011",  # Boone
    "18105",  # Monroe
    "18035",  # Delaware
    "18091",  # LaPorte
    "18109",  # Morgan
    "18043",  # Floyd
    # Deepen — next volume / regional
    "18067",  # Howard
    "18085",  # Kosciusko
    "18005",  # Bartholomew
    "18167",  # Vigo
    "18173",  # Warrick
    "18029",  # Dearborn
    "18177",  # Wayne
    "18033",  # DeKalb
    "18145",  # Shelby
    "18053",  # Grant
    "18113",  # Noble
    "18093",  # Lawrence
    "18061",  # Harrison
    "18065",  # Henry
    "18099",  # Marshall
}

STATES = [
    {
        "code": "MI",
        "name": "Michigan",
        "folder": "michigan",
        "suffix": "_mi",
        "col": "michigan_originations",
        "alias_col": "mi_originations",
        "counties": MI_COUNTIES,
        "majors": MI_MAJORS,
    },
    {
        "code": "IN",
        "name": "Indiana",
        "folder": "indiana",
        "suffix": "_in",
        "col": "indiana_originations",
        "alias_col": "in_originations",
        "counties": IN_COUNTIES,
        "majors": IN_MAJORS,
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


def name_to_slug(name: str) -> str:
    return name.strip().lower().replace(".", "").replace("'", "").replace(" ", "-")


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
    majors: set[str] = set(cfg["majors"])
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
        if not name and fips in counties_map:
            r = {**r, "county_name": counties_map[fips]}
            name = counties_map[fips]
        if name or fips in majors or orig >= 800:
            if not name and fips in counties_map:
                r = {**r, "county_name": counties_map[fips]}
            county_out.append(r)

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
            if not nm and lei in MI_IN_CURATED_LEI:
                nm = MI_IN_CURATED_LEI[lei]["institution_name_hmda"]
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
        curated_slug = (base.get("our_lender_slug") or "").strip()
        slug = (
            curated_slug
            if method_prefix.startswith("mi_in_curated") and curated_slug
            else (NATIONAL_SLUG_BY_NMLS.get(nmls) or curated_slug)
        )
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
            "priority_match": "high" if st_orig >= 500 else "medium",
            "notes": (
                f"{method_prefix.rstrip('+') or 'curated'} map for {code} activity "
                f"({st_orig} {code} originations); slug={slug}."
            ),
        }
        prev = mapping_by_lei.get(lei)
        if prev and int(float(prev[col] or 0)) >= st_orig and prev.get("our_lender_slug"):
            if not method_prefix.startswith("mi_in_curated"):
                return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_prior_state_curated_lei+")
    for lei, cur in MI_IN_CURATED_LEI.items():
        add_mapping(lei, cur, "mi_in_curated+")

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
    major_slugs = [name_to_slug(r.get("county_name") or "") for r in major_named]

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
        "\n## Matching rules\n\n"
        "- Reuse prior product-state curated LEI maps when the LEI has state activity\n"
        "- MI/IN curated + deepen: LMCU, Mortgage 1, DFCU, Genisys, MSUFCU, MSGCU, Dart Bank, "
        "Mercantile Bank, Staunton Financial, First Merchants, GVC, 3Rivers, 1st Source, "
        "German American, Centier, Lake City, Indiana Members CU, Everwise, Centra, Liberty FCU\n"
        "- First Merchants uses LEI identity (no forced company NMLS inventing)\n"
        "- No fuzzy LEI inventing\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-mi-in-slices.py\n"
        "```\n"
        "\n## Major slugs (for states.ts)\n\n```\n"
        + ", ".join(f"'{s}'" for s in major_slugs)
        + "\n```\n"
    )
    (out / "README.md").write_text("".join(md), encoding="utf-8")
    print(
        f"Wrote {cfg['name']} → {out} "
        f"mappings={len(mapping_rows)} counties={len(county_out)} "
        f"activity={len(act_out)} majors={len(major_named)} "
        f"slugs={major_slugs}"
    )


def main() -> None:
    lei_to_map = load_lei_maps()
    gleif: dict[str, str] = {}
    if GLEIF_CACHE.exists():
        gleif = json.loads(GLEIF_CACHE.read_text(encoding="utf-8"))
    for lei, cur in MI_IN_CURATED_LEI.items():
        gleif.setdefault(lei, cur["institution_name_hmda"])
    if GLEIF_CACHE.exists():
        GLEIF_CACHE.write_text(json.dumps(gleif, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    for cfg in STATES:
        build_state(cfg, lei_to_map, gleif)


if __name__ == "__main__":
    main()
