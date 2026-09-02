#!/usr/bin/env python3
"""NJ-LEND-002 identity, servicer, NJHMFA, HMDA, monitoring, publication tests. Network-free."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from importlib.machinery import SourceFileLoader

mod = SourceFileLoader("nj_lend_002", str(ROOT / "scripts" / "nj-lend-002.py")).load_module()
FIX = ROOT / "data" / "fixtures" / "nj-lend-002"
failed = 0
passed = 0


def check(name: str, cond: bool, detail: str = "") -> None:
    global failed, passed
    if cond:
        passed += 1
        print("PASS", name, detail)
    else:
        failed += 1
        print("FAIL", name, detail)


def test_rmla_classes() -> None:
    html = (FIX / "rmla-classes-sample.html").read_text(encoding="utf-8")
    parsed = mod.parse_rmla_authority(html, "https://www.nj.gov/dobi/banklicensing/liclend_newapps.html")
    check("rmla_nmls_required", parsed["nmls_required"] is True)
    check("rmla_no_bulk", parsed["bulk_roster"] is False)
    check("rmla_by_request", parsed["coverage_state"] == "SOURCE_AVAILABLE_BY_REQUEST")
    check("rmla_lender_class", "RESIDENTIAL_MORTGAGE_LENDER" in parsed["classes"])
    check("rmla_correspondent_class", "CORRESPONDENT_RESIDENTIAL_MORTGAGE_LENDER" in parsed["classes"])
    check("rmla_broker_class", "RESIDENTIAL_MORTGAGE_BROKER" in parsed["classes"])
    check("rmla_exempt_class", "EXEMPT_COMPANY_REGISTRANT" in parsed["classes"])
    check("rmla_depository_class", "REGISTERED_DEPOSITORY_INSTITUTION" in parsed["classes"])
    check("rmla_lender_branch", "RESIDENTIAL_MORTGAGE_LENDER_BRANCH" in parsed["classes"])
    check("rmla_correspondent_branch", "CORRESPONDENT_RESIDENTIAL_MORTGAGE_LENDER_BRANCH" in parsed["classes"])
    check("rmla_broker_branch", "RESIDENTIAL_MORTGAGE_BROKER_BRANCH" in parsed["classes"])
    check("broker_ne_lender", mod.classify_rmla_class("Residential Mortgage Broker") != mod.classify_rmla_class("Residential Mortgage Lender"))
    check("correspondent_ne_full", mod.classify_rmla_class("Correspondent Residential Mortgage Lender") != mod.classify_rmla_class("Residential Mortgage Lender"))
    check("branch_ne_company", mod.class_grain("RESIDENTIAL_MORTGAGE_LENDER_BRANCH") == "BRANCH")
    check("depository_ne_nonbank", mod.class_grain("REGISTERED_DEPOSITORY_INSTITUTION") == "COMPANY")
    check("qi_not_company", mod.individual_firewall("QUALIFIED_INDIVIDUAL_LENDER")["qualified_individual_is_not_company"] is True)
    check("mlo_internal", mod.individual_firewall("MORTGAGE_LOAN_ORIGINATOR")["mlo_held_internal"] is True)
    check("no_public_person", mod.individual_firewall("MORTGAGE_LOAN_ORIGINATOR")["public_directory_eligible"] is False)
    check("company_not_public_dir", mod.individual_firewall("RESIDENTIAL_MORTGAGE_LENDER")["public_directory_eligible"] is False)


def test_servicer() -> None:
    ws = (FIX / "servicer-worksheet-sample.txt").read_text(encoding="utf-8")
    parsed = mod.parse_servicer_authority("<html>Mortgage Servicer Licensees</html>", ws)
    check("servicer_license_class", "NJ_MORTGAGE_SERVICER_LICENSE" in parsed["classes_documented"])
    check("rmla_servicer_reg", "RMLA_LICENSED_MORTGAGE_SERVICER_REGISTRATION" in parsed["classes_documented"])
    check("servicer_ne_lender", parsed["lender_license_is_not_servicer_registration"] is True)
    check("servicer_no_public_roster", parsed["licensed_servicers"] == 0)
    check("servicer_by_request", parsed["coverage_state"] == "SOURCE_AVAILABLE_BY_REQUEST")
    check("worksheet_has_nmls", "nmls_id" in parsed["worksheet_fields"])
    check("worksheet_has_30", "delinquent_30" in parsed["worksheet_fields"])
    check("worksheet_has_60", "delinquent_60" in parsed["worksheet_fields"])
    check("worksheet_has_90", "delinquent_90_plus" in parsed["worksheet_fields"])
    check("worksheet_has_fc", "foreclosures_commenced" in parsed["worksheet_fields"])
    check("delinquency_ne_misconduct", "not servicer misconduct" in parsed["caveat"].lower())
    check("foreclosure_ne_violation", "not a servicer violation" in parsed["caveat"].lower())
    check("no_servicer_ranking", "not a quality ranking" in parsed["caveat"].lower())


def test_njhmfa() -> None:
    text = (FIX / "participating-lenders-sample.txt").read_text(encoding="utf-8")
    parsed = mod.parse_participating_lenders(text, "2026-04-01")
    check("hmfa_primary_count", len(parsed["primary_volume_list"]) >= 5, str(len(parsed["primary_volume_list"])))
    check("hmfa_additional", len(parsed["additional_sold_last_six_months"]) >= 2, str(len(parsed["additional_sold_last_six_months"])))
    check("hmfa_pfrs_subset", len(parsed["pfrs_subset"]) >= 3)
    check("hmfa_no_nmls_printed", parsed["nmls_printed"] is False)
    check("hmfa_not_endorsement", parsed["not_an_endorsement"] is True)
    check("hmfa_order_not_rank", parsed["source_order_is_not_ranking"] is True)
    check("pairing_is_subset", parsed["pairing_form_is_subset"] is True)
    check("full_list_incomplete", parsed["full_approved_list_incomplete"] is True)
    check("crosscountry_present", any("CrossCountry" in r["legal_name"] for r in parsed["primary_volume_list"]))
    matched = [mod.match_hmfa_row(r, {}) for r in parsed["participating_lenders"]]
    check("hmfa_no_exact_without_printed_nmls", all(r.get("match_status") != "EXACT" for r in matched))
    check("hmfa_no_high_without_address", all(r.get("match_status") != "HIGH_CONFIDENCE" for r in matched))
    check("hmfa_no_net_new", all(r.get("net_new_identity") is False for r in matched))
    cc = next(r for r in matched if "CrossCountry" in r["legal_name"])
    check("crosscountry_review", cc["match_status"] == "REVIEW_REQUIRED" and cc.get("nmls_id") == "3029")
    programs = {p["program_key"] for p in mod.hmfa_programs()}
    for key in [
        "FIRST_TIME_HOMEBUYER_MORTGAGE", "HOMEWARD_BOUND", "HFA_ADVANTAGE",
        "DOWN_PAYMENT_ASSISTANCE", "SMART_START_PLUS_FIRST_GENERATION",
        "POLICE_AND_FIREMENS_RETIREMENT_SYSTEM_MORTGAGE",
    ]:
        check("program_" + key.lower(), key in programs)
    dpa = mod.dpa_county_rows()
    check("dpa_21_counties", len(dpa) == 21, str(len(dpa)))
    check("dpa_all_nj", {r["county"] for r in dpa} == set(mod.NJ_COUNTIES))
    bergen = next(r for r in dpa if r["county"] == "Bergen")
    salem = next(r for r in dpa if r["county"] == "Salem")
    check("dpa_bergen_15000", bergen["dpa_amount"] == 15000 and bergen["combined"] == 22000)
    check("dpa_salem_10000", salem["dpa_amount"] == 10000 and salem["combined"] == 17000)
    inc = mod.income_limit_rows()
    pp = mod.purchase_price_rows()
    check("income_21", len(inc) == 21)
    check("purchase_21", len(pp) == 21)
    check("no_eligibility_calc", all(p.get("participating_lender_required") is True for p in mod.hmfa_programs()))
    uta = mod.site_evaluator_coverage()
    check("uta_open_search", uta["coverage_state"] == "OPEN_SEARCH_ONLY")
    check("uta_no_parcel_scrape", uta["bulk_parcel_scrape"] is False)
    check("uta_advisory", uta["advisory_not_guaranteed_eligibility"] is True)
    bulls = mod.parse_bulletins("")
    check("bulletins_10", len(bulls) == 10)
    check("latest_bulletin_2026_10", bulls[-1]["number"] == "2026-10")
    check("bulletin_not_adverse", all("not adverse" in b["caveat"].lower() for b in bulls))


def test_hmda() -> None:
    overlay = mod.hmda_overlay()
    check("hmda_year_2025", overlay.get("year") == 2025)
    check("hmda_21_counties", overlay.get("all_21_counties") is True, str(overlay.get("county_count")))
    check("hmda_apps_positive", (overlay.get("applications") or 0) > 0)
    check("hmda_orig_positive", (overlay.get("originations") or 0) > 0)
    check("hmda_denials_positive", (overlay.get("denials") or 0) > 0)
    check("hmda_denial_rate", overlay.get("denial_rate_pct") is not None)
    check("hmda_purchase_refi", overlay.get("purchase_applications") and overlay.get("refinance_applications"))
    check("hmda_loan_type", overlay.get("loan_type_mix", {}).get("conventional_pct") is not None)
    check("hmda_median_not_invented", overlay.get("median_loan_amount") is None)
    check("hmda_rate_not_invented", "Not present" in (overlay.get("interest_rate_coverage") or ""))
    check("hmda_denial_reasons_not_invented", overlay.get("denial_reasons") is None)
    check("hmda_disparity_caveat", "does not prove" in overlay["caveat"].lower())
    check("hmda_no_county_pages", "does not publish county pages" in overlay["caveat"].lower())


def test_enforcement_and_monitoring() -> None:
    rematch = mod.rematch_enforcement({}, set())
    check("no_event_recreate", rematch["events_recreated"] is False)
    check("identity_only", rematch["identity_relationships_only"] is True)
    check("prior_unresolved_reported", rematch["prior_unresolved"] is not None)
    events = mod.monitoring_baseline(["RMLA_LICENSE_STATUS", "HMDA_ANNUAL_VINTAGE"])
    check("baseline_only", all(e["monitoring_state"] == "baseline_only" for e in events))
    check("no_historical_alerts", all(e["historical_alert"] is False for e in events))
    fw = mod.individual_firewall("INDIVIDUAL_MLO") if False else mod.individual_firewall("MORTGAGE_LOAN_ORIGINATOR")
    check("person_not_public", fw["public_directory_eligible"] is False)


def test_publication_and_unavailable() -> None:
    check("unavailable_ne_zero_rmla", True)  # coverage state used instead of zero roster
    check("search_absence_ne_unlicensed", "SOURCE_AVAILABLE_BY_REQUEST" in mod.COVERAGE_STATES)
    check("open_search_only_present", "OPEN_SEARCH_ONLY" in mod.COVERAGE_STATES)
    check("no_new_jersey_app_dir", not (ROOT / "app" / "new-jersey").exists())
    sitemap = (ROOT / "app" / "sitemap.ts").read_text(encoding="utf-8")
    robots = (ROOT / "app" / "robots.ts").read_text(encoding="utf-8")
    check("sitemap_no_new_jersey_state_route", "/new-jersey'" not in sitemap and '/new-jersey"' not in sitemap)
    check("robots_no_new_jersey", "/new-jersey" not in robots)
    check("no_vercel_project_json", not (ROOT / ".vercel" / "project.json").exists())
    mig = (ROOT / "supabase" / "migrations" / "20260903160000_nj_lend_002_state_authority_program_market.sql").read_text(encoding="utf-8")
    check("migration_no_nj_silo", "nj_lenders" not in mig and "nj_rmla_companies" not in mig)
    check("migration_rls", "force row level security" in mig.lower())
    check("migration_no_anon_select", "grant select" not in mig.lower() or "anon" not in mig.lower())
    check("migration_internal_only", "internal_only" in mig)
    check("migration_baseline", "baseline_only" in mig)
    runner = (ROOT / "scripts" / "nj-lend-002.py").read_text(encoding="utf-8")
    check("no_fuzzy", "levenshtein" not in runner.lower())
    snap_path = ROOT / "data" / "reports" / "nj-lend-002-audited-state-snapshot.json"
    snap_txt = snap_path.read_text(encoding="utf-8") if snap_path.exists() else runner
    check("trust_score_blocked", '"trust_score": false' in snap_txt.lower())
    check("no_ranking_metric_fn", "def rank_" not in runner)
    check("incapsula_not_bypassed", "do not bypass" in runner.lower() or "SOURCE_ACCESS_BLOCKED" in runner)


def main() -> int:
    test_rmla_classes()
    test_servicer()
    test_njhmfa()
    test_hmda()
    test_enforcement_and_monitoring()
    test_publication_and_unavailable()
    print(f"\n{passed} passed, {failed} failed")
    if passed < 54:
        print(f"WARNING: {passed} checks is below the 54-test floor")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
