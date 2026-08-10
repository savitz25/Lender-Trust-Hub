#!/usr/bin/env python3
"""
Deepen Tennessee HMDA product coverage (high-volume phase).

  python scripts/build-hmda-tennessee-deepen.py

Source: data/hmda/by-state/TN/
Writes: data/hmda/tennessee/*_tn.csv + lei_to_nmls_mapping.csv
Patches: lib/hmda/states.ts TN majorCountySlugs
"""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "data" / "hmda" / "by-state" / "TN"
OUT = ROOT / "data" / "hmda" / "tennessee"
GLEIF_CACHE = ROOT / "data" / "hmda" / "florida" / "_gleif_name_cache.json"
STATE_TS = ROOT / "lib" / "hmda" / "states.ts"

TN_COUNTIES: dict[str, str] = {
    "47037": "Davidson",
    "47157": "Shelby",
    "47093": "Knox",
    "47065": "Hamilton",
    "47149": "Rutherford",
    "47125": "Montgomery",
    "47187": "Williamson",
    "47165": "Sumner",
    "47189": "Wilson",
    "47163": "Sullivan",
    "47009": "Blount",
    "47119": "Maury",
    "47179": "Washington",
    "47155": "Sevier",
    "47011": "Bradley",
    "47147": "Robertson",
    "47113": "Madison",
    "47001": "Anderson",
    "47105": "Loudon",
    "47141": "Putnam",
    "47145": "Roane",
    "47043": "Dickson",
    "47059": "Greene",
    "47063": "Hamblen",
    "47089": "Jefferson",
    "47035": "Cumberland",
    "47031": "Coffee",
    "47167": "Tipton",
    "47107": "McMinn",
    "47021": "Cheatham",
    "47047": "Hickman",
    "47003": "Bedford",
    "47073": "Hawkins",
    "47117": "Marshall",
    "47053": "Gibson",
}

TN_MAJORS: set[str] = set(TN_COUNTIES.keys())

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
    "39179": "movement-mortgage-charlotte",
    "3274": "guild-mortgage-charlotte",
    "3029": "crosscountry-mortgage-charlotte",
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
    "399802": "bank-of-america-mortgage-north-dfw",
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
    "467341": "regions-bank",
    "472433": "firstbank-tennessee",
    "34391": "mortgage-investors-group-knoxville",
    "418535": "pinnacle-bank",
    "629700": "first-community-mortgage",
    "167911": "knoxville-tva-employees-credit-union",
    "451452": "ascend-federal-credit-union",
    "402436": "cadence-bank",
    "767482": "wilson-bank-and-trust",
    "460298": "tennessee-valley-federal-credit-union",
    "1591": "churchill-mortgage-nashville",
    "402804": "leaders-credit-union",
    "405461": "southstate-bank",
    "405455": "ameris-bank",
    "503941": "first-citizens-bank",
    "2893": "nfm-lending",
    "75164": "prosperity-home-mortgage",
    "1127": "nvr-mortgage",
    "421841": "united-community-bank",
    "72043": "atlantic-bay-mortgage-charleston",
}

