#!/usr/bin/env python3
"""
Build New Mexico and West Virginia HMDA product slices.

  python scripts/build-hmda-nm-wv-slices.py

Source: data/hmda/by-state/{NM,WV}/
Does not modify Idaho / Montana / Wyoming or other product-state slices.
"""
from __future__ import annotations

import csv
import json
import re
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
    "402216": "us-bank",
    "399809": "usaa-federal-savings-bank",
    "399797": "flagstar-bank",
    "39179": "movement-mortgage-myrtle-beach",
    "3274": "guild-mortgage-metrowest",
    "3029": "crosscountry-mortgage-metrowest",
    "399807": "navy-federal-jacksonville",
    "1820": "cmg-home-loans-dennis-vo",
    "2458338": "cmg-home-loans-dennis-vo",
    "75243": "prmg",
    "1124061": "lower",
    "1921": "primelending-columbus",
    "2909": "fairway-mortgage-augusta-sheppard",
    "1168": "amerisave",
    "1907": "veterans-united-west-valley",
    "1058": "lennar-mortgage-queen-creek",
    "1025894": "mutual-of-omaha-mortgage",
    "467341": "regions-bank",
    "402436": "huntington-national-bank",
    "14622": "dhi-mortgage-buckeye",
    "2143": "benchmark-mortgage",
    "403501": "bok-financial",
    "3094": "primary-residential-mortgage",
    "145502": "vip-mortgage",
    "399836": "wesbanco-bank",
    "522399": "united-bank",
    "7233": "gateway-mortgage-myrtle-beach",
    # NM / WV curated
    "186434": "waterstone-mortgage",
    "477659": "nusenda-credit-union",
    "451711": "sunward-federal-credit-union",
    "463291": "us-eagle-federal-credit-union",
}

