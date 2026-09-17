#!/usr/bin/env python3
"""Build lender-pa-state-intel-v1 from committed HMDA PA + FDIC + Open Data + CFPB + PHFA + DoBS catalog."""
from __future__ import annotations

import argparse
import copy
import csv
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
HMDA = ROOT / "data/hmda/by-state/PA/county_market_summary.csv"
LEI = ROOT / "data/hmda/by-state/PA/lender_activity_by_county.csv"
STATE_LEI = ROOT / "data/hmda/by-state/PA/lender_state_summary.csv"
FDIC = ROOT / "lib/fdic/data/pennsylvania.json"
OPEN = ROOT / "data/pennsylvania/pa-lend-001/open-data-type-counts.json"
CFPB = ROOT / "data/pennsylvania/pa-lend-001/cfpb-2025-pa-mortgage-ids.json"
PHFA = ROOT / "data/pennsylvania/pa-lend-001/phfa-participating-lenders.json"
ORDERS = ROOT / "data/pennsylvania/pa-lend-001/dobs-enforcement-catalog.json"
OUT = ROOT / "lib/pennsylvania-intelligence/accepted-snapshot.json"
GENERATION_KEYS = frozenset({"generated_at", "fingerprint"})

EXPECTED = {
    "applications": 444887,
    "originations": 271254,
    "denials": 80570,
    "counties": 67,
    "purchase": 168801,
    "refinance": 145934,
    "other": 130152,
    "conventional": 371433,
    "fha": 49856,
    "va": 21845,
    "usda": 1753,
    "fdic": 110,
    "lei_apps": 441180,
    "lei_orig": 271254,
    "lei_den": 79217,
    "distinct_leis": 994,
    "cfpb": 849,
    "open_lenders": 626,
    "open_brokers": 863,
    "open_servicers": 264,
    "open_mlos": 22286,
    "open_discount": 6,
    "phfa_rows": 106,
    "phfa_distinct": 102,
    "orders_catalog": 1525,
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
    open_data = json.loads(OPEN.read_text(encoding="utf-8"))
    cfpb = json.loads(CFPB.read_text(encoding="utf-8"))
    phfa = json.loads(PHFA.read_text(encoding="utf-8"))
    orders = json.loads(ORDERS.read_text(encoding="utf-8"))
    mort = open_data["mortgage_classes"]
    mlo_rows = mort["Mortgage Originator"]["rows"] + mort["Mortgage Originator Sole Proprietor"]["rows"]
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
        "open_lenders": mort["Mortgage Lender"]["rows"],
        "open_brokers": mort["Mortgage Broker"]["rows"],
        "open_servicers": mort["Mortgage Servicing"]["rows"],
        "open_mlos": mlo_rows,
        "open_discount": mort["Mortgage Discount Company"]["rows"],
        "phfa_rows": phfa["row_count"],
        "phfa_distinct": phfa["distinct_count"],
        "orders_catalog": orders["totalCount"],
    }.items():
        if value != EXPECTED[key]:
            raise SystemExit(f"{key} drifted: {value} != {EXPECTED[key]}")

    generated = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    snap: dict[str, Any] = {
        "contract_name": "lender-pa-state-intel-v1",
        "version": "1.0.0",
        "geography": "PA",
        "publication_status": "published",
        "path": "/pennsylvania",
        "generated_at": generated,
        "retrieved_at": "2026-09-17T16:45:12Z",
        "retrieved_at_precision": "datetime",
        "snapshot_as_of": "2026-09-17",
        "growth_classification": "INTELLIGENCE_GROWTH_HEAVY",
        "source_as_of": {
            "hmda": "HMDA 2025",
            "fdic": "2026-06-26",
            "cfpb": "2025-01-01/2025-12-31",
            "nmls_live_roster": "SOURCE_NOT_ACQUIRED",
            "pa_open_data": "2026-09-01T06:50:23Z",
            "dobs_orders": "2026-09-17T16:45:12Z",
            "phfa": "2026-09-17T11:55:08",
            "dobs_about_dated": "2025-06-30",
        },
        "hero": {
            "universe_label": "HMDA 2025 Pennsylvania applications",
            "universe_value": apps,
            "universe_hint": "Property-geography applications in Pennsylvania. Not lenders and not a current license census.",
            "current_label": "HMDA 2025 Pennsylvania originations",
            "current_value": orig,
            "observations_label": "CFPB 2025 Pennsylvania mortgage complaints",
            "observations_value": 849,
            "geography_label": "Pennsylvania counties in the committed HMDA slice",
            "geography_value": 67,
            "as_of_label": "HMDA vintage",
            "as_of_value": "2025",
        },
        "regulators": {
            "name": "Pennsylvania Department of Banking and Securities",
            "short": "DoBS",
            "unit": "Non-depository mortgage licensing",
            "url": "https://www.pa.gov/agencies/dobs/non-bank-licensees",
            "nmls": "https://www.nmlsconsumeraccess.org/",
            "open_data": "https://data.pa.gov/Licenses-and-Permits/Non-Depository-Licensee-Information-Current-Bankin/tyxc-jyug",
            "orders": "https://www.pa.gov/agencies/dobs/enforcement-orders",
            "complaints": "https://www.pa.gov/agencies/dobs/consumer-help-center",
            "phfa": "https://www.phfa.org/forms/participating_lenders/pl_fulllist.pdf",
            "nmls_is_not_pennsylvania_regulator": True,
        },
        "mixed_dobs_denominator": {
            "dobs_public_approx_nonbank": 28450,
            "open_data_total_rows": 32597,
            "is_not_mortgage_company_count": True,
            "is_not_mortgage_lender_count": True,
            "is_not_mlo_count": True,
        },
        "nmls": {
            "PA_MORTGAGE_LENDER_ROSTER_STATUS": "OPEN_SEARCH_ONLY",
            "PA_MORTGAGE_BROKER_ROSTER_STATUS": "OPEN_SEARCH_ONLY",
            "PA_MORTGAGE_SERVICER_ROSTER_STATUS": "OPEN_SEARCH_ONLY",
            "PA_MLO_ROSTER_STATUS": "OPEN_SEARCH_ONLY",
            "search_only_is_not_zero": True,
            "nmls_is_infrastructure_not_regulator": True,
        },
        "open_data": {
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "dataset_id": "tyxc-jyug",
            "source_as_of": "2026-09-01T06:50:23Z",
            "includes_mortgage_classes": True,
            "is_not_nmls_consumer_access_census": True,
            "principal_license_is_not_automatically_nmls": True,
            "PA_MORTGAGE_LENDER_ROWS": 626,
            "PA_MORTGAGE_LENDER_DISTINCT_NMLS_IDS": None,
            "PA_MORTGAGE_BROKER_ROWS": 863,
            "PA_MORTGAGE_SERVICER_ROWS": 264,
            "PA_MLO_ROWS": 22286,
            "PA_MLO_DISTINCT_NMLS_IDS": None,
            "PA_MORTGAGE_DISCOUNT_COMPANY_ROWS": 6,
            "lender_branch_rows": 2071,
            "broker_branch_rows": 158,
            "servicer_branch_rows": 114,
            "branch_is_not_company": True,
            "mlo_is_not_company": True,
            "discount_company_is_not_generic_lender": True,
            "do_not_add_classes": True,
        },
        "current_roster": {
            "coverage_state": "OPEN_SEARCH_ONLY",
            "PA_MORTGAGE_LENDER_ROSTER_STATUS": "OPEN_SEARCH_ONLY",
            "PA_MORTGAGE_LENDER_ROWS": None,
            "PA_MORTGAGE_LENDER_DISTINCT_NMLS_IDS": None,
            "count": None,
            "verification": ["NMLS Consumer Access", "DoBS Non-Bank Licensees"],
            "search_only_is_not_zero": True,
            "not_inferred_from_hmda": True,
            "not_inferred_from_fdic": True,
            "not_inferred_from_open_data_as_nmls_census": True,
            "not_inferred_from_phfa": True,
            "this_ticket_retrieved": False,
        },
        "broker": {
            "PA_MORTGAGE_BROKER_ROSTER_STATUS": "OPEN_SEARCH_ONLY",
            "PA_MORTGAGE_BROKER_ROWS": None,
            "broker_is_not_lender": True,
            "search_only_is_not_zero": True,
        },
        "mlo": {
            "PA_MLO_ROSTER_STATUS": "OPEN_SEARCH_ONLY",
            "PA_MLO_ROWS": None,
            "PA_MLO_DISTINCT_NMLS_IDS": None,
            "person_is_not_company": True,
            "search_only_is_not_zero": True,
        },
        "servicer": {
            "PA_MORTGAGE_SERVICER_ROSTER_STATUS": "OPEN_SEARCH_ONLY",
            "PA_MORTGAGE_SERVICER_ROWS": None,
            "servicer_is_not_lender": True,
            "search_only_is_not_zero": True,
        },
        "identity": {
            "preferred_company": "NMLS:{id} when source-native",
            "name_only": "UNSAFE",
            "name_plus_city": "REVIEW_REQUIRED",
            "company_is_not_branch": True,
            "company_is_not_mlo": True,
            "depository_is_not_mortgage_banker": True,
            "no_name_match_nmls": True,
            "nmls_is_not_regulator": True,
            "lei_is_not_nmls": True,
        },
        "hmda": {
            "year": 2025,
            "geo_grain": "state_and_county",
            "state_code": "PA",
            "source": "Committed HMDA Pennsylvania partition data/hmda/by-state/PA/county_market_summary.csv. Properties located in Pennsylvania. Not a second national download.",
            "source_as_of": "HMDA 2025",
            "retrieved_at": None,
            "retrieved_at_precision": "UNKNOWN",
            "reuse": "PRE_EXISTING_REUSED",
            "this_ticket_retrieved": False,
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_PUBLIC_METRIC",
            "county_count": 67,
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
            "lei_is_not_pennsylvania_license": True,
            "geography_is_not_headquarters": True,
            "geography_is_not_license_jurisdiction": True,
            "geography_is_not_service_territory": True,
            "no_county_pages": True,
            "no_philadelphia_pittsburgh_routes": True,
        },
        "cfpb": {
            "source": "CFPB Consumer Complaint Database",
            "source_url": "https://www.consumerfinance.gov/data-research/consumer-complaints/",
            "product": "Mortgage",
            "geography": "PA",
            "period": "2025-01-01/2025-12-31",
            "period_complete": True,
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "PA_CFPB_2025_MORTGAGE_COMPLAINT_ROWS": 849,
            "PA_CFPB_2025_DISTINCT_COMPLAINT_IDS": 849,
            "mortgage_complaint_rows": 849,
            "retrieved_at": "2026-09-17T16:45:12Z",
            "retrieved_at_precision": "datetime",
            "this_ticket_retrieved": True,
            "complaint_is_not_violation": True,
            "complaint_is_not_dobs_order": True,
            "company_name_is_not_nmls": True,
            "exact_cfpb_nmls_attachments": 0,
            "narratives_stored": 0,
        },
        "dobs_complaints": {
            "PA_DOBS_MORTGAGE_COMPLAINT_ROWS": None,
            "PA_DOBS_MORTGAGE_COMPLAINT_COVERAGE": "INTAKE_AVAILABLE / BULK_NOT_PUBLIC",
            "intake_url": "https://www.pa.gov/agencies/dobs/consumer-help-center",
            "dobs_intake_is_not_cfpb": True,
            "search_only_is_not_zero": True,
        },
        "dobs_orders": {
            "coverage_state": "ACQUIRED_MIXED_CATALOG",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "catalog_document_rows": 1525,
            "PA_DOBS_MORTGAGE_ENFORCEMENT_CENSUS": "NOT_ACQUIRED",
            "PA_DOBS_MORTGAGE_ORDER_DOCUMENTS": None,
            "PA_DOBS_MORTGAGE_UNIQUE_MATTERS": None,
            "program_area_source_native": False,
            "title_keyword_is_not_census": True,
            "title_contains_mortgage": 261,
            "document_is_not_matter": True,
            "order_to_show_cause_is_not_final_finding": True,
            "settlement_is_not_criminal_conviction": True,
            "name_only": "UNSAFE",
            "exact_enforcement_nmls_attachments": 0,
            "retrieved_at": "2026-09-17T16:45:12Z",
            "not_securities_only": True,
            "mixed_department_universe": True,
        },
        "phfa": {
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "PA_PHFA_PARTICIPATING_LENDER_ROWS": 106,
            "PA_PHFA_DISTINCT_LENDER_NAMES": 102,
            "sourceUpdatedAt": "2026-09-17T11:55:08",
            "phfa_is_not_dobs_license": True,
            "phfa_is_not_all_pa_mortgage_lenders": True,
            "county_physical_presence_ne_county_only_eligibility": True,
            "statewide_origination": True,
            "top_designation_year": "2025",
            "top_designation_is_not_trusthub_ranking": True,
            "name_only": True,
        },
        "fdic": {
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "source": "Existing LenderTrustHub FDIC Pennsylvania overlay",
            "source_as_of": "2026-06-26",
            "retrieved_at": None,
            "retrieved_at_precision": "UNKNOWN",
            "reuse": "PRE_EXISTING_REUSED",
            "this_ticket_retrieved": False,
            "institution_rows": 110,
            "PA_FDIC_DEPOSITORY_ROWS": 110,
            "depository_is_not_mortgage_banker": True,
            "fdic_is_not_dobs_mortgage_license": True,
        },
        "crosswalks": {
            "EXACT_NMLS_LEI_CROSSWALKS": 0,
            "EXACT_ENFORCEMENT_NMLS_ATTACHMENTS": 0,
            "EXACT_CFPB_NMLS_ATTACHMENTS": 0,
            "EXACT_PROFILE_ATTACHMENTS": 0,
        },
        "adverse": {
            "ADVERSE_SOURCES_FOUND": 3,
            "ADVERSE_SOURCES_ACQUIRED": 2,
            "ADVERSE_ROWS_ACQUIRED": None,
            "UNIQUE_REGULATORY_MATTERS": None,
            "do_not_add_cfpb_plus_dobs_orders": True,
        },
        "grain_classification": {
            "hmda_applications": "VISIBLE_PUBLIC_METRIC",
            "hmda_originations": "VISIBLE_PUBLIC_METRIC",
            "cfpb": "VISIBLE_SUPPORTING_CONTEXT",
            "open_data": "VISIBLE_SUPPORTING_CONTEXT",
            "fdic": "VISIBLE_SUPPORTING_CONTEXT",
            "nmls_roster": "VISIBLE_SUPPORTING_CONTEXT",
            "dobs_orders": "VISIBLE_SUPPORTING_CONTEXT",
            "phfa": "VISIBLE_SUPPORTING_CONTEXT",
        },
        "claim_eligibility": {"broadened": False},
        "expansion_ledger": {
            "PA_MORTGAGE_LENDER_ROSTER_STATUS": "OPEN_SEARCH_ONLY",
            "PA_MORTGAGE_LENDER_ROWS": None,
            "PA_MORTGAGE_LENDER_DISTINCT_NMLS_IDS": None,
            "PA_MORTGAGE_BROKER_ROSTER_STATUS": "OPEN_SEARCH_ONLY",
            "PA_MORTGAGE_BROKER_ROWS": None,
            "PA_MORTGAGE_SERVICER_ROSTER_STATUS": "OPEN_SEARCH_ONLY",
            "PA_MORTGAGE_SERVICER_ROWS": None,
            "PA_MLO_ROSTER_STATUS": "OPEN_SEARCH_ONLY",
            "PA_MLO_ROWS": None,
            "PA_MLO_DISTINCT_NMLS_IDS": None,
            "PA_HMDA_2025_APPLICATIONS": apps,
            "PA_HMDA_2025_ORIGINATIONS": orig,
            "PA_HMDA_2025_DENIAL_OBSERVATIONS": den,
            "PA_HMDA_2025_COUNTIES_REPRESENTED": 67,
            "PA_HMDA_LEI_APPLICATIONS": lei_apps,
            "PA_HMDA_LEI_ORIGINATIONS": lei_orig,
            "PA_HMDA_LEI_DENIALS": lei_den,
            "PA_HMDA_DISTINCT_LEIS": distinct_leis,
            "PA_CFPB_2025_MORTGAGE_COMPLAINT_ROWS": 849,
            "PA_CFPB_2025_DISTINCT_COMPLAINT_IDS": 849,
            "PA_DOBS_MORTGAGE_ORDER_DOCUMENTS": None,
            "PA_DOBS_MORTGAGE_UNIQUE_MATTERS": None,
            "PA_PHFA_PARTICIPATING_LENDER_ROWS": 106,
            "PA_PHFA_DISTINCT_LENDER_NAMES": 102,
            "PA_FDIC_DEPOSITORY_ROWS": 110,
            "EXACT_NMLS_LEI_CROSSWALKS": 0,
            "EXACT_PROFILE_ATTACHMENTS": 0,
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
            "HMDA LEI != Pennsylvania DoBS/NMLS license",
            "FDIC depository != DoBS mortgage lender",
            "PHFA participating lender != DoBS mortgage license",
            "Open Data mortgage lender row != NMLS Consumer Access census",
            "28,450 mixed non-bank licensees != Pennsylvania mortgage companies",
            "MLO != company",
            "broker != lender",
            "servicer != lender",
            "Mortgage Discount Company != generic mortgage lender",
            "CFPB complaint != regulator finding",
            "DoBS intake != CFPB database",
            "title-keyword mortgage != enforcement census",
            "search-only != zero",
            "missing != zero",
            "denials / total applications is not a decision-based denial rate",
            "NO TRUST SCORE",
            "NO COMBINED PENNSYLVANIA LENDERS HEADLINE",
            "NO PHILADELPHIA OR PITTSBURGH ROUTES",
        ],
        "no_trust_score": True,
        "no_ranking": True,
        "no_local_pennsylvania_routes": True,
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
        current = json.loads(OUT.read_text(encoding="utf-8"))
        expected = semantic_sha(snap)
        actual = semantic_sha(current)
        if expected != actual:
            raise SystemExit(f"PA snapshot fingerprint drifted: {actual} != {expected}")
        if current["fingerprint"] != actual:
            raise SystemExit("stored fingerprint mismatch")
        clock = copy.deepcopy(current)
        clock["generated_at"] = "2099-01-01T00:00:00Z"
        if semantic_sha(clock) != actual:
            raise SystemExit("generated_at must be excluded from fingerprint")
        print("build-pa-public-snapshot --check pass", actual)
        return
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(snap, indent=2) + "\n", encoding="utf-8")
    print("wrote", OUT, snap["fingerprint"])


if __name__ == "__main__":
    main()
