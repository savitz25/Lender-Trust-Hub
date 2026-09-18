#!/usr/bin/env python3
"""Build lender-oh-state-intel-v1 from HMDA OH + FDIC + CFPB + OHFA county pages."""
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
HMDA = ROOT / "data/hmda/by-state/OH/county_market_summary.csv"
LEI = ROOT / "data/hmda/by-state/OH/lender_activity_by_county.csv"
FDIC = ROOT / "lib/fdic/data/ohio.json"
CFPB = ROOT / "data/ohio/oh-lend-001/cfpb-2025-oh-mortgage-ids.json"
OHFA = ROOT / "data/ohio/oh-lend-001/ohfa-county-lenders.json"
OUT = ROOT / "lib/ohio-intelligence/accepted-snapshot.json"
GENERATION_KEYS = frozenset({"generated_at", "fingerprint"})

EXPECTED = {
    "applications": 460825,
    "originations": 276279,
    "denials": 80708,
    "counties": 88,
    "purchase": 189505,
    "refinance": 152236,
    "other": 119084,
    "conventional": 364628,
    "fha": 63151,
    "va": 31019,
    "usda": 2027,
    "fdic": 157,
    "lei_apps": 456221,
    "lei_orig": 276279,
    "lei_den": 79024,
    "distinct_leis": 981,
    "cfpb": 610,
    "ohfa_obs": 2095,
    "ohfa_names": 85,
    "ohfa_counties": 88,
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


def sum_csv(path: Path, *keys: str) -> int:
    total = 0
    with path.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            total += n(row, *keys)
    return total


def build() -> dict[str, Any]:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    counties = list(csv.DictReader(HMDA.open(encoding="utf-8")))
    lei_rows = list(csv.DictReader(LEI.open(encoding="utf-8")))
    fdic = json.loads(FDIC.read_text(encoding="utf-8"))
    cfpb = json.loads(CFPB.read_text(encoding="utf-8"))
    ohfa = json.loads(OHFA.read_text(encoding="utf-8"))
    apps = sum(n(r, "total_applications") for r in counties)
    orig = sum(n(r, "total_originations") for r in counties)
    den = sum(n(r, "denial_count") for r in counties)
    purch = sum(n(r, "purchase_count") for r in counties)
    refi = sum(n(r, "refinance_count") for r in counties)
    other = sum(n(r, "purpose_other_count") for r in counties)
    conv = sum(n(r, "apps_conventional") for r in counties)
    fha = sum(n(r, "apps_fha") for r in counties)
    va = sum(n(r, "apps_va") for r in counties)
    usda = sum(n(r, "apps_usda_other") for r in counties) + sum(n(r, "apps_other_loan_type") for r in counties)
    lei_apps = sum(n(r, "applications") for r in lei_rows)
    lei_orig = sum(n(r, "originations") for r in lei_rows)
    lei_den = sum(n(r, "denials") for r in lei_rows)
    leis = {r["lei"] for r in lei_rows if r.get("lei")}
    got = {
        "applications": apps,
        "originations": orig,
        "denials": den,
        "counties": len(counties),
        "purchase": purch,
        "refinance": refi,
        "other": other,
        "conventional": conv,
        "fha": fha,
        "va": va,
        "usda": usda,
        "fdic": len(fdic["banks"]),
        "lei_apps": lei_apps,
        "lei_orig": lei_orig,
        "lei_den": lei_den,
        "distinct_leis": len(leis),
        "cfpb": cfpb["meta"]["distinct_ids"],
        "ohfa_obs": ohfa["meta"]["OH_OHFA_LENDER_OBSERVATION_ROWS"],
        "ohfa_names": ohfa["meta"]["OH_OHFA_DISTINCT_LENDER_NAMES"],
        "ohfa_counties": ohfa["meta"]["counties_with_rows"],
    }
    if got != EXPECTED:
        raise SystemExit(f"Ohio freeze drifted: {got} vs {EXPECTED}")

    body: dict[str, Any] = {
        "contract_name": "lender-oh-state-intel-v1",
        "version": "1.0.0",
        "geography": "OH",
        "publication_status": "published",
        "path": "/ohio",
        "retrieved_at": cfpb["meta"]["retrievedAt"],
        "retrieved_at_precision": "datetime",
        "snapshot_as_of": "2026-09-18",
        "growth_classification": "INTELLIGENCE_GROWTH_HEAVY",
        "source_as_of": {
            "hmda": "HMDA 2025",
            "fdic": fdic["updated"],
            "cfpb": "2025-01-01/2025-12-31",
            "nmls_live_roster": "SOURCE_NOT_ACQUIRED",
            "dfi_enforcement": "OPEN_SEARCH_ONLY",
            "ohfa": ohfa["meta"]["observation_period_label"],
            "dfi_complaints": "INTAKE_AVAILABLE / BULK_NOT_PUBLIC",
        },
        "hero": {
            "universe_label": "HMDA 2025 Ohio applications",
            "universe_value": apps,
            "universe_hint": "Property-geography applications in Ohio. Not lenders and not a current RMLA registration census.",
            "current_label": "HMDA 2025 Ohio originations",
            "current_value": orig,
            "observations_label": "CFPB 2025 Ohio mortgage complaints",
            "observations_value": cfpb["meta"]["distinct_ids"],
            "geography_label": "Ohio counties in the committed HMDA slice",
            "geography_value": 88,
            "as_of_label": "HMDA vintage",
            "as_of_value": "2025",
        },
        "regulators": {
            "name": "Ohio Department of Commerce, Division of Financial Institutions",
            "short": "DFI",
            "unit": "Residential Mortgage Lending Act (ORC Chapter 1322)",
            "url": "https://com.ohio.gov/divisions-and-programs/financial-institutions/consumer-finance",
            "nmls": "https://www.nmlsconsumeraccess.org/",
            "elicense": "https://elicense2-secure.com.ohio.gov/Lookup/LicenseLookup.aspx",
            "elicense_roster": "https://elicense2-secure.com.ohio.gov/Lookup/GenerateRoster.aspx",
            "complaints": "https://com.ohio.gov/divisions-and-programs/financial-institutions/file-a-complaint-fi",
            "ohfa": "https://ohiohome.org/lenders/default.aspx",
            "nmls_is_not_ohio_regulator": True,
        },
        "nmls": {
            "OH_RMLA_COMPANY_ROSTER_STATUS": "OPEN_SEARCH_ONLY",
            "OH_MLO_ROSTER_STATUS": "OPEN_SEARCH_ONLY",
            "search_only_is_not_zero": True,
            "nmls_is_infrastructure_not_regulator": True,
            "ohio_license_is_not_nmls": True,
            "no_name_derived_crosswalk": True,
            "elicense_directs_current_rmla_and_mlo_to_nmls": True,
        },
        "current_roster": {
            "coverage_state": "OPEN_SEARCH_ONLY",
            "OH_RMLA_COMPANY_ROSTER_STATUS": "OPEN_SEARCH_ONLY",
            "OH_RMLA_COMPANY_ROWS": None,
            "OH_RMLA_DISTINCT_COMPANY_NMLS_IDS": None,
            "OH_RMLA_DISTINCT_OH_LICENSE_IDS": None,
            "count": None,
            "live_licensed_company_universe": None,
            "verification": ["NMLS Consumer Access", "Ohio DFI eLicense"],
            "search_only_is_not_zero": True,
            "not_inferred_from_hmda": True,
            "not_inferred_from_fdic": True,
            "not_inferred_from_ohfa": True,
            "not_inferred_from_cfpb": True,
            "this_ticket_retrieved": False,
            "rmla_registration_can_cover_lending_brokering_servicing": True,
            "do_not_split_company_counts_by_activity": True,
        },
        "broker": {
            "OH_MORTGAGE_BROKER_ROWS": None,
            "broker_is_not_a_separate_rmla_company_count": True,
            "activity_is_not_entity": True,
            "search_only_is_not_zero": True,
        },
        "servicer": {
            "OH_MORTGAGE_SERVICER_ROWS": None,
            "servicer_is_not_a_separate_rmla_company_count": True,
            "activity_is_not_entity": True,
            "search_only_is_not_zero": True,
        },
        "mlo": {
            "OH_MLO_ROSTER_STATUS": "OPEN_SEARCH_ONLY",
            "OH_MLO_ROWS": None,
            "OH_MLO_DISTINCT_NMLS_IDS": None,
            "OH_MLO_DISTINCT_OH_LICENSE_IDS": None,
            "person_is_not_company": True,
            "do_not_add_to_companies": True,
            "search_only_is_not_zero": True,
        },
        "branches": {
            "OH_RMLA_BRANCH_ROWS": None,
            "branch_is_not_company": True,
            "search_only_is_not_zero": True,
        },
        "dba": {
            "OH_RMLA_DBA_ROWS": None,
            "dba_is_not_company_count": True,
        },
        "identity": {
            "preferred_company": "Ohio DFI RMLA registration / license ID when source-native, else NMLS:{id}",
            "nmls": "NMLS:{id} when source-native",
            "name_only": "UNSAFE",
            "name_plus_city": "REVIEW_REQUIRED",
            "company_is_not_branch": True,
            "company_is_not_mlo": True,
            "company_is_not_dba": True,
            "depository_is_not_rmla_company": True,
            "no_name_match_nmls": True,
            "nmls_is_not_regulator": True,
            "lei_is_not_nmls": True,
            "ohio_license_is_not_nmls": True,
        },
        "depository_exemption": {
            "rmla_is_not_all_ohio_mortgage_lenders": True,
            "banks_savings_credit_unions_may_originate_without_rmla_registration": True,
            "fdic_is_not_rmla": True,
        },
        "non_mortgage_consumer_finance": {
            "general_loan_law_is_not_rmla": True,
            "cila_is_not_rmla": True,
            "small_loan_is_not_rmla": True,
            "short_term_loan_is_not_rmla": True,
            "do_not_answer_mortgage_lenders_ohio_with_those_rows": True,
        },
        "hmda": {
            "year": 2025,
            "geo_grain": "state_and_county",
            "state_code": "OH",
            "source": "Committed HMDA Ohio partition data/hmda/by-state/OH/county_market_summary.csv. Properties located in Ohio. Not a second national download.",
            "source_as_of": "HMDA 2025",
            "retrieved_at": None,
            "retrieved_at_precision": "UNKNOWN",
            "reuse": "PRE_EXISTING_REUSED",
            "this_ticket_retrieved": False,
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_PUBLIC_METRIC",
            "county_count": 88,
            "applications": apps,
            "originations": orig,
            "denials": den,
            "denials_as_pct_of_total_applications": pct(den, apps),
            "denial_pct_numerator_denial_observations": den,
            "denial_pct_denominator_total_applications": apps,
            "denial_pct_is_not_decision_based_rate": True,
            "denial_is_not_lender_quality": True,
            "purchase_applications": purch,
            "refinance_applications": refi,
            "purpose_other_applications": other,
            "purchase_pct_of_apps": pct(purch, apps),
            "refinance_pct_of_apps": pct(refi, apps),
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
            "distinct_leis": len(leis),
            "county_minus_lei_apps": apps - lei_apps,
            "county_minus_lei_orig": orig - lei_orig,
            "county_minus_lei_den": den - lei_den,
            "application_is_not_lender": True,
            "lei_is_not_ohio_license": True,
            "lei_is_not_nmls": True,
            "geography_is_not_headquarters": True,
            "geography_is_not_license_jurisdiction": True,
            "geography_is_not_service_territory": True,
            "no_county_pages": True,
            "no_columbus_cleveland_routes": True,
        },
        "cfpb": {
            "source": "CFPB Consumer Complaint Database",
            "source_url": "https://www.consumerfinance.gov/data-research/consumer-complaints/",
            "product": "Mortgage",
            "geography": "OH",
            "period": "2025-01-01/2025-12-31",
            "period_complete": True,
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "OH_CFPB_2025_MORTGAGE_COMPLAINT_ROWS": cfpb["meta"]["distinct_ids"],
            "OH_CFPB_2025_DISTINCT_COMPLAINT_IDS": cfpb["meta"]["distinct_ids"],
            "mortgage_complaint_rows": cfpb["meta"]["distinct_ids"],
            "retrieved_at": cfpb["meta"]["retrievedAt"],
            "retrieved_at_precision": "datetime",
            "this_ticket_retrieved": True,
            "complaint_is_not_violation": True,
            "complaint_is_not_dfi_enforcement": True,
            "company_name_is_not_nmls": True,
            "exact_cfpb_nmls_attachments": 0,
            "narratives_stored": 0,
        },
        "dfi_complaints": {
            "OH_DFI_MORTGAGE_COMPLAINT_ROWS": None,
            "OH_DFI_MORTGAGE_COMPLAINT_COVERAGE": "INTAKE_AVAILABLE / BULK_NOT_PUBLIC",
            "intake_url": "https://com.ohio.gov/divisions-and-programs/financial-institutions/file-a-complaint-fi",
            "dfi_intake_is_not_cfpb": True,
            "search_only_is_not_zero": True,
        },
        "dfi_enforcement": {
            "coverage_state": "OPEN_SEARCH_ONLY",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "OH_DFI_ENFORCEMENT_ROWS": None,
            "OH_DFI_DISTINCT_MATTERS": None,
            "OH_DFI_COMPANY_ACTION_ROWS": None,
            "OH_DFI_INDIVIDUAL_ACTION_ROWS": None,
            "OH_AG_MORTGAGE_ACTION_ROWS": None,
            "OH_CIVIL_JUDGMENT_ROWS": None,
            "OH_ENFORCEMENT_EXACT_NMLS_ATTACHMENTS": 0,
            "OH_ENFORCEMENT_EXACT_OH_LICENSE_ATTACHMENTS": 0,
            "statute": "ORC 1349.43",
            "database_is_not_real_time_perfect": True,
            "absence_is_not_clean_history": True,
            "dfi_action_is_not_ag_action": True,
            "ag_action_is_not_civil_judgment": True,
            "person_action_is_not_company_action": True,
            "order_is_not_automatically_violation": True,
            "consent_order_is_not_criminal_conviction": True,
            "name_only": "UNSAFE",
            "individual_pdfs_are_not_a_census": True,
            "search_only_is_not_zero": True,
        },
        "ohfa": {
            "coverage_state": "ACQUIRED_COUNTY_ENUMERATION",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "OH_OHFA_LENDER_OBSERVATION_ROWS": ohfa["meta"]["OH_OHFA_LENDER_OBSERVATION_ROWS"],
            "OH_OHFA_DISTINCT_LENDER_NAMES": ohfa["meta"]["OH_OHFA_DISTINCT_LENDER_NAMES"],
            "OH_OHFA_COUNTY_LENDER_RELATIONSHIPS": ohfa["meta"]["OH_OHFA_COUNTY_LENDER_RELATIONSHIPS"],
            "OH_OHFA_PROGRAM_RELATIONSHIPS": None,
            "counties_with_rows": 88,
            "observation_period_label": ohfa["meta"]["observation_period_label"],
            "source_url": ohfa["meta"]["source_url"],
            "retrieved_at": ohfa["meta"]["retrievedAt"],
            "ohfa_is_not_dfi_license": True,
            "ohfa_is_not_all_ohio_mortgage_lenders": True,
            "ohfa_loan_officer_is_not_mlo_census": True,
            "ohfa_is_not_endorsement": True,
            "county_appearance_is_not_headquarters": True,
            "names_are_not_exact_companies": True,
            "no_nmls_bridge": True,
            "program_volume_is_not_best_lender": True,
        },
        "fdic": {
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "source": "Existing LenderTrustHub FDIC Ohio overlay",
            "source_as_of": fdic["updated"],
            "retrieved_at": None,
            "retrieved_at_precision": "UNKNOWN",
            "reuse": "PRE_EXISTING_REUSED",
            "this_ticket_retrieved": False,
            "institution_rows": len(fdic["banks"]),
            "OH_FDIC_DEPOSITORY_ROWS": len(fdic["banks"]),
            "depository_is_not_rmla_company": True,
            "fdic_is_not_rmla_registration": True,
            "bank_is_not_mortgage_broker": True,
            "headquarters_is_not_hmda_ohio_activity": True,
        },
        "crosswalks": {
            "EXACT_OH_DFI_TO_NMLS_CROSSWALKS": 0,
            "EXACT_NMLS_TO_LEI_CROSSWALKS": 0,
            "EXACT_DFI_ENFORCEMENT_NMLS_ATTACHMENTS": 0,
            "EXACT_DFI_ENFORCEMENT_OH_LICENSE_ATTACHMENTS": 0,
            "EXACT_CFPB_NMLS_ATTACHMENTS": 0,
            "EXACT_OHFA_NMLS_ATTACHMENTS": 0,
            "EXACT_PROFILE_ATTACHMENTS": 0,
        },
        "adverse": {
            "ADVERSE_SOURCES_FOUND": 3,
            "ADVERSE_SOURCES_ACQUIRED": 1,
            "ADVERSE_ROWS_ACQUIRED": None,
            "UNIQUE_REGULATORY_MATTERS": None,
            "EXACT_PROFILE_ATTACHMENTS": 0,
            "REVIEW_REQUIRED": 0,
            "UNRESOLVED": 0,
            "INTERNAL_ONLY": 0,
            "PUBLICATION_PENDING": 0,
            "PUBLIC_READY_PROFILES": 0,
            "PUBLICLY_RENDERED_PROFILES": 0,
            "BUSINESS_RESPONSE_READY": 0,
            "SEARCH_SUPPORTED": True,
            "REMAINING_ADVERSE_GAPS": [
                "No bounded DFI/AG/civil-judgment mortgage enforcement census",
                "No DFI bulk mortgage complaint census",
                "No exact CFPB or OHFA NMLS attachments",
            ],
            "WITHHELD_REASON_COUNTS": {"name_only": "UNSAFE"},
            "do_not_add_cfpb_plus_dfi_enforcement": True,
        },
        "grain_classification": {
            "hmda_applications": "VISIBLE_PUBLIC_METRIC",
            "hmda_originations": "VISIBLE_PUBLIC_METRIC",
            "cfpb": "VISIBLE_SUPPORTING_CONTEXT",
            "rmla_current_roster": "VISIBLE_SUPPORTING_CONTEXT",
            "fdic": "VISIBLE_SUPPORTING_CONTEXT",
            "dfi_enforcement": "VISIBLE_SUPPORTING_CONTEXT",
            "ohfa": "VISIBLE_SUPPORTING_CONTEXT",
        },
        "claim_eligibility": {"broadened": False},
        "expansion_ledger": {
            "OH_RMLA_COMPANY_ROWS": None,
            "OH_RMLA_DISTINCT_COMPANY_NMLS_IDS": None,
            "OH_RMLA_DISTINCT_OH_LICENSE_IDS": None,
            "OH_RMLA_BRANCH_ROWS": None,
            "OH_RMLA_DBA_ROWS": None,
            "OH_MLO_ROWS": None,
            "OH_HMDA_2025_APPLICATIONS": apps,
            "OH_HMDA_2025_ORIGINATIONS": orig,
            "OH_HMDA_2025_DENIAL_OBSERVATIONS": den,
            "OH_HMDA_2025_COUNTIES_REPRESENTED": 88,
            "OH_HMDA_LEI_APPLICATIONS": lei_apps,
            "OH_HMDA_LEI_ORIGINATIONS": lei_orig,
            "OH_HMDA_LEI_DENIALS": lei_den,
            "OH_HMDA_DISTINCT_LEIS": len(leis),
            "OH_CFPB_2025_MORTGAGE_COMPLAINT_ROWS": cfpb["meta"]["distinct_ids"],
            "OH_CFPB_2025_DISTINCT_COMPLAINT_IDS": cfpb["meta"]["distinct_ids"],
            "OH_DFI_MORTGAGE_COMPLAINT_ROWS": None,
            "OH_DFI_ENFORCEMENT_ROWS": None,
            "OH_OHFA_LENDER_OBSERVATION_ROWS": ohfa["meta"]["OH_OHFA_LENDER_OBSERVATION_ROWS"],
            "OH_OHFA_DISTINCT_LENDER_NAMES": ohfa["meta"]["OH_OHFA_DISTINCT_LENDER_NAMES"],
            "OH_FDIC_DEPOSITORY_ROWS": len(fdic["banks"]),
            "EXACT_OH_DFI_TO_NMLS_CROSSWALKS": 0,
            "EXACT_NMLS_TO_LEI_CROSSWALKS": 0,
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
            "HMDA LEI != Ohio DFI/NMLS license",
            "FDIC depository != RMLA company",
            "bank != mortgage broker",
            "OHFA participating lender != DFI license",
            "OHFA loan officer != MLO census",
            "RMLA company != MLO person",
            "Ohio license != NMLS Unique ID",
            "lending/brokering/servicing activities != separate company counts",
            "RMLA population != all Ohio mortgage lenders",
            "CFPB complaint != regulator finding",
            "DFI intake != CFPB database",
            "DFI action != AG action != civil judgment",
            "search-only != zero",
            "missing != zero",
            "denials / total applications is not a decision-based denial rate",
            "NO TRUST SCORE",
            "NO RANKING",
        ],
        "no_local_ohio_routes": True,
        "no_columbus_cleveland_cincinnati_toledo_dayton_akron_pages": True,
        "no_ranking": True,
        "no_trust_score": True,
        "local_work_needed_now": "NO",
    }
    body["generated_at"] = now
    body["fingerprint"] = semantic_sha(body)
    return body


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    snapshot = build()
    if args.check:
        existing = json.loads(OUT.read_text(encoding="utf-8"))
        if semantic_sha(existing) != snapshot["fingerprint"] and semantic_sha(existing) != existing.get("fingerprint"):
            raise SystemExit("Ohio snapshot semantic fingerprint drifted")
        if existing["fingerprint"] != snapshot["fingerprint"] and semantic_body(existing) != semantic_body(snapshot):
            # allow generated_at to differ only if fingerprint of existing body matches stored fingerprint
            left = copy.deepcopy(existing)
            right = copy.deepcopy(snapshot)
            left.pop("generated_at", None)
            right.pop("generated_at", None)
            left.pop("fingerprint", None)
            right.pop("fingerprint", None)
            if left != right:
                raise SystemExit("Ohio snapshot body drifted")
        print("oh-lend-001 snapshot check OK", existing["fingerprint"])
        return
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    print("wrote", OUT, snapshot["fingerprint"])


if __name__ == "__main__":
    main()
