#!/usr/bin/env python3
"""MA-LEND-001 — Massachusetts LenderTrustHub state snapshot.

Allowed: Massachusetts Division of Banks approved-licensee XLSX files (as of 2026-06-30) for mortgage
lenders, mortgage brokers, and mortgage loan originators; the DOB enforcement-action table (2021-2026,
mortgage-related rows); the committed HMDA 2025 MA partition; the existing FDIC MA overlay.
Forbidden: NMLS scrape, name-only joins, combined "Massachusetts lenders" totals, public MLO person
pages, county/city/property datasets, HMDA re-ingest, parsing order PDFs.

Stage 1 (needs raw sources, some kept private): scripts/parse_ma_dob_sources.py
Stage 2 (this file; committed derived inputs only): snapshot + compact company lookup + fingerprint.
  --check  rebuild and compare the fingerprint with the committed accepted snapshot.
"""
from __future__ import annotations

import csv
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STAGE = ROOT / "data" / "massachusetts" / "ma-lend-001"
LIB = ROOT / "lib" / "massachusetts-intelligence"
ART = ROOT / "artifacts"
HMDA_COUNTY = ROOT / "data" / "hmda" / "by-state" / "MA" / "county_market_summary.csv"
HMDA_LENDER = ROOT / "data" / "hmda" / "by-state" / "MA" / "lender_state_summary.csv"
HMDA_CURATED = ROOT / "data" / "hmda" / "massachusetts" / "lei_to_nmls_mapping.csv"
HMDA_INDEX = ROOT / "data" / "hmda" / "by-state" / "index.json"
FDIC_MA = ROOT / "lib" / "fdic" / "data" / "massachusetts.json"
GENERATED_AT = "2026-09-24T15:07:00Z"
CHECK = "--check" in sys.argv
SOURCE_AS_OF = "2026-06-30"
CITIES = ["Boston", "Worcester", "Springfield", "Newton", "Quincy", "Lowell", "Fall River", "Waltham", "Framingham", "Burlington"]


def load(name: str):
    return json.loads((STAGE / name).read_text(encoding="utf-8"))


def num(row: dict, key: str) -> int:
    raw = (row.get(key) or "0").replace(",", "").strip()
    try:
        return int(float(raw))
    except ValueError:
        return 0


def pct(n: int, d: int) -> float:
    return round((n / d) * 100, 2) if d else 0.0


