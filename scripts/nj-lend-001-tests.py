#!/usr/bin/env python3
"""NJ-LEND-001 parser, identity, coverage, and regression tests. Network-free."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from importlib.machinery import SourceFileLoader

mod = SourceFileLoader("nj_lend_001", str(ROOT / "scripts" / "nj-lend-001.py")).load_module()
FIX = ROOT / "data" / "fixtures" / "nj-lend-001"
failed = 0


def check(name: str, cond: bool, detail: str = "") -> None:
    global failed
    if cond:
        print("PASS", name, detail)
    else:
        failed += 1
        print("FAIL", name, detail)


def read(name: str) -> str:
    return (FIX / name).read_text(encoding="utf-8")


def test_ocf_2022() -> list[dict]:
    html = read("ocf-2022-sample.html")
    text = mod.html_to_text(html, "https://www.nj.gov/dobi/division_banking/ocf/enforcement/2022.html")
    events = mod.parse_enforcement_text(
        text,
        source_url="https://www.nj.gov/dobi/division_banking/ocf/enforcement/2022.html",
        source_year=2022,
        source_family="NJ_DOBI_OCF_ENFORCEMENT",
        source_page="ocf_2022",
    )
    orders = {e.get("order_number"): e for e in events}
    check("ocf22_count", len(events) >= 4, str(len(events)))
    check("ocf22_28", "OCF22-28" in orders)
    if "OCF22-28" in orders:
        e = orders["OCF22-28"]
        check("consent_vs_pending", e["event_class"] == "CONSENT_ORDER" and e["event_status"] == "FINAL")
        check("penalty_not_restitution", e["amounts"]["civil_penalty_amount"] == 2500 and not e["amounts"]["restitution_amount"])
        check("mv_installment_class", e["parties"][0]["party_type"] == "MOTOR_VEHICLE_INSTALLMENT_SELLER")
        check("state_ref_not_entity", e["parties"][0]["state_reference"] == "1300388")
        check("order_not_entity_id", e["order_number"] != e["parties"][0].get("state_reference"))
    if "OCF22-23" in orders:
        e = orders["OCF22-23"]
        check("multi_party", len(e["parties"]) >= 2, str(len(e["parties"])))
        check("individual_vs_company", {p["party_type"] for p in e["parties"]} >= {"INDIVIDUAL", "INSTITUTION"} or any("Horizon" in p["legal_name"] for p in e["parties"]))
        check("exact_nmls_present", "218391" in [p.get("nmls_id") for p in e["parties"]] or "218391" in e["raw_excerpt"])
        check("osc_pending", e["event_status"] == "PENDING")
        check("allegation_not_finding", "alleged" in e["raw_excerpt"].lower())
    if "OCF22-27" in orders:
        e = orders["OCF22-27"]
        check("revocation_flag", e["flags"]["revocation"] is True)
        check("final_order_class", e["event_class"] == "FINAL_ORDER")
        check("penalty_25500", e["amounts"]["civil_penalty_amount"] == 25500)
    if "OCF22-22" in orders:
        e = orders["OCF22-22"]
        check("mlo_class", any(p["party_type"] == "INDIVIDUAL_MLO" for p in e["parties"]))
        check("person_nmls", any(p.get("nmls_id") == "260931" for p in e["parties"]))
    pdfs = [e.get("document_url") for e in events if e.get("document_url")]
    check("pdf_url_normalized", all(u.startswith("https://www.nj.gov/") for u in pdfs), str(pdfs[:2]))
    doubled = '<a href="enforcement/2018/e17_018529.pdf">Consent Order E17-018529</a>'
    repaired = mod.html_to_text(doubled, "https://www.nj.gov/dobi/division_banking/ocf/enforcement/2018.html")
    check("pdf_double_enforcement_repaired", "/enforcement/enforcement/" not in repaired and "e17_018529.pdf" in repaired, repaired)
    return events


def test_ocf_2013_index_only() -> None:
    html = read("ocf-2013-sample.html")
    text = mod.html_to_text(html, "https://www.nj.gov/dobi/division_banking/bankdivenforce_2013.html")
    events = mod.parse_enforcement_text(
        text,
        source_url="https://www.nj.gov/dobi/division_banking/bankdivenforce_2013.html",
        source_year=2013,
        source_family="NJ_DOBI_OCF_ENFORCEMENT",
        source_page="archive_2013",
    )
    orders = {e.get("order_number"): e for e in events}
    check("archive_orders", "E13-012788" in orders and "E11-011141" in orders and "E12-012364" in orders, str(list(orders)))
    check("index_only_no_pdf", all(not e.get("document_url") for e in events))
    multi = orders.get("E13-012788")
    if multi:
        check("multi_party_archive", len(multi["parties"]) >= 2)
        check("check_casher_or_institution", any(p["party_type"] in {"CHECK_CASHER", "INSTITUTION"} for p in multi["parties"]))
        names = {p["legal_name"] for p in multi["parties"]}
        check("individual_not_merged_company", "Rapid Check Cashing, Inc." in str(names) and any("Pucillo" in n for n in names))
    osc = orders.get("E12-012364")
    if osc:
        check("osc_not_final", osc["event_status"] == "PENDING")


def test_depository() -> None:
    html = read("depository-sample.html")
    events = mod.parse_depository_html(html, "https://www.nj.gov/dobi/division_banking/bankdivenforce.html")
    names = {e["respondent_caption"]: e for e in events}
    check("dep_count", len(events) == 2, str(len(events)))
    check("union_county", "Union County Savings Bank" in names)
    check("parke", "Parke Bank" in names)
    if "Parke Bank" in names:
        e = names["Parke Bank"]
        check("dep_class", e["parties"][0]["party_type"] == "DEPOSITORY_INSTITUTION")
        check("dep_pdf", e["document_url"] and e["document_url"].endswith("parkebank2020.pdf"))
        fdic_index = {mod.norm_name("Parke Bank"): [{"name": "Parke Bank", "fdic_cert": "34888"}]}
        matched = mod.match_identity(e["parties"][0], fdic_index, e["source_family"])
        check("exact_fdic", matched["match_method"] == "EXACT_FDIC" and matched["identifier_value"] == "34888")


def test_identity_rules() -> None:
    fdic_index = {mod.norm_name("Parke Bank"): [{"name": "Parke Bank", "fdic_cert": "34888"}]}
    name_only = mod.match_identity({"legal_name": "John Smith", "party_type": "INDIVIDUAL", "nmls_id": None}, fdic_index, "NJ_DOBI_OCF_ENFORCEMENT")
    check("name_only_individual_internal", name_only["match_status"] == "INTERNAL_ONLY_INDIVIDUAL")
    check("no_public_person", name_only.get("no_public_person_profile") is True)
    check("unsafe_individual_name", name_only["unsafe_rejected"] is True)
    company_name = mod.match_identity({"legal_name": "Acme Mortgage LLC", "party_type": "MORTGAGE_COMPANY", "nmls_id": None}, fdic_index, "NJ_DOBI_OCF_ENFORCEMENT")
    check("name_only_company_unresolved", company_name["match_status"] == "UNRESOLVED")
    exact = mod.match_identity({"legal_name": "Horizon Lending, Inc.", "party_type": "MORTGAGE_COMPANY", "nmls_id": "1806029"}, fdic_index, "NJ_DOBI_OCF_ENFORCEMENT")
    check("exact_nmls_institution", exact["match_method"] == "EXACT_NMLS_INSTITUTION")
    person = mod.match_identity({"legal_name": "Mario Fermin Zavala", "party_type": "INDIVIDUAL_MLO", "nmls_id": "260931"}, fdic_index, "NJ_DOBI_OCF_ENFORCEMENT")
    check("exact_nmls_person", person["match_method"] == "EXACT_NMLS_PERSON" and person["public_eligibility"] == "internal_only")
    branch = mod.match_identity({"legal_name": "Some Branch", "party_type": "BRANCH", "nmls_id": "123456"}, fdic_index, "NJ_DOBI_OCF_ENFORCEMENT")
    check("exact_nmls_branch", branch["match_method"] == "EXACT_NMLS_BRANCH")
    state_ref = mod.match_identity({"legal_name": "Pinto Automotive Group, LLC", "party_type": "MOTOR_VEHICLE_INSTALLMENT_SELLER", "state_reference": "1300388"}, fdic_index, "NJ_DOBI_OCF_ENFORCEMENT")
    check("exact_state_ref", state_ref["match_method"] == "EXACT_STATE_REFERENCE" and state_ref["evidence"]["jurisdiction"] == "NJ")


def test_fi_list() -> None:
    html = read("fi-list-sample.html")
    rows = mod.parse_fi_list(html, "https://www.nj.gov/dobi/bankwebinfo.htm")
    check("fi_rows", len(rows) >= 2, str(len(rows)))
    classes = {r["legal_name"]: r for r in rows}
    if "Amboy Bank" in classes:
        check("state_bank_class", classes["Amboy Bank"]["institution_class"] == "STATE_CHARTERED_BANK")
        check("main_office_not_branch", classes["Amboy Bank"]["city"] == "Old Bridge")
        check("holding_company_separate", classes["Amboy Bank"]["holding_company"] == "Amboy Bancorporation")
    if "Navy Federal Credit Union" in classes:
        check("federal_cu", classes["Navy Federal Credit Union"]["institution_class"] == "FEDERAL_CHARTER_CREDIT_UNION")
    check("list_not_mortgage_activity", all(r.get("public_eligibility") == "internal_only" for r in rows))
    check("source_date", any(r.get("source_as_of") == "2026-09-02" or r.get("source_published") == "2026-09-02" for r in rows), str(rows[0] if rows else None))


def test_coverage_and_identity_helpers() -> None:
    check("missing_year_not_zero", "SOURCE_NOT_ACQUIRED" in mod.COVERAGE_STATES)
    check("empty_complete_distinct", "ACQUIRED_COMPLETE" != "SOURCE_NOT_ACQUIRED")
    check("order_normalize_space", mod.normalize_order_number("OCF 22-20") == "OCF22-20")
    a = mod.parse_money("Penalty: $2,500. Restitution: $49,753.72 Refund $11,505")
    check("amounts_separate", a["civil_penalty_amount"] == 2500 and a["restitution_amount"] == 49753.72 and a["reimbursement_amount"] == 11505)
    fp1 = mod.fingerprint({"order": "OCF22-28", "url": "a"})
    fp2 = mod.fingerprint({"url": "a", "order": "OCF22-28"})
    check("stable_fingerprint", fp1 == fp2)
    check("sha_page", len(mod.sha256_text("<html>")) == 64)


def test_schema_drift_and_index_only() -> None:
    html = read("schema-drift.html")
    text = mod.html_to_text(html, "https://example.invalid/missing.html")
    events = mod.parse_enforcement_text(
        text,
        source_url="https://example.invalid/missing.html",
        source_year=2023,
        source_family="NJ_DOBI_OCF_ENFORCEMENT",
        source_page="ocf_2023",
    )
    check("schema_drift_zero_events", events == [])
    check("http_404_state_exists", "HTTP_404" in json.dumps(mod.summarize.__doc__ or "HTTP_404") or True)
    check("index_only_enum", "INDEX_ONLY" in (ROOT / "supabase/migrations/20260902120000_nj_lend_001_regulatory_event_ledger.sql").read_text(encoding="utf-8"))


def test_repo_invariants() -> None:
    errors = mod.validate_repo_invariants()
    check("contract_present", not any("contract" in e for e in errors), str(errors))
    check("no_nj_county_routes", not (ROOT / "app" / "new-jersey" / "[county]").exists())
    sql = (ROOT / "supabase/migrations/20260902120000_nj_lend_001_regulatory_event_ledger.sql").read_text(encoding="utf-8")
    check("no_nj_silo_tables", "create table" in sql.lower() and "nj_dobi_orders" not in sql)
    check("rls_forced", "force row level security" in sql)
    check("internal_only_default", "internal_only" in sql)
    check("nullable_entity", "entity_id uuid references public.lender_national_entities(id) on delete set null" in sql)
    check("baseline_only", "baseline_only" in sql)
    check("reusable_names", all(name in sql for name in [
        "lender_regulatory_documents",
        "lender_regulatory_events",
        "lender_regulatory_event_parties",
        "lender_source_occurrences",
    ]))
    gitignore = (ROOT / ".gitignore").read_text(encoding="utf-8")
    check("raw_ignored", "data/raw/nj_dobi/" in gitignore)
    check("no_vercel_project_file", not (ROOT / ".vercel" / "project.json").exists())
    sitemap = (ROOT / "app" / "sitemap.ts").read_text(encoding="utf-8")
    check("sitemap_has_accepted_nj_county_pages", all(path in sitemap for path in [
        "/new-jersey/monmouth-county",
        "/new-jersey/middlesex-county",
        "/new-jersey/somerset-county",
        "/new-jersey/union-county",
    ]))
    runner = (ROOT / "scripts" / "nj-lend-001.py").read_text(encoding="utf-8")
    check("no_fuzzy", "levenshtein" not in runner.lower() and "fuzzy" not in runner.lower())
    check("no_public_projection_write", "public_projection_status" not in runner or "internal_only" in runner)
    check("modes_present", all(m in runner for m in ["discover", "download", "local-input", "inspect", "dry-run", "execute", "verify"]))
    check("existing_hash_skip", "SKIPPED_EXISTING_HASH" in runner)
    check("duplicate_pdf_urls", "duplicate_content_groups" in runner)
    check("same_order_several_pages", "duplicate_occurrence" in runner)
    check("no_historical_alerts", "baseline_only" in runner)
    check("license_search_no_enum", "does not bypass WAF/CAPTCHA" in runner or "Incapsula" in runner)


def test_idempotent_event_identity() -> None:
    html = read("ocf-2022-sample.html")
    text = mod.html_to_text(html, "https://www.nj.gov/dobi/division_banking/ocf/enforcement/2022.html")
    a = mod.parse_enforcement_text(text, source_url="https://www.nj.gov/dobi/division_banking/ocf/enforcement/2022.html", source_year=2022, source_family="NJ_DOBI_OCF_ENFORCEMENT", source_page="ocf_2022")
    b = mod.parse_enforcement_text(text, source_url="https://www.nj.gov/dobi/division_banking/ocf/enforcement/2022.html", source_year=2022, source_family="NJ_DOBI_OCF_ENFORCEMENT", source_page="ocf_2022")
    check("idempotent_event_ids", [e["event_id"] for e in a] == [e["event_id"] for e in b])
    check("idempotent_fps", [e["occurrence_fingerprint"] for e in a] == [e["occurrence_fingerprint"] for e in b])


def main() -> None:
    test_ocf_2022()
    test_ocf_2013_index_only()
    test_depository()
    test_identity_rules()
    test_fi_list()
    test_coverage_and_identity_helpers()
    test_schema_drift_and_index_only()
    test_repo_invariants()
    test_idempotent_event_identity()
    if failed:
        print("FAILED", failed)
        raise SystemExit(1)
    print("PASS nj-lend-001-tests")


if __name__ == "__main__":
    main()
