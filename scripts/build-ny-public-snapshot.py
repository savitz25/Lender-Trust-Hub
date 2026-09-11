#!/usr/bin/env python3
"""NY-LEND-001A — public snapshot from DFS aggregates, enforcement, 2026 bulletins, HMDA NY."""
from __future__ import annotations

import csv
import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "artifacts" / "ny-lend-001"
LIB = ROOT / "lib" / "new-york-intelligence"
LIB.mkdir(parents=True, exist_ok=True)

RETRIEVED = "2026-09-11"
GENERATED = "2026-09-11T18:00:00Z"
CONTRACT = "lender-ny-state-intel-v1"


def sha(obj: object) -> str:
    body = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


def hmda() -> dict:
    rows = list(csv.DictReader((ROOT / "data/hmda/by-state/NY/county_market_summary.csv").open(encoding="utf-8")))

    def s(k: str) -> int:
        return sum(int(r.get(k) or 0) for r in rows)

    apps, orig, den = s("total_applications"), s("total_originations"), s("denial_count")
    purch, refi, other = s("purchase_count"), s("refinance_count"), s("purpose_other_count")
    conv, fha, va, usda = s("apps_conventional"), s("apps_fha"), s("apps_va"), s("apps_usda_other")
    return {
        "year": 2025,
        "geo_grain": "state_and_county",
        "state_code": "NY",
        "source": "Committed HMDA New York partition data/hmda/by-state/NY/county_market_summary.csv. Properties located in New York. Not a second national download.",
        "source_as_of": "HMDA 2025",
        "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
        "classification": "VISIBLE_PUBLIC_METRIC",
        "county_count": len(rows),
        "applications": apps,
        "originations": orig,
        "denials": den,
        "denial_rate_pct": round(den / apps * 100, 2),
        "purchase_applications": purch,
        "refinance_applications": refi,
        "purpose_other_applications": other,
        "purchase_pct_of_apps": round(purch / apps * 100, 2),
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
        "no_county_pages": True,
    }


def bulletin_counts() -> dict:
    events = json.loads((ART / "bulletin-events.json").read_text(encoding="utf-8"))
    counts = Counter()
    for e in events:
        counts[e["kind"]] += int(e["count"] or 0)
    total = sum(counts.values())
    return {
        "window": "2026-01-02 through 2026-09-11",
        "bulletin_count": 37,
        "source_url": "https://www.dfs.ny.gov/reports-and-publications/weekly-bulletins",
        "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
        "classification": "VISIBLE_SUPPORTING_CONTEXT",
        "NY_DFS_2026_MORTGAGE_BULLETIN_EVENTS": total,
        "distributions": dict(sorted(counts.items())),
        "event_is_not_current_roster": True,
        "mlo_approval_is_not_current_mlo_population": True,
        "issuance_is_not_active_universe": True,
        "surrender_is_not_enforcement_violation": True,
        "one_company_may_have_multiple_events": True,
    }