def hmda_block(dob_company_ids: set[str]) -> dict:
    rows = list(csv.DictReader(HMDA_COUNTY.open(encoding="utf-8")))
    counties = []
    for r in rows:
        counties.append(
            {
                "county_fips": (r.get("county_fips") or "").strip().zfill(5),
                "county_name": (r.get("county_name") or "").strip(),
                "applications": num(r, "total_applications"),
                "originations": num(r, "total_originations"),
                "denials": num(r, "denial_count"),
                "purchase_applications": num(r, "purchase_count"),
                "refinance_applications": num(r, "refinance_count"),
                "apps_conventional": num(r, "apps_conventional"),
                "apps_fha": num(r, "apps_fha"),
                "apps_va": num(r, "apps_va"),
            }
        )
    counties.sort(key=lambda c: (-c["applications"], c["county_fips"]))
    s = lambda k: sum(c[k] for c in counties)
    apps, orig, den = s("applications"), s("originations"), s("denials")
    agg = {k: 0 for k in ("purpose_other_count", "apps_usda_other")}
    for r in rows:
        for k in agg:
            agg[k] += num(r, k)
    leis = [r for r in csv.DictReader(HMDA_LENDER.open(encoding="utf-8")) if (r.get("lei") or "").strip()]
    curated = list(csv.DictReader(HMDA_CURATED.open(encoding="utf-8")))
    curated_nmls = {"".join(ch for ch in (r.get("nmls_id") or "") if ch.isdigit()) for r in curated} - {""}
    idx = (json.loads(HMDA_INDEX.read_text(encoding="utf-8")).get("by_state") or {}).get("MA") or {}
    return {
        "year": 2025,
        "state_code": "MA",
        "source": "Committed HMDA 2025 Massachusetts partition data/hmda/by-state/MA/county_market_summary.csv (reused; not re-ingested).",
        "source_as_of": "HMDA 2025",
        "retrieved_at": None,
        "coverage_state": "KNOWN",
        "applications": apps,
        "originations": orig,
        "denials": den,
        "denials_as_pct_of_total_applications": pct(den, apps),
        "denial_pct_numerator_denial_observations": den,
        "denial_pct_denominator_total_applications": apps,
        "purchase_applications": s("purchase_applications"),
        "refinance_applications": s("refinance_applications"),
        "purpose_other_applications": agg["purpose_other_count"],
        "apps_conventional": s("apps_conventional"),
        "apps_fha": s("apps_fha"),
        "apps_va": s("apps_va"),
        "apps_usda_other": agg["apps_usda_other"],
        "county_count": len(counties),
        "counties": counties,
        "distinct_leis": len({r["lei"].strip() for r in leis}),
        "index_json_applications": idx.get("applications"),
        "index_json_originations": idx.get("originations"),
        "existing_curated_lei_to_nmls_rows": len(curated),
        "existing_curated_distinct_nmls": len(curated_nmls),
        "existing_curated_nmls_on_dob_company_files": len(curated_nmls & dob_company_ids),
        "lei_nmls_bridge": "REUSED_EXISTING_CURATED_MAP_ONLY — no new NMLS↔LEI bridge in this ticket",
        "application_is_not_lender": True,
        "lei_is_not_ma_license": True,
        "caveat": (
            "HMDA counts applications for properties located in Massachusetts. An application is not a lender. "
            "An HMDA LEI is not a Massachusetts DOB license. Property county is not headquarters or service area."
        ),
    }


