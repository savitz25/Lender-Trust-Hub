#!/usr/bin/env python3
"""Build lender-il-state-intel-v1 from committed HMDA IL + FDIC overlay.

No new scrape. Generation metadata is excluded from the semantic fingerprint.
Synthetic test clocks are never written as Production metadata.
"""
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
HMDA = ROOT / "data/hmda/by-state/IL/county_market_summary.csv"
FDIC = ROOT / "lib/fdic/data/illinois.json"
HMDA_MANIFEST = ROOT / "data/hmda/national/manifest.json"
OUT = ROOT / "lib/illinois-intelligence/accepted-snapshot.json"

# Narrow generation/verification metadata only. Source/provenance objects stay hashed.
GENERATION_KEYS = frozenset({"generated_at", "fingerprint"})

EXPECTED = {
    "applications": 394488,
    "originations": 231788,
    "denials": 66742,
    "counties": 102,
    "purchase": 182964,
    "refinance": 126098,
    "other": 85426,
    "conventional": 324901,
    "fha": 47257,
    "va": 20851,
    "usda": 1479,
    "fdic": 387,
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


def set_path(obj: dict[str, Any], path: tuple[str, ...], value: Any) -> dict[str, Any]:
    mut = copy.deepcopy(obj)
    cur: Any = mut
    for key in path[:-1]:
        cur = cur[key]
    cur[path[-1]] = value
    return mut


def load_frozen_inputs() -> dict[str, Any]:
    rows = list(csv.DictReader(HMDA.open(encoding="utf-8")))

    def s(key: str) -> int:
        return sum(int(float(r[key] or 0)) for r in rows)

    years = {int(r["year"]) for r in rows if r.get("year")}
    if years != {2025}:
        raise SystemExit(f"unexpected HMDA years in IL partition: {sorted(years)}")
    manifest = json.loads(HMDA_MANIFEST.read_text(encoding="utf-8"))
    vintage = manifest.get("data_vintage_label") or "HMDA 2025"
    fdic = json.loads(FDIC.read_text(encoding="utf-8"))
    banks = len(fdic["banks"])
    fdic_as_of = fdic.get("updated")
    if not fdic_as_of:
        raise SystemExit("FDIC overlay missing committed `updated` provenance")
    totals = {
        "applications": s("total_applications"),
        "originations": s("total_originations"),
        "denials": s("denial_count"),
        "counties": len(rows),
        "purchase": s("purchase_count"),
        "refinance": s("refinance_count"),
        "other": s("purpose_other_count"),
        "conventional": s("apps_conventional"),
        "fha": s("apps_fha"),
        "va": s("apps_va"),
        "usda": s("apps_usda_other"),
        "fdic": banks,
        "vintage": vintage,
        "fdic_as_of": fdic_as_of,
    }
    for key, expected in EXPECTED.items():
        if totals[key] != expected:
            raise SystemExit(f"frozen IL {key} drifted: {totals[key]} != {expected}")
    return totals


def build_body(generated_at: str, totals: dict[str, Any] | None = None) -> dict[str, Any]:
    t = totals or load_frozen_inputs()
    apps = t["applications"]
    origs = t["originations"]
    denials = t["denials"]
    counties = t["counties"]
    purchase = t["purchase"]
    refi = t["refinance"]
    other = t["other"]
    conv = t["conventional"]
    fha = t["fha"]
    va = t["va"]
    usda = t["usda"]
    banks = t["fdic"]
    vintage = t["vintage"]
    fdic_as_of = t["fdic_as_of"]
    denial_pct = pct(denials, apps)
    return {
        "contract_name": "lender-il-state-intel-v1",
        "version": "1.0.0",
        "geography": "IL",
        "publication_status": "published",
        "path": "/illinois",
        "generated_at": generated_at,
        "retrieved_at": None,
        "retrieved_at_precision": "UNKNOWN",
        "snapshot_as_of": None,
        "growth_classification": "INTELLIGENCE_GROWTH_HEAVY",
        "source_as_of": {
            "hmda": vintage,
            "fdic": fdic_as_of,
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
            "geography_value": counties,
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
            "this_ticket_retrieved": False,
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
            "source_as_of": vintage,
            "retrieved_at": None,
            "retrieved_at_precision": "UNKNOWN",
            "reuse": "PRE_EXISTING_REUSED",
            "this_ticket_retrieved": False,
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_PUBLIC_METRIC",
            "county_count": counties,
            "applications": apps,
            "originations": origs,
            "denials": denials,
            "denials_as_pct_of_total_applications": denial_pct,
            "denial_pct_numerator_denial_observations": denials,
            "denial_pct_denominator_total_applications": apps,
            "denial_pct_is_not_decision_based_rate": True,
            "denial_is_not_lender_quality": True,
            "purchase_applications": purchase,
            "refinance_applications": refi,
            "purpose_other_applications": other,
            "purchase_pct_of_apps": pct(purchase, apps),
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
            "retrieved_at": None,
            "retrieved_at_precision": "UNKNOWN",
            "this_ticket_retrieved": False,
            "complaint_is_not_violation": True,
            "search_only_is_not_zero": True,
            "caveat": "Statewide CFPB Illinois mortgage complaints remain an official search path. Missing is not zero.",
        },
        "fdic": {
            "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
            "classification": "VISIBLE_SUPPORTING_CONTEXT",
            "source": "Existing LenderTrustHub FDIC Illinois overlay",
            "source_as_of": fdic_as_of,
            "retrieved_at": None,
            "retrieved_at_precision": "UNKNOWN",
            "reuse": "PRE_EXISTING_REUSED",
            "this_ticket_retrieved": False,
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
            "IL_HMDA_COUNTY_ROWS": counties,
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
            "denials / total applications is not a decision-based denial rate",
            "NO TRUST SCORE",
            "NO COMBINED ILLINOIS LENDERS HEADLINE",
            "NO CHICAGO OR COOK COUNTY ROUTES",
        ],
        "no_trust_score": True,
        "no_ranking": True,
        "no_local_illinois_routes": True,
        "fingerprint": "",
    }


def assert_independent_fingerprint(totals: dict[str, Any]) -> str:
    clock_a = "2020-01-01T00:00:00Z"
    clock_b = "2099-12-31T23:59:59Z"
    a = build_body(clock_a, totals)
    b = build_body(clock_b, totals)
    fp_a = semantic_sha(a)
    fp_b = semantic_sha(b)
    if a["generated_at"] == b["generated_at"]:
        raise SystemExit("synthetic generatedAt clocks must differ")
    if fp_a != fp_b:
        raise SystemExit("semantic fingerprint changed across generatedAt")
    mutations: list[tuple[str, tuple[str, ...], Any]] = [
        ("hmda applications", ("hmda", "applications"), 1),
        ("hmda originations", ("hmda", "originations"), 1),
        ("fdic institutions", ("fdic", "institution_rows"), 1),
        ("hmda year", ("hmda", "year"), 2024),
        ("hmda source clock", ("hmda", "source_as_of"), "HMDA 2024"),
        ("roster coverage", ("current_roster", "coverage_state"), "ACQUIRED_CURRENT_SNAPSHOT"),
        ("cfpb coverage", ("cfpb", "coverage_state"), "ACQUIRED_CURRENT_SNAPSHOT"),
        ("claim broadened", ("claim_eligibility", "broadened"), True),
        ("publication path", ("path",), "/illinois/chicago"),
    ]
    for label, path, value in mutations:
        mut = set_path(a, path, value)
        if semantic_sha(mut) == fp_a:
            raise SystemExit(f"mutation did not change fingerprint: {label}")
    return fp_a


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--generated-at", default=None, help="Production generation timestamp. Never a synthetic test clock.")
    args = parser.parse_args()
    totals = load_frozen_inputs()
    fp = assert_independent_fingerprint(totals)
    if args.check:
        current = json.loads(OUT.read_text(encoding="utf-8"))
        if current.get("generated_at") in {"2020-01-01T00:00:00Z", "2099-12-31T23:59:59Z"}:
            raise SystemExit("synthetic test clocks must not be stored as Production metadata")
        if current.get("retrieved_at") is not None:
            raise SystemExit("retrieved_at must stay UNKNOWN/null; this ticket did not retrieve HMDA/FDIC")
        if "denial_rate_pct" in current.get("hmda", {}):
            raise SystemExit("denial_rate_pct is too broad; use denials_as_pct_of_total_applications")
        if semantic_sha(current) != fp or current.get("fingerprint") != fp:
            raise SystemExit(f"fingerprint drifted: file={current.get('fingerprint')} rebuild={fp}")
        print(json.dumps({"check": "ok", "fingerprint": fp}, indent=2))
        return
    generated_at = args.generated_at or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    if generated_at in {"2020-01-01T00:00:00Z", "2099-12-31T23:59:59Z"}:
        raise SystemExit("refusing to write synthetic test clocks as Production metadata")
    body = build_body(generated_at, totals)
    body["fingerprint"] = fp
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(body, indent=2) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "fingerprint": fp,
                "previous_fingerprint": "c6da4761a11c6fccff22fbadb1eac1d2158b2756bfcf6823d622454ddbc5c03d",
                "apps": totals["applications"],
                "origs": totals["originations"],
                "denials": totals["denials"],
                "counties": totals["counties"],
                "fdic": totals["fdic"],
                "generated_at": generated_at,
                "retrieved_at": None,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
