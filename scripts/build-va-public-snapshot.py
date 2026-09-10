#!/usr/bin/env python3
"""VA-LEND-001A — Virginia mortgage state snapshot.

Allowed: SCC 2025 annual-report mortgage list, committed HMDA VA slice,
existing CFPB API overlay, existing FDIC VA overlay, official Virginia Housing pages.
Forbidden: NMLS company-by-company scrape, SCC case-PDF census, name-only joins,
local/county routes, MLO person directory, live 2026 denominator, combined "Virginia lenders".
"""
from __future__ import annotations

import csv
import hashlib
import json
import ssl
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from parse_va_scc_mortgage_roster import parse_records, stats as roster_stats  # noqa: E402

UA = "LenderTrustHub-VA-LEND-001/1.0 (research; official bulk/API only; no NMLS scrape)"
CTX = ssl.create_default_context()
ART = ROOT / "artifacts"
LIB = ROOT / "lib" / "virginia-intelligence"
STAGE = ROOT / "data" / "virginia" / "va-lend-001"
HMDA_COUNTY = ROOT / "data" / "hmda" / "by-state" / "VA" / "county_market_summary.csv"
HMDA_LENDER = ROOT / "data" / "hmda" / "by-state" / "VA" / "lender_state_summary.csv"
HMDA_MAP = ROOT / "data" / "hmda" / "by-state" / "VA" / "lei_mapping_candidates.csv"
HMDA_INDEX = ROOT / "data" / "hmda" / "by-state" / "index.json"
FDIC_VA = ROOT / "lib" / "fdic" / "data" / "virginia.json"
TEXT = ROOT / "data" / "raw" / "virginia" / "ar02-25.txt"
CFPB_API = "https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/"
RETRIEVED_AT = "2026-09-10"
GENERATED_AT = "2026-09-10T16:40:00Z"
REFRESH = "--refresh" in sys.argv
CHECK = "--check" in sys.argv
ACCEPTED_CFPB_ROWS = 14563
VA_FIPS = {
    "51001": "Accomack", "51003": "Albemarle", "51005": "Alleghany", "51007": "Amelia",
    "51009": "Amherst", "51011": "Appomattox", "51013": "Arlington", "51015": "Augusta",
    "51017": "Bath", "51019": "Bedford", "51021": "Bland", "51023": "Botetourt",
    "51025": "Brunswick", "51027": "Buchanan", "51029": "Buckingham", "51031": "Campbell",
    "51033": "Caroline", "51035": "Carroll", "51036": "Charles City", "51037": "Charlotte",
    "51041": "Chesterfield", "51043": "Clarke", "51045": "Craig", "51047": "Culpeper",
    "51049": "Cumberland", "51051": "Dickenson", "51053": "Dinwiddie", "51057": "Essex",
    "51059": "Fairfax", "51061": "Fauquier", "51063": "Floyd", "51065": "Fluvanna",
    "51067": "Franklin", "51069": "Frederick", "51071": "Giles", "51073": "Gloucester",
    "51075": "Goochland", "51077": "Grayson", "51079": "Greene", "51081": "Greensville",
    "51083": "Halifax", "51085": "Hanover", "51087": "Henrico", "51089": "Henry",
    "51091": "Highland", "51093": "Isle of Wight", "51095": "James City", "51097": "King and Queen",
    "51099": "King George", "51101": "King William", "51103": "Lancaster", "51105": "Lee",
    "51107": "Loudoun", "51109": "Louisa", "51111": "Lunenburg", "51113": "Madison",
    "51115": "Mathews", "51117": "Mecklenburg", "51119": "Middlesex", "51121": "Montgomery",
    "51125": "Nelson", "51127": "New Kent", "51131": "Northampton", "51133": "Northumberland",
    "51135": "Nottoway", "51137": "Orange", "51139": "Page", "51141": "Patrick",
    "51143": "Pittsylvania", "51145": "Powhatan", "51147": "Prince Edward", "51149": "Prince George",
    "51153": "Prince William", "51155": "Pulaski", "51157": "Rappahannock", "51159": "Richmond County",
    "51161": "Roanoke", "51163": "Rockbridge", "51165": "Rockingham", "51167": "Russell",
    "51169": "Scott", "51171": "Shenandoah", "51173": "Smyth", "51175": "Southampton",
    "51177": "Spotsylvania", "51179": "Stafford", "51181": "Surry", "51183": "Sussex",
    "51185": "Tazewell", "51187": "Warren", "51191": "Washington", "51193": "Westmoreland",
    "51195": "Wise", "51197": "Wythe", "51199": "York",
    "51510": "Alexandria city", "51520": "Bristol city", "51530": "Buena Vista city",
    "51540": "Charlottesville city", "51550": "Chesapeake city", "51570": "Colonial Heights city",
    "51580": "Covington city", "51590": "Danville city", "51595": "Emporia city",
    "51600": "Fairfax city", "51610": "Falls Church city", "51620": "Franklin city",
    "51630": "Fredericksburg city", "51640": "Galax city", "51650": "Hampton city",
    "51660": "Harrisonburg city", "51670": "Hopewell city", "51678": "Lexington city",
    "51680": "Lynchburg city", "51683": "Manassas city", "51685": "Manassas Park city",
    "51690": "Martinsville city", "51700": "Newport News city", "51710": "Norfolk city",
    "51720": "Norton city", "51730": "Petersburg city", "51735": "Poquoson city",
    "51740": "Portsmouth city", "51750": "Radford city", "51760": "Richmond city",
    "51770": "Roanoke city", "51775": "Salem city", "51790": "Staunton city",
    "51800": "Suffolk city", "51810": "Virginia Beach city", "51820": "Waynesboro city",
    "51830": "Williamsburg city", "51840": "Winchester city",
}

