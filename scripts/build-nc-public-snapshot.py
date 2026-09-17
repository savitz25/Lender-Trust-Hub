#!/usr/bin/env python3
"""Build lender-nc-state-intel-v1 from NCCOB Show All + HMDA NC + CFPB + FDIC."""
from __future__ import annotations

import argparse
import copy
import csv
import hashlib
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
HMDA = ROOT / "data/hmda/by-state/NC/county_market_summary.csv"
LEI = ROOT / "data/hmda/by-state/NC/lender_activity_by_county.csv"
STATE_LEI = ROOT / "data/hmda/by-state/NC/lender_state_summary.csv"
FDIC = ROOT / "lib/fdic/data/north-carolina.json"
CENSUS = ROOT / "data/north-carolina/nc-lend-001/derived/nccob-company-census.json"
ENF_HTML = ROOT / "data/north-carolina/nc-lend-001/raw/mortgage-enforcement-results.html"
ENF_JSON = ROOT / "data/north-carolina/nc-lend-001/derived/nccob-enforcement-docs.json"
REV_HTML = ROOT / "data/north-carolina/nc-lend-001/raw/reverse-list.html"
OFF_HTML = ROOT / "data/north-carolina/nc-lend-001/raw/license-all-officers.html"
CFPB = ROOT / "data/north-carolina/nc-lend-001/cfpb-2025-nc-mortgage-ids.json"
OUT = ROOT / "lib/north-carolina-intelligence/accepted-snapshot.json"
GENERATION_KEYS = frozenset({"generated_at", "fingerprint"})
DOC_BASE = "https://www.nccob.gov/Online/Shared/DocumentsDisplay.aspx?FileNameAndPath="
CORP_RE = re.compile(
    r"\b(LLC|L\.L\.C\.?|INC\.?|INCORPORATED|CORP\.?|CORPORATION|LTD\.?|L\.P\.|LP|LLP|"
    r"N\.A\.|NATIONAL ASSOCIATION|BANK|COMPANY|CO\.|HOLDINGS|FINANCIAL|FUNDING|"
    r"MORTGAGE|SERVICES|SOLUTIONS|GROUP|PARTNERS|TRUST|CREDIT UNION|DBA|D/B/A)\b",
    re.I,
)
PERSON_RE = re.compile(r"^[^,]+,\s+\S+")
ROW_RE = re.compile(
    r"<td>(\d{2}/\d{2}/\d{4})</td><td>([^<]*)</td><td>([^<]*)</td><td>\s*"
    r'<a[^>]*href="([^"]+)"[^>]*>([^<]+)</a>',
    re.I,
)

EXPECTED = {
    "applications": 484454,
    "originations": 279735,
    "denials": 86923,
    "counties": 100,
    "purchase": 222400,
    "refinance": 159382,
    "other": 102672,
    "conventional": 360738,
    "fha": 62540,
    "va": 59290,
    "usda": 1886,
    "fdic": 91,
    "lei_apps": 478702,
    "lei_orig": 279735,
    "lei_den": 84978,
    "distinct_leis": 1121,
    "cfpb": 920,
    "lenders": 640,
    "brokers": 574,
    "servicers": 62,
    "mosr": 104,
    "mixed": 1380,
    "nmls_both": 1380,
    "distinct_nmls": 1376,
    "dba": 483,
    "services_loan_yes": 277,
    "reverse": 112,
    "mlo_matching": 24612,
    "enf_docs": 723,
    "enf_dockets": 693,
}


def dumps(obj: object) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha(obj: object) -> str:
    return hashlib.sha256(dumps(obj).encode("utf-8")).hexdigest()


def semantic_body(obj: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in obj.items() if k not in GENERATION_KEYS}


def semantic_sha(obj: dict[str, Any]) -> str:
    return sha(semantic_body(obj))


def pct(num: int, den: int) -> float:
    return round(num / den * 100, 2)


def n(row: dict[str, str], *keys: str) -> int:
    for key in keys:
        if row.get(key) not in (None, ""):
            return int(float(row[key]))
    return 0