def main() -> None:
    enf = json.loads((ART / "enforcement-rows.json").read_text(encoding="utf-8"))
    hmda_ny = hmda()
    bull = bulletin_counts()
    fdic_n = len(json.loads((ROOT / "lib/fdic/data/new-york.json").read_text(encoding="utf-8")).get("banks") or [])
    subjects = Counter(r["subject"] for r in enf)

    snapshot = {
        "contract_name": CONTRACT,
        "version": "1.0.0",
        "geography": "NY",
        "publication_status": "published",
        "path": "/new-york",
        "generated_at": GENERATED,
        "retrieved_at": RETRIEVED,
        "snapshot_as_of": RETRIEVED,
        "growth_classification": "INTELLIGENCE_GROWTH_HEAVY",
        "source_as_of": {
            "dfs_annual_aggregates": "2024-12-31",
            "weekly_bulletins": "2026-01-02/2026-09-11",
            "enforcement": "2011-10-17/2026-08-12",
            "hmda": "HMDA 2025",
            "cfpb": None,
            "live_roster": "SOURCE_NOT_ACQUIRED",
        },
        "hero": {
            "universe_label": "DFS licensed mortgage bankers (end of 2024)",
            "universe_value": 151,
            "universe_hint": "Dated DFS 2024 Annual Report aggregate. Not current September 2026 licensees and not a combined lender count.",
            "current_label": "DFS registered mortgage brokers (end of 2024)",
            "current_value": 439,
            "observations_label": "HMDA 2025 New York applications",
            "observations_value": hmda_ny["applications"],
            "geography_label": "HMDA 2025 New York originations",
            "geography_value": hmda_ny["originations"],
            "as_of_label": "DFS annual-report period",
            "as_of_value": "end of 2024",
        },
        "regulators": {
            "name": "New York State Department of Financial Services",
            "short": "NYDFS",
            "unit": "Mortgage Banking Unit",
            "url": "https://www.dfs.ny.gov/apps_and_licensing/mortgage_companies",
            "nmls": "https://www.nmlsconsumeraccess.org/",
            "enforcement": "https://www.dfs.ny.gov/industry_guidance/enforcement_actions_mortgage",
            "weekly_bulletins": "https://www.dfs.ny.gov/reports-and-publications/weekly-bulletins",
        },
        "dfs_2024_aggregates": {
            "source": "NYDFS 2024 Annual Report mortgage-banking supervision aggregates",
            "source_period": "END OF 2024",
            "source_as_of": "2024-12-31",
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_PUBLIC_METRIC",
            "registered_mortgage_brokers": 439,
            "licensed_mortgage_bankers": 151,
            "registered_mortgage_loan_servicers": 36,
            "licensed_mortgage_loan_originators": 9769,
            "not_current_2026_roster": True,
            "not_company_rows": True,
            "mlo_is_person_grain": True,
            "do_not_sum_classes": True,
            "banker_is_not_broker": True,
            "servicer_is_not_banker": True,
            "mlo_is_not_company": True,
        },
        "current_roster": {
            "coverage_state": "OPEN_SEARCH_ONLY",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "NY_CURRENT_MORTGAGE_BANKER_ROWS": None,
            "NY_CURRENT_MORTGAGE_BROKER_ROWS": None,
            "NY_CURRENT_SERVICER_ROWS": None,
            "count": None,
            "verification": ["NYDFS Mortgage Banking", "NMLS Consumer Access"],
            "not_inferred_from_2024_aggregates": True,
            "search_only_is_not_zero": True,
        },
        "identity": {
            "preferred_company": "NMLS:{id} when source-native",
            "source_native": "NYDFS license/certificate/registration numbers when printed",
            "name_only": "UNSAFE",
            "name_plus_city": "REVIEW_REQUIRED",
            "company_is_not_branch": True,
            "company_is_not_mlo": True,
            "registration_is_not_license": True,
            "no_name_match_nmls": True,
        },
        "weekly_bulletins": bull,
        "enforcement": {
            "agency": "NYDFS Mortgage Banking Enforcement Actions",
            "url": "https://www.dfs.ny.gov/industry_guidance/enforcement_actions_mortgage",
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_PUBLIC_METRIC",
            "observation_rows": len(enf),
            "date_min": min(r["date"] for r in enf),
            "date_max": max(r["date"] for r in enf),
            "subject_distribution": dict(subjects),
            "naic_or_nmls_column": False,
            "name_only_join": "UNSAFE",
            "action_is_not_violation_count": True,
            "settlement_is_not_conviction": True,
            "consent_order_is_not_quality": True,
            "row_is_not_unique_company": True,
            "subject_is_not_always_lender_company": True,
            "did_not_download_pdfs": True,
        },
        "hmda": hmda_ny,
        "cfpb": {
            "source": "CFPB Consumer Complaint Database",
            "source_url": "https://www.consumerfinance.gov/data-research/consumer-complaints/",
            "product": "Mortgage",
            "geography": "NY",
            "coverage_state": "OPEN_SEARCH_ONLY",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "result": "SOURCE_NOT_ACQUIRED",
            "mortgage_complaint_rows": None,
            "company_rate_published": False,
            "retrieved_at": RETRIEVED,
            "api_last_updated": None,
            "complaint_is_not_violation": True,
            "complaint_is_not_enforcement": True,
            "search_only_is_not_zero": True,
            "caveat": "Statewide CFPB mortgage complaints for New York remain an official search/API path. This ticket did not freeze a bulk NY count because the public API was not retrievable from the builder environment. Missing is not zero. A complaint is not a violation.",
        },
        "fdic": {
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "source": "Existing LenderTrustHub FDIC New York overlay",
            "institution_rows": fdic_n,
            "depository_is_not_mortgage_banker": True,
            "fdic_is_not_nydfs_mortgage_license": True,
        },
        "mlo_person": {
            "grain": "PERSON",
            "dfs_2024_licensed_mlos": 9769,
            "bulletin_2026_approvals": bull["distributions"].get("mlo_approval", 0),
            "bulletin_2026_withdrawals": bull["distributions"].get("mlo_withdrawal", 0),
            "approval_is_not_current_population": True,
            "person_is_not_company": True,
            "no_public_person_profiles": True,
        },
        "grain_classification": {
            "dfs_2024_bankers": "VISIBLE_PUBLIC_METRIC",
            "dfs_2024_brokers": "VISIBLE_PUBLIC_METRIC",
            "hmda_applications": "VISIBLE_PUBLIC_METRIC",
            "hmda_originations": "VISIBLE_PUBLIC_METRIC",
            "enforcement": "VISIBLE_PUBLIC_METRIC",
            "dfs_2024_servicers": "VISIBLE_SUPPORTING_CONTEXT",
            "dfs_2024_mlos": "VISIBLE_SUPPORTING_CONTEXT",
            "weekly_bulletins": "VISIBLE_SUPPORTING_CONTEXT",
            "current_roster": "VISIBLE_SUPPORTING_CONTEXT",
            "cfpb": "VISIBLE_SUPPORTING_CONTEXT",
            "fdic": "VISIBLE_SUPPORTING_CONTEXT",
        },
        "claim_eligibility": {"broadened": False},
        "expansion_ledger": {
            "NY_DFS_2024_REGISTERED_MORTGAGE_BROKERS": 439,
            "NY_DFS_2024_LICENSED_MORTGAGE_BANKERS": 151,
            "NY_DFS_2024_REGISTERED_MORTGAGE_SERVICERS": 36,
            "NY_DFS_2024_LICENSED_MLOS": 9769,
            "NY_CURRENT_MORTGAGE_BANKER_ROWS": None,
            "NY_CURRENT_MORTGAGE_BROKER_ROWS": None,
            "NY_CURRENT_SERVICER_ROWS": None,
            "NY_DFS_2026_MORTGAGE_BULLETIN_EVENTS": bull["NY_DFS_2026_MORTGAGE_BULLETIN_EVENTS"],
            "NY_DFS_MORTGAGE_ENFORCEMENT_ROWS": len(enf),
            "NY_HMDA_2025_APPLICATIONS": hmda_ny["applications"],
            "NY_HMDA_2025_ORIGINATIONS": hmda_ny["originations"],
            "NY_HMDA_2025_DENIALS": hmda_ny["denials"],
            "NY_CFPB_MORTGAGE_COMPLAINT_ROWS": None,
            "EXACT_NMLS_CROSSWALKS": 0,
            "EXACT_PROFILE_ATTACHMENTS": 0,
            "REJECTED_UNSAFE_CROSSWALKS": "name-only enforcement attachment UNSAFE; bulletin MLO NMLS IDs are person-grain and were not written as company profiles",
            "NET_NEW_CANONICAL_ORGANIZATIONS": 0,
            "NET_NEW_PUBLIC_LENDER_PROFILES": 0,
            "EXISTING_ORGANIZATIONS_ENRICHED": 0,
        },
        "semantic_guardrails": [
            "mortgage banker != mortgage broker",
            "mortgage servicer != mortgage banker",
            "MLO != company",
            "branch != company",
            "2024 aggregate != current 2026 roster",
            "weekly bulletin event != current license census",
            "license issuance event != current active universe",
            "surrender event != enforcement violation",
            "HMDA application != lender",
            "HMDA geography != company location",
            "complaint != violation",
            "enforcement action != conviction",
            "name-only adverse join unsafe",
            "missing != zero",
            "search-only != zero",
            "NO TRUST SCORE",
            "NO COMBINED NEW YORK LENDERS HEADLINE",
        ],
        "juice_squeeze": {
            "GRABBED_HIGH_YIELD": [
                "DFS 2024 mortgage-banking supervision aggregates",
                "DFS Mortgage Banking Enforcement Actions HTML table",
                "HMDA New York 2025 state slice",
            ],
            "GRABBED_EASY_SECONDARY": [
                "2026 Weekly Banking Bulletin mortgage activity (37 issues)",
                "Existing FDIC New York depository overlay",
            ],
            "LEFT_SEARCH_ONLY": [
                "Live NYDFS / NMLS current company roster",
                "CFPB New York mortgage complaint bulk count",
            ],
            "LEFT_TOO_MUCH_WORK": [
                "Historical Weekly Bulletins",
                "Enforcement PDF corpus",
                "Complete MLO person directory",
            ],
            "LEFT_REQUEST_ONLY": ["FOIL"],
            "LEFT_LOCAL_FUTURE": ["NYC boroughs", "counties", "local mortgage pages"],
        },
        "noCombinedDenominator": True,
        "noCountyRoutes": True,
        "noLocalNewYorkPages": True,
        "statewideOnly": True,
        "no_trust_score": True,
        "no_paid_ranking": True,
        "claimEligibilityBroadened": False,
    }
    snapshot["fingerprint"] = sha({k: v for k, v in snapshot.items() if k != "fingerprint"})
    (LIB / "accepted-snapshot.json").write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (ART / "accepted-snapshot.json").write_text((LIB / "accepted-snapshot.json").read_text(encoding="utf-8"), encoding="utf-8")
    print("fingerprint", snapshot["fingerprint"])
    print("fingerprint2", sha({k: v for k, v in snapshot.items() if k != "fingerprint"}))
    print("enforcement", len(enf), "bulletin events", bull["NY_DFS_2026_MORTGAGE_BULLETIN_EVENTS"])
    print("hmda apps", hmda_ny["applications"], "orig", hmda_ny["originations"], "den", hmda_ny["denials"])
    print("fdic", fdic_n)


if __name__ == "__main__":
    main()