def license_block(stats: dict, companies: list[dict], mlo: dict) -> dict:
    L, B, X = stats["lender"], stats["broker"], stats["cross_file"]
    cities = {}
    for city in CITIES:
        key = city.lower()
        out = {}
        for kind in ("lender", "broker"):
            main = 0
            anyloc = 0
            branch_rows = 0
            for c in companies:
                cred = c["credentials"].get(kind)
                if not cred:
                    continue
                m = cred["main_office"] or {}
                is_main = m.get("state") == "MA" and (m.get("city") or "").strip().lower() == key
                brs = [b for b in cred["branches"] if b["state"] == "MA" and b["city"].strip().lower() == key]
                main += int(is_main)
                anyloc += int(is_main or bool(brs))
                branch_rows += len(brs)
            out[kind] = {
                "companies_main_office_in_city": main,
                "companies_with_any_licensed_location_in_city": anyloc,
                "branch_license_rows_in_city": branch_rows,
            }
        cities[city] = out
    return {
        "authority": "Massachusetts Division of Banks (DOB)",
        "source_page": "https://www.mass.gov/lists/download-a-list-of-approved-licensees",
        "source_semantics": "DOB: lists are updated on a quarterly basis; all businesses listed are approved and authorized to conduct business in Massachusetts.",
        "source_as_of": SOURCE_AS_OF,
        "retrieved_at": L["retrieved_at"],
        "status_vocabulary": "APPROVED_AND_AUTHORIZED_AS_OF_2026_06_30 (source wording; no ACTIVE/INACTIVE field, no issue or expiration date in the files)",
        "company_key": "NMLS:{Company ID}",
        "branch_key": "NMLS branch:{Branch ID}",
        "lender": {
            "coverage_state": "KNOWN",
            "grain": "company license row + branch license rows + trade-name rows",
            "source_url": L["source_url"],
            "source_sha256": L["source_sha256"],
            "source_file": L["source_file"],
            "columns": L["columns"],
            "total_rows": L["total_rows"],
            "company_license_rows": L["company_license_rows"],
            "distinct_company_nmls_ids": L["distinct_company_nmls_ids"],
            "branch_license_rows": L["branch_license_rows"],
            "distinct_nmls_branch_ids": L["distinct_nmls_branch_ids"],
            "trade_name_rows": L["trade_name_rows"],
            "main_office_in_ma": L["company_rows_main_office_in_ma"],
            "branch_rows_in_ma": L["branch_rows_in_ma"],
            "source_anomaly_rows": L["source_anomaly_rows"],
        },
        "broker": {
            "coverage_state": "KNOWN",
            "grain": "company license row + branch license rows + trade-name rows",
            "source_url": B["source_url"],
            "source_sha256": B["source_sha256"],
            "source_file": B["source_file"],
            "columns": B["columns"],
            "total_rows": B["total_rows"],
            "company_license_rows": B["company_license_rows"],
            "distinct_company_nmls_ids": B["distinct_company_nmls_ids"],
            "branch_license_rows": B["branch_license_rows"],
            "distinct_nmls_branch_ids": B["distinct_nmls_branch_ids"],
            "trade_name_rows": B["trade_name_rows"],
            "main_office_in_ma": B["company_rows_main_office_in_ma"],
            "branch_rows_in_ma": B["branch_rows_in_ma"],
            "source_anomaly_rows": B["source_anomaly_rows"],
        },
        "mlo": {
            "coverage_state": "KNOWN",
            "grain": "PERSON",
            "source_url": mlo["source_url"],
            "source_sha256": mlo["source_sha256"],
            "source_file_committed": False,
            "columns": mlo["columns"],
            "rows": mlo["rows"],
            "distinct_person_nmls_ids": mlo["distinct_person_nmls_ids"],
            "nmls_ids_on_more_than_one_row": mlo["nmls_ids_on_more_than_one_row"],
            "rows_with_sponsoring_company_name": mlo["rows_with_sponsoring_company_name"],
            "rows_without_sponsoring_company_name": mlo["rows_without_sponsoring_company_name"],
            "rows_license_digits_ne_nmls_id": mlo["rows_license_digits_ne_nmls_id"],
            "sponsor_company_join": "UNSUPPORTED",
            "public_person_pages": "NONE",
            "person_is_not_company": True,
            "not_added_to_company_counts": True,
        },
        "cross_file": X,
        "city_filters": {
            "grain": "DOB-listed licensed location address (main office or branch) in a Massachusetts city",
            "not_service_area": True,
            "not_a_local_license_system": True,
            "cities": cities,
        },
        "branches_ne_companies": True,
        "trade_name_rows_ne_companies": True,
        "no_combined_total": True,
    }