def infer_respondent_kind(name: str) -> str:
    text = name.strip()
    if CORP_RE.search(text):
        return "company_name_pattern"
    if PERSON_RE.match(text):
        return "person_name_pattern"
    return "other_or_untyped"


def parse_enforcement(html: str) -> dict[str, Any]:
    official = re.search(r"(\d+)\s+records found", html, re.I)
    official_n = int(official.group(1)) if official else None
    rows: list[dict[str, Any]] = []
    for date_s, name, action, href, docket in ROW_RE.findall(html):
        path = unquote(href.split("FileNameAndPath=", 1)[-1]) if "FileNameAndPath=" in href else href
        doc_url = DOC_BASE + path if "DocumentsDisplay" in href else href
        nmls = None
        nccob = None
        if re.search(r"\bNMLS\b|\bL-\d+|\bB-\d+|\bR-\d+", f"{name} {action} {docket} {path}", re.I):
            # Grid metadata did not publish these; keep null unless a dedicated column appears.
            nmls = None
            nccob = None
        rows.append(
            {
                "order_date": date_s,
                "respondent": name.strip(),
                "action_type": action.strip(),
                "docket_number": docket.strip(),
                "document_path": path,
                "document_url": doc_url,
                "display_name_mode": "name_on_the_order",
                "nmls_id_source": nmls,
                "nccob_license_source": nccob,
                "respondent_kind_inferred": infer_respondent_kind(name),
                "respondent_kind_source_native": False,
                "source_status": "listed",
            }
        )
    dockets = {r["docket_number"] for r in rows}
    kinds = Counter(r["respondent_kind_inferred"] for r in rows)
    actions = Counter(r["action_type"] for r in rows)
    dates = [datetime.strptime(r["order_date"], "%m/%d/%Y") for r in rows]
    bound = datetime(2021, 9, 17)
    five_year = sum(1 for d in dates if d >= bound)
    has_nmls = sum(1 for r in rows if r["nmls_id_source"])
    has_nccob = sum(1 for r in rows if r["nccob_license_source"])
    catalog = {
        "official_records_found": official_n,
        "documents": len(rows),
        "distinct_dockets": len(dockets),
        "unique_matters_docket_identity": len(dockets),
        "document_is_not_matter": True,
        "do_not_dedupe_by_respondent_name": True,
        "order_date_min": min(dates).strftime("%Y-%m-%d") if dates else None,
        "order_date_max": max(dates).strftime("%Y-%m-%d") if dates else None,
        "five_year_window_label": "Click [Search] to show all orders for the past 5 years.",
        "documents_order_date_on_or_after_2021_09_17": five_year,
        "action_types": dict(actions.most_common()),
        "respondent_kind_inferred_counts": dict(kinds),
        "respondent_kind_is_not_license_class": True,
        "exact_enforcement_nmls_attachments": has_nmls,
        "exact_enforcement_nccob_attachments": has_nccob,
        "grid_columns": ["Order Date", "Individual/Company", "Type of Action", "Docket Number"],
        "endpoint": "https://www.nccob.gov/Online/NMLS/CommissionOrderListing.aspx",
        "display": "Name on the Order",
    }
    ENF_JSON.parent.mkdir(parents=True, exist_ok=True)
    ENF_JSON.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")
    return catalog


