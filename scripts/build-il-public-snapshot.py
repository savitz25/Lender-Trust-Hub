#!/usr/bin/env python3
"""Build lender-il-state-intel-v1 from committed HMDA IL + FDIC overlay. No new scrape."""
from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HMDA = ROOT / "data/hmda/by-state/IL/county_market_summary.csv"
FDIC = ROOT / "lib/fdic/data/illinois.json"
OUT = ROOT / "lib/illinois-intelligence/accepted-snapshot.json"


def sha(obj: dict) -> str:
    body = json.dumps({k: v for k, v in obj.items() if k != "fingerprint"}, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


def main() -> None:
    rows = list(csv.DictReader(HMDA.open(encoding="utf-8")))
    def s(key: str) -> int:
        return sum(int(float(r[key] or 0)) for r in rows)
    apps = s("total_applications")
    origs = s("total_originations")
    denials = s("denial_count")
    purchase = s("purchase_count")
    refi = s("refinance_count")
    other = s("purpose_other_count")
    conv = s("apps_conventional")
    fha = s("apps_fha")
    va = s("apps_va")
    usda = s("apps_usda_other")
    fdic = json.loads(FDIC.read_text(encoding="utf-8"))
    banks = len(fdic["banks"])
    body = {
        "contract_name": "lender-il-state-intel-v1",
        "version": "1.0.0",
        "geography": "IL",
        "publication_status": "published",
        "path": "/illinois",
        "generated_at": "2026-09-11T21:00:00Z",
        "retrieved_at": "2026-09-11",
        "snapshot_as_of": "2026-09-11",
        "growth_classification": "INTELLIGENCE_GROWTH_HEAVY",
        "source_as_of": {
            "hmda": "HMDA 2025",
            "fdic": fdic.get("updated") or "2026-06-26",
            "cfpb": None,
            "live_roster": "SOURCE_NOT_ACQUIRED",
        },
        "hero": {
            "universe_label": "HMDA 2025 Illinois applications",
            "universe_value": apps,
            "universe_hint": "Property-geography applications in Illinois. Not lenders and not a current license census.",
            "current_label": "HMDA 2025 Illinois originations",
            "current_value": origs,
            "observations_label": "FDIC Illinois depository institutions",
            "observations_value": banks,
            "geography_label": "Illinois counties in the committed HMDA slice",
            "geography_value": len(rows),
            "as_of_label": "HMDA vintage",
            "as_of_value": "2025",
        },
        "regulators": {
            "name": "Illinois Department of Financial and Professional Regulation",
            "short": "IDFPR",
            "unit": "Bureau of Residential Finance / Division of Banking",
            "url": "https://idfpr.illinois.gov/banks/resfin.html",
            "nmls": "https://www.nmlsconsumeraccess.org/",
            "lookup": "https://idfpr.illinois.gov/checklicense.html",
        },
        "current_roster": {
            "coverage_state": "OPEN_SEARCH_ONLY",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "IL_CURRENT_MORTGAGE_COMPANY_ROWS": None,
            "count": None,
            "verification": ["IDFPR Banking / Residential Finance lookup", "NMLS Consumer Access"],
            "search_only_is_not_zero": True,
            "not_inferred_from_hmda": True,
            "not_inferred_from_fdic": True,
        },
        "identity": {
            "preferred_company": "NMLS:{id} when source-native",
            "name_only": "UNSAFE",
            "name_plus_city": "REVIEW_REQUIRED",
            "company_is_not_branch": True,
            "company_is_not_mlo": True,
            "depository_is_not_mortgage_banker": True,
            "no_name_match_nmls": True,
        },
        "hmda": {
            "year": 2025,
            "geo_grain": "state_and_county",
            "state_code": "IL",
            "source": "Committed HMDA Illinois partition data/hmda/by-state/IL/county_market_summary.csv. Properties located in Illinois. Not a second national download.",
            "source_as_of": "HMDA 2025",
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_PUBLIC_METRIC",
            "county_count": len(rows),
            "applications": apps,
            "originations": origs,
            "denials": denials,
            "denial_rate_pct": round(denials / apps * 100, 2),
            "purchase_applications": purchase,
            "refinance_applications": refi,
            "purpose_other_applications": other,
            "purchase_pct_of_apps": round(purchase / apps * 100, 2),
            "refinance_pct_of_apps": round(refi / apps * 100, 2),
            "purpose_other_pct_of_apps": round(other / apps * 100, 2),
            "apps_conventional": conv,
            "apps_fha": fha,
            "apps_va": va,
            "apps_usda_other": usda,
            "conventional_pct": round(conv / apps * 100, 2),
            "fha_pct": round(fha / apps * 100, 2),
            "va_pct": round(va / apps * 100, 2),
            "usda_other_pct": round(usda / apps * 100, 2),
            "application_is_not_lender": True,
            "geography_is_not_headquarters": True,
            "geography_is_not_license_jurisdiction": True,
            "geography_is_not_service_territory": True,
            "no_county_pages": True,
            "no_chicago_cook_routes": True,
        },
        "cfpb": {
            "source": "CFPB Consumer Complaint Database",
            "source_url": "https://www.consumerfinance.gov/data-research/consumer-complaints/",
            "product": "Mortgage",
            "geography": "IL",
            "coverage_state": "OPEN_SEARCH_ONLY",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "result": "SOURCE_NOT_ACQUIRED",
            "mortgage_complaint_rows": None,
            "complaint_is_not_violation": True,
            "search_only_is_not_zero": True,
            "caveat": "Statewide CFPB Illinois mortgage complaints remain an official search path. Missing is not zero.",
        },
        "fdic": {
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "source": "Existing LenderTrustHub FDIC Illinois overlay",
            "source_as_of": fdic.get("updated") or "2026-06-26",
            "institution_rows": banks,
            "depository_is_not_mortgage_banker": True,
            "fdic_is_not_idfpr_mortgage_license": True,
        },
        "grain_classification": {
            "hmda_applications": "VISIBLE_PUBLIC_METRIC",
            "hmda_originations": "VISIBLE_PUBLIC_METRIC",
            "fdic": "VISIBLE_SUPPORTING_CONTEXT",
            "current_roster": "VISIBLE_SUPPORTING_CONTEXT",
            "cfpb": "VISIBLE_SUPPORTING_CONTEXT",
        },
        "claim_eligibility": {"broadened": False},
        "expansion_ledger": {
            "IL_HMDA_2025_APPLICATIONS": apps,
            "IL_HMDA_2025_ORIGINATIONS": origs,
            "IL_HMDA_2025_DENIALS": denials,
            "IL_HMDA_COUNTY_ROWS": len(rows),
            "IL_FDIC_INSTITUTION_ROWS": banks,
            "IL_CURRENT_MORTGAGE_COMPANY_ROWS": None,
            "IL_CFPB_MORTGAGE_COMPLAINT_ROWS": None,
            "EXACT_NMLS_CROSSWALKS": 0,
            "EXACT_PROFILE_ATTACHMENTS": 0,
            "NET_NEW_CANONICAL_ORGANIZATIONS": 0,
            "NET_NEW_PUBLIC_LENDER_PROFILES": 0,
            "EXISTING_ORGANIZATIONS_ENRICHED": 0,
            "pre_existing_hmda_il_partition_ne_new_orgs": True,
            "pre_existing_local_lenders_illinois_ne_state_intel": True,
        },
        "semantic_guardrails": [
            "HMDA application != lender",
            "HMDA geography != headquarters",
            "HMDA geography != license jurisdiction",
            "HMDA geography != service territory",
            "FDIC depository != IDFPR mortgage banker",
            "search-only != zero",
            "missing != zero",
            "NO TRUST SCORE",
            "NO COMBINED ILLINOIS LENDERS HEADLINE",
            "NO CHICAGO OR COOK COUNTY ROUTES",
        ],
        "no_trust_score": True,
        "no_ranking": True,
        "no_local_illinois_routes": True,
        "fingerprint": "",
    }
    fp1 = sha(body)
    fp2 = sha(body)
    if fp1 != fp2:
        raise SystemExit("fingerprint not deterministic")
    mut = json.loads(json.dumps(body))
    mut["hmda"]["applications"] = 1
    if sha(mut) == fp1:
        raise SystemExit("mutation did not change fingerprint")
    body["fingerprint"] = fp1
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(body, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"fingerprint": fp1, "apps": apps, "origs": origs, "counties": len(rows), "fdic": banks}, indent=2))


if __name__ == "__main__":
    main()