SCC_REPORTED = {
    "as_of": "2025-12-31",
    "brokers_companies": 713,
    "brokers_offices": 839,
    "lenders_companies": 180,
    "lenders_offices": 501,
    "lender_brokers_companies": 364,
    "lender_brokers_offices": 2709,
    "mortgage_loan_originators": 24222,
}

STATUS_CHANGES_2025 = {
    "grain": "2025_status_change_aggregate",
    "not_current_license_status": True,
    "not_complaint_count": True,
    "not_violation_count": True,
    "not_unique_bad_actors": True,
    "rows": [
        {"license_type": "Mortgage Broker", "approvals": 99, "withdrawn_abandoned": 49, "denials": 0, "surrendered_expired": 99, "revocations": 2},
        {"license_type": "Mortgage Lender", "approvals": 30, "withdrawn_abandoned": 24, "denials": 0, "surrendered_expired": 36, "revocations": 0},
        {"license_type": "Mortgage Branch", "approvals": 595, "withdrawn_abandoned": 9, "denials": 0, "surrendered_expired": 665, "revocations": 0},
        {"license_type": "Mortgage Loan Originator", "approvals": 5250, "withdrawn_abandoned": 556, "denials": 0, "surrendered_expired": 3457, "revocations": 0},
    ],
    "source": "SCC BFI 2025 Annual Report, Status Changes of Mortgage-Related Applications and Licenses",
}