# GLEIF-verified curated maps (win over prior).
TN_CURATED_LEI: dict[str, dict[str, str]] = {
    # Nationals re-ID
    "549300HW662MN1WU8550": {
        "institution_name_hmda": "United Wholesale Mortgage, LLC",
        "nmls_id": "3038",
        "our_lender_slug": "united-wholesale-mortgage",
        "legal_name": "United Wholesale Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "549300FGXN1K3HLB1R50": {
        "institution_name_hmda": "Rocket Mortgage, LLC",
        "nmls_id": "3030",
        "our_lender_slug": "rocket-mortgage",
        "legal_name": "Rocket Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "EQTWLK1G7ODGC2MGLV11": {
        "institution_name_hmda": "Regions Bank",
        "nmls_id": "467341",
        "our_lender_slug": "regions-bank",
        "legal_name": "Regions Bank",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "549300OBO7DOF2KOP535": {
        "institution_name_hmda": "FirstBank",
        "nmls_id": "472433",
        "our_lender_slug": "firstbank-tennessee",
        "legal_name": "FirstBank",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "549300GKFNPRWNS0GF29": {
        "institution_name_hmda": "AmeriHome Mortgage Company, LLC",
        "nmls_id": "1120271",
        "our_lender_slug": "amerihome-mortgage",
        "legal_name": "AmeriHome Mortgage Company, LLC",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "549300DD4R4SYK5RAQ92": {
        "institution_name_hmda": "MOVEMENT MORTGAGE, LLC",
        "nmls_id": "39179",
        "our_lender_slug": "movement-mortgage-charlotte",
        "legal_name": "Movement Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "549300DD5QQUHO6PCH70": {
        "institution_name_hmda": "MORTGAGE RESEARCH CENTER, LLC",
        "nmls_id": "1907",
        "our_lender_slug": "veterans-united-west-valley",
        "legal_name": "Mortgage Research Center, LLC (Veterans United Home Loans)",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "549300VNBQD8FDHF7563": {
        "institution_name_hmda": "MORTGAGE INVESTORS GROUP, INC.",
        "nmls_id": "34391",
        "our_lender_slug": "mortgage-investors-group-knoxville",
        "legal_name": "Mortgage Investors Group, Inc.",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "549300CDOC4F7XSRG390": {
        "institution_name_hmda": "Pinnacle Bank",
        "nmls_id": "418535",
        "our_lender_slug": "pinnacle-bank",
        "legal_name": "Pinnacle Bank",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "RVDPPPGHCGZ40J4VQ731": {
        "institution_name_hmda": "PENNYMAC LOAN SERVICES, LLC",
        "nmls_id": "35953",
        "our_lender_slug": "pennymac",
        "legal_name": "PennyMac Loan Services, LLC",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "COOWI3L2W9TPYR3WJX37": {
        "institution_name_hmda": "First Horizon Bank",
        "nmls_id": "",
        "our_lender_slug": "first-horizon-bank",
        "legal_name": "First Horizon Bank",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+directory_slug",
    },
    "549300R0SXC1JU7ZU290": {
        "institution_name_hmda": "FIRST COMMUNITY MORTGAGE, INC.",
        "nmls_id": "629700",
        "our_lender_slug": "first-community-mortgage",
        "legal_name": "First Community Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "549300AQ3T62GXDU7D76": {
        "institution_name_hmda": "GUILD MORTGAGE COMPANY LLC",
        "nmls_id": "3274",
        "our_lender_slug": "guild-mortgage-charlotte",
        "legal_name": "Guild Mortgage Company LLC",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "549300LYRWPSYPK6S325": {
        "institution_name_hmda": "FREEDOM MORTGAGE CORPORATION",
        "nmls_id": "2767",
        "our_lender_slug": "freedom-mortgage",
        "legal_name": "Freedom Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "549300VORTI31GZTJL53": {
        "institution_name_hmda": "CARDINAL FINANCIAL COMPANY, LIMITED PARTNERSHIP",
        "nmls_id": "66247",
        "our_lender_slug": "cardinal-financial",
        "legal_name": "Cardinal Financial Company, Limited Partnership",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "5493001SXWZ4OFP8Z903": {
        "institution_name_hmda": "DHI MORTGAGE COMPANY, LTD.",
        "nmls_id": "14622",
        "our_lender_slug": "dhi-mortgage-buckeye",
        "legal_name": "DHI Mortgage Company, Ltd.",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+directory_slug",
    },
    "549300VZVN841I2ILS84": {
        "institution_name_hmda": "CROSSCOUNTRY MORTGAGE, LLC",
        "nmls_id": "3029",
        "our_lender_slug": "crosscountry-mortgage-charlotte",
        "legal_name": "CrossCountry Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "JJKC32MCHWDI71265Z06": {
        "institution_name_hmda": "Truist Bank",
        "nmls_id": "405457",
        "our_lender_slug": "truist-bank",
        "legal_name": "Truist Bank",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "549300AG64NHILB7ZP05": {
        "institution_name_hmda": "LOANDEPOT.COM, LLC",
        "nmls_id": "174457",
        "our_lender_slug": "loandepot",
        "legal_name": "loanDepot.com, LLC",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "5493003GQDUH26DNNH17": {
        "institution_name_hmda": "Navy Federal Credit Union",
        "nmls_id": "399807",
        "our_lender_slug": "navy-federal-jacksonville",
        "legal_name": "Navy Federal Credit Union",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "549300U3721PJGQZYY68": {
        "institution_name_hmda": "GUARANTEED RATE, INC.",
        "nmls_id": "2611",
        "our_lender_slug": "guaranteed-rate",
        "legal_name": "Guaranteed Rate, Inc.",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "549300LBCBNR1OT00651": {
        "institution_name_hmda": "NATIONSTAR MORTGAGE LLC",
        "nmls_id": "2104",
        "our_lender_slug": "mr-cooper",
        "legal_name": "Nationstar Mortgage LLC",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "6BYL5QZYBDK8S7L73M02": {
        "institution_name_hmda": "U.S. Bank National Association",
        "nmls_id": "402216",
        "our_lender_slug": "us-bank",
        "legal_name": "U.S. Bank National Association",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "54930074H8866HTIWU69": {
        "institution_name_hmda": "KNOXVILLE TVA EMPLOYEES CREDIT UNION",
        "nmls_id": "167911",
        "our_lender_slug": "knoxville-tva-employees-credit-union",
        "legal_name": "Knoxville TVA Employees Credit Union",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "549300E1PJPTI4YS7H26": {
        "institution_name_hmda": "ASCEND FEDERAL CREDIT UNION",
        "nmls_id": "451452",
        "our_lender_slug": "ascend-federal-credit-union",
        "legal_name": "Ascend Federal Credit Union",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "Q7C315HKI8VX0SSKBS64": {
        "institution_name_hmda": "Cadence Bank",
        "nmls_id": "402436",
        "our_lender_slug": "cadence-bank",
        "legal_name": "Cadence Bank",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "549300MGPZBLQDIL7538": {
        "institution_name_hmda": "FAIRWAY INDEPENDENT MORTGAGE CORPORATION",
        "nmls_id": "2909",
        "our_lender_slug": "fairway-mortgage-augusta-sheppard",
        "legal_name": "Fairway Independent Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "549300E2UX99HKDBR481": {
        "institution_name_hmda": "NEW AMERICAN FUNDING, LLC",
        "nmls_id": "6606",
        "our_lender_slug": "new-american-funding",
        "legal_name": "New American Funding, LLC",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "5493000YNV8IX4VD3X12": {
        "institution_name_hmda": "VANDERBILT MORTGAGE AND FINANCE, INC.",
        "nmls_id": "1561",
        "our_lender_slug": "silverton-mortgage-myrtle-beach",
        "legal_name": "Vanderbilt Mortgage and Finance, Inc. (dba Silverton Mortgage)",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+silverton_dba+public_nmls",
    },
    "B4TYDEB6GKMZO031MB27": {
        "institution_name_hmda": "Bank of America, National Association",
        "nmls_id": "399802",
        "our_lender_slug": "bank-of-america-mortgage-north-dfw",
        "legal_name": "Bank of America, National Association",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "549300RPOGWJRH63HS39": {
        "institution_name_hmda": "UNION HOME MORTGAGE CORP.",
        "nmls_id": "1904",
        "our_lender_slug": "union-home-mortgage-reeves-team",
        "legal_name": "Union Home Mortgage Corp.",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "549300FNXYY540N23N64": {
        "institution_name_hmda": "Newrez LLC",
        "nmls_id": "2289",
        "our_lender_slug": "newrez",
        "legal_name": "Newrez LLC",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "254900PVWALA7JTBXA31": {
        "institution_name_hmda": "WILSON BANK AND TRUST",
        "nmls_id": "767482",
        "our_lender_slug": "wilson-bank-and-trust",
        "legal_name": "Wilson Bank and Trust",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "7H6GLXDRUGQFU57RNE97": {
        "institution_name_hmda": "JPMorgan Chase Bank, National Association",
        "nmls_id": "399798",
        "our_lender_slug": "jpmorgan-chase-bank",
        "legal_name": "JPMorgan Chase Bank, National Association",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "T68X8LLAQYRNDV034K14": {
        "institution_name_hmda": "United Community Bank",
        "nmls_id": "421841",
        "our_lender_slug": "united-community-bank",
        "legal_name": "United Community Bank",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "5493007669OVCSCATP45": {
        "institution_name_hmda": "TENNESSEE VALLEY FCU",
        "nmls_id": "460298",
        "our_lender_slug": "tennessee-valley-federal-credit-union",
        "legal_name": "Tennessee Valley Federal Credit Union",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "QFROUN1UWUYU0DVIWD51": {
        "institution_name_hmda": "Eagle Home Mortgage, LLC",
        "nmls_id": "2925",
        "our_lender_slug": "eagle-home-mortgage",
        "legal_name": "Eagle Home Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "549300KIOYNU323LVJ37": {
        "institution_name_hmda": "AMERICAN PACIFIC MORTGAGE CORPORATION",
        "nmls_id": "1850",
        "our_lender_slug": "american-pacific-mortgage-inland-empire",
        "legal_name": "American Pacific Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "549300H3IZO24NSOO931": {
        "institution_name_hmda": "LENNAR MORTGAGE, LLC",
        "nmls_id": "1058",
        "our_lender_slug": "lennar-mortgage-queen-creek",
        "legal_name": "Lennar Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+directory_slug",
    },
    "549300121SF0K2LN2804": {
        "institution_name_hmda": "PRIMELENDING, A PLAINSCAPITAL COMPANY",
        "nmls_id": "1921",
        "our_lender_slug": "primelending-columbus",
        "legal_name": "PrimeLending, a PlainsCapital Company",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "549300PIL8LFAQ04XC20": {
        "institution_name_hmda": "Better Mortgage Corporation",
        "nmls_id": "330511",
        "our_lender_slug": "better-mortgage",
        "legal_name": "Better Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "549300OPCWU6E72WUT29": {
        "institution_name_hmda": "MUTUAL OF OMAHA MORTGAGE, INC.",
        "nmls_id": "1025894",
        "our_lender_slug": "mutual-of-omaha-mortgage",
        "legal_name": "Mutual of Omaha Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "549300YIQ7S7Z8PIHE53": {
        "institution_name_hmda": "AMERISAVE MORTGAGE CORPORATION",
        "nmls_id": "1168",
        "our_lender_slug": "amerisave",
        "legal_name": "Amerisave Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif_reidentify+public_nmls",
    },
    "549300RN01LBYR8ZVX74": {
        "institution_name_hmda": "LOWER, LLC",
        "nmls_id": "1124061",
        "our_lender_slug": "lower",
        "legal_name": "Lower, LLC",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "549300370QILXLFUWD20": {
        "institution_name_hmda": "ZILLOW HOME LOANS, LLC",
        "nmls_id": "1027871",
        "our_lender_slug": "zillow-home-loans",
        "legal_name": "Zillow Home Loans, LLC",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "54930021WPEXNHYZUL09": {
        "institution_name_hmda": "PLANET HOME LENDING, LLC",
        "nmls_id": "17022",
        "our_lender_slug": "planet-home-lending",
        "legal_name": "Planet Home Lending, LLC",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "5493001GDRY0EL7VG372": {
        "institution_name_hmda": "ARK-LA-TEX FINANCIAL SERVICES, LLC.",
        "nmls_id": "2143",
        "our_lender_slug": "benchmark-mortgage",
        "legal_name": "Ark-La-Tex Financial Services, LLC dba Benchmark Mortgage",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "549300MZ8VZJOVC63092": {
        "institution_name_hmda": "KIND LENDING, LLC",
        "nmls_id": "3925",
        "our_lender_slug": "kind-lending",
        "legal_name": "Kind Lending, LLC",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "549300JYXTZDSPJEPI44": {
        "institution_name_hmda": "PLAZA HOME MORTGAGE, INC.",
        "nmls_id": "2113",
        "our_lender_slug": "plaza-home-mortgage",
        "legal_name": "Plaza Home Mortgage, Inc.",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "549300O6Z0I6KYMESL47": {
        "institution_name_hmda": "AMWEST FUNDING CORP.",
        "nmls_id": "167441",
        "our_lender_slug": "amwest-funding",
        "legal_name": "AmWest Funding Corp.",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "549300VQUTI5IU7GXT57": {
        "institution_name_hmda": "SECURITYNATIONAL MORTGAGE COMPANY",
        "nmls_id": "3116",
        "our_lender_slug": "securitynational-mortgage",
        "legal_name": "SecurityNational Mortgage Company",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "549300NOCASXPA34X033": {
        "institution_name_hmda": "LAKEVIEW LOAN SERVICING, LLC",
        "nmls_id": "4095",
        "our_lender_slug": "lakeview-loan-servicing",
        "legal_name": "Lakeview Loan Servicing, LLC",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "549300KBWX4NV5Q1E376": {
        "institution_name_hmda": "NVR Mortgage Finance, Inc.",
        "nmls_id": "1127",
        "our_lender_slug": "nvr-mortgage",
        "legal_name": "NVR Mortgage Finance, Inc.",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "549300MCIFZSDHUT8X63": {
        "institution_name_hmda": "NFM, INC.",
        "nmls_id": "2893",
        "our_lender_slug": "nfm-lending",
        "legal_name": "NFM, Inc. (dba NFM Lending)",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    "5493005PKOSG7MYX0B34": {
        "institution_name_hmda": "Prosperity Home Mortgage, LLC",
        "nmls_id": "75164",
        "our_lender_slug": "prosperity-home-mortgage",
        "legal_name": "Prosperity Home Mortgage, LLC",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls",
    },
    # Multi-state regionals with prior maps
    "549300AT7EB9FJAF0E61": {
        "institution_name_hmda": "Old National Bank",
        "nmls_id": "",
        "our_lender_slug": "old-national-bank",
        "legal_name": "Old National Bank",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+directory_slug",
    },
    "5493002RF1ERFA2XR050": {
        "institution_name_hmda": "Renasant Bank",
        "nmls_id": "",
        "our_lender_slug": "renasant-bank",
        "legal_name": "Renasant Bank",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+directory_slug",
    },
    "549300DPRWSBUY619V27": {
        "institution_name_hmda": "Simmons Bank",
        "nmls_id": "",
        "our_lender_slug": "simmons-bank",
        "legal_name": "Simmons Bank",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+directory_slug",
    },
    "549300QR0KFPEDZPEI42": {
        "institution_name_hmda": "STOCKTON MORTGAGE CORPORATION",
        "nmls_id": "",
        "our_lender_slug": "stockton-mortgage",
        "legal_name": "Stockton Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+directory_slug",
    },
    "54930072OCHTUJOZQB56": {
        "institution_name_hmda": "Liberty Credit Union",
        "nmls_id": "",
        "our_lender_slug": "liberty-federal-credit-union",
        "legal_name": "Liberty Credit Union",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+directory_slug",
    },
    "549300G6RZM5T8NQJW74": {
        "institution_name_hmda": "REDSTONE FEDERAL CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "redstone-federal-credit-union",
        "legal_name": "Redstone Federal Credit Union",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+directory_slug",
    },
    # TN deepen regionals
    "549300DDLYW49R2HCV81": {
        "institution_name_hmda": "EASTMAN CREDIT UNION",
        "nmls_id": "",
        "our_lender_slug": "eastman-credit-union",
        "legal_name": "Eastman Credit Union",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+tn_directory",
    },
    "254900FJRICL380R4T46": {
        "institution_name_hmda": "Leaders Credit Union",
        "nmls_id": "402804",
        "our_lender_slug": "leaders-credit-union",
        "legal_name": "Leaders Credit Union",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls+tn_directory",
    },
    "549300K6L4VXCXWN4205": {
        "institution_name_hmda": "ORNL",
        "nmls_id": "",
        "our_lender_slug": "ornl-federal-credit-union",
        "legal_name": "ORNL Federal Credit Union",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+tn_directory",
    },
    "549300BLL6VL7AXWYP56": {
        "institution_name_hmda": "CHURCHILL MORTGAGE CORPORATION",
        "nmls_id": "1591",
        "our_lender_slug": "churchill-mortgage-nashville",
        "legal_name": "Churchill Mortgage Corporation",
        "match_confidence": "high",
        "match_method": "tn_deepen_gleif+public_nmls+tn_directory",
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
    if not (r.get("county_name") or "").strip() and fips in TN_COUNTIES:
        return {**r, "county_name": TN_COUNTIES[fips]}
    return r


def load_prior_maps() -> dict[str, dict[str, str]]:
    lei_to_map: dict[str, dict[str, str]] = {}
    for path in sorted((ROOT / "data" / "hmda").glob("*/lei_to_nmls_mapping.csv")):
        if "by-state" in str(path) or path.parent.name == "tennessee":
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
        r'(code: [\'"]TN[\'"],[\s\S]*?)majorCountySlugs: new Set\(\[[\s\S]*?\]\),',
        re.M,
    )
    m = pattern.search(text)
    if not m:
        raise SystemExit("Could not find TN majorCountySlugs in states.ts")
    text2 = pattern.sub(m.group(1) + new_block, text, count=1)
    STATE_TS.write_text(text2, encoding="utf-8")


def main() -> None:
    if not SRC.is_dir():
        raise SystemExit(f"Missing {SRC}")

    gleif: dict[str, str] = {}
    if GLEIF_CACHE.exists():
        gleif = json.loads(GLEIF_CACHE.read_text(encoding="utf-8"))
    for lei, cur in TN_CURATED_LEI.items():
        gleif.setdefault(lei, cur["institution_name_hmda"])

    prior = load_prior_maps()
    col = "tennessee_originations"

    county_rows = [fill_county(r) for r in read_csv(SRC / "county_market_summary.csv")]
    county_out: list[dict[str, str]] = []
    for r in county_rows:
        fips = (r.get("county_fips") or "").strip()
        try:
            orig = float(r.get("total_originations") or 0)
        except ValueError:
            orig = 0
        name = (r.get("county_name") or "").strip()
        if not name and fips in TN_COUNTIES:
            r = {**r, "county_name": TN_COUNTIES[fips]}
            name = TN_COUNTIES[fips]
        if fips in TN_MAJORS or name or orig >= 1000:
            if fips in TN_COUNTIES and not (r.get("county_name") or "").strip():
                r = {**r, "county_name": TN_COUNTIES[fips]}
            county_out.append(r)

    state_rows = []
    for r in read_csv(SRC / "lender_state_summary.csv"):
        lei = (r.get("lei") or "").strip()
        if not (r.get("institution_name") or "").strip():
            nm = gleif.get(lei) or (prior.get(lei) or {}).get("institution_name_hmda")
            if not nm and lei in TN_CURATED_LEI:
                nm = TN_CURATED_LEI[lei]["institution_name_hmda"]
            if nm:
                r = {**r, "institution_name": nm}
        state_rows.append(r)

    act_out: list[dict[str, str]] = []
    for r in read_csv(SRC / "lender_activity_by_county.csv"):
        r = fill_county(r)
        fips = (r.get("county_fips") or "").strip()
        if fips not in TN_MAJORS:
            continue
        if not (r.get("county_name") or "").strip() and fips in TN_COUNTIES:
            r = {**r, "county_name": TN_COUNTIES[fips]}
        lei = (r.get("lei") or "").strip()
        if not (r.get("institution_name") or "").strip():
            nm = gleif.get(lei) or (prior.get(lei) or {}).get("institution_name_hmda")
            if not nm and lei in TN_CURATED_LEI:
                nm = TN_CURATED_LEI[lei]["institution_name_hmda"]
            if nm:
                r = {**r, "institution_name": nm}
        act_out.append(r)

    cand = read_csv(SRC / "lei_mapping_candidates.csv")
    for r in cand:
        if "tn_originations" in r and col not in r:
            r[col] = r.get("tn_originations") or "0"

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
        if method_prefix.startswith("tn_deepen") and curated_slug:
            slug = curated_slug
        else:
            slug = NATIONAL_SLUG_BY_NMLS.get(nmls) or curated_slug
        if not slug:
            return
        if not method_prefix.startswith("tn_deepen") and nmls in NATIONAL_SLUG_BY_NMLS:
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
                f"{method_prefix.rstrip('+') or 'curated'} map for TN activity "
                f"({st_orig} TN originations); slug={slug}."
            ),
        }
        prev = mapping_by_lei.get(lei)
        if prev and not method_prefix.startswith("tn_deepen"):
            if int(float(prev.get(col) or 0)) >= st_orig:
                return
        mapping_by_lei[lei] = row

    for lei, prior_row in prior.items():
        add_mapping(lei, prior_row, "reuse_prior_state_curated_lei+")
    for lei, cur in TN_CURATED_LEI.items():
        add_mapping(lei, cur, "tn_deepen+")

    mapping_rows = sorted(
        mapping_by_lei.values(),
        key=lambda r: -int(float(r.get(col) or 0)),
    )

    if county_out:
        write_csv(OUT / "county_market_summary_tn.csv", county_out, list(county_out[0].keys()))
    if act_out:
        write_csv(OUT / "lender_activity_by_county_tn.csv", act_out, list(act_out[0].keys()))
    if state_rows:
        write_csv(OUT / "lender_state_summary_tn.csv", state_rows, list(state_rows[0].keys()))
    if cand:
        write_csv(OUT / "lei_mapping_candidates_tn.csv", cand, list(cand[0].keys()))
    if mapping_rows:
        write_csv(OUT / "lei_to_nmls_mapping.csv", mapping_rows, list(mapping_rows[0].keys()))

    major_named = [
        r
        for r in county_out
        if (r.get("county_fips") or "") in TN_MAJORS and (r.get("county_name") or "").strip()
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
        "state": "TN",
        "phase": "tennessee-deepen",
        "major_counties": len(major_slugs),
        "major_county_slugs": major_slugs,
        "cms_rows": len(county_out),
        "activity_rows": len(act_out),
        "lss_rows": len(state_rows),
        "mapped_leis": len(mapping_rows),
        "top20_mapped": sum(1 for lei in top20 if lei in mapped),
        "top50_mapped": sum(1 for lei in top50 if lei in mapped),
        "deferred_examples": [
            "Legacy Home Loans",
            "Y-12 Federal Credit Union",
            "Primis Mortgage Company",
            "Figure Lending",
            "Community Mortgage Corporation",
            "Home Federal Bank of Tennessee",
            "Farm Credit Mid-America",
            "Fortera Federal Credit Union",
            "SmartBank",
            "SWBC Mortgage / First Citizens National Bank",
        ],
        "notes": (
            "Expanded major-county panels to 35; GLEIF re-ID of national LEIs; "
            "linked Eastman CU, Leaders CU, ORNL FCU, Churchill; multi-state regionals."
        ),
    }
    (OUT / "coverage_summary.json").write_text(json.dumps(coverage, indent=2), encoding="utf-8")

    md = [
        "# Tennessee HMDA slice (deepened)\n\n",
        "**Source:** `data/hmda/by-state/TN/` (national foundation)\n\n",
        "**Phase:** tennessee-deepen\n\n",
        f"- County market rows: **{len(county_out)}**\n",
        f"- Lender–county activity (major markets): **{len(act_out)}**\n",
        f"- LEI state summaries: **{len(state_rows)}**\n",
        f"- High-confidence LEI→directory mappings: **{len(mapping_rows)}**\n",
        f"- Major markets with names: **{len(major_named)}**\n",
        f"- Top-20 mapped: **{coverage['top20_mapped']}/20** · "
        f"Top-50 mapped: **{coverage['top50_mapped']}/50**\n\n",
        "## Top mapped LEIs by TN originations\n\n",
    ]
    for r in mapping_rows[:30]:
        md.append(
            f"- `{r['our_lender_slug']}` — {r['institution_name_hmda']} "
            f"({r[col]} TN orig.)\n"
        )
    md.append("\n## Major markets (panel-ready)\n\n")
    for r in major_named:
        md.append(
            f"- **{r.get('county_name')}** (`{r.get('county_fips')}`) — "
            f"{r.get('total_originations')} originations\n"
        )
    md.append(
        "\n## Matching rules\n\n"
        "- Reuse prior product-state curated LEI maps when LEI has TN activity\n"
        "- **tn_deepen** GLEIF re-identification overrides corrupted identity swaps\n"
        "- Prefer TN hosts (FirstBank, MIG, Pinnacle, Churchill Nashville, Eastman, Leaders, ORNL)\n"
        "- Precision over coverage — low-confidence regionals deferred\n"
        "\n## Rebuild\n\n"
        "```bash\n"
        "python scripts/build-hmda-tennessee-deepen.py\n"
        "```\n"
    )
    (OUT / "README.md").write_text("".join(md), encoding="utf-8")

    print(
        f"Wrote TN deepen → {OUT}\n"
        f"  mappings={len(mapping_rows)} counties={len(county_out)} "
        f"activity={len(act_out)} majors={len(major_slugs)}\n"
        f"  top20={coverage['top20_mapped']}/20 top50={coverage['top50_mapped']}/50\n"
        f"  majors={major_slugs}"
    )


if __name__ == "__main__":
    main()