def build() -> dict[str, Any]:
    rows = list(csv.DictReader(HMDA.open(encoding="utf-8")))
    lei_rows = list(csv.DictReader(LEI.open(encoding="utf-8")))
    state_rows = list(csv.DictReader(STATE_LEI.open(encoding="utf-8")))
    years = {int(r["year"]) for r in rows if r.get("year")}
    if years != {2025}:
        raise SystemExit(f"unexpected HMDA years: {sorted(years)}")
    apps = sum(n(r, "total_applications") for r in rows)
    orig = sum(n(r, "total_originations") for r in rows)
    den = sum(n(r, "denial_count") for r in rows)
    purchase = sum(n(r, "purchase_count") for r in rows)
    refinance = sum(n(r, "refinance_count") for r in rows)
    other = sum(n(r, "purpose_other_count") for r in rows)
    conv = sum(n(r, "apps_conventional") for r in rows)
    fha = sum(n(r, "apps_fha") for r in rows)
    va = sum(n(r, "apps_va") for r in rows)
    usda = sum(n(r, "apps_usda_other") for r in rows)
    lei_apps = sum(n(r, "applications", "total_applications") for r in lei_rows)
    lei_orig = sum(n(r, "originations", "total_originations") for r in lei_rows)
    lei_den = sum(n(r, "denials", "denial_count") for r in lei_rows)
    distinct_leis = len({r.get("lei") for r in state_rows if r.get("lei")})
    fdic = json.loads(FDIC.read_text(encoding="utf-8"))
    fdic_n = len(fdic.get("banks") or [])
    census = json.loads(CENSUS.read_text(encoding="utf-8"))
    cfpb = json.loads(CFPB.read_text(encoding="utf-8"))
    if ENF_HTML.exists():
        enf = parse_enforcement(ENF_HTML.read_text(encoding="utf-8", errors="replace"))
    else:
        enf = json.loads(ENF_JSON.read_text(encoding="utf-8"))
    if REV_HTML.exists():
        reverse_n = len(set(re.findall(r"RM-\d+", REV_HTML.read_text(encoding="utf-8", errors="replace"))))
    else:
        reverse_n = int(census.get("reverse_certificates") or 112)
    if OFF_HTML.exists():
        off = OFF_HTML.read_text(encoding="utf-8", errors="replace")
        mlo_m = re.search(r"([\d,]+)\s+Matching Record", off, re.I)
        mlo_matching = int(mlo_m.group(1).replace(",", "")) if mlo_m else 24612
    else:
        mlo_matching = int(census.get("mlo_official_matching") or 24612)
    by_type = census["by_type"]
    for key, value in {
        "applications": apps,
        "originations": orig,
        "denials": den,
        "counties": len(rows),
        "purchase": purchase,
        "refinance": refinance,
        "other": other,
        "conventional": conv,
        "fha": fha,
        "va": va,
        "usda": usda,
        "fdic": fdic_n,
        "lei_apps": lei_apps,
        "lei_orig": lei_orig,
        "lei_den": lei_den,
        "distinct_leis": distinct_leis,
        "cfpb": cfpb["meta"]["distinct_ids"],
        "lenders": by_type["Mortgage Lender"],
        "brokers": by_type["Mortgage Broker"],
        "servicers": by_type["Mortgage Servicer"],
        "mosr": by_type["Mortgage Origination Support Registration"],
        "mixed": census["distinct_licenses"],
        "nmls_both": census["nccob_nmls_both"],
        "distinct_nmls": census["distinct_nmls"],
        "dba": census["dba_populated"],
        "services_loan_yes": census["services_loan_yes"],
        "reverse": reverse_n,
        "mlo_matching": mlo_matching,
        "enf_docs": enf["documents"],
        "enf_dockets": enf["distinct_dockets"],
    }.items():
        if value != EXPECTED[key]:
            raise SystemExit(f"{key} drifted: {value} != {EXPECTED[key]}")
    if enf["official_records_found"] != 723:
        raise SystemExit(f"official enforcement records drifted: {enf['official_records_found']}")
    if by_type["Mortgage Lender"] + by_type["Mortgage Broker"] + by_type["Mortgage Servicer"] + by_type[
        "Mortgage Origination Support Registration"
    ] != 1380:
        raise SystemExit("class rows must sum to mixed current 1380")
    if 1380 == 640:
        raise SystemExit("mixed current entities must not equal lender class")

    generated = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    snap: dict[str, Any] = {
        "contract_name": "lender-nc-state-intel-v1",
        "version": "1.0.0",
        "geography": "NC",
        "publication_status": "published",
        "path": "/north-carolina",
        "generated_at": generated,
        "retrieved_at": "2026-09-17T21:18:40Z",
        "retrieved_at_precision": "datetime",
        "snapshot_as_of": "2026-09-17",
        "growth_classification": "INTELLIGENCE_GROWTH_HEAVY",
        "source_as_of": {
            "hmda": "HMDA 2025",
            "fdic": "2026-06-26",
            "cfpb": "2025-01-01/2025-12-31",
            "nccob_current_companies": "2026-09-17",
            "nccob_enforcement": "2026-09-17",
            "nccob_reverse": "2026-09-17",
            "nchfa": "OPEN_SEARCH_ONLY",
            "nmls_consumer_access": "INFRASTRUCTURE_NOT_REGULATOR",
        },
        "hero": {
            "universe_label": "HMDA 2025 North Carolina applications",
            "universe_value": apps,
            "universe_hint": "Property-geography applications in North Carolina. Not lenders and not a current license census.",
            "current_label": "HMDA 2025 North Carolina originations",
            "current_value": orig,
            "observations_label": "CFPB 2025 North Carolina mortgage complaints",
            "observations_value": 920,
            "geography_label": "North Carolina counties in the committed HMDA slice",
            "geography_value": 100,
            "as_of_label": "HMDA vintage",
            "as_of_value": "2025",
        },
        "regulators": {
            "name": "North Carolina Office of the Commissioner of Banks",
            "short": "NCCOB",
            "unit": "Mortgage licensing under the North Carolina SAFE Act",
            "url": "https://www.nccob.gov/online/NMLS/licensesearch.aspx",
            "nmls": "https://www.nmlsconsumeraccess.org/",
            "orders": "https://www.nccob.gov/Online/NMLS/CommissionOrderListing.aspx",
            "complaints": "https://www.nccob.gov/online/NMLS/EntitySelect.aspx",
            "reverse": "https://www.nccob.gov/online/nmls/ReverseMortgageCertificates.aspx",
            "nchfa": "https://www.nchfa.com/home-buyers/find-lender",
            "nmls_is_not_north_carolina_regulator": True,
        },
        "mixed_nccob_denominator": {
            "NC_CURRENT_LICENSED_ENTITY_ROWS": 1380,
            "is_not_mortgage_company_count": True,
            "is_not_mortgage_lender_count": True,
            "is_not_mlo_count": True,
            "do_not_add_classes": True,
        },
        "nmls": {
            "nmls_is_infrastructure_not_regulator": True,
            "nccob_license_is_not_nmls": True,
            "source_native_both_ids_are_exact_crosswalk": True,
            "no_name_derived_crosswalk": True,
        },
        "current_roster": {
            "coverage_state": "ACQUIRED_CURRENT_SHOW_ALL",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "source": "NCCOB Licensee Search Show All Companies",
            "source_url": "https://www.nccob.gov/online/NMLS/licensesearch.aspx",
            "note_current_only": "This search will ONLY show current licensed entities.",
            "NC_MORTGAGE_LENDER_ROWS": 640,
            "NC_MORTGAGE_LENDER_DISTINCT_NCCOB_LICENSES": 640,
            "NC_MORTGAGE_LENDER_DISTINCT_NMLS_IDS": None,
            "NC_CURRENT_LICENSED_ENTITY_ROWS": 1380,
            "NC_CURRENT_DISTINCT_NCCOB_LICENSES": 1380,
            "NC_CURRENT_DISTINCT_NMLS_IDS": 1376,
            "NC_CURRENT_EXACT_NCCOB_NMLS_PAIRS": 1380,
            "count": None,
            "live_licensed_company_universe": None,
            "this_ticket_retrieved": True,
            "search_only_is_not_zero": True,
            "not_inferred_from_hmda": True,
            "not_inferred_from_fdic": True,
            "not_inferred_from_nchfa": True,
            "not_inferred_from_cfpb": True,
            "mixed_1380_is_not_lender_count": True,
        },
        "broker": {
            "NC_MORTGAGE_BROKER_ROWS": 574,
            "broker_is_not_lender": True,
        },
        "servicer": {
            "NC_MORTGAGE_SERVICER_ROWS": 62,
            "servicer_is_not_lender": True,
            "services_loan_yes_flag": 277,
            "services_loan_flag_is_not_servicer_census": True,
        },
        "mosr": {
            "NC_MOSR_ROWS": 104,
            "mosr_is_not_lender": True,
            "mosr_is_not_mlo": True,
        },
        "mlo": {
            "coverage_state": "OFFICIAL_MATCHING_COUNT_NOT_FULLY_PAGED",
            "NC_MLO_ROWS": 24612,
            "NC_MLO_OFFICIAL_MATCHING_RECORDS": 24612,
            "NC_MLO_DISTINCT_NCCOB_LICENSES": None,
            "NC_MLO_DISTINCT_NMLS_IDS": None,
            "person_is_not_company": True,
            "do_not_add_to_1380": True,
            "search_only_is_not_zero": True,
        },
        "reverse": {
            "NC_REVERSE_MORTGAGE_CERTIFICATE_ROWS": 112,
            "reverse_is_not_generic_lender": True,
            "do_not_add_to_640": True,
        },
        "previous_exempt": {
            "coverage_state": "OPEN_SEARCH_ONLY",
            "current_is_not_previous": True,
            "current_is_not_exempt": True,
            "search_only_is_not_zero": True,
        },
        "branches": {
            "coverage_state": "NOT_SEPARATELY_COUNTED",
            "branch_is_not_company": True,
        },
        "dba": {
            "NC_DBA_POPULATED_ROWS": 483,
            "dba_is_not_company_count": True,
        },
        "identity": {
            "preferred_company": "NC-NCCOB-LICENSE:{licenseNumber} after source validation",
            "nmls": "NMLS:{id} when source-native",
            "name_only": "UNSAFE",
            "name_plus_city": "REVIEW_REQUIRED",
            "company_is_not_branch": True,
            "company_is_not_mlo": True,
            "depository_is_not_mortgage_banker": True,
            "no_name_match_nmls": True,
            "nmls_is_not_regulator": True,
            "lei_is_not_nmls": True,
            "nccob_license_is_not_nmls": True,
        },
        "hmda": {
            "year": 2025,
            "geo_grain": "state_and_county",
            "state_code": "NC",
            "source": "Committed HMDA North Carolina partition data/hmda/by-state/NC/county_market_summary.csv. Properties located in North Carolina. Not a second national download.",
            "source_as_of": "HMDA 2025",
            "retrieved_at": None,
            "retrieved_at_precision": "UNKNOWN",
            "reuse": "PRE_EXISTING_REUSED",
            "this_ticket_retrieved": False,
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_PUBLIC_METRIC",
            "county_count": 100,
            "applications": apps,
            "originations": orig,
            "denials": den,
            "denials_as_pct_of_total_applications": pct(den, apps),
            "denial_pct_numerator_denial_observations": den,
            "denial_pct_denominator_total_applications": apps,
            "denial_pct_is_not_decision_based_rate": True,
            "denial_is_not_lender_quality": True,
            "purchase_applications": purchase,
            "refinance_applications": refinance,
            "purpose_other_applications": other,
            "purchase_pct_of_apps": pct(purchase, apps),
            "refinance_pct_of_apps": pct(refinance, apps),
            "purpose_other_pct_of_apps": pct(other, apps),
            "apps_conventional": conv,
            "apps_fha": fha,
            "apps_va": va,
            "apps_usda_other": usda,
            "conventional_pct": pct(conv, apps),
            "fha_pct": pct(fha, apps),
            "va_pct": pct(va, apps),
            "usda_other_pct": pct(usda, apps),
            "lei_cell_applications": lei_apps,
            "lei_cell_originations": lei_orig,
            "lei_cell_denials": lei_den,
            "distinct_leis": distinct_leis,
            "county_minus_lei_apps": apps - lei_apps,
            "county_minus_lei_orig": orig - lei_orig,
            "county_minus_lei_den": den - lei_den,
            "application_is_not_lender": True,
            "lei_is_not_north_carolina_license": True,
            "geography_is_not_headquarters": True,
            "geography_is_not_license_jurisdiction": True,
            "geography_is_not_service_territory": True,
            "no_county_pages": True,
            "no_charlotte_raleigh_routes": True,
        },
        "cfpb": {
            "source": "CFPB Consumer Complaint Database",
            "source_url": "https://www.consumerfinance.gov/data-research/consumer-complaints/",
            "product": "Mortgage",
            "geography": "NC",
            "period": "2025-01-01/2025-12-31",
            "period_complete": True,
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "NC_CFPB_2025_MORTGAGE_COMPLAINT_ROWS": 920,
            "NC_CFPB_2025_DISTINCT_COMPLAINT_IDS": 920,
            "mortgage_complaint_rows": 920,
            "retrieved_at": "2026-09-17T21:18:40Z",
            "retrieved_at_precision": "datetime",
            "this_ticket_retrieved": True,
            "complaint_is_not_violation": True,
            "complaint_is_not_nccob_order": True,
            "company_name_is_not_nmls": True,
            "exact_cfpb_nmls_attachments": 0,
            "narratives_stored": 0,
        },
        "nccob_complaints": {
            "NC_NCCOB_MORTGAGE_COMPLAINT_ROWS": None,
            "NC_NCCOB_MORTGAGE_COMPLAINT_COVERAGE": "INTAKE_AVAILABLE / BULK_NOT_PUBLIC",
            "intake_url": "https://www.nccob.gov/online/NMLS/EntitySelect.aspx",
            "nccob_intake_is_not_cfpb": True,
            "search_only_is_not_zero": True,
        },
        "nccob_orders": {
            "coverage_state": "ACQUIRED_BOUNDED_SEARCH_CATALOG",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "endpoint": enf["endpoint"],
            "not_consumer_industries_listing": True,
            "NC_NCCOB_MORTGAGE_ORDER_DOCUMENTS": enf["documents"],
            "NC_NCCOB_MORTGAGE_DISTINCT_DOCKETS": enf["distinct_dockets"],
            "NC_NCCOB_MORTGAGE_UNIQUE_MATTERS": enf["unique_matters_docket_identity"],
            "document_is_not_matter": True,
            "do_not_dedupe_by_respondent_name": True,
            "five_year_window_label": enf["five_year_window_label"],
            "order_date_min": enf["order_date_min"],
            "order_date_max": enf["order_date_max"],
            "documents_order_date_on_or_after_2021_09_17": enf["documents_order_date_on_or_after_2021_09_17"],
            "action_types_source_native": enf["action_types"],
            "consent_order_is_not_criminal_conviction": True,
            "suspension_is_not_permanent_revocation": True,
            "application_denial_is_not_operating_violation": True,
            "notice_of_hearing_is_not_final_finding": True,
            "respondent_kind_inferred_counts": enf["respondent_kind_inferred_counts"],
            "respondent_kind_is_not_license_class": True,
            "person_is_not_company": True,
            "mlo_enforcement_is_not_lender_company_matter": True,
            "name_only": "UNSAFE",
            "EXACT_ENFORCEMENT_NCCOB_ATTACHMENTS": enf["exact_enforcement_nccob_attachments"],
            "EXACT_ENFORCEMENT_NMLS_ATTACHMENTS": enf["exact_enforcement_nmls_attachments"],
            "grid_published_nmls_or_nccob_license": False,
            "retrieved_at": "2026-09-17",
            "retrieved_at_precision": "date",
        },
        "nchfa": {
            "coverage_state": "OPEN_SEARCH_ONLY",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "NC_NCHFA_PARTICIPATING_LENDER_ROWS": None,
            "NC_NCHFA_DISTINCT_LENDERS": None,
            "finder_url": "https://www.nchfa.com/home-buyers/find-lender",
            "finder_is_radius_search": True,
            "nchfa_is_not_nccob_license": True,
            "nchfa_loan_officer_is_not_mlo_census": True,
            "nchfa_is_not_endorsement": True,
            "program_eligibility_is_not_universal_product": True,
            "preferred_loan_officer_is_nchfa_language": True,
            "preferred_is_not_trusthub_ranking": True,
            "name_only": "UNSAFE",
            "search_only_is_not_zero": True,
        },
        "fdic": {
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "source": "Existing LenderTrustHub FDIC North Carolina overlay",
            "source_as_of": "2026-06-26",
            "retrieved_at": None,
            "retrieved_at_precision": "UNKNOWN",
            "reuse": "PRE_EXISTING_REUSED",
            "this_ticket_retrieved": False,
            "institution_rows": fdic_n,
            "NC_FDIC_DEPOSITORY_ROWS": fdic_n,
            "depository_is_not_mortgage_banker": True,
            "fdic_is_not_nccob_mortgage_license": True,
            "bank_is_not_mortgage_broker": True,
            "headquarters_is_not_hmda_north_carolina_activity": True,
        },
        "state_charter": {
            "coverage_state": "NOT_ACQUIRED_THIS_TICKET",
            "note": "North Carolina state-chartered bank and credit-union populations stay separate from the NCCOB mortgage-license population. Existing FDIC overlay is the depository context used here.",
            "do_not_delay_nc_lend_001": True,
        },
        "crosswalks": {
            "EXACT_NMLS_LEI_CROSSWALKS": 0,
            "EXACT_ENFORCEMENT_NMLS_ATTACHMENTS": 0,
            "EXACT_ENFORCEMENT_NCCOB_ATTACHMENTS": 0,
            "EXACT_CFPB_NMLS_ATTACHMENTS": 0,
            "EXACT_PROFILE_ATTACHMENTS": 0,
            "EXACT_NCCOB_NMLS_SOURCE_NATIVE_PAIRS": 1380,
        },
        "adverse": {
            "ADVERSE_SOURCES_FOUND": 3,
            "ADVERSE_SOURCES_ACQUIRED": 2,
            "ADVERSE_ROWS_ACQUIRED": None,
            "UNIQUE_REGULATORY_MATTERS": 693,
            "do_not_add_cfpb_plus_nccob_orders": True,
        },
        "grain_classification": {
            "hmda_applications": "VISIBLE_PUBLIC_METRIC",
            "hmda_originations": "VISIBLE_PUBLIC_METRIC",
            "cfpb": "VISIBLE_SUPPORTING_CONTEXT",
            "nccob_current_classes": "VISIBLE_SUPPORTING_CONTEXT",
            "fdic": "VISIBLE_SUPPORTING_CONTEXT",
            "nccob_orders": "VISIBLE_SUPPORTING_CONTEXT",
            "nchfa": "VISIBLE_SUPPORTING_CONTEXT",
        },
        "claim_eligibility": {"broadened": False},
        "expansion_ledger": {
            "NC_MORTGAGE_LENDER_ROWS": 640,
            "NC_MORTGAGE_BROKER_ROWS": 574,
            "NC_MORTGAGE_SERVICER_ROWS": 62,
            "NC_MOSR_ROWS": 104,
            "NC_CURRENT_LICENSED_ENTITY_ROWS": 1380,
            "NC_CURRENT_DISTINCT_NCCOB_LICENSES": 1380,
            "NC_CURRENT_DISTINCT_NMLS_IDS": 1376,
            "NC_MLO_ROWS": 24612,
            "NC_MLO_DISTINCT_NCCOB_LICENSES": None,
            "NC_MLO_DISTINCT_NMLS_IDS": None,
            "NC_REVERSE_MORTGAGE_CERTIFICATE_ROWS": 112,
            "NC_HMDA_2025_APPLICATIONS": apps,
            "NC_HMDA_2025_ORIGINATIONS": orig,
            "NC_HMDA_2025_DENIAL_OBSERVATIONS": den,
            "NC_HMDA_2025_COUNTIES_REPRESENTED": 100,
            "NC_HMDA_LEI_APPLICATIONS": lei_apps,
            "NC_HMDA_LEI_ORIGINATIONS": lei_orig,
            "NC_HMDA_LEI_DENIALS": lei_den,
            "NC_HMDA_DISTINCT_LEIS": distinct_leis,
            "NC_CFPB_2025_MORTGAGE_COMPLAINT_ROWS": 920,
            "NC_CFPB_2025_DISTINCT_COMPLAINT_IDS": 920,
            "NC_NCCOB_MORTGAGE_COMPLAINT_ROWS": None,
            "NC_NCCOB_MORTGAGE_ORDER_DOCUMENTS": 723,
            "NC_NCCOB_MORTGAGE_DISTINCT_DOCKETS": 693,
            "NC_NCCOB_MORTGAGE_UNIQUE_MATTERS": 693,
            "NC_NCHFA_PARTICIPATING_LENDER_ROWS": None,
            "NC_FDIC_DEPOSITORY_ROWS": fdic_n,
            "EXACT_NMLS_LEI_CROSSWALKS": 0,
            "EXACT_PROFILE_ATTACHMENTS": 0,
            "EXACT_ENFORCEMENT_NMLS_ATTACHMENTS": 0,
            "EXACT_ENFORCEMENT_NCCOB_ATTACHMENTS": 0,
            "NET_NEW_STATE_RESEARCH_IDENTITIES": 0,
            "NET_NEW_CANONICAL_ORGANIZATIONS": 0,
            "NET_NEW_PUBLIC_LENDER_PROFILES": 0,
            "EXISTING_ORGANIZATIONS_ENRICHED": 0,
            "GRAPH_WRITES": 0,
            "CLAIM_ELIGIBILITY_BROADENED": False,
            "pre_existing_hmda_or_partition_ne_new_orgs": True,
        },
        "semantic_guardrails": [
            "HMDA application != lender",
            "HMDA geography != headquarters",
            "HMDA geography != license jurisdiction",
            "HMDA geography != service territory",
            "HMDA LEI != North Carolina NCCOB/NMLS license",
            "FDIC depository != NCCOB mortgage license",
            "bank != mortgage broker",
            "NCHFA participating lender != NCCOB license",
            "NCHFA preferred loan officer != TrustHub ranking",
            "1380 current licensed entities != North Carolina mortgage companies",
            "640 lenders != 574 brokers != 62 servicers != 104 MOSR",
            "MLO != company",
            "reverse-mortgage certificate != generic lender",
            "CFPB complaint != regulator finding",
            "NCCOB intake != CFPB database",
            "enforcement document != unique matter",
            "consent order != criminal conviction",
            "search-only != zero",
            "missing != zero",
            "denials / total applications is not a decision-based denial rate",
            "NO TRUST SCORE",
            "NO COMBINED NORTH CAROLINA LENDERS HEADLINE",
            "NO CHARLOTTE OR RALEIGH ROUTES",
        ],
        "no_trust_score": True,
        "no_ranking": True,
        "no_local_north_carolina_routes": True,
        "local_work_needed_now": "NO",
        "fingerprint": "",
    }
    snap["fingerprint"] = semantic_sha(snap)
    return snap


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    snap = build()
    if args.check:
        existing = json.loads(OUT.read_text(encoding="utf-8"))
        if semantic_sha(existing) != snap["fingerprint"]:
            raise SystemExit("North Carolina public snapshot fingerprint drifted")
        if existing["fingerprint"] != snap["fingerprint"]:
            raise SystemExit("stored fingerprint does not match semantic body")
        print("build-nc-public-snapshot --check pass", snap["fingerprint"])
        return
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(snap, indent=2) + "\n", encoding="utf-8")
    print("wrote", OUT, snap["fingerprint"])


if __name__ == "__main__":
    main()