def enforcement_block(enf: dict) -> dict:
    events = enf["events"]
    parties = [p for e in events for p in e["parties"]]
    fam = Counter(f for e in events for f in e["action_families"])
    yrs = Counter(e["action_date"][:4] for e in events)
    company_exact = [p for p in parties if p["respondent_class"] == "COMPANY" and p["attachment"] == "EXACT_NMLS_PRINTED"]
    return {
        "authority": "Massachusetts Division of Banks (DOB)",
        "source_page": enf["source_page"],
        "source_sha256": enf["source_sha256"],
        "retrieved_at": enf["retrieved_at"],
        "coverage_state": "PARTIAL",
        "window": "Action dates 2021-03-16 through 2026-08-12 (DOB table sections 2021-2026)",
        "window_section_years": enf["window_section_years"],
        "filter": enf["filter"],
        "all_table_rows_on_page": enf["all_table_rows_on_page"],
        "mortgage_related_events": len(events),
        "events_by_year": dict(sorted(yrs.items())),
        "action_families": dict(sorted(fam.items())),
        "company_party_rows": sum(1 for p in parties if p["respondent_class"] == "COMPANY"),
        "person_party_rows": sum(1 for p in parties if p["respondent_class"] == "PERSON"),
        "events_with_company_respondent": sum(1 for e in events if any(p["respondent_class"] == "COMPANY" for p in e["parties"])),
        "events_with_person_respondent_only": sum(1 for e in events if all(p["respondent_class"] == "PERSON" for p in e["parties"])),
        "exact_company_nmls_attachments": len(company_exact),
        "distinct_companies_attached": len({p["nmls_printed"] for p in company_exact}),
        "attached_companies_on_current_dob_files": len(
            {p["nmls_printed"] for p in company_exact if p["in_dob_lender_file_2026_06_30"] or p["in_dob_broker_file_2026_06_30"]}
        ),
        "person_exact_nmls_printed": sum(1 for p in parties if p["respondent_class"] == "PERSON" and p["attachment"] == "EXACT_NMLS_PRINTED"),
        "ambiguous_multi_party_rows": sum(1 for p in parties if p["attachment"] == "AMBIGUOUS_MULTI_PARTY_NMLS"),
        "no_nmls_printed_rows": sum(1 for p in parties if p["attachment"] == "NO_NMLS_PRINTED"),
        "name_only_attachments": 0,
        "person_names_published": False,
        "order_text_parsed": False,
        "events": events,
        "caveat": (
            "Each row is a DOB enforcement-table event. The action type is kept as DOB printed it "
            "(Consent Order, Settlement Agreement, Temporary Order to Cease and Desist, Order of Suspension, "
            "Order of Revocation, Order to Show Cause). A temporary order or an order to show cause is not a "
            "final order. Order text was not parsed, so admission, denial, and settlement-only language is "
            "unknown here. An event is not a TrustHub finding and is attached to a company only when DOB "
            "printed that company's NMLS number. Individual respondents are counted but not named."
        ),
    }


def compact_companies(companies: list[dict]) -> list[dict]:
    out = []
    for c in companies:
        row = {"n": c["nmls_company_id"], "name": c["company_name"], "holds": c["holds"]}
        for kind, cred in c["credentials"].items():
            m = cred["main_office"] or {}
            row[kind] = {
                "lic": cred["license_numbers"],
                "city": m.get("city"),
                "st": m.get("state"),
                "branches": len(cred["branches"]),
                "branchesMA": sum(1 for b in cred["branches"] if b["state"] == "MA"),
                "tradeNameRows": cred["trade_name_rows"],
            }
        out.append(row)
    return out


