#!/usr/bin/env python3
"""CO-LEND-001A — Colorado mortgage state snapshot.

Allowed: committed HMDA CO slice, CIM DRE 4zse-6bnw MLO aggregates, CFPB API, official CHFA/DRE HTML.
Forbidden: NMLS scrape, MLO person-page harvest, employer-string companies, county/Denver routes,
fake company denominator, name-only adverse attach, national total inflation.
"""
from __future__ import annotations

import csv
import hashlib
import json
import ssl
import urllib.error
import urllib.parse
import urllib.request
import sys
from datetime import datetime, timezone
from pathlib import Path

UA = "LenderTrustHub-CO-LEND-001/1.0 (research; official bulk/API only; no NMLS scrape)"
CTX = ssl.create_default_context()
ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "artifacts"
LIB = ROOT / "lib" / "colorado-intelligence"
HMDA_COUNTY = ROOT / "data" / "hmda" / "by-state" / "CO" / "county_market_summary.csv"
HMDA_LENDER = ROOT / "data" / "hmda" / "by-state" / "CO" / "lender_state_summary.csv"
HMDA_MAP = ROOT / "data" / "hmda" / "by-state" / "CO" / "lei_mapping_candidates.csv"
HMDA_INDEX = ROOT / "data" / "hmda" / "by-state" / "index.json"
FDIC_CO = ROOT / "lib" / "fdic" / "data" / "colorado.json"
CFPB_API = "https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/"
DRE_DS = "4zse-6bnw"
# Day-level actual retrieval. Do not invent 22:00Z (or any hour) to make hashes stable.
RETRIEVED_AT = "2026-09-09"
# Snapshot generation freeze = first CO-LEND commit clock (2026-09-09 13:49:51 -0400).
# Distinct from retrievedAt. Not a regulatory source date. Not a fabricated 22:00Z.
GENERATED_AT = "2026-09-09T17:49:51Z"
REFRESH = "--refresh" in sys.argv
CHECK = "--check" in sys.argv

# Frozen accepted overlays. Re-running against these inputs must keep the fingerprint.
# --refresh re-queries CIM / CFPB; it is not the accepted-snapshot path.
ACCEPTED_MLO = {
    "rows": 21865,
    "unique_license_numbers": 21859,
    "active": 21584,
    "inactive": 281,
    "status_counts": {"Active": 21584, "Inactive": 281},
    "entityname_nonempty": 0,
    "casenumber_nonempty": 79,
    "source_as_of": "2026-09-09",
}
ACCEPTED_CFPB_ROWS = 8627

CO_COUNTY_NAMES = {
    "08001": "Adams", "08003": "Alamosa", "08005": "Arapahoe", "08007": "Archuleta",
    "08009": "Baca", "08011": "Bent", "08013": "Boulder", "08014": "Broomfield",
    "08015": "Chaffee", "08017": "Cheyenne", "08019": "Clear Creek", "08021": "Conejos",
    "08023": "Costilla", "08025": "Crowley", "08027": "Custer", "08029": "Delta",
    "08031": "Denver", "08033": "Dolores", "08035": "Douglas", "08037": "Eagle",
    "08039": "Elbert", "08041": "El Paso", "08043": "Fremont", "08045": "Garfield",
    "08047": "Gilpin", "08049": "Grand", "08051": "Gunnison", "08053": "Hinsdale",
    "08055": "Huerfano", "08057": "Jackson", "08059": "Jefferson", "08061": "Kiowa",
    "08063": "Kit Carson", "08065": "Lake", "08067": "La Plata", "08069": "Larimer",
    "08071": "Las Animas", "08073": "Lincoln", "08075": "Logan", "08077": "Mesa",
    "08079": "Mineral", "08081": "Moffat", "08083": "Montezuma", "08085": "Montrose",
    "08087": "Morgan", "08089": "Otero", "08091": "Ouray", "08093": "Park",
    "08095": "Phillips", "08097": "Pitkin", "08099": "Prowers", "08101": "Pueblo",
    "08103": "Rio Blanco", "08105": "Rio Grande", "08107": "Routt", "08109": "Saguache",
    "08111": "San Juan", "08113": "San Miguel", "08115": "Sedgwick", "08117": "Summit",
    "08119": "Teller", "08121": "Washington", "08123": "Weld", "08125": "Yuma",
}


