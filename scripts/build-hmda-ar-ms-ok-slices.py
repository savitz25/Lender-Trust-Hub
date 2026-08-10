#!/usr/bin/env python3
"""
Build Arkansas, Mississippi, and Oklahoma HMDA product slices.

  python scripts/build-hmda-ar-ms-ok-slices.py

Source: data/hmda/by-state/{AR,MS,OK}/
Does not modify Iowa / Kansas / Nebraska or other product-state slices.
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
    "480004": "synovus-bank",
    "402436": "cadence-bank",
    "405456": "first-horizon-bank",
    "14622": "dhi-mortgage-buckeye",
    "2143": "benchmark-mortgage",
    "224149": "flat-branch-mortgage",
    "403501": "bok-financial",
    "449605": "trustmark-bank",
    "402669": "renasant-bank",
    "454781": "hancock-whitney-bank",
    "70345": "eustis-mortgage",
    "7233": "gateway-mortgage-myrtle-beach",
    # AR / MS / OK curated
    "418494": "arkansas-federal-credit-union",
    "75271": "firsttrust-home-loans",
    "414458": "first-security-bank-arkansas",
    "466091": "centennial-bank",
    "464037": "bank-ozk",
    "484633": "simmons-bank",
    "402411": "community-bank-of-mississippi",
    "431487": "bankplus",
    "441224": "bancfirst",
    "619047": "midfirst-bank",
    "401680": "ttcu-federal-credit-union",
}

CURATED_LEI: dict[str, dict[str, str]] = {
    # ── National re-identify ─────────────────────────────────────────────────
    "549300HW662MN1WU8550": {
        "institution_name_hmda": "United Wholesale Mortgage, LLC",
        "nmls_id": "3038",
        "our_lender_slug": "united-wholesale-mortgage",
        "legal_name": "United Wholesale Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "549300FGXN1K3HLB1R50": {
        "institution_name_hmda": "Rocket Mortgage, LLC",
        "nmls_id": "3030",
        "our_lender_slug": "rocket-mortgage",
        "legal_name": "Rocket Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "EQTWLK1G7ODGC2MGLV11": {
        "institution_name_hmda": "Regions Bank",
        "nmls_id": "467341",
        "our_lender_slug": "regions-bank",
        "legal_name": "Regions Bank",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "549300AQ3T62GXDU7D76": {
        "institution_name_hmda": "GUILD MORTGAGE COMPANY LLC",
        "nmls_id": "3274",
        "our_lender_slug": "guild-mortgage-metrowest",
        "legal_name": "Guild Mortgage Company LLC",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "549300VZVN841I2ILS84": {
        "institution_name_hmda": "CROSSCOUNTRY MORTGAGE, LLC",
        "nmls_id": "3029",
        "our_lender_slug": "crosscountry-mortgage-metrowest",
        "legal_name": "CrossCountry Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "549300LYRWPSYPK6S325": {
        "institution_name_hmda": "FREEDOM MORTGAGE CORPORATION",
        "nmls_id": "2767",
        "our_lender_slug": "freedom-mortgage",
        "legal_name": "Freedom Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "549300AG64NHILB7ZP05": {
        "institution_name_hmda": "LOANDEPOT.COM, LLC",
        "nmls_id": "174457",
        "our_lender_slug": "loandepot",
        "legal_name": "loanDepot.com, LLC",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "RVDPPPGHCGZ40J4VQ731": {
        "institution_name_hmda": "PENNYMAC LOAN SERVICES, LLC",
        "nmls_id": "35953",
        "our_lender_slug": "pennymac",
        "legal_name": "PennyMac Loan Services, LLC",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "549300H3IZO24NSOO931": {
        "institution_name_hmda": "LENNAR MORTGAGE, LLC",
        "nmls_id": "1058",
        "our_lender_slug": "lennar-mortgage-queen-creek",
        "legal_name": "Lennar Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "5493001SXWZ4OFP8Z903": {
        "institution_name_hmda": "DHI MORTGAGE COMPANY, LTD.",
        "nmls_id": "14622",
        "our_lender_slug": "dhi-mortgage-buckeye",
        "legal_name": "DHI Mortgage Company, Ltd.",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+directory_slug",
    },
    "549300LBCBNR1OT00651": {
        "institution_name_hmda": "NATIONSTAR MORTGAGE LLC",
        "nmls_id": "2104",
        "our_lender_slug": "mr-cooper",
        "legal_name": "Nationstar Mortgage LLC",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "549300MGPZBLQDIL7538": {
        "institution_name_hmda": "FAIRWAY INDEPENDENT MORTGAGE CORPORATION",
        "nmls_id": "2909",
        "our_lender_slug": "fairway-mortgage-augusta-sheppard",
        "legal_name": "Fairway Independent Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "549300DD5QQUHO6PCH70": {
        "institution_name_hmda": "MORTGAGE RESEARCH CENTER, LLC",
        "nmls_id": "1907",
        "our_lender_slug": "veterans-united-west-valley",
        "legal_name": "Mortgage Research Center, LLC (Veterans United Home Loans)",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "549300FNXYY540N23N64": {
        "institution_name_hmda": "Newrez LLC",
        "nmls_id": "2289",
        "our_lender_slug": "newrez",
        "legal_name": "Newrez LLC",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "549300E2UX99HKDBR481": {
        "institution_name_hmda": "NEW AMERICAN FUNDING, LLC",
        "nmls_id": "6606",
        "our_lender_slug": "new-american-funding",
        "legal_name": "New American Funding, LLC",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "5493003GQDUH26DNNH17": {
        "institution_name_hmda": "Navy Federal Credit Union",
        "nmls_id": "399807",
        "our_lender_slug": "navy-federal-jacksonville",
        "legal_name": "Navy Federal Credit Union",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "7H6GLXDRUGQFU57RNE97": {
        "institution_name_hmda": "JPMorgan Chase Bank, National Association",
        "nmls_id": "399798",
        "our_lender_slug": "jpmorgan-chase-bank",
        "legal_name": "JPMorgan Chase Bank, National Association",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "Q7C315HKI8VX0SSKBS64": {
        "institution_name_hmda": "Cadence Bank",
        "nmls_id": "402436",
        "our_lender_slug": "cadence-bank",
        "legal_name": "Cadence Bank",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "COOWI3L2W9TPYR3WJX37": {
        "institution_name_hmda": "First Horizon Bank",
        "nmls_id": "405456",
        "our_lender_slug": "first-horizon-bank",
        "legal_name": "First Horizon Bank",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "6BYL5QZYBDK8S7L73M02": {
        "institution_name_hmda": "U.S. Bank National Association",
        "nmls_id": "402216",
        "our_lender_slug": "us-bank",
        "legal_name": "U.S. Bank National Association",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "01J4SO3XTWZF4PP38209": {
        "institution_name_hmda": "Trustmark Bank",
        "nmls_id": "449605",
        "our_lender_slug": "trustmark-bank",
        "legal_name": "Trustmark National Bank",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "5493002RF1ERFA2XR050": {
        "institution_name_hmda": "Renasant Bank",
        "nmls_id": "402669",
        "our_lender_slug": "renasant-bank",
        "legal_name": "Renasant Bank",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "FU7RSW4CQQY98A2O7J66": {
        "institution_name_hmda": "BOKF, National Association",
        "nmls_id": "403501",
        "our_lender_slug": "bok-financial",
        "legal_name": "BOKF, National Association",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "COINQMNIM6RBU631DD85": {
        "institution_name_hmda": "Arvest Bank",
        "nmls_id": "",
        "our_lender_slug": "arvest-bank",
        "legal_name": "Arvest Bank",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+directory_slug",
    },
    "549300LXKO1O7CSK5J52": {
        "institution_name_hmda": "FLAT BRANCH MORTGAGE, INC.",
        "nmls_id": "224149",
        "our_lender_slug": "flat-branch-mortgage",
        "legal_name": "Flat Branch Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "54930034MNPILHP25H80": {
        "institution_name_hmda": "Gateway First Bank",
        "nmls_id": "7233",
        "our_lender_slug": "gateway-mortgage-myrtle-beach",
        "legal_name": "Gateway First Bank",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "NSGZD26XPW2CUM2JKU70": {
        "institution_name_hmda": "HANCOCK WHITNEY BANK",
        "nmls_id": "454781",
        "our_lender_slug": "hancock-whitney-bank",
        "legal_name": "Hancock Whitney Bank",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "549300DG3IV05V4C4E03": {
        "institution_name_hmda": "EUSTIS MORTGAGE CORPORATION",
        "nmls_id": "70345",
        "our_lender_slug": "eustis-mortgage",
        "legal_name": "Eustis Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "549300GKFNPRWNS0GF29": {
        "institution_name_hmda": "AmeriHome Mortgage Company, LLC",
        "nmls_id": "1120271",
        "our_lender_slug": "amerihome-mortgage",
        "legal_name": "AmeriHome Mortgage Company, LLC",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    "549300XY701IELCE5Q08": {
        "institution_name_hmda": "BETTER MORTGAGE CORPORATION",
        "nmls_id": "330511",
        "our_lender_slug": "better-mortgage",
        "legal_name": "Better Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif_reidentify+public_nmls",
    },
    # ── Arkansas ─────────────────────────────────────────────────────────────
    "549300HIKKZQ0TVJWA08": {
        "institution_name_hmda": "ARKANSAS FEDERAL CREDIT UNION",
        "nmls_id": "418494",
        "our_lender_slug": "arkansas-federal-credit-union",
        "legal_name": "Arkansas Federal Credit Union",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif+public_nmls",
    },
    "2549007JQKHU8KQ0FC19": {
        "institution_name_hmda": "FIRSTTRUST HOME LOANS, INC.",
        "nmls_id": "75271",
        "our_lender_slug": "firsttrust-home-loans",
        "legal_name": "FirstTrust Home Loans, Inc.",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif+public_nmls",
    },
    "254900561K135J92VD38": {
        "institution_name_hmda": "First Security Bank",
        "nmls_id": "414458",
        "our_lender_slug": "first-security-bank-arkansas",
        "legal_name": "First Security Bank (Arkansas)",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif+public_nmls",
    },
    "549300BEFX6JRSCS5N78": {
        "institution_name_hmda": "Centennial Bank",
        "nmls_id": "466091",
        "our_lender_slug": "centennial-bank",
        "legal_name": "Centennial Bank",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif+public_nmls",
    },
    "549300VYK2WBD7SST478": {
        "institution_name_hmda": "Bank OZK",
        "nmls_id": "464037",
        "our_lender_slug": "bank-ozk",
        "legal_name": "Bank OZK",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif+public_nmls",
    },
    "549300DPRWSBUY619V27": {
        "institution_name_hmda": "Simmons Bank",
        "nmls_id": "484633",
        "our_lender_slug": "simmons-bank",
        "legal_name": "Simmons Bank",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif+public_nmls",
    },
    # ── Mississippi ──────────────────────────────────────────────────────────
    "5493005QK4NV0ZZ5EM64": {
        "institution_name_hmda": "Community Bank of Mississippi",
        "nmls_id": "402411",
        "our_lender_slug": "community-bank-of-mississippi",
        "legal_name": "Community Bank of Mississippi",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif+public_nmls",
    },
    "549300SFG15JDKI5MD22": {
        "institution_name_hmda": "BankPlus",
        "nmls_id": "431487",
        "our_lender_slug": "bankplus",
        "legal_name": "BankPlus",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif+public_nmls",
    },
    # ── Oklahoma ─────────────────────────────────────────────────────────────
    "549300MNZECUR067HB12": {
        "institution_name_hmda": "BancFirst",
        "nmls_id": "441224",
        "our_lender_slug": "bancfirst",
        "legal_name": "BancFirst",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif+public_nmls",
    },
    "337KMNHEWWWR6B7Q7W10": {
        "institution_name_hmda": "MidFirst Bank",
        "nmls_id": "619047",
        "our_lender_slug": "midfirst-bank",
        "legal_name": "MidFirst Bank",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif+public_nmls",
    },
    "254900F8XCJE1G9OYR92": {
        "institution_name_hmda": "TTCU Federal Credit Union",
        "nmls_id": "401680",
        "our_lender_slug": "ttcu-federal-credit-union",
        "legal_name": "TTCU Federal Credit Union",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif+public_nmls",
    },
    "549300DMHEHNYZ2OLB41": {
        "institution_name_hmda": "First United Bank and Trust Company",
        "nmls_id": "",
        "our_lender_slug": "first-united-bank-and-trust",
        "legal_name": "First United Bank and Trust Company",
        "match_confidence": "high",
        "match_method": "ar_ms_ok_gleif+lei_identity",
    },
}

AR_COUNTIES: dict[str, str] = {
    "05005": "Baxter",
    "05007": "Benton",
    "05009": "Boone",
    "05031": "Craighead",
    "05033": "Crawford",
    "05035": "Crittenden",
    "05045": "Faulkner",
    "05051": "Garland",
    "05055": "Greene",
    "05063": "Independence",
    "05069": "Jefferson",
    "05085": "Lonoke",
    "05091": "Miller",
    "05115": "Pope",
    "05119": "Pulaski",
    "05125": "Saline",
    "05131": "Sebastian",
    "05143": "Washington",
    "05145": "White",
}

AR_MAJORS: set[str] = {
    "05007",  # Benton
    "05119",  # Pulaski
    "05143",  # Washington
    "05125",  # Saline
    "05045",  # Faulkner
    "05031",  # Craighead
    "05131",  # Sebastian
    "05051",  # Garland
    "05085",  # Lonoke
    "05145",  # White
    "05033",  # Crawford
    "05115",  # Pope
    "05005",  # Baxter
    "05055",  # Greene
    "05009",  # Boone
    "05069",  # Jefferson
    "05035",  # Crittenden
    "05063",  # Independence
}

MS_COUNTIES: dict[str, str] = {
    "28033": "DeSoto",
    "28035": "Forrest",
    "28045": "Hancock",
    "28047": "Harrison",
    "28049": "Hinds",
    "28059": "Jackson",
    "28067": "Jones",
    "28071": "Lafayette",
    "28073": "Lamar",
    "28075": "Lauderdale",
    "28081": "Lee",
    "28087": "Lowndes",
    "28089": "Madison",
    "28093": "Marshall",
    "28105": "Oktibbeha",
    "28109": "Pearl River",
    "28121": "Rankin",
    "28149": "Warren",
}

MS_MAJORS: set[str] = {
    "28033",  # DeSoto
    "28047",  # Harrison
    "28121",  # Rankin
    "28049",  # Hinds
    "28059",  # Jackson
    "28089",  # Madison
    "28081",  # Lee
    "28071",  # Lafayette
    "28073",  # Lamar
    "28035",  # Forrest
    "28067",  # Jones
    "28045",  # Hancock
    "28109",  # Pearl River
    "28087",  # Lowndes
    "28075",  # Lauderdale
    "28093",  # Marshall
    "28105",  # Oktibbeha
    "28149",  # Warren
}

OK_COUNTIES: dict[str, str] = {
    "40013": "Bryan",
    "40017": "Canadian",
    "40019": "Carter",
    "40027": "Cleveland",
    "40031": "Comanche",
    "40037": "Creek",
    "40047": "Garfield",
    "40051": "Grady",
    "40083": "Logan",
    "40087": "McClain",
    "40101": "Muskogee",
    "40109": "Oklahoma",
    "40119": "Payne",
    "40125": "Pottawatomie",
    "40131": "Rogers",
    "40143": "Tulsa",
    "40145": "Wagoner",
    "40147": "Washington",
}

OK_MAJORS: set[str] = {
    "40109",  # Oklahoma
    "40143",  # Tulsa
    "40027",  # Cleveland
    "40017",  # Canadian
    "40145",  # Wagoner
    "40031",  # Comanche
    "40131",  # Rogers
    "40083",  # Logan
    "40125",  # Pottawatomie
    "40037",  # Creek
    "40051",  # Grady
    "40087",  # McClain
    "40119",  # Payne
    "40101",  # Muskogee
    "40047",  # Garfield
    "40147",  # Washington
    "40013",  # Bryan
    "40019",  # Carter
}

STATES = [
    {
        "code": "AR",
        "name": "Arkansas",
        "folder": "arkansas",
        "suffix": "_ar",
        "col": "arkansas_originations",
        "alias_col": "ar_originations",
        "counties": AR_COUNTIES,
        "majors": AR_MAJORS,
    },
    {
        "code": "MS",
        "name": "Mississippi",
        "folder": "mississippi",
        "suffix": "_ms",
        "col": "mississippi_originations",
        "alias_col": "ms_originations",
        "counties": MS_COUNTIES,
        "majors": MS_MAJORS,
    },
    {
        "code": "OK",
        "name": "Oklahoma",
        "folder": "oklahoma",
        "suffix": "_ok",
        "col": "oklahoma_originations",
        "alias_col": "ok_originations",
        "counties": OK_COUNTIES,
        "majors": OK_MAJORS,
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
        if name or fips in majors or orig >= 700:
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
        if method_prefix.startswith("ar_ms_ok_curated") and curated_slug:
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
            if not method_prefix.startswith("ar_ms_ok_curated"):
                return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_prior_state_curated_lei+")
    for lei, cur in CURATED_LEI.items():
        add_mapping(lei, cur, "ar_ms_ok_curated+")

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
        "- AR curated: Arvest, Arkansas FCU, FirstTrust, First Security Bank, Centennial, Bank OZK, Simmons\n"
        "- MS curated: Community Bank of Mississippi, BankPlus (+ Trustmark / Cadence / Renasant reuse)\n"
        "- OK curated: BancFirst, MidFirst, TTCU, First United (+ BOK / Gateway / Arvest reuse)\n"
        "- National LEI re-identify for UWM, Rocket, Regions, Guild, Freedom, etc.\n"
        "- Precision over coverage — no fuzzy LEI inventing\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-ar-ms-ok-slices.py\n"
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