def main() -> int:
    stats = load("dob-license-stats.json")
    companies = load("dob-company-credentials.json")
    mlo = load("dob-mlo-population.json")
    enf = load("dob-enforcement-events.json")
    prod = load("prod-identity-audit-summary.json")
    ids = {c["nmls_company_id"] for c in companies}
    hmda = hmda_block(ids)
    lic = license_block(stats, companies, mlo)
    enforcement = enforcement_block(enf)
    fdic = json.loads(FDIC_MA.read_text(encoding="utf-8"))
    if hmda["applications"] != hmda["index_json_applications"]:
        raise SystemExit("MA HMDA county sum drifted from index.json")
    if lic["lender"]["distinct_company_nmls_ids"] + lic["broker"]["distinct_company_nmls_ids"] - lic["cross_file"]["companies_holding_lender_and_broker"] != lic["cross_file"]["distinct_company_nmls_ids_any_file"]:
        raise SystemExit("company identity arithmetic drifted")
    snapshot = {
        "contract_name": "lender-ma-state-intel-v1",
        "version": "1.0.0",
        "ticket": "MA-LEND-001",
        "geography": "MA",
        "publication_status": "published",
        "path": "/massachusetts",
        "generated_at": GENERATED_AT,
        "source_as_of": {
            "dob_license_files": SOURCE_AS_OF,
            "dob_enforcement": "action_date per event (latest 2026-08-12)",
            "hmda": "HMDA 2025",
            "fdic": fdic.get("updated"),
        },
        "clock_reconciliation": {
            "license_source_as_of": SOURCE_AS_OF,
            "license_retrieved_at": lic["retrieved_at"],
            "enforcement_retrieved_at": enforcement["retrieved_at"],
            "generated_at": GENERATED_AT,
            "quarterly_file_date_is_not_expiration": True,
            "retrieval_is_not_license_effective_date": True,
            "nmls_is_current_verification_path": True,
        },
        "regulators": {
            "name": "Massachusetts Division of Banks",
            "short": "DOB",
            "licensees": "https://www.mass.gov/lists/download-a-list-of-approved-licensees",
            "verify": "https://www.mass.gov/how-to/verify-a-financial-services-licensee",
            "enforcement": "https://www.mass.gov/info-details/enforcement-actions-issued-by-the-division-of-banks",
            "complaints": "https://www.mass.gov/info-details/filing-a-consumer-financial-complaint",
            "consumer": "https://www.mass.gov/info-details/mortgage-lender-broker-and-loan-originator-information-for-consumers",
            "nmls": "https://www.nmlsconsumeraccess.org/",
            "nmls_role": "Licensing system of record DOB uses for applications and public verification. Not a federal-only list and not the Massachusetts regulator.",
        },
        "licenses": lic,
        "enforcement": enforcement,
        "hmda": hmda,
        "complaints": {
            "dob_complaint_process": "KNOWN",
            "dob_process_note": "DOB's Consumer Assistance Unit handles complaints about mortgage lenders, brokers, and loan originators it licenses.",
            "public_provider_level_dataset": "NOT_ACQUIRED",
            "provider_level_access": "REQUEST_ONLY",
            "cfpb_substituted": False,
            "complaint_is_not_violation": True,
        },
        "depository": {
            "source": "Existing LenderTrustHub FDIC Massachusetts overlay (lib/fdic/data/massachusetts.json)",
            "fdic_rows": len(fdic.get("banks") or []),
            "source_as_of": fdic.get("updated"),
            "not_in_mortgage_license_counts": True,
        },
        "existing_coverage_audit": prod,
        "identity": {
            "company": "One company identity per NMLS Company ID. Lender and broker licenses are separate MA credential relationships on that identity.",
            "person": "MLO identity is the individual NMLS ID. Not joined to a company by sponsor name.",
            "branch": "NMLS Branch ID from the DOB file. Branch is not a company.",
            "enforcement": "Attached only when DOB printed the respondent's NMLS number for that single respondent.",
            "rejected_joins": [
                "Name-only company match",
                "MLO sponsor company name to company NMLS",
                "Name-only adverse attachment",
                "HMDA LEI to MA license without the existing curated map",
                "Main-office address inferred as a branch",
            ],
        },
        "expansion_ledger": {
            "NET_NEW_CANONICAL_ORGANIZATIONS": 0,
            "NET_NEW_PUBLIC_LENDER_PROFILES": 0,
            "NET_NEW_PUBLIC_PERSON_PAGES": 0,
            "MA_CREDENTIAL_RELATIONSHIPS": lic["lender"]["company_license_rows"] + lic["broker"]["company_license_rows"],
            "GRAPH_WRITES": 0,
            "CLAIM_ELIGIBILITY_BROADENED": False,
        },
        "capability_matrix": [
            {"capability": "DOB mortgage lender licensee file", "state": "KNOWN"},
            {"capability": "DOB mortgage broker licensee file", "state": "KNOWN"},
            {"capability": "DOB mortgage loan originator licensee file (person grain)", "state": "KNOWN"},
            {"capability": "Branch license rows listed in the DOB lender and broker files", "state": "KNOWN"},
            {"capability": "Issue or expiration dates per license", "state": "UNSUPPORTED"},
            {"capability": "DOB mortgage enforcement table 2021-2026", "state": "PARTIAL"},
            {"capability": "DOB enforcement before 2021", "state": "NOT_ACQUIRED"},
            {"capability": "Enforcement order text (admissions, findings)", "state": "NOT_ACQUIRED"},
            {"capability": "Name-only enforcement attachment", "state": "UNSUPPORTED"},
            {"capability": "Public MLO person pages", "state": "UNSUPPORTED"},
            {"capability": "MLO to sponsoring company NMLS link", "state": "UNSUPPORTED"},
            {"capability": "DOB provider-level complaint records", "state": "REQUEST_ONLY"},
            {"capability": "HMDA 2025 Massachusetts activity", "state": "KNOWN"},
            {"capability": "New NMLS to LEI bridge", "state": "UNSUPPORTED"},
            {"capability": "Combined Massachusetts lender total", "state": "UNSUPPORTED"},
            {"capability": "Third-party loan servicer and other DOB license files", "state": "NOT_ACQUIRED"},
            {"capability": "Current status after 2026-06-30", "state": "UNKNOWN"},
        ],
        "deferred": [
            "Third-party loan servicer, small loan, consumer finance, debt collector, money transmitter, and vehicle finance DOB files",
            "DOB enforcement before 2021 and order-document text",
            "DOB complaint records (request only)",
            "County, city, deed, foreclosure, UCC, and court data",
        ],
        "semantic_guardrails": [
            "lender != broker",
            "company != MLO",
            "branch != company",
            "trade-name row != company",
            "license != HMDA activity",
            "HMDA LEI != Massachusetts license",
            "enforcement event != entity",
            "temporary order != final order",
            "complaint != violation",
            "missing != zero",
            "no combined Massachusetts lender total",
            "no ranking, no Trust Score",
        ],
        "noCombinedDenominator": True,
        "noLocalRoutes": True,
        "statewideOnly": True,
        "no_ranking": True,
        "no_trust_score": True,
    }
    blob = json.dumps(snapshot, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    snapshot["fingerprint"] = hashlib.sha256(blob).hexdigest()
    lookup = compact_companies(companies)
    if CHECK:
        committed = json.loads((LIB / "accepted-snapshot.json").read_text(encoding="utf-8"))
        if committed.get("fingerprint") != snapshot["fingerprint"]:
            raise SystemExit(f"MA snapshot fingerprint drifted: builder={snapshot['fingerprint']} committed={committed.get('fingerprint')}")
        if json.loads((LIB / "dob-companies.json").read_text(encoding="utf-8")) != lookup:
            raise SystemExit("MA DOB company lookup drifted from derived credentials")
        print("fingerprint check OK", snapshot["fingerprint"])
        return 0
    ART.mkdir(parents=True, exist_ok=True)
    LIB.mkdir(parents=True, exist_ok=True)
    text = json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n"
    (ART / "ma-lend-001-public-snapshot.json").write_text(text, encoding="utf-8")
    (LIB / "accepted-snapshot.json").write_text(text, encoding="utf-8")
    (LIB / "dob-companies.json").write_text(json.dumps(lookup, separators=(",", ":"), ensure_ascii=False) + "\n", encoding="utf-8")
    print("fingerprint", snapshot["fingerprint"])
    print("lender", lic["lender"]["distinct_company_nmls_ids"], "broker", lic["broker"]["distinct_company_nmls_ids"], "mlo", lic["mlo"]["distinct_person_nmls_ids"])
    print("enforcement", enforcement["mortgage_related_events"], "company exact", enforcement["exact_company_nmls_attachments"])
    print("hmda", hmda["applications"], hmda["originations"], hmda["denials"])
    print("cities", {k: (v["lender"]["companies_with_any_licensed_location_in_city"], v["broker"]["companies_with_any_licensed_location_in_city"]) for k, v in lic["city_filters"]["cities"].items()})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
