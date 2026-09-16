#!/usr/bin/env python3
"""Build lender-or-state-intel-v1 from committed HMDA OR + FDIC overlay + DFR/OHCS freezes."""
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
HMDA = ROOT / "data/hmda/by-state/OR/county_market_summary.csv"
LEI = ROOT / "data/hmda/by-state/OR/lender_activity_by_county.csv"
STATE_LEI = ROOT / "data/hmda/by-state/OR/lender_state_summary.csv"
FDIC = ROOT / "lib/fdic/data/oregon.json"
DFR = ROOT / "data/oregon/or-lend-001/dfr-mortgage-orders.json"
OHCS = ROOT / "data/oregon/or-lend-001/ohcs-flex-lenders.json"
OUT = ROOT / "lib/oregon-intelligence/accepted-snapshot.json"
GENERATION_KEYS = frozenset({"generated_at", "fingerprint"})

EXPECTED = {
    "applications": 146902,
    "originations": 89073,
    "denials": 22290,
    "counties": 36,
    "purchase": 62284,
    "refinance": 46456,
    "other": 38162,
    "conventional": 117653,
    "fha": 17334,
    "va": 11502,
    "usda": 413,
    "fdic": 14,
    "lei_apps": 145271,
    "lei_orig": 89073,
    "lei_den": 21731,
    "distinct_leis": 629,
    "dfr_docs": 10,
    "dfr_matters": 10,
    "ohcs": 23,
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
    dfr = json.loads(DFR.read_text(encoding="utf-8"))
    ohcs = json.loads(OHCS.read_text(encoding="utf-8"))
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
        "dfr_docs": dfr["documentRows"],
        "dfr_matters": dfr["distinctCases"],
        "ohcs": len(ohcs["rows"]),
    }.items():
        if value != EXPECTED[key]:
            raise SystemExit(f"{key} drifted: {value} != {EXPECTED[key]}")

    generated = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    snap: dict[str, Any] = {
        "contract_name": "lender-or-state-intel-v1",
        "version": "1.0.0",
        "geography": "OR",
        "publication_status": "published",
        "path": "/oregon",
        "generated_at": generated,
        "retrieved_at": None,
        "retrieved_at_precision": "UNKNOWN",
        "snapshot_as_of": None,
        "growth_classification": "INTELLIGENCE_GROWTH_HEAVY",
        "source_as_of": {
            "hmda": "HMDA 2025",
            "fdic": "2026-06-26",
            "cfpb": None,
            "live_roster": "SOURCE_NOT_ACQUIRED",
            "dfr_orders": dfr.get("dateMax"),
            "ohcs": ohcs.get("sourceModifiedAt"),
        },
        "hero": {
            "universe_label": "HMDA 2025 Oregon applications",
            "universe_value": apps,
            "universe_hint": "Property-geography applications in Oregon. Not lenders and not a current license census.",
            "current_label": "HMDA 2025 Oregon originations",
            "current_value": orig,
            "observations_label": "FDIC Oregon depository institutions",
            "observations_value": fdic_n,
            "geography_label": "Oregon counties in the committed HMDA slice",
            "geography_value": len(rows),
            "as_of_label": "HMDA vintage",
            "as_of_value": "2025",
        },
        "regulators": {
            "name": "Oregon Division of Financial Regulation",
            "short": "DFR",
            "unit": "Department of Consumer and Business Services — mortgage licensing",
            "url": "https://dfr.oregon.gov/business/licensing/financial/mortgage/pages/mortgage-lender-licensing.aspx",
            "nmls": "https://www.nmlsconsumeraccess.org/",
            "lookup": "https://dfr.oregon.gov/help/complaints-licenses/Pages/check-license.aspx",
            "servicer": "https://dfr.oregon.gov/business/licensing/financial/mortgage/pages/mortgage-servicer-licensing.aspx",
            "orders": "https://dfr.oregon.gov/laws-rules/Pages/notices-orders.aspx",
            "ohcs": "https://www.oregon.gov/ohcs/homeownership/homebuyers/pages/flex-lending.aspx",
        },
        "current_roster": {
            "coverage_state": "OPEN_SEARCH_ONLY",
            "OR_MORTGAGE_COMPANY_ROSTER": "OPEN_SEARCH_ONLY",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "OR_MORTGAGE_COMPANY_ROWS": None,
            "OR_MORTGAGE_COMPANY_DISTINCT_NMLS": None,
            "OR_MORTGAGE_COMPANY_CURRENT_DISTINCT_NMLS": None,
            "OR_MORTGAGE_BRANCH_ROWS": None,
            "count": None,
            "verification": ["NMLS Consumer Access", "Oregon DFR Check a license"],
            "search_only_is_not_zero": True,
            "not_inferred_from_hmda": True,
            "not_inferred_from_fdic": True,
            "not_inferred_from_ohcs": True,
            "this_ticket_retrieved": False,
        },
        "mlo": {
            "OR_MLO_ROSTER": "OPEN_SEARCH_ONLY",
            "OR_MLO_ROWS": None,
            "OR_MLO_DISTINCT_NMLS": None,
            "person_is_not_company": True,
            "search_only_is_not_zero": True,
        },
        "servicer": {
            "OR_MORTGAGE_SERVICER_ROSTER": "OPEN_SEARCH_ONLY",
            "OR_MORTGAGE_SERVICER_ROWS": None,
            "OR_MORTGAGE_SERVICER_DISTINCT_NMLS": None,
            "servicer_is_not_origination_license": True,
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
        },
        "hmda": {
            "year": 2025,
            "geo_grain": "state_and_county",
            "state_code": "OR",
            "source": "Committed HMDA Oregon partition data/hmda/by-state/OR/county_market_summary.csv. Properties located in Oregon. Not a second national download.",
            "source_as_of": "HMDA 2025",
            "retrieved_at": None,
            "retrieved_at_precision": "UNKNOWN",
            "reuse": "PRE_EXISTING_REUSED",
            "this_ticket_retrieved": False,
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_PUBLIC_METRIC",
            "county_count": len(rows),
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
            "application_is_not_lender": True,
            "lei_is_not_oregon_license": True,
            "geography_is_not_headquarters": True,
            "geography_is_not_license_jurisdiction": True,
            "geography_is_not_service_territory": True,
            "no_county_pages": True,
            "no_portland_multnomah_routes": True,
        },
        "cfpb": {
            "source": "CFPB Consumer Complaint Database",
            "source_url": "https://www.consumerfinance.gov/data-research/consumer-complaints/",
            "product": "Mortgage",
            "geography": "OR",
            "coverage_state": "OPEN_SEARCH_ONLY",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "result": "SOURCE_NOT_ACQUIRED",
            "OR_MORTGAGE_COMPLAINT_OBSERVATIONS": None,
            "mortgage_complaint_rows": None,
            "retrieved_at": None,
            "retrieved_at_precision": "UNKNOWN",
            "this_ticket_retrieved": False,
            "complaint_is_not_violation": True,
            "search_only_is_not_zero": True,
            "caveat": "Oregon DFR/NMLS mortgage complaints remain an official search path. Missing is not zero. CFPB complaints are a separate federal overlay and were not acquired as an Oregon bulk slice in this ticket.",
        },
        "fdic": {
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "source": "Existing LenderTrustHub FDIC Oregon overlay",
            "source_as_of": "2026-06-26",
            "retrieved_at": None,
            "retrieved_at_precision": "UNKNOWN",
            "reuse": "PRE_EXISTING_REUSED",
            "this_ticket_retrieved": False,
            "institution_rows": fdic_n,
            "depository_is_not_mortgage_banker": True,
            "fdic_is_not_dfr_mortgage_license": True,
        },
        "dfr_orders": {
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "filter": "AdminOrders FSObjType=0 and DFRAction eq Mortgage (source-native business classification; not a case-number prefix guess)",
            "OR_DFR_MORTGAGE_ORDER_ROWS": dfr["documentRows"],
            "OR_DFR_MORTGAGE_UNIQUE_MATTERS": dfr["distinctCases"],
            "document_is_not_matter": True,
            "name_only": "UNSAFE",
            "exact_nmls_attachments": 0,
            "sourceModifiedAt": "2026-09-15T21:18:58Z",
            "dateMin": dfr.get("dateMin"),
            "dateMax": dfr.get("dateMax"),
            "pdfs_downloaded": 0,
            "not_ia_disciplinary_census": True,
            "not_insurance_or_securities": True,
        },
        "ohcs": {
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "OR_OHCS_APPROVED_LENDER_ROWS": len(ohcs["rows"]),
            "OR_OHCS_DISTINCT_LENDER_IDENTITIES": len({r["title"] for r in ohcs["rows"]}),
            "name_only": True,
            "ohcs_is_not_dfr_license": True,
            "featured_is_not_ranking": True,
            "sourceModifiedAt": ohcs.get("sourceModifiedAt"),
            "pageUrl": ohcs.get("pageUrl"),
        },
        "grain_classification": {
            "hmda_applications": "VISIBLE_PUBLIC_METRIC",
            "hmda_originations": "VISIBLE_PUBLIC_METRIC",
            "fdic": "VISIBLE_SUPPORTING_CONTEXT",
            "current_roster": "VISIBLE_SUPPORTING_CONTEXT",
            "cfpb": "VISIBLE_SUPPORTING_CONTEXT",
            "dfr_orders": "VISIBLE_SUPPORTING_CONTEXT",
            "ohcs": "VISIBLE_SUPPORTING_CONTEXT",
        },
        "claim_eligibility": {"broadened": False},
        "expansion_ledger": {
            "OR_MORTGAGE_COMPANY_ROSTER": "OPEN_SEARCH_ONLY",
            "OR_MORTGAGE_COMPANY_ROWS": None,
            "OR_MORTGAGE_COMPANY_DISTINCT_NMLS": None,
            "OR_MORTGAGE_COMPANY_CURRENT_DISTINCT_NMLS": None,
            "OR_MORTGAGE_BRANCH_ROWS": None,
            "OR_MLO_ROSTER": "OPEN_SEARCH_ONLY",
            "OR_MLO_ROWS": None,
            "OR_MLO_DISTINCT_NMLS": None,
            "OR_MORTGAGE_SERVICER_ROSTER": "OPEN_SEARCH_ONLY",
            "OR_MORTGAGE_SERVICER_ROWS": None,
            "OR_MORTGAGE_SERVICER_DISTINCT_NMLS": None,
            "OR_HMDA_APPLICATIONS_2025": apps,
            "OR_HMDA_ORIGINATIONS_2025": orig,
            "OR_HMDA_DENIAL_OBSERVATIONS_2025": den,
            "OR_HMDA_DISTINCT_LEIS_2025": distinct_leis,
            "OR_HMDA_COUNTIES_REPRESENTED": len(rows),
            "OR_DFR_MORTGAGE_ORDER_ROWS": dfr["documentRows"],
            "OR_DFR_MORTGAGE_UNIQUE_MATTERS": dfr["distinctCases"],
            "OR_MORTGAGE_COMPLAINT_OBSERVATIONS": None,
            "OR_OHCS_APPROVED_LENDER_ROWS": len(ohcs["rows"]),
            "OR_OHCS_DISTINCT_LENDER_IDENTITIES": len({r["title"] for r in ohcs["rows"]}),
            "OR_FDIC_OVERLAY_COUNT": fdic_n,
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
            "HMDA LEI != Oregon DFR/NMLS license",
            "FDIC depository != DFR mortgage banker",
            "OHCS approved lender != Oregon mortgage license",
            "MLO != company",
            "servicer license != origination license",
            "search-only != zero",
            "missing != zero",
            "denials / total applications is not a decision-based denial rate",
            "NO TRUST SCORE",
            "NO COMBINED OREGON LENDERS HEADLINE",
            "NO PORTLAND OR MULTNOMAH ROUTES",
        ],
        "no_trust_score": True,
        "no_ranking": True,
        "no_local_oregon_routes": True,
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
            raise SystemExit("Oregon snapshot semantic fingerprint drifted")
        if existing["fingerprint"] != snap["fingerprint"]:
            raise SystemExit("stored fingerprint mismatch")
        print("or-lend-001 snapshot check pass", snap["fingerprint"])
        return
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(snap, indent=2) + "\n", encoding="utf-8")
    print("wrote", OUT, snap["fingerprint"])


if __name__ == "__main__":
    main()