CURATED_LEI: dict[str, dict[str, str]] = {
    # ── National re-identify ─────────────────────────────────────────────────
    "549300HW662MN1WU8550": {
        "institution_name_hmda": "United Wholesale Mortgage, LLC",
        "nmls_id": "3038",
        "our_lender_slug": "united-wholesale-mortgage",
        "legal_name": "United Wholesale Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "549300FGXN1K3HLB1R50": {
        "institution_name_hmda": "Rocket Mortgage, LLC",
        "nmls_id": "3030",
        "our_lender_slug": "rocket-mortgage",
        "legal_name": "Rocket Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "549300AQ3T62GXDU7D76": {
        "institution_name_hmda": "GUILD MORTGAGE COMPANY LLC",
        "nmls_id": "3274",
        "our_lender_slug": "guild-mortgage-metrowest",
        "legal_name": "Guild Mortgage Company LLC",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "549300VZVN841I2ILS84": {
        "institution_name_hmda": "CROSSCOUNTRY MORTGAGE, LLC",
        "nmls_id": "3029",
        "our_lender_slug": "crosscountry-mortgage-metrowest",
        "legal_name": "CrossCountry Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "549300LYRWPSYPK6S325": {
        "institution_name_hmda": "FREEDOM MORTGAGE CORPORATION",
        "nmls_id": "2767",
        "our_lender_slug": "freedom-mortgage",
        "legal_name": "Freedom Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "549300AG64NHILB7ZP05": {
        "institution_name_hmda": "LOANDEPOT.COM, LLC",
        "nmls_id": "174457",
        "our_lender_slug": "loandepot",
        "legal_name": "loanDepot.com, LLC",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "RVDPPPGHCGZ40J4VQ731": {
        "institution_name_hmda": "PENNYMAC LOAN SERVICES, LLC",
        "nmls_id": "35953",
        "our_lender_slug": "pennymac",
        "legal_name": "PennyMac Loan Services, LLC",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "549300H3IZO24NSOO931": {
        "institution_name_hmda": "LENNAR MORTGAGE, LLC",
        "nmls_id": "1058",
        "our_lender_slug": "lennar-mortgage-queen-creek",
        "legal_name": "Lennar Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "5493001SXWZ4OFP8Z903": {
        "institution_name_hmda": "DHI MORTGAGE COMPANY, LTD.",
        "nmls_id": "14622",
        "our_lender_slug": "dhi-mortgage-buckeye",
        "legal_name": "DHI Mortgage Company, Ltd.",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+directory_slug",
    },
    "549300LBCBNR1OT00651": {
        "institution_name_hmda": "NATIONSTAR MORTGAGE LLC",
        "nmls_id": "2104",
        "our_lender_slug": "mr-cooper",
        "legal_name": "Nationstar Mortgage LLC",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "549300DD5QQUHO6PCH70": {
        "institution_name_hmda": "MORTGAGE RESEARCH CENTER, LLC",
        "nmls_id": "1907",
        "our_lender_slug": "veterans-united-west-valley",
        "legal_name": "Mortgage Research Center, LLC (Veterans United Home Loans)",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "549300FNXYY540N23N64": {
        "institution_name_hmda": "Newrez LLC",
        "nmls_id": "2289",
        "our_lender_slug": "newrez",
        "legal_name": "Newrez LLC",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "549300E2UX99HKDBR481": {
        "institution_name_hmda": "NEW AMERICAN FUNDING, LLC",
        "nmls_id": "6606",
        "our_lender_slug": "new-american-funding",
        "legal_name": "New American Funding, LLC",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "549300DD4R4SYK5RAQ92": {
        "institution_name_hmda": "MOVEMENT MORTGAGE, LLC",
        "nmls_id": "39179",
        "our_lender_slug": "movement-mortgage-myrtle-beach",
        "legal_name": "Movement Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "5493003GQDUH26DNNH17": {
        "institution_name_hmda": "Navy Federal Credit Union",
        "nmls_id": "399807",
        "our_lender_slug": "navy-federal-jacksonville",
        "legal_name": "Navy Federal Credit Union",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "7H6GLXDRUGQFU57RNE97": {
        "institution_name_hmda": "JPMorgan Chase Bank, National Association",
        "nmls_id": "399798",
        "our_lender_slug": "jpmorgan-chase-bank",
        "legal_name": "JPMorgan Chase Bank, National Association",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "2WHM8VNJH63UN14OL754": {
        "institution_name_hmda": "The Huntington National Bank",
        "nmls_id": "402436",
        "our_lender_slug": "huntington-national-bank",
        "legal_name": "The Huntington National Bank",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "QGPGHQ1ENZOOLJRFTH41": {
        "institution_name_hmda": "WesBanco Bank, Inc.",
        "nmls_id": "399836",
        "our_lender_slug": "wesbanco-bank",
        "legal_name": "WesBanco Bank, Inc.",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "JJKC32MCHWDI71265Z06": {
        "institution_name_hmda": "Truist Bank",
        "nmls_id": "405457",
        "our_lender_slug": "truist-bank",
        "legal_name": "Truist Bank",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "549300MKOZ81ZWTNKB12": {
        "institution_name_hmda": "United Bank",
        "nmls_id": "522399",
        "our_lender_slug": "united-bank",
        "legal_name": "United Bank",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "FU7RSW4CQQY98A2O7J66": {
        "institution_name_hmda": "BOKF, National Association",
        "nmls_id": "403501",
        "our_lender_slug": "bok-financial",
        "legal_name": "BOKF, National Association",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "54930052M48FOD3CWA54": {
        "institution_name_hmda": "PRIMARY RESIDENTIAL MORTGAGE, INC.",
        "nmls_id": "3094",
        "our_lender_slug": "primary-residential-mortgage",
        "legal_name": "Primary Residential Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "549300GKFNPRWNS0GF29": {
        "institution_name_hmda": "AmeriHome Mortgage Company, LLC",
        "nmls_id": "1120271",
        "our_lender_slug": "amerihome-mortgage",
        "legal_name": "AmeriHome Mortgage Company, LLC",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "549300PC4MFWQBNVKG88": {
        "institution_name_hmda": "V.I.P. MORTGAGE, INC.",
        "nmls_id": "145502",
        "our_lender_slug": "vip-mortgage",
        "legal_name": "V.I.P. Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "549300WYBPIWKK6SQC06": {
        "institution_name_hmda": "Bell Bank",
        "nmls_id": "",
        "our_lender_slug": "bell-bank",
        "legal_name": "Bell Bank",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+directory_slug",
    },
    "549300U3721PJGQZYY68": {
        "institution_name_hmda": "GUARANTEED RATE, INC.",
        "nmls_id": "2611",
        "our_lender_slug": "guaranteed-rate",
        "legal_name": "Guaranteed Rate, Inc.",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "AD6GFRVSDT01YPT1CS68": {
        "institution_name_hmda": "PNC Bank, National Association",
        "nmls_id": "446038",
        "our_lender_slug": "pnc-bank",
        "legal_name": "PNC Bank, National Association",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "KB1H1DSPRFMYMCUFXT09": {
        "institution_name_hmda": "Wells Fargo Bank, National Association",
        "nmls_id": "399801",
        "our_lender_slug": "wells-fargo-bank",
        "legal_name": "Wells Fargo Bank, National Association",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "6BYL5QZYBDK8S7L73M02": {
        "institution_name_hmda": "U.S. Bank National Association",
        "nmls_id": "402216",
        "our_lender_slug": "us-bank",
        "legal_name": "U.S. Bank National Association",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    "54930034MNPILHP25H80": {
        "institution_name_hmda": "Gateway First Bank",
        "nmls_id": "7233",
        "our_lender_slug": "gateway-mortgage-myrtle-beach",
        "legal_name": "Gateway First Bank",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif_reidentify+public_nmls",
    },
    # ── New Mexico regionals ─────────────────────────────────────────────────
    "549300GRGZDEH4ZGQS06": {
        "institution_name_hmda": "WATERSTONE MORTGAGE CORPORATION",
        "nmls_id": "186434",
        "our_lender_slug": "waterstone-mortgage",
        "legal_name": "Waterstone Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif+public_nmls",
    },
    "5493007B1GAUZGYHPR07": {
        "institution_name_hmda": "NUSENDA",
        "nmls_id": "477659",
        "our_lender_slug": "nusenda-credit-union",
        "legal_name": "Nusenda Credit Union",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif+public_nmls",
    },
    "549300CIQ950OK0BS407": {
        "institution_name_hmda": "SUNWARD",
        "nmls_id": "451711",
        "our_lender_slug": "sunward-federal-credit-union",
        "legal_name": "Sunward Federal Credit Union",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif+public_nmls",
    },
    "549300H6J0XZXQGKDW16": {
        "institution_name_hmda": "U.S. EAGLE",
        "nmls_id": "463291",
        "our_lender_slug": "us-eagle-federal-credit-union",
        "legal_name": "U.S. Eagle Federal Credit Union",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif+public_nmls",
    },
    "2549008NZFLT1BQ8EN23": {
        "institution_name_hmda": "Kirtland Federal Credit Union",
        "nmls_id": "",
        "our_lender_slug": "kirtland-federal-credit-union",
        "legal_name": "Kirtland Federal Credit Union",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif+lei_identity",
    },
    "549300L3IHIP0RH6IY76": {
        "institution_name_hmda": "SANDIA AREA",
        "nmls_id": "",
        "our_lender_slug": "sandia-area-federal-credit-union",
        "legal_name": "Sandia Area Federal Credit Union",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif+lei_identity",
    },
    "549300L5PE7ZGYRW5Q15": {
        "institution_name_hmda": "Citizens Bank of Las Cruces",
        "nmls_id": "",
        "our_lender_slug": "citizens-bank-of-las-cruces",
        "legal_name": "Citizens Bank of Las Cruces",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif+lei_identity",
    },
    # ── West Virginia regionals ──────────────────────────────────────────────
    "549300KJZ82173UB3I21": {
        "institution_name_hmda": "City National Bank of West Virginia",
        "nmls_id": "",
        "our_lender_slug": "city-national-bank-of-west-virginia",
        "legal_name": "City National Bank of West Virginia",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif+lei_identity",
    },
    "I70W3N0Z6KOX8FYIH023": {
        "institution_name_hmda": "Peoples Bank",
        "nmls_id": "",
        "our_lender_slug": "peoples-bank-west-virginia",
        "legal_name": "Peoples Bank (West Virginia / Ohio Valley)",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif+lei_identity",
    },
    "549300KNZ6E1MM7RQQ04": {
        "institution_name_hmda": "Clear Mountain Bank",
        "nmls_id": "",
        "our_lender_slug": "clear-mountain-bank",
        "legal_name": "Clear Mountain Bank",
        "match_confidence": "high",
        "match_method": "nm_wv_gleif+lei_identity",
    },
}

# FIPS maps — Doña Ana stored as "Dona Ana" for ASCII slug dona-ana
NM_COUNTIES: dict[str, str] = {
    "35001": "Bernalillo",
    "35005": "Chaves",
    "35009": "Curry",
    "35013": "Dona Ana",
    "35015": "Eddy",
    "35017": "Grant",
    "35025": "Lea",
    "35027": "Lincoln",
    "35028": "Los Alamos",
    "35031": "McKinley",
    "35035": "Otero",
    "35039": "Rio Arriba",
    "35043": "Sandoval",
    "35045": "San Juan",
    "35049": "Santa Fe",
    "35055": "Taos",
    "35057": "Torrance",
    "35061": "Valencia",
}

NM_MAJORS: set[str] = {
    "35001",  # Bernalillo
    "35043",  # Sandoval
    "35013",  # Dona Ana
    "35049",  # Santa Fe
    "35061",  # Valencia
    "35045",  # San Juan
    "35035",  # Otero
    "35015",  # Eddy
    "35005",  # Chaves
    "35025",  # Lea
    "35009",  # Curry
    "35028",  # Los Alamos
    "35055",  # Taos
    "35027",  # Lincoln
    "35057",  # Torrance
    "35017",  # Grant
    "35039",  # Rio Arriba
    "35031",  # McKinley
}

WV_COUNTIES: dict[str, str] = {
    "54003": "Berkeley",
    "54011": "Cabell",
    "54019": "Fayette",
    "54025": "Greenbrier",
    "54027": "Hampshire",
    "54029": "Hancock",
    "54033": "Harrison",
    "54037": "Jefferson",
    "54039": "Kanawha",
    "54049": "Marion",
    "54055": "Mercer",
    "54061": "Monongalia",
    "54065": "Morgan",
    "54069": "Ohio",
    "54079": "Putnam",
    "54081": "Raleigh",
    "54099": "Wayne",
    "54107": "Wood",
}

WV_MAJORS: set[str] = {
    "54003",  # Berkeley
    "54039",  # Kanawha
    "54037",  # Jefferson
    "54061",  # Monongalia
    "54011",  # Cabell
    "54107",  # Wood
    "54081",  # Raleigh
    "54079",  # Putnam
    "54033",  # Harrison
    "54049",  # Marion
    "54055",  # Mercer
    "54069",  # Ohio
    "54027",  # Hampshire
    "54025",  # Greenbrier
    "54065",  # Morgan
    "54019",  # Fayette
    "54099",  # Wayne
    "54029",  # Hancock
}

STATES = [
    {
        "code": "NM",
        "name": "New Mexico",
        "folder": "new-mexico",
        "suffix": "_nm",
        "col": "new_mexico_originations",
        "alias_col": "nm_originations",
        "counties": NM_COUNTIES,
        "majors": NM_MAJORS,
    },
    {
        "code": "WV",
        "name": "West Virginia",
        "folder": "west-virginia",
        "suffix": "_wv",
        "col": "west_virginia_originations",
        "alias_col": "wv_originations",
        "counties": WV_COUNTIES,
        "majors": WV_MAJORS,
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
    # Normalize ñ/Ñ and other diacritics for directory-safe slugs (Doña Ana → dona-ana)
    s = name.strip().lower()
    s = s.replace("ñ", "n").replace("á", "a").replace("é", "e").replace("í", "i")
    s = s.replace("ó", "o").replace("ú", "u").replace("ü", "u")
    s = s.replace(".", "").replace("'", "")
    s = re.sub(r"\s+", "-", s)
    return re.sub(r"[^a-z0-9-]", "", s)


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
        if name or fips in majors or orig >= 400:
            county_out.append(r)

    state_rows = read_csv(src / "lender_state_summary.csv")
    enriched: list[dict[str, str]] = []
    for r in state_rows:
        lei = (r.get("lei") or "").strip()
        if not (r.get("institution_name") or "").strip():
            nm = gleif.get(lei) or (lei_to_map.get(lei) or {}).get("institution_name_hmda")
            if not nm and lei in CURATED_LEI:
                nm = CURATED_LEI[lei]["institution_name_hmda"]
            if nm:
                r = {**r, "institution_name": nm}
        enriched.append(r)
    state_rows = enriched

    act_out: list[dict[str, str]] = []
    for r in read_csv(src / "lender_activity_by_county.csv"):
        r = fill_county(r, counties_map)
        fips = (r.get("county_fips") or "").strip()
        if not (r.get("county_name") or "").strip() or fips not in majors:
            continue
        lei = (r.get("lei") or "").strip()
        if not (r.get("institution_name") or "").strip():
            nm = gleif.get(lei) or (lei_to_map.get(lei) or {}).get("institution_name_hmda")
            if not nm and lei in CURATED_LEI:
                nm = CURATED_LEI[lei]["institution_name_hmda"]
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
        if method_prefix.startswith("nm_wv_curated") and curated_slug:
            slug = curated_slug
        else:
            slug = NATIONAL_SLUG_BY_NMLS.get(nmls) or curated_slug
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
            if not method_prefix.startswith("nm_wv_curated"):
                return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_prior_state_curated_lei+")
    for lei, cur in CURATED_LEI.items():
        add_mapping(lei, cur, "nm_wv_curated+")

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
        "- Reuse prior product-state curated LEI maps when the LEI has activity in this state\n"
        "- NM curated: Waterstone Mortgage, Nusenda, Sunward FCU, U.S. Eagle FCU, Kirtland FCU, "
        "Sandia Area FCU, Citizens Bank of Las Cruces\n"
        "- WV curated: City National Bank of WV, Peoples Bank, Clear Mountain Bank "
        "(+ Huntington / WesBanco / United Bank / Truist reuse)\n"
        "- Doña Ana → directory slug `dona-ana` (ASCII-safe)\n"
        "- Precision over coverage — no fuzzy LEI inventing\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-nm-wv-slices.py\n"
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
    for lei, cur in CURATED_LEI.items():
        gleif.setdefault(lei, cur["institution_name_hmda"])
    if GLEIF_CACHE.exists():
        GLEIF_CACHE.write_text(json.dumps(gleif, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    for cfg in STATES:
        build_state(cfg, lei_to_map, gleif)


if __name__ == "__main__":
    main()
