#!/usr/bin/env python3
"""
Deepen Oregon HMDA product coverage (high-volume phase).

  python scripts/build-hmda-oregon-deepen.py

Source: data/hmda/by-state/OR/
Writes: data/hmda/oregon/*_or.csv + lei_to_nmls_mapping.csv
Patches: lib/hmda/states.ts OR majorCountySlugs
"""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "data" / "hmda" / "by-state" / "OR"
OUT = ROOT / "data" / "hmda" / "oregon"
GLEIF_CACHE = ROOT / "data" / "hmda" / "florida" / "_gleif_name_cache.json"
STATE_TS = ROOT / "lib" / "hmda" / "states.ts"

OR_COUNTIES: dict[str, str] = {
    "41051": "Multnomah",
    "41067": "Washington",
    "41005": "Clackamas",
    "41039": "Lane",
    "41047": "Marion",
    "41017": "Deschutes",
    "41029": "Jackson",
    "41043": "Linn",
    "41071": "Yamhill",
    "41019": "Douglas",
    "41053": "Polk",
    "41033": "Josephine",
    "41059": "Umatilla",
    "41035": "Klamath",
    "41003": "Benton",
    "41011": "Coos",
    "41041": "Lincoln",
    "41009": "Columbia",
    # Deepen band
    "41007": "Clatsop",
    "41013": "Crook",
    "41057": "Tillamook",
    "41031": "Jefferson",
    "41061": "Union",
    "41065": "Wasco",
    "41045": "Malheur",
    "41015": "Curry",
    "41027": "Hood River",
}

OR_MAJORS: set[str] = set(OR_COUNTIES.keys())

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
    "402216": "us-bank",
    "399809": "usaa-federal-savings-bank",
    "39179": "movement-mortgage-myrtle-beach",
    "3274": "guild-mortgage-metrowest",
    "3029": "crosscountry-mortgage-metrowest",
    "399807": "navy-federal-jacksonville",
    "1820": "cmg-home-loans-dennis-vo",
    "75243": "prmg",
    "1124061": "lower",
    "1921": "primelending-columbus",
    "2909": "fairway-mortgage-augusta-sheppard",
    "1168": "amerisave",
    "3113": "academy-mortgage",
    "1907": "veterans-united-west-valley",
    "1058": "lennar-mortgage-queen-creek",
    "14622": "dhi-mortgage-buckeye",
    "399802": "bank-of-america-mortgage-west-valley",
    "2280": "21st-mortgage",
    "2143": "benchmark-mortgage",
    "3925": "kind-lending",
    "1904": "union-home-mortgage-reeves-team",
    "1561": "silverton-mortgage-myrtle-beach",
    "2113": "plaza-home-mortgage",
    "3821": "provident-funding",
    "1027871": "zillow-home-loans",
    "17022": "planet-home-lending",
    "167441": "amwest-funding",
    "3116": "securitynational-mortgage",
    "1025894": "mutual-of-omaha-mortgage",
    "2925": "eagle-home-mortgage",
    "1850": "american-pacific-mortgage-inland-empire",
    "1591": "churchill-mortgage-nashville",
    "405464": "rivermark-community-credit-union",
    "476661": "unitus-community-credit-union",
    "462882": "maps-credit-union",
    "3240": "directors-mortgage",
    "217251": "first-community-credit-union-oregon",
}