def fetch(url: str, timeout: int = 90) -> tuple[int, bytes]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json,*/*"})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read() if e.fp else b""
    except Exception as e:  # noqa: BLE001
        return 0, str(e).encode()


def get_json(url: str, timeout: int = 90):
    st, body = fetch(url, timeout=timeout)
    if st != 200:
        return None
    try:
        return json.loads(body.decode("utf-8"))
    except json.JSONDecodeError:
        return None


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


def soda(select: str, where: str | None = None, group: str | None = None, limit: int | None = None):
    params: dict[str, str] = {"$select": select}
    if where:
        params["$where"] = where
    if group:
        params["$group"] = group
    if limit is not None:
        params["$limit"] = str(limit)
    url = f"https://data.colorado.gov/resource/{DRE_DS}.json?{urllib.parse.urlencode(params)}"
    return get_json(url)


def hmda_block() -> dict:
    rows = list(csv.DictReader(HMDA_COUNTY.open(encoding="utf-8")))
    counties = []
    for r in rows:
        fips = (r.get("county_fips") or "").strip().zfill(5)
        name = (r.get("county_name") or "").strip() or CO_COUNTY_NAMES.get(fips)
        if not name:
            raise SystemExit(f"Colorado county FIPS {fips} has no publishable name")
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
    oconv = sum(c["orig_conventional"] for c in counties)
    ofha = sum(c["orig_fha"] for c in counties)
    ova = sum(c["orig_va"] for c in counties)
    ousda = sum(c["orig_usda_other"] for c in counties)

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
    index_co = {}
    if HMDA_INDEX.exists():
        idx = json.loads(HMDA_INDEX.read_text(encoding="utf-8"))
        index_co = (idx.get("by_state") or {}).get("CO") or {}
    return {
        "year": 2025,
        "geo_grain": "state_and_county",
        "state_code": "CO",
        "source": "Committed HMDA Colorado partition data/hmda/by-state/CO/county_market_summary.csv. Properties located in Colorado. Not a second national download.",
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
        "orig_conventional": oconv,
        "orig_fha": ofha,
        "orig_va": ova,
        "orig_usda_other": ousda,
        "county_count": len(counties),
        "colorado_county_universe": 64,
        "all_64_counties": len(counties) == 64,
        "counties": counties,
        "lei_reporter_rows": len(reporters),
        "lei_reporters_with_exact_nmls": nmls_exact,
        "index_json_applications": index_co.get("applications"),
        "index_json_originations": index_co.get("originations"),
        "index_json_lei_state_rows": index_co.get("lei_state_rows"),
        "index_json_lender_county_rows": index_co.get("lender_county_rows"),
        "top_reporters_by_applications": reporters[:12],
        "denial_reasons": None,
        "denial_reasons_coverage": "SOURCE_NOT_AVAILABLE_IN_COMMITTED_EXTRACT",
        "caveat": (
            "HMDA is a mortgage-application filing extract for properties located in Colorado. "
            "It is not a Colorado mortgage-company registration roster, not an MLO license count, "
            "and the denial rate does not prove discrimination. An HMDA reporter is not a Colorado "
            "state-licensed mortgage company. Application != lender. Origination != lender. "
            "County-grain HMDA is not added to a second state-grain total on this page."
        ),
    }


def dre_mlo() -> dict:
    if REFRESH:
        total = soda("count(*)", "licenseprefix='MLO'")
        status_rows = soda("licensestatus,count(*)", "licenseprefix='MLO'", "licensestatus") or []
        unique = soda("count(distinct licensenumber)", "licenseprefix='MLO'")
        case_rows = soda(
            "count(*)",
            "licenseprefix='MLO' and casenumber is not null and casenumber not in ('None','NONE','N/A','')",
        )
        entity_rows = soda(
            "count(*)",
            "licenseprefix='MLO' and entityname is not null and entityname != ''",
        )
        meta = get_json("https://data.colorado.gov/api/views/4zse-6bnw.json") or {}
        rows_updated = meta.get("rowsUpdatedAt")
        source_as_of = None
        if isinstance(rows_updated, int):
            source_as_of = datetime.fromtimestamp(rows_updated, tz=timezone.utc).strftime("%Y-%m-%d")
        statuses = {str(r.get("licensestatus") or "UNKNOWN"): int(r.get("count") or 0) for r in status_rows}
        overlay = {
            "rows": int((total or [{}])[0].get("count") or 0),
            "unique_license_numbers": int(
                (unique or [{}])[0].get("count_distinct_licensenumber")
                or (unique or [{}])[0].get("count")
                or 0
            ),
            "active": statuses.get("Active", 0),
            "inactive": statuses.get("Inactive", 0),
            "status_counts": statuses,
            "entityname_nonempty": int((entity_rows or [{}])[0].get("count") or 0),
            "casenumber_nonempty": int((case_rows or [{}])[0].get("count") or 0),
            "source_as_of": source_as_of,
        }
    else:
        overlay = dict(ACCEPTED_MLO)
    return {
        "source": "Colorado Information Marketplace dataset 4zse-6bnw Licensed Real Estate Professionals in Colorado, filtered licenseprefix=MLO",
        "source_url": "https://data.colorado.gov/Regulations/Licensed-Real-Estate-Professionals-in-Colorado/4zse-6bnw",
        "authority": "Colorado Division of Real Estate / Board of Mortgage Loan Originators",
        "grain": "PERSON",
        "identity": "CO-DORA:MLO:{licenseNumber}",
        "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
        "publication": "NO_PERSON_PAGES",
        "rows": overlay["rows"],
        "unique_license_numbers": overlay["unique_license_numbers"],
        "active": overlay["active"],
        "inactive": overlay["inactive"],
        "status_counts": overlay["status_counts"],
        "entityname_nonempty": overlay["entityname_nonempty"],
        "casenumber_nonempty": overlay["casenumber_nonempty"],
        "nmls_individual_id_field": None,
        "nmls_individual_id_coverage": "NOT_SOURCE_NATIVE",
        "source_as_of": overlay["source_as_of"],
        "retrieved_at": RETRIEVED_AT,
        "verify_path": "https://apps.colorado.gov/dre/licensing/Lookup/LicenseLookup.aspx",
        "roster_generator": "https://apps2.colorado.gov/dre/licensing/lookup/generateroster.aspx",
        "caveat": (
            "MLO rows are people, not lenders, not branches, and not additional national lender entities. "
            "They are not published as a person directory and are not claimable profiles. "
            "The license number is a Colorado DRE credential, not automatically an NMLS Individual ID. "
            "Absence from this roster does not mean a person is unauthorized: federally registered "
            "depository MLOs may be outside the state-licensed roster. State-license absence != unlicensed. "
            "casenumber is not proof of final discipline. Employer/entity strings are not used to mint companies."
        ),
        "not_a_lender_count": True,
        "not_added_to_national_institution_totals": True,
    }


def company_roster() -> dict:
    return {
        "CURRENT_COLORADO_MORTGAGE_COMPANY_BULK_ROSTER": "SOURCE_NOT_ACQUIRED",
        "access": "OPEN_SEARCH_ONLY",
        "live_licensed_company_denominator": "UNKNOWN",
        "nmls_consumer_access": "https://www.nmlsconsumeraccess.org/",
        "dre_note": "DRE states mortgage-company license histories are at NMLS Consumer Access, not issued as a DRE certified-history file.",
        "dre_company_type_in_4zse_6bnw": False,
        "public_profile_effect": "ZERO_NET_NEW_PUBLIC_LENDER_PROFILES",
        "scrape": "FORBIDDEN",
        "caveat": (
            "Colorado mortgage companies register through NMLS subject to exemptions. "
            "No current public bulk company-registration roster was acquired. "
            "Search-only is not zero. Missing is not zero. Do not invent a Colorado lender census. "
            "NMLS Company ID is the expected public company identifier when a live search returns one. "
            "Do not build companies from MLO names or employer strings."
        ),
    }


def dre_enforcement() -> dict:
    return {
        "agency": "Colorado Division of Real Estate / Board of Mortgage Loan Originators",
        "url": "https://dre.colorado.gov/",
        "coverage_state": "OPEN_SEARCH_ONLY",
        "grain": "case / enforcement observation / final order remain separate when source-native",
        "bulk": "NOT_ACQUIRED",
        "name_only_identity": "UNSAFE_FOR_ADVERSE_PROFILE_ATTACH",
        "not_a_license_roster": True,
        "publication_eligibility": "RESEARCH_ONLY until EXACT_OFFICIAL_ID or EXACT_NMLS_ID",
        "casenumber_field": "Present on DRE professional rows; literal None is not a case.",
        "caveat": (
            "Case != violation. Investigation != discipline. Complaint != enforcement. "
            "Allegation != finding. A DRE casenumber is not automatically a final adverse order. "
            "Name-only adverse attachment is UNSAFE."
        ),
    }


def complaints() -> dict:
    return {
        "state_process": "PUBLIC_RESEARCH_PATH",
        "state_process_url": "https://dre.colorado.gov/",
        "bulk_state_complaints": "NOT_ACQUIRED",
        "caveat": (
            "The public DRE complaint process is not a complaint dataset. "
            "No bulk complaints acquired != 0 complaints. No attached complaint != clean history. "
            "Complaint != violation. Complaint != final action. "
            "CFPB mortgage complaints are a separate federal overlay and are not merged into DRE complaints."
        ),
    }


def cfpb_overlay() -> dict:
    out = {
        "source": "CFPB Consumer Complaint Database API",
        "source_url": "https://www.consumerfinance.gov/data-research/consumer-complaints/",
        "product": "Mortgage",
        "geography": "CO",
        "company_rate_published": False,
        "caveat": (
            "Complaint is not a violation. Raw complaint count is not a quality ranking and is not "
            "exposure-normalized. CFPB complaint != Colorado DRE complaint. No company complaint rate "
            "is published against an HMDA denominator."
        ),
        "retrieved_at": RETRIEVED_AT,
        "api_last_updated": None,
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
    params = urllib.parse.urlencode({"size": "0", "state": "CO", "product": "Mortgage"})
    payload = get_json(f"{CFPB_API}?{params}", timeout=60)
    if not payload:
        out.update({"coverage_state": "SOURCE_NOT_ACQUIRED", "result": "SOURCE_NOT_ACQUIRED", "mortgage_complaint_rows": None})
        return out
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
    return {
        "retrieved_at": RETRIEVED_AT,
        "verified_family_count": 2,
        "items": [
            {
                "id": "chfa-homebuyer",
                "name": "CHFA homebuyer assistance / first-mortgage programs",
                "url": "https://www.chfainfo.com/",
                "source_url": "https://www.chfainfo.com/",
                "source_date": None,
                "grain": "PROGRAM_PARTICIPATION / CONSUMER_RESOURCE",
            },
            {
                "id": "chfa-participating-lenders",
                "name": "CHFA participating-lender / loan-officer search",
                "url": "https://www.chfainfo.com/",
                "source_url": "https://www.chfainfo.com/",
                "source_date": None,
                "grain": "PROGRAM_PARTICIPATION",
                "access": "OPEN_SEARCH_ONLY",
            },
        ],
        "exact_identity_attachment_count": 0,
        "unresolved_rows": None,
        "not_a_license": True,
        "not_an_endorsement": True,
        "caveat": (
            "CHFA is not the mortgage licensing authority. Participation is not licensure, "
            "regulatory approval, a Trust rating, a quality rating, or an endorsement. "
            "CHFA states participating-lender search results do not constitute an endorsement or referral "
            "and do not guarantee service quality, outcomes, or results. No name-only attachment to canonical lenders."
        ),
    }


def depository() -> dict:
    banks = []
    if FDIC_CO.exists():
        payload = json.loads(FDIC_CO.read_text(encoding="utf-8"))
        banks = payload.get("banks") or []
    return {
        "source": "Existing LenderTrustHub FDIC Colorado overlay (lib/fdic/data/colorado.json)",
        "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
        "identity": "FDIC CERT",
        "fdic_cert_rows": len(banks),
        "caveat": "FDIC institution != Colorado mortgage-company registration. A bank may lend without being a state-registered mortgage company.",
    }


def main() -> int:
    hmda = hmda_block()
    mlo = dre_mlo()
    roster = company_roster()
    enf = dre_enforcement()
    comps = complaints()
    cfpb = cfpb_overlay()
    chfa = programs()
    dep = depository()
    if hmda["applications"] <= 0 or hmda["originations"] <= 0:
        raise SystemExit("HMDA Colorado metrics missing")
    if hmda["county_count"] != 64:
        raise SystemExit(f"Colorado HMDA must cover 64 counties, got {hmda['county_count']}")
    if mlo["rows"] <= 0:
        raise SystemExit("DRE MLO overlay missing")
    snapshot = {
        "contract_name": "lender-co-state-intel-v1",
        "version": "1.0.0",
        "geography": "CO",
        "publication_status": "published",
        "path": "/colorado",
        "generated_at": GENERATED_AT,
        "growth_classification": "INTELLIGENCE_GROWTH_HEAVY",
        "source_as_of": {
            "hmda": "HMDA 2025",
            "dre_mlo": mlo.get("source_as_of"),
            "company_roster": "SOURCE_NOT_ACQUIRED",
            "dre_enforcement": "OPEN_SEARCH_ONLY",
            "programs": None,
            "cfpb": cfpb.get("api_last_updated"),
        },
        "hero": {
            "universe_label": "HMDA applications",
            "universe_value": hmda["applications"],
            "universe_hint": "2025 HMDA applications for properties located in Colorado. Not a count of Colorado lenders or MLO people.",
            "current_label": "HMDA originations",
            "current_value": hmda["originations"],
            "observations_label": "CFPB Colorado mortgage complaint rows",
            "observations_value": cfpb.get("mortgage_complaint_rows") or 0,
            "geography_label": "Counties in HMDA geography",
            "geography_value": hmda["county_count"],
            "as_of_label": "HMDA vintage",
            "as_of_value": "2025",
        },
        "pre_ingest_baseline": {
            "hmda_partition_already_in_repo": True,
            "hmda_applications_already_present": hmda["index_json_applications"],
            "lei_reporter_rows_already_present": hmda["index_json_lei_state_rows"],
            "canonical_company_vs_nmls_vs_lei": "Kept as distinct identity layers. A Colorado HMDA row is not a new organization. An MLO row is not a company.",
        },
        "clock_reconciliation": {
            "lender_canonical_source": "data/hmda/by-state/CO/county_market_summary.csv (summed)",
            "lender_applications": hmda["applications"],
            "lender_originations": hmda["originations"],
            "lender_denials": hmda["denials"],
            "index_json_applications": hmda["index_json_applications"],
            "index_json_originations": hmda["index_json_originations"],
            "national_production_county_grain_applications": 257140,
            "national_production_county_grain_originations": 156145,
            "national_production_county_grain_denials": 39356,
            "national_production_source": "lender_hmda_observations geo_grain=county grouped by state_code, published in lender-network-metrics-v1 geography",
            "ticket_remembered_applications": 257140,
            "ticket_remembered_originations": 156145,
            "ticket_remembered_denials": 39356,
            "originations_match_index": hmda["originations"] == hmda["index_json_originations"],
            "originations_match_national_geo": hmda["originations"] == 156145,
            "applications_match_index": hmda["applications"] == hmda["index_json_applications"],
            "do_not_add_national_geo_to_state_intel": True,
            "do_not_rewrite_national_aggregate": True,
            "why": (
                "Canonical for /colorado is SUM(data/hmda/by-state/CO/county_market_summary.csv) over 64 county rows. "
                "That sum matches data/hmda/by-state/index.json CO applications and originations. "
                "The previously published network geography CO row (257,140 / 156,145 / 39,356) is the production "
                "lender_hmda_observations county-grain LEI aggregate, a different input from the by-state county "
                "market summary. Originations match across both. Applications and denials do not. "
                "Do not add the two. Do not rewrite the national county-grain total to force symmetry. "
                "Ask is not rewritten. County-grain is not added to state-grain."
            ),
            "which_is_canonical_for_this_ticket": "Committed Colorado county_market_summary.csv county-sum",
        },
        "hmda": hmda,
        "mlo_roster": mlo,
        "live_roster": roster,
        "dre_enforcement": enf,
        "complaints": comps,
        "cfpb": cfpb,
        "programs": chfa,
        "depository": dep,
        "foreclosure": {
            "STATEWIDE_STRUCTURED_FORECLOSURE_SOURCE_NOT_ACQUIRED": True,
            "note": "No dedicated statewide structured Colorado foreclosure file was acquired.",
        },
        "regulator_matrix": [
            {
                "credential": "Mortgage Loan Originator",
                "what": "Colorado individual MLO license",
                "regulator": "DRE / Board of Mortgage Loan Originators",
                "grain": "person",
                "identity": "CO-DORA:MLO:{licenseNumber}",
                "verification": "CIM 4zse-6bnw + DRE lookup",
                "proves": "A person license row in the accepted DRE extract",
                "does_not_prove": "A lender company, branch, NMLS Individual ID, or that absence means unlicensed",
            },
            {
                "credential": "Mortgage company registration",
                "what": "NMLS mortgage-company registration required by Colorado law subject to exemptions",
                "regulator": "DRE via NMLS",
                "grain": "business",
                "identity": "NMLS Company ID when a live official search returns one",
                "verification": "OPEN_SEARCH_ONLY — not scraped",
                "proves": "Nothing numeric in this snapshot; bulk roster not acquired",
                "does_not_prove": "A complete Colorado lender census, FDIC identity, or endorsement",
            },
            {
                "credential": "NMLS Company ID",
                "what": "Nationwide Multistate Licensing System company identifier",
                "regulator": "NMLS / CSBS",
                "grain": "business",
                "identity": "NMLS Company ID",
                "verification": "Existing identity graph / Consumer Access",
                "proves": "Company NMLS identity when source-native",
                "does_not_prove": "State MLO license or that a company is the same as an MLO person",
            },
            {
                "credential": "NMLS Individual ID",
                "what": "Person NMLS identifier",
                "regulator": "NMLS / CSBS",
                "grain": "person",
                "identity": "NMLS Individual ID",
                "verification": "Not source-native on CIM 4zse-6bnw",
                "proves": "Nothing in this extract; field not present",
                "does_not_prove": "That a DRE MLO license number is an NMLS Individual ID",
            },
            {
                "credential": "FDIC CERT",
                "what": "Insured depository institution",
                "regulator": "FDIC",
                "grain": "business",
                "identity": "FDIC CERT / NCUA / RSSD",
                "verification": "Existing national overlay",
                "proves": "Charter identity when source-native",
                "does_not_prove": "Colorado mortgage-company registration",
            },
            {
                "credential": "CHFA participating lender",
                "what": "Appears on a CHFA participating-lender / homebuyer path",
                "regulator": "Colorado Housing and Finance Authority",
                "grain": "business program listing",
                "identity": "Program listing",
                "verification": "Official CHFA pages — OPEN_SEARCH_ONLY",
                "proves": "Program-participation listing as of page retrieval",
                "does_not_prove": "Licensure, endorsement, TrustHub recommendation, or quality",
            },
        ],
        "identity_rules": {
            "EXACT_OFFICIAL_ID": "CO-DORA:MLO:{licenseNumber} or other source-native official ID",
            "EXACT_NMLS_ID": "NMLS Company or Individual ID only when source-native",
            "REVIEW_REQUIRED": "Name + address may be review evidence only",
            "UNSAFE": "Name-only or address-only relationship or adverse attachment",
        },
        "expansion_ledger": {
            "NET_NEW_CANONICAL_ORGANIZATIONS": 0,
            "NET_NEW_PUBLIC_LENDER_PROFILES": 0,
            "NET_NEW_PUBLIC_PERSON_PAGES": 0,
            "MLO_PERSON_ROWS_ACQUIRED": mlo["rows"],
            "NEW_EVIDENCE_ROWS": (cfpb.get("mortgage_complaint_rows") or 0) + mlo["rows"] + len(chfa["items"]),
            "notes": {
                "hmda": "HMDA Colorado partition was already in the repository.",
                "mlo": "MLO rows are person-grain research evidence, not public lender profiles and not added to national institution totals.",
                "roster": "No mortgage-company bulk identities were acquired.",
                "cfpb": "Statewide Colorado mortgage complaint overlay is new evidence, not organizations.",
            },
        },
        "semantic_guardrails": [
            "MLO != mortgage company",
            "mortgage-company registration != MLO license",
            "NMLS Company ID != state MLO license number",
            "NMLS Individual ID != NMLS Company ID",
            "branch != lender",
            "HMDA application != lender",
            "HMDA origination != lender",
            "CFPB complaint != violation",
            "complaint != enforcement",
            "investigation != final discipline",
            "case number != violation",
            "CHFA participation != licensure",
            "CHFA participation != endorsement",
            "FDIC institution != mortgage-company registration",
            "state-license absence != unlicensed",
            "search-only != zero",
            "missing != zero",
            "claimed != verified",
            "NO TRUST SCORE",
            "NO COMBINED COLORADO LENDER DENOMINATOR",
        ],
        "gaps": [
            "Current public bulk Colorado mortgage-company registration roster",
            "Source-native NMLS Individual ID on DRE MLO rows",
            "Bulk DRE enforcement/order dataset with exact identity",
            "Bulk DRE complaint dataset",
            "Machine-readable CHFA participating-lender list with exact NMLS/FDIC IDs",
            "Statewide structured foreclosure file",
        ],
        "noCombinedDenominator": True,
        "noCountyRoutes": True,
        "noDenverPage": True,
        "statewideOnly": True,
        "claimEligibilityBroadened": False,
        "unresolved_relationships": {
            "mortgage_company_registration": "OPEN_SEARCH_ONLY / SOURCE_NOT_ACQUIRED",
            "nmls_individual_id_on_dre_mlo_rows": "NOT_SOURCE_NATIVE",
            "dre_enforcement_bulk": "NOT_ACQUIRED",
            "dre_complaint_bulk": "NOT_ACQUIRED",
            "chfa_participating_lender_list": "OPEN_SEARCH_ONLY",
            "statewide_foreclosure_file": "NOT_ACQUIRED",
        },
        "rejected_joins": [
            "Name-only adverse attachment",
            "Employer-string or entityname company promotion",
            "DRE MLO license number inferred as NMLS Individual ID",
            "MLO person row published as a lender-company search result",
            "CHFA participation treated as licensure or endorsement",
            "HMDA application or origination counted as a lender",
            "CFPB complaint counted as a DRE violation",
            "State-license absence inferred as unlicensed",
            "Federal depository identity collapsed into mortgage-company registration",
        ],
    }
    blob = json.dumps(snapshot, sort_keys=True, separators=(",", ":")).encode("utf-8")
    snapshot["fingerprint"] = hashlib.sha256(blob).hexdigest()
    if CHECK:
        committed = json.loads((LIB / "accepted-snapshot.json").read_text(encoding="utf-8"))
        if committed.get("fingerprint") != snapshot["fingerprint"]:
            raise SystemExit(
                f"Colorado snapshot fingerprint drifted: builder={snapshot['fingerprint']} committed={committed.get('fingerprint')}"
            )
        print("fingerprint check OK", snapshot["fingerprint"])
        return 0
    ART.mkdir(parents=True, exist_ok=True)
    LIB.mkdir(parents=True, exist_ok=True)
    (ART / "co-lend-001-public-snapshot.json").write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    (LIB / "accepted-snapshot.json").write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    print("fingerprint", snapshot["fingerprint"])
    print("hmda", hmda["applications"], hmda["originations"], hmda["denials"], "counties", hmda["county_count"])
    print("mlo", mlo["rows"], "active", mlo["active"], "inactive", mlo["inactive"], "unique", mlo["unique_license_numbers"])
    print("cfpb", cfpb.get("mortgage_complaint_rows"))
    print("fdic", dep["fdic_cert_rows"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
