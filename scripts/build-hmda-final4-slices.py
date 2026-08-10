#!/usr/bin/env python3
"""
Build Alaska, Hawaii, North Dakota, and South Dakota HMDA product slices.

  python scripts/build-hmda-final4-slices.py

Source: data/hmda/by-state/{AK,HI,ND,SD}/
Completes the national 50-state + DC product map.
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
    "14622": "dhi-mortgage-buckeye",
    "2143": "benchmark-mortgage",
    "3094": "primary-residential-mortgage",
    "3116": "securitynational-mortgage",
    "7233": "gateway-mortgage-myrtle-beach",
    "2893": "nfm-lending",
    "7700": "homebridge-financial",
    # Final-4 curated
    "409001": "global-federal-credit-union",
    "640297": "first-national-bank-alaska",
    "423168": "american-savings-bank-hawaii",
    "435154": "gate-city-bank",
    "474396": "first-premier-bank",
    "410144": "first-dakota-national-bank",
    "463950": "plains-commerce-bank",
}

CURATED_LEI: dict[str, dict[str, str]] = {
    # ── National re-identify ─────────────────────────────────────────────────
    "549300HW662MN1WU8550": {
        "institution_name_hmda": "United Wholesale Mortgage, LLC",
        "nmls_id": "3038",
        "our_lender_slug": "united-wholesale-mortgage",
        "legal_name": "United Wholesale Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "549300FGXN1K3HLB1R50": {
        "institution_name_hmda": "Rocket Mortgage, LLC",
        "nmls_id": "3030",
        "our_lender_slug": "rocket-mortgage",
        "legal_name": "Rocket Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "549300AQ3T62GXDU7D76": {
        "institution_name_hmda": "GUILD MORTGAGE COMPANY LLC",
        "nmls_id": "3274",
        "our_lender_slug": "guild-mortgage-metrowest",
        "legal_name": "Guild Mortgage Company LLC",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "549300VZVN841I2ILS84": {
        "institution_name_hmda": "CROSSCOUNTRY MORTGAGE, LLC",
        "nmls_id": "3029",
        "our_lender_slug": "crosscountry-mortgage-metrowest",
        "legal_name": "CrossCountry Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "549300LYRWPSYPK6S325": {
        "institution_name_hmda": "FREEDOM MORTGAGE CORPORATION",
        "nmls_id": "2767",
        "our_lender_slug": "freedom-mortgage",
        "legal_name": "Freedom Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "549300AG64NHILB7ZP05": {
        "institution_name_hmda": "LOANDEPOT.COM, LLC",
        "nmls_id": "174457",
        "our_lender_slug": "loandepot",
        "legal_name": "loanDepot.com, LLC",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "RVDPPPGHCGZ40J4VQ731": {
        "institution_name_hmda": "PENNYMAC LOAN SERVICES, LLC",
        "nmls_id": "35953",
        "our_lender_slug": "pennymac",
        "legal_name": "PennyMac Loan Services, LLC",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "549300FNXYY540N23N64": {
        "institution_name_hmda": "Newrez LLC",
        "nmls_id": "2289",
        "our_lender_slug": "newrez",
        "legal_name": "Newrez LLC",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "549300DD5QQUHO6PCH70": {
        "institution_name_hmda": "MORTGAGE RESEARCH CENTER, LLC",
        "nmls_id": "1907",
        "our_lender_slug": "veterans-united-west-valley",
        "legal_name": "Mortgage Research Center, LLC (Veterans United Home Loans)",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "549300DD4R4SYK5RAQ92": {
        "institution_name_hmda": "MOVEMENT MORTGAGE, LLC",
        "nmls_id": "39179",
        "our_lender_slug": "movement-mortgage-myrtle-beach",
        "legal_name": "Movement Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "5493003GQDUH26DNNH17": {
        "institution_name_hmda": "Navy Federal Credit Union",
        "nmls_id": "399807",
        "our_lender_slug": "navy-federal-jacksonville",
        "legal_name": "Navy Federal Credit Union",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "549300U3721PJGQZYY68": {
        "institution_name_hmda": "GUARANTEED RATE, INC.",
        "nmls_id": "2611",
        "our_lender_slug": "guaranteed-rate",
        "legal_name": "Guaranteed Rate, Inc.",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "5493001SXWZ4OFP8Z903": {
        "institution_name_hmda": "DHI MORTGAGE COMPANY, LTD.",
        "nmls_id": "14622",
        "our_lender_slug": "dhi-mortgage-buckeye",
        "legal_name": "DHI Mortgage Company, Ltd.",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+directory_slug",
    },
    "549300LBCBNR1OT00651": {
        "institution_name_hmda": "NATIONSTAR MORTGAGE LLC",
        "nmls_id": "2104",
        "our_lender_slug": "mr-cooper",
        "legal_name": "Nationstar Mortgage LLC",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "549300MGPZBLQDIL7538": {
        "institution_name_hmda": "FAIRWAY INDEPENDENT MORTGAGE CORPORATION",
        "nmls_id": "2909",
        "our_lender_slug": "fairway-mortgage-augusta-sheppard",
        "legal_name": "Fairway Independent Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "549300GKFNPRWNS0GF29": {
        "institution_name_hmda": "AmeriHome Mortgage Company, LLC",
        "nmls_id": "1120271",
        "our_lender_slug": "amerihome-mortgage",
        "legal_name": "AmeriHome Mortgage Company, LLC",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "6BYL5QZYBDK8S7L73M02": {
        "institution_name_hmda": "U.S. Bank National Association",
        "nmls_id": "402216",
        "our_lender_slug": "us-bank",
        "legal_name": "U.S. Bank National Association",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "KB1H1DSPRFMYMCUFXT09": {
        "institution_name_hmda": "Wells Fargo Bank, National Association",
        "nmls_id": "399801",
        "our_lender_slug": "wells-fargo-bank",
        "legal_name": "Wells Fargo Bank, National Association",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "C5654JQHZUHN0772B561": {
        "institution_name_hmda": "USAA Federal Savings Bank",
        "nmls_id": "399809",
        "our_lender_slug": "usaa-federal-savings-bank",
        "legal_name": "USAA Federal Savings Bank",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "254900DTLHVWQ7NP7R34": {
        "institution_name_hmda": "CMG Mortgage, Inc.",
        "nmls_id": "1820",
        "our_lender_slug": "cmg-home-loans-dennis-vo",
        "legal_name": "CMG Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "549300WYBPIWKK6SQC06": {
        "institution_name_hmda": "Bell Bank",
        "nmls_id": "",
        "our_lender_slug": "bell-bank",
        "legal_name": "Bell Bank",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+directory_slug",
    },
    "549300C4J510S9L1RF98": {
        "institution_name_hmda": "Alerus Financial, National Association",
        "nmls_id": "",
        "our_lender_slug": "alerus-financial",
        "legal_name": "Alerus Financial, National Association",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+directory_slug",
    },
    "549300RFSMIRUODUVW59": {
        "institution_name_hmda": "First Interstate Bank",
        "nmls_id": "",
        "our_lender_slug": "first-interstate-bank",
        "legal_name": "First Interstate Bank",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+directory_slug",
    },
    "54930052M48FOD3CWA54": {
        "institution_name_hmda": "PRIMARY RESIDENTIAL MORTGAGE, INC.",
        "nmls_id": "3094",
        "our_lender_slug": "primary-residential-mortgage",
        "legal_name": "Primary Residential Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "549300VQUTI5IU7GXT57": {
        "institution_name_hmda": "SECURITYNATIONAL MORTGAGE COMPANY",
        "nmls_id": "3116",
        "our_lender_slug": "securitynational-mortgage",
        "legal_name": "SecurityNational Mortgage Company",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    "5493001GDRY0EL7VG372": {
        "institution_name_hmda": "ARK-LA-TEX FINANCIAL SERVICES, LLC.",
        "nmls_id": "2143",
        "our_lender_slug": "benchmark-mortgage",
        "legal_name": "Ark-La-Tex Financial Services, LLC dba Benchmark Mortgage",
        "match_confidence": "high",
        "match_method": "final4_gleif_reidentify+public_nmls",
    },
    # ── Alaska ───────────────────────────────────────────────────────────────
    "549300DK7QID2ZON6Q55": {
        "institution_name_hmda": "Global Federal Credit Union",
        "nmls_id": "409001",
        "our_lender_slug": "global-federal-credit-union",
        "legal_name": "Global Federal Credit Union",
        "match_confidence": "high",
        "match_method": "final4_gleif+public_nmls",
    },
    "549300SCFWZXMDMZPE93": {
        "institution_name_hmda": "RESIDENTIAL MORTGAGE, LLC",
        "nmls_id": "",
        "our_lender_slug": "residential-mortgage-alaska",
        "legal_name": "Residential Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "final4_gleif+lei_identity",
    },
    "25490089V5DJHFQMOA03": {
        "institution_name_hmda": "First National Bank Alaska",
        "nmls_id": "640297",
        "our_lender_slug": "first-national-bank-alaska",
        "legal_name": "First National Bank Alaska",
        "match_confidence": "high",
        "match_method": "final4_gleif+public_nmls",
    },
    "5493001K6UOKMZBPMI34": {
        "institution_name_hmda": "CREDIT UNION 1 Credit Union",
        "nmls_id": "",
        "our_lender_slug": "credit-union-1-alaska",
        "legal_name": "Credit Union 1",
        "match_confidence": "high",
        "match_method": "final4_gleif+lei_identity",
    },
    "25490011JA7PP73YY190": {
        "institution_name_hmda": "Mt. McKinley Bank",
        "nmls_id": "",
        "our_lender_slug": "mt-mckinley-bank",
        "legal_name": "Mt. McKinley Bank",
        "match_confidence": "high",
        "match_method": "final4_gleif+lei_identity",
    },
    # ── Hawaii ───────────────────────────────────────────────────────────────
    "XJCRTTYJVBMA22IXL619": {
        "institution_name_hmda": "Bank of Hawaii",
        "nmls_id": "",
        "our_lender_slug": "bank-of-hawaii",
        "legal_name": "Bank of Hawaii",
        "match_confidence": "high",
        "match_method": "final4_gleif+lei_identity",
    },
    "WWJYKHS2UNKSDW8XLB53": {
        "institution_name_hmda": "First Hawaiian Bank",
        "nmls_id": "",
        "our_lender_slug": "first-hawaiian-bank",
        "legal_name": "First Hawaiian Bank",
        "match_confidence": "high",
        "match_method": "final4_gleif+lei_identity",
    },
    "549300BES7HNVKCDIM50": {
        "institution_name_hmda": "AMERICAN SAVINGS BANK, NATIONAL ASSOCIATION",
        "nmls_id": "423168",
        "our_lender_slug": "american-savings-bank-hawaii",
        "legal_name": "American Savings Bank, National Association",
        "match_confidence": "high",
        "match_method": "final4_gleif+public_nmls",
    },
    "5493005VBGFDRV6FSU19": {
        "institution_name_hmda": "HAWAII STATE FEDERAL CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "hawaii-state-federal-credit-union",
        "legal_name": "Hawaii State Federal Credit Union",
        "match_confidence": "high",
        "match_method": "final4_gleif+lei_identity",
    },
    "549300Z6QWABFYI73E79": {
        "institution_name_hmda": "HAWAIIUSA",
        "nmls_id": "",
        "our_lender_slug": "hawaiiusa-federal-credit-union",
        "legal_name": "HawaiiUSA Federal Credit Union",
        "match_confidence": "high",
        "match_method": "final4_gleif+lei_identity",
    },
    "5493005R24FV5DFFXW42": {
        "institution_name_hmda": "Central Pacific Bank",
        "nmls_id": "",
        "our_lender_slug": "central-pacific-bank",
        "legal_name": "Central Pacific Bank",
        "match_confidence": "high",
        "match_method": "final4_gleif+lei_identity",
    },
    # ── North Dakota ─────────────────────────────────────────────────────────
    "549300TQVOMKNKFOH392": {
        "institution_name_hmda": "GATE CITY BANK",
        "nmls_id": "435154",
        "our_lender_slug": "gate-city-bank",
        "legal_name": "Gate City Bank",
        "match_confidence": "high",
        "match_method": "final4_gleif+public_nmls",
    },
    "5493002LPXKMOZNXUY90": {
        "institution_name_hmda": "First International Bank & Trust",
        "nmls_id": "",
        "our_lender_slug": "first-international-bank-and-trust",
        "legal_name": "First International Bank & Trust",
        "match_confidence": "high",
        "match_method": "final4_gleif+lei_identity",
    },
    "213800THW6KSUL191M34": {
        "institution_name_hmda": "FIRST COMMUNITY CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "first-community-credit-union-nd",
        "legal_name": "First Community Credit Union",
        "match_confidence": "high",
        "match_method": "final4_gleif+lei_identity",
    },
    "549300UQPFB0RR8JCA42": {
        "institution_name_hmda": "Dacotah Bank",
        "nmls_id": "",
        "our_lender_slug": "dacotah-bank",
        "legal_name": "Dacotah Bank",
        "match_confidence": "high",
        "match_method": "final4_gleif+lei_identity",
    },
    "549300UONVHJ0G6DSL23": {
        "institution_name_hmda": "Bravera Bank",
        "nmls_id": "",
        "our_lender_slug": "bravera-bank",
        "legal_name": "Bravera Bank",
        "match_confidence": "high",
        "match_method": "final4_gleif+lei_identity",
    },
    # ── South Dakota ─────────────────────────────────────────────────────────
    "549300KJ8PAJ7E52HG32": {
        "institution_name_hmda": "Plains Commerce Bank",
        "nmls_id": "463950",
        "our_lender_slug": "plains-commerce-bank",
        "legal_name": "Plains Commerce Bank",
        "match_confidence": "high",
        "match_method": "final4_gleif+public_nmls",
    },
    "549300Z77WUYJM3QG591": {
        "institution_name_hmda": "First PREMIER Bank",
        "nmls_id": "474396",
        "our_lender_slug": "first-premier-bank",
        "legal_name": "First PREMIER Bank",
        "match_confidence": "high",
        "match_method": "final4_gleif+public_nmls",
    },
    "549300M2Z8GR3VL0QQ74": {
        "institution_name_hmda": "BLACK HILLS FEDERAL CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "black-hills-federal-credit-union",
        "legal_name": "Black Hills Federal Credit Union",
        "match_confidence": "high",
        "match_method": "final4_gleif+lei_identity",
    },
    "549300T1ONVEMLQ4B629": {
        "institution_name_hmda": "First Dakota National Bank",
        "nmls_id": "410144",
        "our_lender_slug": "first-dakota-national-bank",
        "legal_name": "First Dakota National Bank",
        "match_confidence": "high",
        "match_method": "final4_gleif+public_nmls",
    },
    "549300IQ5NY7CSJLZW53": {
        "institution_name_hmda": "FIRST BANK & TRUST",
        "nmls_id": "",
        "our_lender_slug": "first-bank-and-trust-south-dakota",
        "legal_name": "First Bank & Trust",
        "match_confidence": "high",
        "match_method": "final4_gleif+lei_identity",
    },
    "549300REHZOIYMHDPI61": {
        "institution_name_hmda": "Levo Federal Credit Union",
        "nmls_id": "",
        "our_lender_slug": "levo-federal-credit-union",
        "legal_name": "Levo Federal Credit Union",
        "match_confidence": "high",
        "match_method": "final4_gleif+lei_identity",
    },
    "5493007YN2BYYXCI7W64": {
        "institution_name_hmda": "BANKWEST, INC.",
        "nmls_id": "",
        "our_lender_slug": "bankwest-south-dakota",
        "legal_name": "BankWest, Inc.",
        "match_confidence": "high",
        "match_method": "final4_gleif+lei_identity",
    },
}

AK_COUNTIES: dict[str, str] = {
    "02020": "Anchorage",
    "02050": "Bethel",
    "02063": "Chugach",
    "02066": "Copper River",
    "02068": "Denali",
    "02090": "Fairbanks North Star",
    "02100": "Haines",
    "02110": "Juneau",
    "02122": "Kenai Peninsula",
    "02130": "Ketchikan Gateway",
    "02150": "Kodiak Island",
    "02170": "Matanuska-Susitna",
    "02180": "Nome",
    "02185": "North Slope",
    "02195": "Petersburg",
    "02220": "Sitka",
    "02240": "Southeast Fairbanks",
}

AK_MAJORS: set[str] = {
    "02020",  # Anchorage
    "02170",  # Matanuska-Susitna
    "02090",  # Fairbanks North Star
    "02122",  # Kenai Peninsula
    "02110",  # Juneau
    "02130",  # Ketchikan Gateway
    "02150",  # Kodiak Island
    "02240",  # Southeast Fairbanks
    "02220",  # Sitka
    "02180",  # Nome
    "02050",  # Bethel
    "02063",  # Chugach
}

HI_COUNTIES: dict[str, str] = {
    "15001": "Hawaii",
    "15003": "Honolulu",
    "15007": "Kauai",
    "15009": "Maui",
}

HI_MAJORS: set[str] = {
    "15003",  # Honolulu
    "15001",  # Hawaii
    "15009",  # Maui
    "15007",  # Kauai
}

ND_COUNTIES: dict[str, str] = {
    "38003": "Barnes",
    "38015": "Burleigh",
    "38017": "Cass",
    "38025": "Dunn",
    "38035": "Grand Forks",
    "38053": "McKenzie",
    "38055": "McLean",
    "38057": "Mercer",
    "38059": "Morton",
    "38061": "Mountrail",
    "38071": "Ramsey",
    "38077": "Richland",
    "38089": "Stark",
    "38093": "Stutsman",
    "38097": "Traill",
    "38101": "Ward",
    "38105": "Williams",
}

ND_MAJORS: set[str] = {
    "38017",  # Cass
    "38015",  # Burleigh
    "38101",  # Ward
    "38035",  # Grand Forks
    "38059",  # Morton
    "38089",  # Stark
    "38105",  # Williams
    "38093",  # Stutsman
    "38077",  # Richland
    "38053",  # McKenzie
    "38055",  # McLean
    "38003",  # Barnes
    "38071",  # Ramsey
    "38097",  # Traill
    "38057",  # Mercer
    "38061",  # Mountrail
}

SD_COUNTIES: dict[str, str] = {
    "46011": "Brookings",
    "46013": "Brown",
    "46019": "Butte",
    "46027": "Clay",
    "46029": "Codington",
    "46035": "Davison",
    "46065": "Hughes",
    "46079": "Lake",
    "46081": "Lawrence",
    "46083": "Lincoln",
    "46093": "Meade",
    "46099": "Minnehaha",
    "46103": "Pennington",
    "46127": "Union",
    "46135": "Yankton",
}

SD_MAJORS: set[str] = {
    "46099",  # Minnehaha
    "46103",  # Pennington
    "46083",  # Lincoln
    "46093",  # Meade
    "46081",  # Lawrence
    "46029",  # Codington
    "46011",  # Brookings
    "46013",  # Brown
    "46127",  # Union
    "46035",  # Davison
    "46135",  # Yankton
    "46065",  # Hughes
    "46079",  # Lake
    "46027",  # Clay
    "46019",  # Butte
}

STATES = [
    {
        "code": "AK",
        "name": "Alaska",
        "folder": "alaska",
        "suffix": "_ak",
        "col": "alaska_originations",
        "alias_col": "ak_originations",
        "counties": AK_COUNTIES,
        "majors": AK_MAJORS,
        "min_orig": 20,
    },
    {
        "code": "HI",
        "name": "Hawaii",
        "folder": "hawaii",
        "suffix": "_hi",
        "col": "hawaii_originations",
        "alias_col": "hi_originations",
        "counties": HI_COUNTIES,
        "majors": HI_MAJORS,
        "min_orig": 100,
    },
    {
        "code": "ND",
        "name": "North Dakota",
        "folder": "north-dakota",
        "suffix": "_nd",
        "col": "north_dakota_originations",
        "alias_col": "nd_originations",
        "counties": ND_COUNTIES,
        "majors": ND_MAJORS,
        "min_orig": 100,
    },
    {
        "code": "SD",
        "name": "South Dakota",
        "folder": "south-dakota",
        "suffix": "_sd",
        "col": "south_dakota_originations",
        "alias_col": "sd_originations",
        "counties": SD_COUNTIES,
        "majors": SD_MAJORS,
        "min_orig": 150,
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
    s = name.strip().lower()
    s = s.replace("ñ", "n")
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
    min_orig = float(cfg.get("min_orig") or 200)

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
        if name or fips in majors or orig >= min_orig:
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
        if method_prefix.startswith("final4_curated") and curated_slug:
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
            "priority_match": "high" if st_orig >= 300 else "medium",
            "notes": (
                f"{method_prefix.rstrip('+') or 'curated'} map for {code} activity "
                f"({st_orig} {code} originations); slug={slug}."
            ),
        }
        prev = mapping_by_lei.get(lei)
        if prev and int(float(prev[col] or 0)) >= st_orig and prev.get("our_lender_slug"):
            if not method_prefix.startswith("final4_curated"):
                return
        mapping_by_lei[lei] = row

    for lei, prior in lei_to_map.items():
        add_mapping(lei, prior, "reuse_prior_state_curated_lei+")
    for lei, cur in CURATED_LEI.items():
        add_mapping(lei, cur, "final4_curated+")

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
        f"- Market rows: **{len(county_out)}**\n",
        f"- Lender–market activity (major markets): **{len(act_out)}**\n",
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
        "- AK: Global FCU, Residential Mortgage LLC, First National Bank Alaska, Credit Union 1, Mt. McKinley Bank\n"
        "- HI: Bank of Hawaii, First Hawaiian, American Savings Bank, Hawaii State FCU, HawaiiUSA, Central Pacific Bank\n"
        "- ND: Gate City Bank, First International Bank & Trust, First Community CU, Dacotah Bank, Bravera Bank\n"
        "- SD: Plains Commerce Bank, First PREMIER, Black Hills FCU, First Dakota, First Bank & Trust, Levo FCU, BankWest\n"
        "- Precision over coverage — no fuzzy LEI inventing\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-final4-slices.py\n"
        "```\n"
        "\n## Major slugs (for states.ts)\n\n```\n"
        + ", ".join(f"'{s}'" for s in major_slugs)
        + "\n```\n"
    )
    (out / "README.md").write_text("".join(md), encoding="utf-8")
    print(
        f"Wrote {cfg['name']} → {out} "
        f"mappings={len(mapping_rows)} markets={len(county_out)} "
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
    print("\nNational map complete: AK + HI + ND + SD product slices ready.")


if __name__ == "__main__":
    main()