OR_CURATED_LEI: dict[str, dict[str, str]] = {
    # Nationals re-ID
    "549300HW662MN1WU8550": {
        "institution_name_hmda": "United Wholesale Mortgage, LLC",
        "nmls_id": "3038",
        "our_lender_slug": "united-wholesale-mortgage",
        "legal_name": "United Wholesale Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "549300FGXN1K3HLB1R50": {
        "institution_name_hmda": "Rocket Mortgage, LLC",
        "nmls_id": "3030",
        "our_lender_slug": "rocket-mortgage",
        "legal_name": "Rocket Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "549300AQ3T62GXDU7D76": {
        "institution_name_hmda": "GUILD MORTGAGE COMPANY LLC",
        "nmls_id": "3274",
        "our_lender_slug": "guild-mortgage-metrowest",
        "legal_name": "Guild Mortgage Company LLC",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "6BYL5QZYBDK8S7L73M02": {
        "institution_name_hmda": "U.S. Bank National Association",
        "nmls_id": "402216",
        "our_lender_slug": "us-bank",
        "legal_name": "U.S. Bank National Association",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "549300GKFNPRWNS0GF29": {
        "institution_name_hmda": "AmeriHome Mortgage Company, LLC",
        "nmls_id": "1120271",
        "our_lender_slug": "amerihome-mortgage",
        "legal_name": "AmeriHome Mortgage Company, LLC",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "RVDPPPGHCGZ40J4VQ731": {
        "institution_name_hmda": "PENNYMAC LOAN SERVICES, LLC",
        "nmls_id": "35953",
        "our_lender_slug": "pennymac",
        "legal_name": "PennyMac Loan Services, LLC",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "549300VZVN841I2ILS84": {
        "institution_name_hmda": "CROSSCOUNTRY MORTGAGE, LLC",
        "nmls_id": "3029",
        "our_lender_slug": "crosscountry-mortgage-metrowest",
        "legal_name": "CrossCountry Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "549300FNXYY540N23N64": {
        "institution_name_hmda": "Newrez LLC",
        "nmls_id": "2289",
        "our_lender_slug": "newrez",
        "legal_name": "Newrez LLC",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "549300AG64NHILB7ZP05": {
        "institution_name_hmda": "LOANDEPOT.COM, LLC",
        "nmls_id": "174457",
        "our_lender_slug": "loandepot",
        "legal_name": "loanDepot.com, LLC",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "549300MGPZBLQDIL7538": {
        "institution_name_hmda": "FAIRWAY INDEPENDENT MORTGAGE CORPORATION",
        "nmls_id": "2909",
        "our_lender_slug": "fairway-mortgage-augusta-sheppard",
        "legal_name": "Fairway Independent Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "549300U3721PJGQZYY68": {
        "institution_name_hmda": "GUARANTEED RATE, INC.",
        "nmls_id": "2611",
        "our_lender_slug": "guaranteed-rate",
        "legal_name": "Guaranteed Rate, Inc.",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "B4TYDEB6GKMZO031MB27": {
        "institution_name_hmda": "Bank of America, National Association",
        "nmls_id": "399802",
        "our_lender_slug": "bank-of-america-mortgage-west-valley",
        "legal_name": "Bank of America, National Association",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "549300DD4R4SYK5RAQ92": {
        "institution_name_hmda": "MOVEMENT MORTGAGE, LLC",
        "nmls_id": "39179",
        "our_lender_slug": "movement-mortgage-myrtle-beach",
        "legal_name": "Movement Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "549300MZ8VZJOVC63092": {
        "institution_name_hmda": "KIND LENDING, LLC",
        "nmls_id": "3925",
        "our_lender_slug": "kind-lending",
        "legal_name": "Kind Lending, LLC",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+public_nmls",
    },
    "549300KIOYNU323LVJ37": {
        "institution_name_hmda": "AMERICAN PACIFIC MORTGAGE CORPORATION",
        "nmls_id": "1850",
        "our_lender_slug": "american-pacific-mortgage-inland-empire",
        "legal_name": "American Pacific Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "549300DD5QQUHO6PCH70": {
        "institution_name_hmda": "MORTGAGE RESEARCH CENTER, LLC",
        "nmls_id": "1907",
        "our_lender_slug": "veterans-united-west-valley",
        "legal_name": "Mortgage Research Center, LLC (Veterans United Home Loans)",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "254900DTLHVWQ7NP7R34": {
        "institution_name_hmda": "CMG Mortgage, Inc.",
        "nmls_id": "1820",
        "our_lender_slug": "cmg-home-loans-dennis-vo",
        "legal_name": "CMG Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "7H6GLXDRUGQFU57RNE97": {
        "institution_name_hmda": "JPMorgan Chase Bank, National Association",
        "nmls_id": "399798",
        "our_lender_slug": "jpmorgan-chase-bank",
        "legal_name": "JPMorgan Chase Bank, National Association",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "549300RPOGWJRH63HS39": {
        "institution_name_hmda": "UNION HOME MORTGAGE CORP.",
        "nmls_id": "1904",
        "our_lender_slug": "union-home-mortgage-reeves-team",
        "legal_name": "Union Home Mortgage Corp.",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "549300LYRWPSYPK6S325": {
        "institution_name_hmda": "FREEDOM MORTGAGE CORPORATION",
        "nmls_id": "2767",
        "our_lender_slug": "freedom-mortgage",
        "legal_name": "Freedom Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "549300H3IZO24NSOO931": {
        "institution_name_hmda": "LENNAR MORTGAGE, LLC",
        "nmls_id": "1058",
        "our_lender_slug": "lennar-mortgage-queen-creek",
        "legal_name": "Lennar Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+directory_slug",
    },
    "549300LBCBNR1OT00651": {
        "institution_name_hmda": "NATIONSTAR MORTGAGE LLC",
        "nmls_id": "2104",
        "our_lender_slug": "mr-cooper",
        "legal_name": "Nationstar Mortgage LLC",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "254900ZFWS2106HWPH46": {
        "institution_name_hmda": "PARAMOUNT RESIDENTIAL MORTGAGE GROUP, INC.",
        "nmls_id": "75243",
        "our_lender_slug": "prmg",
        "legal_name": "Paramount Residential Mortgage Group, Inc.",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "5493001SXWZ4OFP8Z903": {
        "institution_name_hmda": "DHI MORTGAGE COMPANY, LTD.",
        "nmls_id": "14622",
        "our_lender_slug": "dhi-mortgage-buckeye",
        "legal_name": "DHI Mortgage Company, Ltd.",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "549300PIL8LFAQ04XC20": {
        "institution_name_hmda": "Better Mortgage Corporation",
        "nmls_id": "330511",
        "our_lender_slug": "better-mortgage",
        "legal_name": "Better Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "549300E2UX99HKDBR481": {
        "institution_name_hmda": "NEW AMERICAN FUNDING, LLC",
        "nmls_id": "6606",
        "our_lender_slug": "new-american-funding",
        "legal_name": "New American Funding, LLC",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif_reidentify+public_nmls",
    },
    "549300RN01LBYR8ZVX74": {
        "institution_name_hmda": "LOWER, LLC",
        "nmls_id": "1124061",
        "our_lender_slug": "lower",
        "legal_name": "Lower, LLC",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+public_nmls",
    },
    "549300370QILXLFUWD20": {
        "institution_name_hmda": "ZILLOW HOME LOANS, LLC",
        "nmls_id": "1027871",
        "our_lender_slug": "zillow-home-loans",
        "legal_name": "Zillow Home Loans, LLC",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+public_nmls",
    },
    "54930021WPEXNHYZUL09": {
        "institution_name_hmda": "PLANET HOME LENDING, LLC",
        "nmls_id": "17022",
        "our_lender_slug": "planet-home-lending",
        "legal_name": "Planet Home Lending, LLC",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+public_nmls",
    },
    "549300OPCWU6E72WUT29": {
        "institution_name_hmda": "MUTUAL OF OMAHA MORTGAGE, INC.",
        "nmls_id": "1025894",
        "our_lender_slug": "mutual-of-omaha-mortgage",
        "legal_name": "Mutual of Omaha Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+public_nmls",
    },
    "549300YIQ7S7Z8PIHE53": {
        "institution_name_hmda": "AMERISAVE MORTGAGE CORPORATION",
        "nmls_id": "1168",
        "our_lender_slug": "amerisave",
        "legal_name": "Amerisave Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+public_nmls",
    },
    "5493001GDRY0EL7VG372": {
        "institution_name_hmda": "ARK-LA-TEX FINANCIAL SERVICES, LLC.",
        "nmls_id": "2143",
        "our_lender_slug": "benchmark-mortgage",
        "legal_name": "Ark-La-Tex Financial Services, LLC dba Benchmark Mortgage",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+public_nmls",
    },
    "549300JYXTZDSPJEPI44": {
        "institution_name_hmda": "PLAZA HOME MORTGAGE, INC.",
        "nmls_id": "2113",
        "our_lender_slug": "plaza-home-mortgage",
        "legal_name": "Plaza Home Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+public_nmls",
    },
    "549300O6Z0I6KYMESL47": {
        "institution_name_hmda": "AMWEST FUNDING CORP.",
        "nmls_id": "167441",
        "our_lender_slug": "amwest-funding",
        "legal_name": "AmWest Funding Corp.",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+public_nmls",
    },
    "5493000YNV8IX4VD3X12": {
        "institution_name_hmda": "VANDERBILT MORTGAGE AND FINANCE, INC.",
        "nmls_id": "1561",
        "our_lender_slug": "silverton-mortgage-myrtle-beach",
        "legal_name": "Vanderbilt Mortgage and Finance, Inc. (dba Silverton Mortgage)",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+silverton_dba",
    },
    "549300BLL6VL7AXWYP56": {
        "institution_name_hmda": "CHURCHILL MORTGAGE CORPORATION",
        "nmls_id": "1591",
        "our_lender_slug": "churchill-mortgage-nashville",
        "legal_name": "Churchill Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+public_nmls",
    },
    "549300B4IYL7TZT8FA34": {
        "institution_name_hmda": "PREMIER MORTGAGE RESOURCES, L.L.C.",
        "nmls_id": "",
        "our_lender_slug": "premier-mortgage-resources",
        "legal_name": "Premier Mortgage Resources, L.L.C.",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+directory_slug",
    },
    "549300RFSMIRUODUVW59": {
        "institution_name_hmda": "First Interstate Bank",
        "nmls_id": "",
        "our_lender_slug": "first-interstate-bank",
        "legal_name": "First Interstate Bank",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+directory_slug",
    },
    # Existing OR / PNW hosts
    "2549008LK3474E9U2888": {
        "institution_name_hmda": "ONPOINT COMMUNITY CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "onpoint-community-credit-union",
        "legal_name": "OnPoint Community Credit Union",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+lei_identity",
    },
    "IFQSIUC9AGQV2NE8CN25": {
        "institution_name_hmda": "Columbia Bank",
        "nmls_id": "",
        "our_lender_slug": "columbia-bank-pnw",
        "legal_name": "Columbia Bank",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+lei_identity",
    },
    "549300HH0V8LECLNPQ26": {
        "institution_name_hmda": "ROGUE",
        "nmls_id": "",
        "our_lender_slug": "rogue-credit-union",
        "legal_name": "Rogue Credit Union",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+lei_identity",
    },
    "549300IEP77RKJ87Z176": {
        "institution_name_hmda": "OREGON COMMUNITY",
        "nmls_id": "",
        "our_lender_slug": "oregon-community-credit-union",
        "legal_name": "Oregon Community Credit Union",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+lei_identity",
    },
    "549300Q02LGIN9AXKP98": {
        "institution_name_hmda": "FIRST TECHNOLOGY FEDERAL CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "first-tech-federal-credit-union",
        "legal_name": "First Technology Federal Credit Union",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+lei_identity",
    },
    "5493003WLEYGXGNTI654": {
        "institution_name_hmda": "SELCO COMMUNITY",
        "nmls_id": "",
        "our_lender_slug": "selco-community-credit-union",
        "legal_name": "SELCO Community Credit Union",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+lei_identity",
    },
    "5493008JECR4UE0WVR04": {
        "institution_name_hmda": "MORTGAGE EXPRESS, LLC",
        "nmls_id": "",
        "our_lender_slug": "mortgage-express",
        "legal_name": "Mortgage Express, LLC",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+lei_identity",
    },
    "254900Z8J5L9POS71X51": {
        "institution_name_hmda": "Oregon State Credit Union",
        "nmls_id": "",
        "our_lender_slug": "oregon-state-credit-union",
        "legal_name": "Oregon State Credit Union",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+lei_identity",
    },
    "WE0I402RW25AU38DTI13": {
        "institution_name_hmda": "Banner Bank",
        "nmls_id": "",
        "our_lender_slug": "banner-bank",
        "legal_name": "Banner Bank",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+lei_identity",
    },
    # Newly linked high-value OR regionals
    "254900T37KTTXKCK3416": {
        "institution_name_hmda": "Rivermark Community Credit Union",
        "nmls_id": "405464",
        "our_lender_slug": "rivermark-community-credit-union",
        "legal_name": "Rivermark Community Credit Union",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+public_nmls+or_directory",
    },
    "2549001IK7UDPADKAG34": {
        "institution_name_hmda": "Unitus Community Credit Union",
        "nmls_id": "476661",
        "our_lender_slug": "unitus-community-credit-union",
        "legal_name": "Unitus Community Credit Union",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+public_nmls+or_directory",
    },
    "549300CDLJDN8ENOT455": {
        "institution_name_hmda": "MARION AND POLK SCHOOLS CREDIT UNION",
        "nmls_id": "462882",
        "our_lender_slug": "maps-credit-union",
        "legal_name": "Maps Credit Union (Marion and Polk Schools Credit Union)",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+public_nmls+or_directory",
    },
    "549300ZBXINP1Y94CN02": {
        "institution_name_hmda": "DIRECTORS MORTGAGE, INC.",
        "nmls_id": "3240",
        "our_lender_slug": "directors-mortgage",
        "legal_name": "Directors Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+public_nmls+or_directory",
    },
    "549300TEGBOIDI6Z5J56": {
        "institution_name_hmda": "Mid Oregon Federal Credit Union",
        "nmls_id": "",
        "our_lender_slug": "mid-oregon-federal-credit-union",
        "legal_name": "Mid Oregon Federal Credit Union",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+or_directory",
    },
    "549300L44U62O7WHRR78": {
        "institution_name_hmda": "FIRST COMMUNITY",
        "nmls_id": "217251",
        "our_lender_slug": "first-community-credit-union-oregon",
        "legal_name": "First Community Credit Union",
        "match_confidence": "high",
        "match_method": "or_deepen_gleif+public_nmls+or_directory",
    },
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


def name_to_slug(name: str) -> str:
    return name.strip().lower().replace(".", "").replace("'", "").replace(" ", "-")


def fill_county(r: dict[str, str]) -> dict[str, str]:
    fips = (r.get("county_fips") or "").strip()
    if not (r.get("county_name") or "").strip() and fips in OR_COUNTIES:
        return {**r, "county_name": OR_COUNTIES[fips]}
    return r


def load_prior_maps() -> dict[str, dict[str, str]]:
    lei_to_map: dict[str, dict[str, str]] = {}
    for path in sorted((ROOT / "data" / "hmda").glob("*/lei_to_nmls_mapping.csv")):
        if "by-state" in str(path) or path.parent.name == "oregon":
            continue
        for r in read_csv(path):
            lei = (r.get("lei") or "").strip()
            slug = (r.get("our_lender_slug") or "").strip()
            if not lei or not slug:
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
    return lei_to_map


def patch_states_ts(major_slugs: list[str]) -> None:
    text = STATE_TS.read_text(encoding="utf-8")
    block_lines = [f"      '{s}'," for s in major_slugs]
    new_block = "majorCountySlugs: new Set([\n" + "\n".join(block_lines) + "\n    ]),"
    pattern = re.compile(
        r'(code: [\'"]OR[\'"],[\s\S]*?)majorCountySlugs: new Set\(\[[\s\S]*?\]\),',
        re.M,
    )
    m = pattern.search(text)
    if not m:
        raise SystemExit("Could not find OR majorCountySlugs in states.ts")
    text2 = pattern.sub(m.group(1) + new_block, text, count=1)
    STATE_TS.write_text(text2, encoding="utf-8")


def main() -> None:
    if not SRC.is_dir():
        raise SystemExit(f"Missing {SRC}")

    gleif: dict[str, str] = {}
    if GLEIF_CACHE.exists():
        gleif = json.loads(GLEIF_CACHE.read_text(encoding="utf-8"))
    for lei, cur in OR_CURATED_LEI.items():
        gleif.setdefault(lei, cur["institution_name_hmda"])

    prior = load_prior_maps()
    col = "oregon_originations"

    county_rows = [fill_county(r) for r in read_csv(SRC / "county_market_summary.csv")]
    county_out: list[dict[str, str]] = []
    for r in county_rows:
        fips = (r.get("county_fips") or "").strip()
        try:
            orig = float(r.get("total_originations") or 0)
        except ValueError:
            orig = 0
        name = (r.get("county_name") or "").strip()
        if not name and fips in OR_COUNTIES:
            r = {**r, "county_name": OR_COUNTIES[fips]}
            name = OR_COUNTIES[fips]
        if fips in OR_MAJORS or name or orig >= 450:
            if fips in OR_COUNTIES and not (r.get("county_name") or "").strip():
                r = {**r, "county_name": OR_COUNTIES[fips]}
            county_out.append(r)

    state_rows = []
    for r in read_csv(SRC / "lender_state_summary.csv"):
        lei = (r.get("lei") or "").strip()
        if not (r.get("institution_name") or "").strip():
            nm = gleif.get(lei) or (prior.get(lei) or {}).get("institution_name_hmda")
            if not nm and lei in OR_CURATED_LEI:
                nm = OR_CURATED_LEI[lei]["institution_name_hmda"]
            if nm:
                r = {**r, "institution_name": nm}
        state_rows.append(r)

    act_out: list[dict[str, str]] = []
    for r in read_csv(SRC / "lender_activity_by_county.csv"):
        r = fill_county(r)
        fips = (r.get("county_fips") or "").strip()
        if fips not in OR_MAJORS:
            continue
        if not (r.get("county_name") or "").strip() and fips in OR_COUNTIES:
            r = {**r, "county_name": OR_COUNTIES[fips]}
        lei = (r.get("lei") or "").strip()
        if not (r.get("institution_name") or "").strip():
            nm = gleif.get(lei) or (prior.get(lei) or {}).get("institution_name_hmda")
            if not nm and lei in OR_CURATED_LEI:
                nm = OR_CURATED_LEI[lei]["institution_name_hmda"]
            if nm:
                r = {**r, "institution_name": nm}
        act_out.append(r)

    cand = read_csv(SRC / "lei_mapping_candidates.csv")
    for r in cand:
        if "or_originations" in r and col not in r:
            r[col] = r.get("or_originations") or "0"

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
        if method_prefix.startswith("or_deepen") and curated_slug:
            slug = curated_slug
        else:
            slug = NATIONAL_SLUG_BY_NMLS.get(nmls) or curated_slug
        if not slug:
            return
        if not method_prefix.startswith("or_deepen") and nmls in NATIONAL_SLUG_BY_NMLS:
            slug = NATIONAL_SLUG_BY_NMLS[nmls]
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
                f"{method_prefix.rstrip('+') or 'curated'} map for OR activity "
                f"({st_orig} OR originations); slug={slug}."
            ),
        }
        prev = mapping_by_lei.get(lei)
        if prev and not method_prefix.startswith("or_deepen"):
            if int(float(prev.get(col) or 0)) >= st_orig:
                return
        mapping_by_lei[lei] = row

    for lei, prior_row in prior.items():
        add_mapping(lei, prior_row, "reuse_prior_state_curated_lei+")
    for lei, cur in OR_CURATED_LEI.items():
        add_mapping(lei, cur, "or_deepen+")

    mapping_rows = sorted(
        mapping_by_lei.values(),
        key=lambda r: -int(float(r.get(col) or 0)),
    )

    if county_out:
        write_csv(OUT / "county_market_summary_or.csv", county_out, list(county_out[0].keys()))
    if act_out:
        write_csv(OUT / "lender_activity_by_county_or.csv", act_out, list(act_out[0].keys()))
    if state_rows:
        write_csv(OUT / "lender_state_summary_or.csv", state_rows, list(state_rows[0].keys()))
    if cand:
        write_csv(OUT / "lei_mapping_candidates_or.csv", cand, list(cand[0].keys()))
    if mapping_rows:
        write_csv(OUT / "lei_to_nmls_mapping.csv", mapping_rows, list(mapping_rows[0].keys()))

    major_named = [
        r
        for r in county_out
        if (r.get("county_fips") or "") in OR_MAJORS and (r.get("county_name") or "").strip()
    ]
    major_named.sort(key=lambda r: -float(r.get("total_originations") or 0))
    major_slugs: list[str] = []
    seen: set[str] = set()
    for r in major_named:
        s = name_to_slug(r.get("county_name") or "")
        if s and s not in seen:
            seen.add(s)
            major_slugs.append(s)

    patch_states_ts(major_slugs)

    mapped = {m["lei"] for m in mapping_rows}
    ranked = sorted(state_rows, key=lambda x: -float(x.get("total_originations") or 0))
    top20 = [r["lei"] for r in ranked[:20]]
    top50 = [r["lei"] for r in ranked[:50]]
    coverage = {
        "state": "OR",
        "phase": "oregon-deepen",
        "major_counties": len(major_slugs),
        "major_county_slugs": major_slugs,
        "cms_rows": len(county_out),
        "activity_rows": len(act_out),
        "lss_rows": len(state_rows),
        "mapped_leis": len(mapping_rows),
        "top20_mapped": sum(1 for lei in top20 if lei in mapped),
        "top50_mapped": sum(1 for lei in top50 if lei in mapped),
        "deferred_examples": [
            "Nations Direct Mortgage",
            "Summit Funding",
            "Figure Lending / Synergy One",
            "Peak Credit Union",
            "Sierra Pacific Mortgage",
            "Alliant Credit Union",
            "Consolidated Federal Credit Union",
            "Go Mortgage",
            "Sunflower Bank",
        ],
        "notes": (
            "Expanded major-county panels to 27; GLEIF re-ID; linked Rivermark, Unitus, "
            "Maps CU, Directors Mortgage, Mid Oregon FCU, First Community CU OR; "
            "retained OnPoint/Rogue/OCCU/etc."
        ),
    }
    (OUT / "coverage_summary.json").write_text(json.dumps(coverage, indent=2), encoding="utf-8")

    md = [
        "# Oregon HMDA slice (deepened)\n\n",
        "**Source:** `data/hmda/by-state/OR/` (national foundation)\n\n",
        "**Phase:** oregon-deepen\n\n",
        f"- County market rows: **{len(county_out)}**\n",
        f"- Lender–county activity (major markets): **{len(act_out)}**\n",
        f"- LEI state summaries: **{len(state_rows)}**\n",
        f"- High-confidence LEI→directory mappings: **{len(mapping_rows)}**\n",
        f"- Major markets with names: **{len(major_named)}**\n",
        f"- Top-20 mapped: **{coverage['top20_mapped']}/20** · "
        f"Top-50 mapped: **{coverage['top50_mapped']}/50**\n\n",
        "## Top mapped LEIs by OR originations\n\n",
    ]
    for r in mapping_rows[:30]:
        md.append(
            f"- `{r['our_lender_slug']}` — {r['institution_name_hmda']} "
            f"({r[col]} OR orig.)\n"
        )
    md.append("\n## Major markets (panel-ready)\n\n")
    for r in major_named:
        md.append(
            f"- **{r.get('county_name')}** (`{r.get('county_fips')}`) — "
            f"{r.get('total_originations')} originations\n"
        )
    md.append(
        "\n## Matching rules\n\n"
        "- Reuse prior product-state curated LEI maps when LEI has OR activity\n"
        "- **or_deepen** GLEIF re-identification + OR directory hosts\n"
        "- Precision over coverage — low-confidence regionals deferred\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-oregon-deepen.py\n"
        "```\n"
    )
    (OUT / "README.md").write_text("".join(md), encoding="utf-8")

    print(
        f"Wrote OR deepen → {OUT}\n"
        f"  mappings={len(mapping_rows)} counties={len(county_out)} "
        f"activity={len(act_out)} majors={len(major_slugs)}\n"
        f"  top20={coverage['top20_mapped']}/20 top50={coverage['top50_mapped']}/50\n"
        f"  majors={major_slugs}"
    )


if __name__ == "__main__":
    main()
