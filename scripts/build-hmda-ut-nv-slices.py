#!/usr/bin/env python3
"""
Build Utah and Nevada HMDA product slices.

  python scripts/build-hmda-ut-nv-slices.py

Source: data/hmda/by-state/{UT,NV}/
Does not modify Missouri / Kentucky or other product-state slices.
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
    "1820": "cmg-home-loans-dennis-vo",
    "2458338": "cmg-home-loans-dennis-vo",
    "1850": "american-pacific-mortgage-inland-empire",
    "75243": "prmg",
    "1124061": "lower",
    "1921": "primelending-columbus",
    "2909": "fairway-mortgage-augusta-sheppard",
    "1168": "amerisave",
    "3113": "academy-mortgage",
    "1907": "veterans-united-west-valley",
    "1058": "lennar-mortgage-queen-creek",
    "467014": "zions-bank",
    "1025894": "mutual-of-omaha-mortgage",
    "237341": "american-financial-network",
    "130676": "homeamerican-mortgage",
    "3094": "primary-residential-mortgage",
    "458903": "security-service-federal-credit-union",
    # UT / NV curated
    "412819": "america-first-federal-credit-union",
    "462815": "mountain-america-federal-credit-union",
    "190465": "intercap-lending",
    "440574": "goldenwest-federal-credit-union",
    "3112": "first-colony-mortgage",
    "3116": "securitynational-mortgage",
    "407653": "utah-community-credit-union",
    "3151": "ranlife",
    "422914": "bank-of-utah",
    "403075": "deseret-first-credit-union",
    "446035": "utah-first-credit-union",
    "423149": "chartway-federal-credit-union",
    "178787": "security-home-mortgage",
    "279738": "greater-nevada-credit-union",
    "3821": "provident-funding",
}

# GLEIF-verified LEI identities → directory slugs (high confidence only).
UT_NV_CURATED_LEI: dict[str, dict[str, str]] = {
    # ── National LEI re-identify (override any corrupted prior-state rows) ───
    "549300HW662MN1WU8550": {
        "institution_name_hmda": "United Wholesale Mortgage, LLC",
        "nmls_id": "3038",
        "our_lender_slug": "united-wholesale-mortgage",
        "legal_name": "United Wholesale Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "549300FGXN1K3HLB1R50": {
        "institution_name_hmda": "Rocket Mortgage, LLC",
        "nmls_id": "3030",
        "our_lender_slug": "rocket-mortgage",
        "legal_name": "Rocket Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "549300AQ3T62GXDU7D76": {
        "institution_name_hmda": "GUILD MORTGAGE COMPANY LLC",
        "nmls_id": "3274",
        "our_lender_slug": "guild-mortgage-metrowest",
        "legal_name": "Guild Mortgage Company LLC",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "549300VZVN841I2ILS84": {
        "institution_name_hmda": "CROSSCOUNTRY MORTGAGE, LLC",
        "nmls_id": "3029",
        "our_lender_slug": "crosscountry-mortgage-metrowest",
        "legal_name": "CrossCountry Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "549300LYRWPSYPK6S325": {
        "institution_name_hmda": "FREEDOM MORTGAGE CORPORATION",
        "nmls_id": "2767",
        "our_lender_slug": "freedom-mortgage",
        "legal_name": "Freedom Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "549300AG64NHILB7ZP05": {
        "institution_name_hmda": "LOANDEPOT.COM, LLC",
        "nmls_id": "174457",
        "our_lender_slug": "loandepot",
        "legal_name": "loanDepot.com, LLC",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "RVDPPPGHCGZ40J4VQ731": {
        "institution_name_hmda": "PENNYMAC LOAN SERVICES, LLC",
        "nmls_id": "35953",
        "our_lender_slug": "pennymac",
        "legal_name": "PennyMac Loan Services, LLC",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "549300U3721PJGQZYY68": {
        "institution_name_hmda": "GUARANTEED RATE, INC.",
        "nmls_id": "2611",
        "our_lender_slug": "guaranteed-rate",
        "legal_name": "Guaranteed Rate, Inc.",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "549300H3IZO24NSOO931": {
        "institution_name_hmda": "LENNAR MORTGAGE, LLC",
        "nmls_id": "1058",
        "our_lender_slug": "lennar-mortgage-queen-creek",
        "legal_name": "Lennar Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "5493001SXWZ4OFP8Z903": {
        "institution_name_hmda": "DHI MORTGAGE COMPANY, LTD.",
        "nmls_id": "14622",
        "our_lender_slug": "dhi-mortgage-buckeye",
        "legal_name": "DHI Mortgage Company, Ltd.",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+directory_slug",
    },
    "549300LBCBNR1OT00651": {
        "institution_name_hmda": "NATIONSTAR MORTGAGE LLC",
        "nmls_id": "2104",
        "our_lender_slug": "mr-cooper",
        "legal_name": "Nationstar Mortgage LLC",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "549300MGPZBLQDIL7538": {
        "institution_name_hmda": "FAIRWAY INDEPENDENT MORTGAGE CORPORATION",
        "nmls_id": "2909",
        "our_lender_slug": "fairway-mortgage-augusta-sheppard",
        "legal_name": "Fairway Independent Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "549300DD5QQUHO6PCH70": {
        "institution_name_hmda": "MORTGAGE RESEARCH CENTER, LLC",
        "nmls_id": "1907",
        "our_lender_slug": "veterans-united-west-valley",
        "legal_name": "Mortgage Research Center, LLC (Veterans United Home Loans)",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "549300FNXYY540N23N64": {
        "institution_name_hmda": "Newrez LLC",
        "nmls_id": "2289",
        "our_lender_slug": "newrez",
        "legal_name": "Newrez LLC",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "549300E2UX99HKDBR481": {
        "institution_name_hmda": "NEW AMERICAN FUNDING, LLC",
        "nmls_id": "6606",
        "our_lender_slug": "new-american-funding",
        "legal_name": "New American Funding, LLC",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "6BYL5QZYBDK8S7L73M02": {
        "institution_name_hmda": "U.S. Bank National Association",
        "nmls_id": "402216",
        "our_lender_slug": "us-bank",
        "legal_name": "U.S. Bank National Association",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "7H6GLXDRUGQFU57RNE97": {
        "institution_name_hmda": "JPMorgan Chase Bank, National Association",
        "nmls_id": "399798",
        "our_lender_slug": "jpmorgan-chase-bank",
        "legal_name": "JPMorgan Chase Bank, National Association",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "5493003GQDUH26DNNH17": {
        "institution_name_hmda": "Navy Federal Credit Union",
        "nmls_id": "399807",
        "our_lender_slug": "navy-federal-jacksonville",
        "legal_name": "Navy Federal Credit Union",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "254900DTLHVWQ7NP7R34": {
        "institution_name_hmda": "CMG Mortgage, Inc.",
        "nmls_id": "1820",
        "our_lender_slug": "cmg-home-loans-dennis-vo",
        "legal_name": "CMG Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "549300GKFNPRWNS0GF29": {
        "institution_name_hmda": "AmeriHome Mortgage Company, LLC",
        "nmls_id": "1120271",
        "our_lender_slug": "amerihome-mortgage",
        "legal_name": "AmeriHome Mortgage Company, LLC",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "549300DD4R4SYK5RAQ92": {
        "institution_name_hmda": "MOVEMENT MORTGAGE, LLC",
        "nmls_id": "39179",
        "our_lender_slug": "movement-mortgage-myrtle-beach",
        "legal_name": "Movement Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "549300OPCWU6E72WUT29": {
        "institution_name_hmda": "MUTUAL OF OMAHA MORTGAGE, INC.",
        "nmls_id": "1025894",
        "our_lender_slug": "mutual-of-omaha-mortgage",
        "legal_name": "Mutual of Omaha Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "KB1H1DSPRFMYMCUFXT09": {
        "institution_name_hmda": "Wells Fargo Bank, National Association",
        "nmls_id": "399801",
        "our_lender_slug": "wells-fargo-bank",
        "legal_name": "Wells Fargo Bank, National Association",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "549300PIL8LFAQ04XC20": {
        "institution_name_hmda": "Better Mortgage Corporation",
        "nmls_id": "330511",
        "our_lender_slug": "better-mortgage",
        "legal_name": "Better Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "549300YIQ7S7Z8PIHE53": {
        "institution_name_hmda": "AMERISAVE MORTGAGE CORPORATION",
        "nmls_id": "1168",
        "our_lender_slug": "amerisave",
        "legal_name": "Amerisave Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "5493004WMLN60ZJ2ON46": {
        "institution_name_hmda": "Paramount Residential Mortgage Group, Inc.",
        "nmls_id": "75243",
        "our_lender_slug": "prmg",
        "legal_name": "Paramount Residential Mortgage Group, Inc.",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    "254900ZFWS2106HWPH46": {
        "institution_name_hmda": "PARAMOUNT RESIDENTIAL MORTGAGE GROUP, INC.",
        "nmls_id": "75243",
        "our_lender_slug": "prmg",
        "legal_name": "Paramount Residential Mortgage Group, Inc.",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif_reidentify+public_nmls",
    },
    # ── Utah majors ──────────────────────────────────────────────────────────
    "5493007I0X1GRWIU8B34": {
        "institution_name_hmda": "AMERICA FIRST Federal Credit Union",
        "nmls_id": "412819",
        "our_lender_slug": "america-first-federal-credit-union",
        "legal_name": "America First Federal Credit Union",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif+public_nmls",
    },
    "5493006S869XKIESMV41": {
        "institution_name_hmda": "Mountain America Federal Credit Union",
        "nmls_id": "462815",
        "our_lender_slug": "mountain-america-federal-credit-union",
        "legal_name": "Mountain America Federal Credit Union",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif+public_nmls",
    },
    "549300S5FVOSK5DQJN30": {
        "institution_name_hmda": "INTERCAP LENDING INC.",
        "nmls_id": "190465",
        "our_lender_slug": "intercap-lending",
        "legal_name": "Intercap Lending Inc.",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif+public_nmls",
    },
    "549300BDHZAV4ZQHQV19": {
        "institution_name_hmda": "GOLDENWEST",
        "nmls_id": "440574",
        "our_lender_slug": "goldenwest-federal-credit-union",
        "legal_name": "Goldenwest Federal Credit Union",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif+public_nmls",
    },
    "5493003V40VGM7YDFM54": {
        "institution_name_hmda": "FIRST COLONY MORTGAGE CORPORATION",
        "nmls_id": "3112",
        "our_lender_slug": "first-colony-mortgage",
        "legal_name": "First Colony Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif+public_nmls",
    },
    "549300VQUTI5IU7GXT57": {
        "institution_name_hmda": "SECURITYNATIONAL MORTGAGE COMPANY",
        "nmls_id": "3116",
        "our_lender_slug": "securitynational-mortgage",
        "legal_name": "SecurityNational Mortgage Company",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif+public_nmls",
    },
    "549300BOLK89ZL7BNX85": {
        "institution_name_hmda": "UTAH COMMUNITY FEDERAL CREDIT UNION",
        "nmls_id": "407653",
        "our_lender_slug": "utah-community-credit-union",
        "legal_name": "Utah Community Federal Credit Union",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif+public_nmls",
    },
    "549300W1HU6IVVIEJ389": {
        "institution_name_hmda": "RANLIFE, INC.",
        "nmls_id": "3151",
        "our_lender_slug": "ranlife",
        "legal_name": "RanLife, Inc.",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif+public_nmls",
    },
    "549300NNL9H573MWO110": {
        "institution_name_hmda": "BANK OF UTAH",
        "nmls_id": "422914",
        "our_lender_slug": "bank-of-utah",
        "legal_name": "Bank of Utah",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif+public_nmls",
    },
    "254900FFZUXK3B729T97": {
        "institution_name_hmda": "Deseret First Credit Union",
        "nmls_id": "403075",
        "our_lender_slug": "deseret-first-credit-union",
        "legal_name": "Deseret First Credit Union",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif+public_nmls",
    },
    "549300DEVPMBR765WH45": {
        "institution_name_hmda": "UTAH FIRST",
        "nmls_id": "446035",
        "our_lender_slug": "utah-first-credit-union",
        "legal_name": "Utah First Credit Union",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif+public_nmls",
    },
    "549300NWKILSNQAIG053": {
        "institution_name_hmda": "CHARTWAY FEDERAL CREDIT UNION",
        "nmls_id": "423149",
        "our_lender_slug": "chartway-federal-credit-union",
        "legal_name": "Chartway Federal Credit Union",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif+public_nmls",
    },
    "5493008I5A5R6730MQ84": {
        "institution_name_hmda": "SECURITY HOME MORTGAGE, LLC",
        "nmls_id": "178787",
        "our_lender_slug": "security-home-mortgage",
        "legal_name": "Security Home Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif+public_nmls",
    },
    "54930043BMDE130FJ617": {
        "institution_name_hmda": "PROVIDENT FUNDING ASSOCIATES, L.P.",
        "nmls_id": "3821",
        "our_lender_slug": "provident-funding",
        "legal_name": "Provident Funding Associates, L.P.",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif+public_nmls",
    },
    "54930052M48FOD3CWA54": {
        "institution_name_hmda": "PRIMARY RESIDENTIAL MORTGAGE, INC.",
        "nmls_id": "3094",
        "our_lender_slug": "primary-residential-mortgage",
        "legal_name": "Primary Residential Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "ut_nv_reuse_directory+public_nmls",
    },
    "549300XWUSRVVOHPRY47": {
        "institution_name_hmda": "Academy Mortgage Corporation",
        "nmls_id": "3113",
        "our_lender_slug": "academy-mortgage",
        "legal_name": "Academy Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "ut_nv_reuse_directory+public_nmls",
    },
    "8WH0EE09O9V05QJZ3V89": {
        "institution_name_hmda": "Zions Bancorporation, N.A.",
        "nmls_id": "467014",
        "our_lender_slug": "zions-bank",
        "legal_name": "Zions Bancorporation, N.A.",
        "match_confidence": "high",
        "match_method": "ut_nv_reuse_directory+public_nmls",
    },
    # ── Nevada regionals ─────────────────────────────────────────────────────
    "549300QZED00YTPAWQ69": {
        "institution_name_hmda": "GREATER NEVADA LLC",
        "nmls_id": "279738",
        "our_lender_slug": "greater-nevada-credit-union",
        "legal_name": "Greater Nevada Credit Union",
        "match_confidence": "high",
        "match_method": "ut_nv_gleif+public_nmls",
    },
    # Shared nationals re-identified for name enrichment
    "549300MZ8VZJOVC63092": {
        "institution_name_hmda": "KIND LENDING, LLC",
        "nmls_id": "",
        "our_lender_slug": "kind-lending",
        "legal_name": "Kind Lending, LLC",
        "match_confidence": "high",
        "match_method": "ut_nv_reuse_directory+gleif",
    },
    "5493001HHBUTXHS7TZ96": {
        "institution_name_hmda": "HOMEAMERICAN MORTGAGE CORPORATION",
        "nmls_id": "130676",
        "our_lender_slug": "homeamerican-mortgage",
        "legal_name": "HomeAmerican Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "ut_nv_reuse_directory+public_nmls",
    },
    "549300KIOYNU323LVJ37": {
        "institution_name_hmda": "AMERICAN PACIFIC MORTGAGE CORPORATION",
        "nmls_id": "1850",
        "our_lender_slug": "american-pacific-mortgage-inland-empire",
        "legal_name": "American Pacific Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "ut_nv_reuse_directory+public_nmls",
    },
}

UT_COUNTIES: dict[str, str] = {
    "49001": "Beaver",
    "49003": "Box Elder",
    "49005": "Cache",
    "49007": "Carbon",
    "49009": "Daggett",
    "49011": "Davis",
    "49013": "Duchesne",
    "49015": "Emery",
    "49017": "Garfield",
    "49019": "Grand",
    "49021": "Iron",
    "49023": "Juab",
    "49025": "Kane",
    "49027": "Millard",
    "49029": "Morgan",
    "49031": "Piute",
    "49033": "Rich",
    "49035": "Salt Lake",
    "49037": "San Juan",
    "49039": "Sanpete",
    "49041": "Sevier",
    "49043": "Summit",
    "49045": "Tooele",
    "49047": "Uintah",
    "49049": "Utah",
    "49051": "Wasatch",
    "49053": "Washington",
    "49055": "Wayne",
    "49057": "Weber",
}

# Wave 1 majors — Wasatch Front + secondary high-volume markets
UT_MAJORS: set[str] = {
    "49035",  # Salt Lake
    "49049",  # Utah
    "49011",  # Davis
    "49057",  # Weber
    "49053",  # Washington
    "49005",  # Cache
    "49045",  # Tooele
    "49043",  # Summit
    "49021",  # Iron
    "49003",  # Box Elder
    "49051",  # Wasatch
    "49047",  # Uintah
    "49039",  # Sanpete
    "49041",  # Sevier
    "49007",  # Carbon
    "49029",  # Morgan
}

NV_COUNTIES: dict[str, str] = {
    "32001": "Churchill",
    "32003": "Clark",
    "32005": "Douglas",
    "32007": "Elko",
    "32009": "Esmeralda",
    "32011": "Eureka",
    "32013": "Humboldt",
    "32015": "Lander",
    "32017": "Lincoln",
    "32019": "Lyon",
    "32021": "Mineral",
    "32023": "Nye",
    "32027": "Pershing",
    "32029": "Storey",
    "32031": "Washoe",
    "32033": "White Pine",
    "32510": "Carson City",
}

NV_MAJORS: set[str] = {
    "32003",  # Clark
    "32031",  # Washoe
    "32019",  # Lyon
    "32023",  # Nye
    "32005",  # Douglas
    "32007",  # Elko
    "32510",  # Carson City
    "32001",  # Churchill
    "32013",  # Humboldt
}

STATES = [
    {
        "code": "UT",
        "name": "Utah",
        "folder": "utah",
        "suffix": "_ut",
        "col": "utah_originations",
        "alias_col": "ut_originations",
        "counties": UT_COUNTIES,
        "majors": UT_MAJORS,
    },
    {
        "code": "NV",
        "name": "Nevada",
        "folder": "nevada",
        "suffix": "_nv",
        "col": "nevada_originations",
        "alias_col": "nv_originations",
        "counties": NV_COUNTIES,
        "majors": NV_MAJORS,
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
    return (
        name.strip()
        .lower()
        .replace(".", "")
        .replace("'", "")
        .replace(" ", "-")
    )


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
    enriched_state: list[dict[str, str]] = []
    for r in state_rows:
        lei = (r.get("lei") or "").strip()
        if not (r.get("institution_name") or "").strip():
            nm = gleif.get(lei) or (lei_to_map.get(lei) or {}).get("institution_name_hmda")
            if not nm and lei in UT_NV_CURATED_LEI:
                nm = UT_NV_CURATED_LEI[lei]["institution_name_hmda"]
            if nm:
                r = {**r, "institution_name": nm}
        enriched_state.append(r)
    state_rows = enriched_state

    act_out: list[dict[str, str]] = []
    for r in read_csv(src / "lender_activity_by_county.csv"):
        r = fill_county(r, counties_map)
        fips = (r.get("county_fips") or "").strip()
        if not (r.get("county_name") or "").strip() or fips not in majors:
            continue
        lei = (r.get("lei") or "").strip()
        if not (r.get("institution_name") or "").strip():
            nm = gleif.get(lei) or (lei_to_map.get(lei) or {}).get("institution_name_hmda")
            if not nm and lei in UT_NV_CURATED_LEI:
                nm = UT_NV_CURATED_LEI[lei]["institution_name_hmda"]
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
        if method_prefix.startswith("ut_nv_curated") and curated_slug:
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
            if not method_prefix.startswith("ut_nv_curated"):
                return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_prior_state_curated_lei+")
    for lei, cur in UT_NV_CURATED_LEI.items():
        add_mapping(lei, cur, "ut_nv_curated+")

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
    for r in mapping_rows[:25]:
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
        "- UT/NV curated: America First FCU, Mountain America FCU, Intercap, Goldenwest, "
        "First Colony, SecurityNational, Utah Community CU, RanLife, Bank of Utah, "
        "Deseret First, Utah First, Chartway, Security Home Mortgage, Provident Funding, "
        "Greater Nevada CU, plus Academy / PRMI / Zions directory reuse\n"
        "- Precision over coverage — no fuzzy LEI inventing\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-ut-nv-slices.py\n"
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
    for lei, cur in UT_NV_CURATED_LEI.items():
        gleif.setdefault(lei, cur["institution_name_hmda"])
    # Named LEIs from GLEIF used for enrichment only
    extra_gleif = {
        "5493007I0X1GRWIU8B34": "AMERICA FIRST Federal Credit Union",
        "5493006S869XKIESMV41": "Mountain America Federal Credit Union",
        "549300S5FVOSK5DQJN30": "INTERCAP LENDING INC.",
        "549300BDHZAV4ZQHQV19": "GOLDENWEST",
        "549300VQUTI5IU7GXT57": "SECURITYNATIONAL MORTGAGE COMPANY",
        "549300BOLK89ZL7BNX85": "UTAH COMMUNITY FEDERAL CREDIT UNION",
        "549300W1HU6IVVIEJ389": "RANLIFE, INC.",
        "549300NNL9H573MWO110": "BANK OF UTAH",
        "254900FFZUXK3B729T97": "Deseret First Credit Union",
        "549300DEVPMBR765WH45": "UTAH FIRST",
        "549300NWKILSNQAIG053": "CHARTWAY FEDERAL CREDIT UNION",
        "5493008I5A5R6730MQ84": "SECURITY HOME MORTGAGE, LLC",
        "549300QZED00YTPAWQ69": "GREATER NEVADA LLC",
        "549300WSQPVY1NRH6062": "SILVER STATE SCHOOLS SERVICE COMPANY, LLC",
        "549300PKEQ3Q9S0IXW76": "UNITED FEDERAL CREDIT UNION",
        "549300PMVNBERP6TB157": "ONE NEVADA CREDIT UNION",
        "5493002QI2ILHHZH8D20": "KBHS HOME LOANS, LLC",
        "549300HS714PZ0BMPN11": "CYPRUS Federal Credit Union",
        "5493000KQ2PZ8G6VNI80": "CANYON VIEW",
        "549300ZWNETGFXTBBY03": "CANOPY MORTGAGE, LLC",
        "549300IQGEUYRQBJC007": "State Bank of Southern Utah",
        "54930016ZSB1QWXLRJ13": "MY MOVE MORTGAGE, LLC",
    }
    for lei, name in extra_gleif.items():
        gleif.setdefault(lei, name)
    if GLEIF_CACHE.exists():
        GLEIF_CACHE.write_text(json.dumps(gleif, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    for cfg in STATES:
        build_state(cfg, lei_to_map, gleif)


if __name__ == "__main__":
    main()