def fetch_json(url: str, timeout: int = 90):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json,*/*"})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as resp:
        return json.loads(resp.read().decode("utf-8"))


def pct(n: int, d: int) -> float:
    return round((n / d) * 100, 2) if d else 0.0


def num(row: dict, key: str) -> int:
    raw = (row.get(key) or "0").replace(",", "").strip()
    try:
        return int(float(raw))
    except ValueError:
        return 0


def fnum(row: dict, key: str) -> float:
    raw = (row.get(key) or "0").replace(",", "").strip()
    try:
        return float(raw)
    except ValueError:
        return 0.0


def hmda_block() -> dict:
    rows = list(csv.DictReader(HMDA_COUNTY.open(encoding="utf-8")))
    counties = []
    for r in rows:
        fips = (r.get("county_fips") or "").strip().zfill(5)
        name = (r.get("county_name") or "").strip() or VA_FIPS.get(fips, "")
        if not name:
            raise SystemExit(f"Virginia county FIPS {fips} has no publishable name")
        counties.append(
            {
                "county_fips": fips,
                "county_name": name,
                "applications": num(r, "total_applications"),
                "originations": num(r, "total_originations"),
                "denials": num(r, "denial_count"),
                "denial_rate_pct": fnum(r, "denial_rate_pct"),
                "purchase_applications": num(r, "purchase_count"),
                "refinance_applications": num(r, "refinance_count"),
                "purpose_other_applications": num(r, "purpose_other_count"),
                "purchase_pct_of_apps": fnum(r, "purchase_pct_of_apps"),
                "refinance_pct_of_apps": fnum(r, "refinance_pct_of_apps"),
                "apps_conventional": num(r, "apps_conventional"),
                "apps_fha": num(r, "apps_fha"),
                "apps_va": num(r, "apps_va"),
                "apps_usda_other": num(r, "apps_usda_other"),
                "conventional_pct": fnum(r, "apps_conventional_pct"),
                "orig_conventional": num(r, "orig_conventional"),
                "orig_fha": num(r, "orig_fha"),
                "orig_va": num(r, "orig_va"),
                "orig_usda_other": num(r, "orig_usda_other"),
            }
        )
    counties.sort(key=lambda c: (c["county_name"], c["county_fips"]))
    apps = sum(c["applications"] for c in counties)
    orig = sum(c["originations"] for c in counties)
    den = sum(c["denials"] for c in counties)
    purch = sum(c["purchase_applications"] for c in counties)
    refi = sum(c["refinance_applications"] for c in counties)
    other_p = sum(c["purpose_other_applications"] for c in counties)
    conv = sum(c["apps_conventional"] for c in counties)
    fha = sum(c["apps_fha"] for c in counties)
    va = sum(c["apps_va"] for c in counties)
    usda = sum(c["apps_usda_other"] for c in counties)
    maps: dict[str, dict] = {}
    if HMDA_MAP.exists():
        for r in csv.DictReader(HMDA_MAP.open(encoding="utf-8")):
            lei = (r.get("lei") or "").strip()
            if lei:
                maps[lei] = r
    reporters = []
    nmls_exact = 0
    if HMDA_LENDER.exists():
        for r in csv.DictReader(HMDA_LENDER.open(encoding="utf-8")):
            lei = (r.get("lei") or "").strip()
            if not lei:
                continue
            mapped = maps.get(lei)
            nmls_raw = (mapped or {}).get("nmls_id") or (mapped or {}).get("nmls") or ""
            digits = "".join(ch for ch in str(nmls_raw) if ch.isdigit())
            nmls = digits if len(digits) >= 3 else None
            if nmls:
                nmls_exact += 1
            reporters.append(
                {
                    "lei": lei,
                    "applications": num(r, "total_applications"),
                    "originations": num(r, "total_originations"),
                    "nmls_id": nmls,
                }
            )
    reporters.sort(key=lambda x: (-x["applications"], x["lei"]))
    index_va = {}
    if HMDA_INDEX.exists():
        idx = json.loads(HMDA_INDEX.read_text(encoding="utf-8"))
        index_va = (idx.get("by_state") or {}).get("VA") or {}
    return {
        "year": 2025,
        "geo_grain": "state_and_county",
        "state_code": "VA",
        "source": "Committed HMDA Virginia partition data/hmda/by-state/VA/county_market_summary.csv. Properties located in Virginia, including independent cities. Not a second national download.",
        "source_as_of": "HMDA 2025",
        "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
        "applications": apps,
        "originations": orig,
        "denials": den,
        "denial_rate_pct": pct(den, apps),
        "denial_rate_calculation": "denials / applications * 100, rounded to 2 decimals",
        "purchase_applications": purch,
        "refinance_applications": refi,
        "purpose_other_applications": other_p,
        "purchase_pct_of_apps": pct(purch, apps),
        "refinance_pct_of_apps": pct(refi, apps),
        "purpose_other_pct_of_apps": pct(other_p, apps),
        "apps_conventional": conv,
        "apps_fha": fha,
        "apps_va": va,
        "apps_usda_other": usda,
        "conventional_pct": pct(conv, apps),
        "fha_pct": pct(fha, apps),
        "va_pct": pct(va, apps),
        "usda_other_pct": pct(usda, apps),
        "county_count": len(counties),
        "virginia_county_and_city_universe": 133,
        "all_133_geographies": len(counties) == 133,
        "counties": counties,
        "lei_reporter_rows": len(reporters),
        "lei_reporters_with_exact_nmls": nmls_exact,
        "index_json_applications": index_va.get("applications"),
        "index_json_originations": index_va.get("originations"),
        "index_json_lei_state_rows": index_va.get("lei_state_rows"),
        "index_json_lender_county_rows": index_va.get("lender_county_rows"),
        "top_reporters_by_applications": reporters[:12],
        "denial_reasons": None,
        "denial_reasons_coverage": "SOURCE_NOT_AVAILABLE_IN_COMMITTED_EXTRACT",
        "caveat": (
            "HMDA is a mortgage-application filing extract for properties located in Virginia. "
            "It is not a Virginia SCC mortgage-company roster, not an MLO count, and not headquarters geography. "
            "An HMDA reporter is not a Virginia-licensed mortgage company. "
            "Application != lender. Origination != lender. County/city grain is not a local SEO route."
        ),
    }


def scc_roster() -> dict:
    records = parse_records(TEXT.read_text(encoding="utf-8"))
    summary = roster_stats(records)
    STAGE.mkdir(parents=True, exist_ok=True)
    (STAGE / "scc-mortgage-companies.json").write_text(json.dumps(records, indent=2) + "\n", encoding="utf-8")
    (STAGE / "scc-mortgage-parse-stats.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    by = summary["by_type"]
    types_exclusive = summary["unknown_type"] == 0 and summary["rows"] == (
        by.get("BROKER", 0) + by.get("LENDER", 0) + by.get("LENDER_AND_BROKER", 0)
    )
    return {
        "source": "Virginia SCC Bureau of Financial Institutions 2025 Annual Report (ar02-25.pdf) Mortgage Companies -- List by Name",
        "source_url": "https://www.scc.virginia.gov/media/sccvirginiagov-home/regulated-industries/bureau-of-financial-institutions/reports-amp-publications/ar02-25.pdf",
        "authority": "Virginia State Corporation Commission, Bureau of Financial Institutions",
        "grain": "dated_company_licensee_row",
        "coverage_state": "ACQUIRED_DATED_ROSTER",
        "source_as_of": "2025-12-31",
        "retrieved_at": RETRIEVED_AT,
        "clock": "DATED_STATE_LICENSE_ROSTER",
        "not_current_2026_status": True,
        "identity": "VA-SCC-BFI:{virginiaLicenseNumber}",
        "federal_identity": "NMLS:{nmlsId}",
        "rows": summary["rows"],
        "brokers": by.get("BROKER", 0),
        "lenders": by.get("LENDER", 0),
        "lender_brokers": by.get("LENDER_AND_BROKER", 0),
        "license_types_mutually_exclusive_in_list": types_exclusive,
        "distinct_virginia_mc": summary["distinct_mc"],
        "duplicate_mc": summary["duplicate_mc"],
        "missing_mc": summary["missing_mc"],
        "distinct_nmls": summary["distinct_nmls"],
        "duplicate_nmls": summary["duplicate_nmls"],
        "missing_nmls": summary["missing_nmls"],
        "exact_va_to_nmls_crosswalks": summary["exact_crosswalks"],
        "corporate_offices_on_list": summary["corporate_offices"],
        "additional_location_lines_parsed": summary["additional_location_rows"],
        "additional_locations_not_official_office_census": True,
        "scc_reported": SCC_REPORTED,
        "list_vs_narrative": {
            "brokers_match": by.get("BROKER") == SCC_REPORTED["brokers_companies"],
            "lenders_match": by.get("LENDER") == SCC_REPORTED["lenders_companies"],
            "lender_brokers_match": by.get("LENDER_AND_BROKER") == SCC_REPORTED["lender_brokers_companies"],
            "combined_list_rows": summary["rows"],
            "combined_narrative_companies": (
                SCC_REPORTED["brokers_companies"]
                + SCC_REPORTED["lenders_companies"]
                + SCC_REPORTED["lender_brokers_companies"]
            ),
            "do_not_call_combined_virginia_lenders": True,
            "note": (
                "The parsed list and the SCC narrative agree on 713 brokers and on 1,257 combined company rows. "
                "Lender vs lender-and-broker classification differs by two rows. Categories stay separate. "
                "1,257 is dated list rows, not unique companies as a consumer headline and not current 2026 licenses."
            ),
        },
        "name_only_nmls_fill": "FORBIDDEN",
        "caveat": (
            "This is dated official licensing evidence as of 2025-12-31. "
            "It is not current September 2026 license status. NMLS Consumer Access is the current verification path. "
            "Broker != lender != lender-and-broker. Company != office. Company != MLO. "
            "Do not name-match missing NMLS IDs. Do not mint canonical organizations from this roster."
        ),
    }


def live_roster() -> dict:
    return {
        "CURRENT_VIRGINIA_MORTGAGE_COMPANY_BULK_ROSTER": "SOURCE_NOT_ACQUIRED",
        "access": "OPEN_SEARCH_ONLY",
        "live_licensed_company_denominator": "UNKNOWN",
        "nmls_consumer_access": "https://www.nmlsconsumeraccess.org/",
        "scc_note": "SCC states additional licensing records for all mortgage licensees are on NMLS Consumer Access.",
        "public_profile_effect": "ZERO_NET_NEW_PUBLIC_LENDER_PROFILES",
        "scrape": "FORBIDDEN",
        "caveat": (
            "Current 2026 license status is not manufactured from the 2025 annual report. "
            "Search-only is not zero. Missing is not zero. NMLS verification is not a claimed profile."
        ),
    }


def mlo_person() -> dict:
    return {
        "grain": "PERSON",
        "source_as_of": "2025-12-31",
        "persons": SCC_REPORTED["mortgage_loan_originators"],
        "publication": "NO_PERSON_PAGES",
        "not_a_lender_count": True,
        "not_added_to_company_denominator": True,
        "bulk_roster": "NOT_ACQUIRED",
        "nmls_scrape": "FORBIDDEN",
        "verify_path": "https://www.nmlsconsumeraccess.org/",
        "caveat": "24,222 is a person-grain aggregate. It is not mortgage companies and is not a public MLO directory.",
    }


def offices() -> dict:
    r = SCC_REPORTED
    return {
        "grain": "office",
        "source_as_of": "2025-12-31",
        "brokers_offices": r["brokers_offices"],
        "lenders_offices": r["lenders_offices"],
        "lender_brokers_offices": r["lender_brokers_offices"],
        "office_ne_company": True,
        "branch_ne_separate_lender": True,
        "out_of_state_corporate_office_ne_unlicensed": True,
        "parsed_additional_locations": "BEST_EFFORT_NOT_OFFICIAL_CENSUS",
        "caveat": (
            "SCC office aggregates are kept. Parsed additional-location lines are not substituted for the official office census. "
            "Office != company."
        ),
    }


def enforcement() -> dict:
    return {
        "agency": "Virginia SCC Bureau of Financial Institutions",
        "coverage_state": "OPEN_SEARCH_ONLY",
        "bulk_case_corpus": "SOURCE_NOT_ACQUIRED",
        "named_orders": "NOT_HARVESTED",
        "status_change_aggregates": "ACQUIRED",
        "name_only_identity": "UNSAFE_FOR_ADVERSE_PROFILE_ATTACH",
        "caveat": (
            "No clean bounded named mortgage-license enforcement table was acquired. "
            "2025 status-change aggregates are not a case census. Revocation != unique bad actor. "
            "Name-only adverse attachment is UNSAFE. SCC corporate-entity/officer dump is SHARED_NETWORK_BACKLOG."
        ),
    }


def cfpb_overlay() -> dict:
    out = {
        "source": "CFPB Consumer Complaint Database API",
        "source_url": "https://www.consumerfinance.gov/data-research/consumer-complaints/",
        "product": "Mortgage",
        "geography": "VA",
        "company_rate_published": False,
        "retrieved_at": RETRIEVED_AT,
        "api_last_updated": None,
        "caveat": (
            "Complaint is not a violation. Raw complaint count is not a quality ranking and is not "
            "exposure-normalized. CFPB complaint != SCC enforcement. No company complaint rate is published."
        ),
    }
    if not REFRESH:
        out.update(
            {
                "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
                "result": "ACQUIRED",
                "mortgage_complaint_rows": ACCEPTED_CFPB_ROWS,
            }
        )
        return out
    params = urllib.parse.urlencode({"size": "0", "state": "VA", "product": "Mortgage"})
    payload = fetch_json(f"{CFPB_API}?{params}")
    total = payload.get("hits", {}).get("total", {})
    if isinstance(total, dict):
        total = total.get("value")
    out.update(
        {
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "result": "ACQUIRED",
            "mortgage_complaint_rows": total if isinstance(total, int) else None,
        }
    )
    return out


def programs() -> dict:
    items = [
        {
            "id": "va-housing-dpa-grant",
            "name": "Down Payment Assistance Grant (DPA)",
            "status": "CURRENT",
            "url": "https://www.virginiahousing.com/homebuyers/home-loans",
            "kind": "GRANT",
        },
        {
            "id": "va-housing-cca-grant",
            "name": "Closing Cost Assistance (CCA) Grant",
            "status": "CURRENT",
            "url": "https://www.virginiahousing.com/homebuyers/home-loans",
            "kind": "GRANT",
        },
        {
            "id": "va-housing-plus-second",
            "name": "Plus Second Mortgage",
            "status": "CURRENT",
            "url": "https://www.virginiahousing.com/homebuyers/plus-second-mortgage/",
            "kind": "SECOND_MORTGAGE",
        },
        {
            "id": "va-housing-conventional",
            "name": "Virginia Housing Conventional first mortgage",
            "status": "CURRENT",
            "url": "https://www.virginiahousing.com/homebuyers/home-loans",
            "kind": "FIRST_MORTGAGE",
        },
        {
            "id": "va-housing-fha",
            "name": "Virginia Housing FHA first mortgage",
            "status": "CURRENT",
            "url": "https://www.virginiahousing.com/homebuyers/home-loans",
            "kind": "FIRST_MORTGAGE",
        },
        {
            "id": "va-housing-va",
            "name": "Virginia Housing VA first mortgage",
            "status": "CURRENT",
            "url": "https://www.virginiahousing.com/homebuyers/home-loans",
            "kind": "FIRST_MORTGAGE",
        },
        {
            "id": "va-housing-usda",
            "name": "Virginia Housing USDA / RHS first mortgage",
            "status": "CURRENT",
            "url": "https://www.virginiahousing.com/homebuyers/home-loans",
            "kind": "FIRST_MORTGAGE",
        },
    ]
    return {
        "retrieved_at": RETRIEVED_AT,
        "source": "Virginia Housing homebuyer program pages",
        "source_url": "https://www.virginiahousing.com/homebuyers/home-loans",
        "verified_family_count": len(items),
        "items": items,
        "not_a_license": True,
        "not_an_endorsement": True,
        "participating_lender_ne_all_licensees": True,
        "caveat": (
            "Virginia Housing programs are consumer assistance products, not SCC licenses. "
            "A participating Virginia Housing lender is not the set of all Virginia mortgage licensees. "
            "Program availability != licensing. Confirm current product status on official pages."
        ),
    }


def depository() -> dict:
    banks = []
    if FDIC_VA.exists():
        payload = json.loads(FDIC_VA.read_text(encoding="utf-8"))
        banks = payload.get("banks") or []
    return {
        "source": "Existing LenderTrustHub FDIC Virginia overlay (lib/fdic/data/virginia.json)",
        "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
        "identity": "FDIC CERT",
        "fdic_cert_rows": len(banks),
        "caveat": "FDIC institution != Virginia SCC mortgage licensee. A bank may lend without this SCC mortgage license.",
    }


def juice_squeeze() -> list[dict]:
    return [
        {"decision": "GRABBED — HIGH YIELD", "source": "SCC 2025 mortgage-company list with MC + NMLS exact IDs"},
        {"decision": "GRABBED — EASY SECONDARY", "source": "SCC 2025 status-change aggregates"},
        {"decision": "GRABBED — EASY SECONDARY", "source": "Committed HMDA 2025 Virginia property-location slice"},
        {"decision": "GRABBED — EASY SECONDARY", "source": "Existing CFPB mortgage complaint API overlay, state=VA"},
        {"decision": "GRABBED — EASY SECONDARY", "source": "Virginia Housing statewide homebuyer programs"},
        {"decision": "GRABBED — EASY SECONDARY", "source": "Existing FDIC Virginia overlay"},
        {"decision": "LEFT — SEARCH ONLY", "source": "NMLS Consumer Access current 2026 company/MLO lookup"},
        {"decision": "LEFT — TOO MUCH WORK FOR CURRENT YIELD", "source": "SCC named enforcement/case-document census"},
        {"decision": "LEFT — TOO MUCH WORK FOR CURRENT YIELD", "source": "Perfected additional-office graph vs official office census"},
        {"decision": "LEFT — SHARED NETWORK BACKLOG", "source": "SCC corporate entity/officer/name-history dump"},
        {"decision": "LEFT — LOCAL / FUTURE", "source": "Fairfax/Arlington/Richmond/Virginia Beach lender pages"},
        {"decision": "LEFT — SEARCH ONLY", "source": "NMLS MLO person roster (24,222 aggregate kept)"},
    ]


def main() -> int:
    hmda = hmda_block()
    roster = scc_roster()
    live = live_roster()
    mlo = mlo_person()
    off = offices()
    enf = enforcement()
    cfpb = cfpb_overlay()
    prog = programs()
    dep = depository()
    if hmda["applications"] != 340304 or hmda["originations"] != 202417:
        raise SystemExit(f"Virginia HMDA drifted: {hmda['applications']} / {hmda['originations']}")
    if hmda["county_count"] != 133:
        raise SystemExit(f"Virginia HMDA must cover 133 county/city rows, got {hmda['county_count']}")
    if roster["brokers"] != 713:
        raise SystemExit(f"Parsed broker count drifted: {roster['brokers']}")
    snapshot = {
        "contract_name": "lender-va-state-intel-v1",
        "version": "1.0.0",
        "geography": "VA",
        "publication_status": "published",
        "path": "/virginia",
        "generated_at": GENERATED_AT,
        "growth_classification": "INTELLIGENCE_GROWTH_HEAVY",
        "source_as_of": {
            "scc_roster": "2025-12-31",
            "hmda": "HMDA 2025",
            "cfpb": cfpb.get("api_last_updated"),
            "programs": None,
            "live_roster": "SOURCE_NOT_ACQUIRED",
            "enforcement": "OPEN_SEARCH_ONLY",
        },
        "hero": {
            "universe_label": "SCC mortgage brokers (as of 2025-12-31)",
            "universe_value": SCC_REPORTED["brokers_companies"],
            "universe_hint": "SCC-reported mortgage broker companies as of 2025-12-31. Not MLOs, not HMDA applications, not current 2026 status.",
            "current_label": "SCC mortgage lenders (as of 2025-12-31)",
            "current_value": SCC_REPORTED["lenders_companies"],
            "observations_label": "SCC lender-and-brokers (as of 2025-12-31)",
            "observations_value": SCC_REPORTED["lender_brokers_companies"],
            "geography_label": "HMDA 2025 Virginia applications",
            "geography_value": hmda["applications"],
            "as_of_label": "SCC roster as of",
            "as_of_value": "2025-12-31",
        },
        "pre_ingest_baseline": {
            "hmda_partition_already_in_repo": True,
            "hmda_applications_already_present": hmda["index_json_applications"],
            "lei_reporter_rows_already_present": hmda["index_json_lei_state_rows"],
            "canonical_company_vs_nmls_vs_lei": "VA-SCC-BFI, NMLS, and HMDA LEI remain distinct. Dated roster row is not a new public profile.",
        },
        "clock_reconciliation": {
            "scc_roster_source_as_of": "2025-12-31",
            "retrieved_at": RETRIEVED_AT,
            "generated_at": GENERATED_AT,
            "nmls_is_current_verification_path": True,
            "do_not_call_scc_roster_september_2026": True,
            "lender_canonical_source": "data/hmda/by-state/VA/county_market_summary.csv (summed)",
            "lender_applications": hmda["applications"],
            "lender_originations": hmda["originations"],
            "lender_denials": hmda["denials"],
            "index_json_applications": hmda["index_json_applications"],
            "index_json_originations": hmda["index_json_originations"],
            "applications_match_index": hmda["applications"] == hmda["index_json_applications"],
            "originations_match_index": hmda["originations"] == hmda["index_json_originations"],
            "do_not_add_national_geo_to_state_intel": True,
            "do_not_rewrite_national_aggregate": True,
            "which_is_canonical_for_this_ticket": "Committed Virginia county_market_summary.csv county/city-sum",
        },
        "hmda": hmda,
        "scc_roster": roster,
        "live_roster": live,
        "mlo_person": mlo,
        "offices": off,
        "status_changes_2025": STATUS_CHANGES_2025,
        "enforcement": enf,
        "cfpb": cfpb,
        "programs": prog,
        "depository": dep,
        "juice_squeeze": juice_squeeze(),
        "regulator_matrix": [
            {
                "credential": "Mortgage Broker license",
                "regulator": "Virginia SCC BFI",
                "grain": "company",
                "identity": "VA-SCC-BFI:{MC}",
                "as_of": "2025-12-31",
                "proves": "Dated broker licensee row in the 2025 annual report list",
                "does_not_prove": "Current 2026 status, lender authority, quality, or an MLO person",
            },
            {
                "credential": "Mortgage Lender license",
                "regulator": "Virginia SCC BFI",
                "grain": "company",
                "identity": "VA-SCC-BFI:{MC}",
                "as_of": "2025-12-31",
                "proves": "Dated lender licensee row",
                "does_not_prove": "Broker authority, current 2026 status, or endorsement",
            },
            {
                "credential": "Mortgage Lender and Broker license",
                "regulator": "Virginia SCC BFI",
                "grain": "company",
                "identity": "VA-SCC-BFI:{MC}",
                "as_of": "2025-12-31",
                "proves": "Dated combined lender-and-broker licensee row",
                "does_not_prove": "That broker and lender counts may be added as one 'lenders' headline",
            },
            {
                "credential": "NMLS Company ID",
                "regulator": "NMLS / CSBS",
                "grain": "business",
                "identity": "NMLS:{nmlsId}",
                "as_of": "printed on SCC 2025 list; current status via Consumer Access",
                "proves": "Exact source-native crosswalk when SCC prints both MC and NMLS",
                "does_not_prove": "Current 2026 license status or a claimed profile",
            },
            {
                "credential": "Mortgage Loan Originator",
                "regulator": "Virginia SCC BFI / NMLS",
                "grain": "person",
                "identity": "not published as a person directory",
                "as_of": "2025-12-31 aggregate 24,222",
                "proves": "A person-grain statewide aggregate",
                "does_not_prove": "A company count or a public MLO roster",
            },
        ],
        "identity_rules": {
            "EXACT_OFFICIAL_ID": "VA-SCC-BFI:{virginiaLicenseNumber}",
            "EXACT_NMLS_ID": "NMLS Company ID when SCC prints it",
            "REVIEW_REQUIRED": "Name + address may be review evidence only",
            "UNSAFE": "Name-only relationship or adverse attachment",
        },
        "expansion_ledger": {
            "NET_NEW_CANONICAL_ORGANIZATIONS": 0,
            "NET_NEW_PUBLIC_LENDER_PROFILES": 0,
            "NET_NEW_PUBLIC_PERSON_PAGES": 0,
            "NEW_VA_DATED_COMPANY_ROWS": roster["rows"],
            "NEW_EXACT_VA_TO_NMLS_CROSSWALKS": roster["exact_va_to_nmls_crosswalks"],
            "NEW_EVIDENCE_ROWS": roster["rows"] + (cfpb.get("mortgage_complaint_rows") or 0) + len(prog["items"]),
            "notes": {
                "roster": "Dated SCC rows are research identities, not public lender profiles and not added to national institution totals.",
                "hmda": "HMDA Virginia partition was already in the repository.",
                "cfpb": "Statewide Virginia mortgage complaint overlay is evidence, not organizations.",
            },
        },
        "semantic_guardrails": [
            "broker != lender",
            "lender != lender-and-broker",
            "company != office",
            "company != MLO",
            "MLO != lender company",
            "dated 2025-12-31 roster != current 2026 verification",
            "NMLS verification != claim",
            "HMDA application != lender",
            "HMDA geography != headquarters",
            "complaint != violation",
            "Virginia Housing program != license",
            "participating Virginia Housing lender != all SCC licensees",
            "FDIC institution != SCC mortgage licensee",
            "search-only != zero",
            "missing != zero",
            "NO TRUST SCORE",
            "NO COMBINED VIRGINIA LENDERS HEADLINE",
        ],
        "gaps": [
            "Current 2026 NMLS bulk company roster",
            "Named SCC mortgage enforcement/order corpus",
            "Official additional-office census matching parsed location lines",
            "MLO person roster",
            "SCC corporate entity/officer graph (shared network backlog)",
        ],
        "noCombinedDenominator": True,
        "noCountyRoutes": True,
        "noLocalVirginiaPages": True,
        "statewideOnly": True,
        "claimEligibilityBroadened": False,
        "unresolved_relationships": {
            "current_2026_license_status": "OPEN_SEARCH_ONLY / NMLS Consumer Access",
            "scc_enforcement_bulk": "NOT_ACQUIRED",
            "mlo_person_roster": "NOT_ACQUIRED",
            "scc_corporate_entities": "SHARED_NETWORK_BACKLOG",
        },
        "rejected_joins": [
            "Name-only NMLS fill",
            "Name-only adverse attachment",
            "Dated roster used as current 2026 denominator",
            "713+180+364 published as Virginia lenders",
            "24,222 MLOs counted as companies",
            "HMDA application counted as a lender",
            "Virginia Housing participant treated as a license",
            "Office counted as a separate lender",
        ],
    }
    blob = json.dumps(snapshot, sort_keys=True, separators=(",", ":")).encode("utf-8")
    snapshot["fingerprint"] = hashlib.sha256(blob).hexdigest()
    if CHECK:
        committed = json.loads((LIB / "accepted-snapshot.json").read_text(encoding="utf-8"))
        if committed.get("fingerprint") != snapshot["fingerprint"]:
            raise SystemExit(
                f"Virginia snapshot fingerprint drifted: builder={snapshot['fingerprint']} committed={committed.get('fingerprint')}"
            )
        print("fingerprint check OK", snapshot["fingerprint"])
        return 0
    ART.mkdir(parents=True, exist_ok=True)
    LIB.mkdir(parents=True, exist_ok=True)
    (ART / "va-lend-001-public-snapshot.json").write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    (LIB / "accepted-snapshot.json").write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    print("fingerprint", snapshot["fingerprint"])
    print("scc", roster["rows"], roster["brokers"], roster["lenders"], roster["lender_brokers"], "crosswalks", roster["exact_va_to_nmls_crosswalks"])
    print("hmda", hmda["applications"], hmda["originations"], hmda["denials"], "geos", hmda["county_count"])
    print("cfpb", cfpb.get("mortgage_complaint_rows"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
