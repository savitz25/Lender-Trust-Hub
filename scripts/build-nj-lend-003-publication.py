#!/usr/bin/env python3
"""NJ-LEND-003 — deterministic public snapshot from committed artifacts.

Recomputes HMDA from the NJ county CSV. Does not invent missing fields.
Does not attach review-required / unresolved / individual identities.
"""
from __future__ import annotations

import csv
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HMDA = ROOT / "data" / "hmda" / "new-jersey" / "county_market_summary_nj.csv"
SNAP002 = ROOT / "data" / "reports" / "nj-lend-002-audited-state-snapshot.json"
SUM001 = ROOT / "data" / "generated" / "nj-lend-001" / "summary.json"
IDENTITY_001 = Path(r"C:\Users\Michael.Savitsky\lender-nj-lend-001\data\generated\nj-lend-001\identity-ledgers.json")
OUT_DIR = ROOT / "lib" / "new-jersey-intelligence"
REPORTS = ROOT / "data" / "reports"
CONTRACT = "lender-nj-state-intel-v1"

DPA_HIGH = [
    "Bergen", "Essex", "Hudson", "Hunterdon", "Mercer", "Middlesex",
    "Monmouth", "Morris", "Ocean", "Passaic", "Somerset", "Union",
]
DPA_STANDARD = [
    "Atlantic", "Burlington", "Camden", "Cape May", "Cumberland",
    "Gloucester", "Salem", "Sussex", "Warren",
]


def sha(obj: object) -> str:
    blob = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()


def hmda_from_csv() -> dict:
    counties = []
    with HMDA.open(encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            apps = int(row["total_applications"])
            orig = int(row["total_originations"])
            den = int(row["denial_count"])
            purch = int(row["purchase_count"])
            refi = int(row["refinance_count"])
            conv = int(row["apps_conventional"])
            fha = int(row["apps_fha"])
            va = int(row["apps_va"])
            usda = int(row["apps_usda_other"])
            counties.append({
                "county_fips": row["county_fips"],
                "county_name": row["county_name"],
                "applications": apps,
                "originations": orig,
                "denials": den,
                "denial_rate_pct": round(100.0 * den / apps, 2) if apps else None,
                "purchase_applications": purch,
                "refinance_applications": refi,
                "purchase_pct_of_apps": round(100.0 * purch / apps, 2) if apps else None,
                "refinance_pct_of_apps": round(100.0 * refi / apps, 2) if apps else None,
                "apps_conventional": conv,
                "apps_fha": fha,
                "apps_va": va,
                "apps_usda_other": usda,
                "conventional_pct": round(100.0 * conv / apps, 2) if apps else None,
                "fha_pct": round(100.0 * fha / apps, 2) if apps else None,
                "va_pct": round(100.0 * va / apps, 2) if apps else None,
            })
    apps = sum(c["applications"] for c in counties)
    orig = sum(c["originations"] for c in counties)
    den = sum(c["denials"] for c in counties)
    purch = sum(c["purchase_applications"] for c in counties)
    refi = sum(c["refinance_applications"] for c in counties)
    conv = sum(c["apps_conventional"] for c in counties)
    fha = sum(c["apps_fha"] for c in counties)
    va = sum(c["apps_va"] for c in counties)
    usda = sum(c["apps_usda_other"] for c in counties)
    year = 2025
    return {
        "year": year,
        "geo_grain": "state_and_county",
        "state_code": "NJ",
        "source": "Committed HMDA New Jersey slice (data/hmda/new-jersey/county_market_summary_nj.csv). Properties located in New Jersey. Not a second national download.",
        "source_as_of": "HMDA 2025",
        "coverage_state": "ACQUIRED_CURRENT_SNAPSHOT",
        "applications": apps,
        "originations": orig,
        "denials": den,
        "denial_rate_pct": round(100.0 * den / apps, 2),
        "denial_rate_calculation": "denials / applications * 100, rounded to 2 decimals",
        "purchase_applications": purch,
        "refinance_applications": refi,
        "purchase_pct_of_apps": round(100.0 * purch / apps, 2),
        "refinance_pct_of_apps": round(100.0 * refi / apps, 2),
        "apps_conventional": conv,
        "apps_fha": fha,
        "apps_va": va,
        "apps_usda_other": usda,
        "conventional_pct": round(100.0 * conv / apps, 2),
        "fha_pct": round(100.0 * fha / apps, 2),
        "va_pct": round(100.0 * va / apps, 2),
        "usda_other_pct": round(100.0 * usda / apps, 2),
        "county_count": len(counties),
        "all_21_counties": len(counties) == 21,
        "counties": sorted(counties, key=lambda c: c["county_name"]),
        "omitted": {
            "median_loan_amount": "Not present in the committed 2025 NJ summary extract.",
            "interest_rate": "Not present in the committed 2025 NJ summary extract.",
            "denial_reasons": "Not present in the committed 2025 NJ summary extract.",
        },
        "caveat": "HMDA describes reporting institutions in the statutory HMDA universe for properties located in New Jersey. It does not describe all lending activity. Denial rate is not a quality score. Disparity does not prove discrimination.",
    }


def public_hmfa_names(raw: dict) -> list[dict]:
    rows = []
    seen = set()
    for r in raw.get("participating_lenders") or []:
        name = (r.get("display_name") or r.get("legal_name") or "").strip()
        if not name:
            continue
        key = " ".join(name.lower().split())
        if key in seen:
            continue
        seen.add(key)
        rows.append({
            "name": name,
            "phone": r.get("phone"),
            "on_numbered_recent_activity_list": r.get("source_order") is not None,
        })
    rows.sort(key=lambda x: x["name"].lower())
    return rows


def exact_index() -> dict:
    nmls: set[str] = set()
    fdic: set[str] = set()
    refs: set[str] = set()
    if IDENTITY_001.exists():
        blob = json.loads(IDENTITY_001.read_text(encoding="utf-8"))
        for row in blob.get("exact") or []:
            method = row.get("match_method")
            if method == "EXACT_NMLS_INSTITUTION" and row.get("nmls_id"):
                nmls.add(str(row["nmls_id"]).strip())
            if method == "EXACT_NMLS_BRANCH":
                continue
            if method == "EXACT_NMLS_PERSON":
                continue
            if (row.get("identifier_type") == "FDIC_CERT" or method == "EXACT_FDIC") and row.get("identifier_value"):
                fdic.add(str(row["identifier_value"]).strip())
            if method == "EXACT_STATE_REFERENCE" and row.get("state_reference"):
                refs.add(str(row["state_reference"]).strip())
    return {
        "nmls_institution": sorted(nmls),
        "fdic_cert": sorted(fdic),
        "nj_state_reference": sorted(refs),
        "nmls_person_excluded": True,
        "nmls_branch_excluded_from_company_profile": True,
        "note": "Exact company identifiers only. Individual NMLS IDs are never used to populate a company profile.",
    }


def main() -> None:
    s002 = json.loads(SNAP002.read_text(encoding="utf-8"))
    s001 = json.loads(SUM001.read_text(encoding="utf-8"))
    hmda = hmda_from_csv()
    hmfa = s002["njhmfa_participating_lenders"]
    names = public_hmfa_names(hmfa)
    programs = []
    for p in s002["njhmfa_programs"]["programs"]:
        programs.append({
            "program_key": p["program_key"],
            "official_name": p["official_name"],
            "program_class": p["program_class"],
            "first_time_buyer_requirement": p.get("first_time_buyer_requirement"),
            "loan_type_raw": p.get("loan_type_raw"),
            "dpa_available": p.get("dpa_available"),
            "participating_lender_required": p.get("participating_lender_required"),
            "source_effective_on": p.get("source_effective_on"),
            "source_url": p.get("source_url"),
            "amount_raw": p.get("amount_raw"),
        })
    dpa_geo = s002["njhmfa_programs"]["dpa_geography"]
    high = sorted({r["county"] for r in dpa_geo if r["group"] == "HIGH"})
    standard = sorted({r["county"] for r in dpa_geo if r["group"] == "STANDARD"})
    bulletins = s002["njhmfa_policy"]["bulletins"]
    fi = s001["financial_institution_list"]
    ident = s001["identity_results"]
    events = s001["event_results"]
    acq = s001["acquisition"]
    cov = s001["source_coverage"]
    exact = exact_index()

    payload = {
        "contract_name": CONTRACT,
        "version": "1.0.0",
        "geography": "NJ",
        "publication_status": "published",
        "path": "/new-jersey",
        "source_as_of": {
            "hmda": "HMDA 2025",
            "njhmfa_lenders": hmfa.get("source_date"),
            "njhmfa_programs_limits": s002["njhmfa_programs"]["current_source_dates"].get("limits"),
            "dobi_fi_list": fi.get("source_rows") and "2026-09-02",
            "dobi_enforcement": "acquired through 2022 OCF year pages; later years SOURCE_NOT_ACQUIRED",
        },
        "hero": {
            "universe_label": "HMDA applications",
            "universe_value": hmda["applications"],
            "universe_hint": "2025 HMDA applications for properties located in New Jersey. Not a count of NJ-licensed mortgage companies.",
            "current_label": "HMDA originations",
            "current_value": hmda["originations"],
            "observations_label": "DOBI unique orders",
            "observations_value": acq["unique_order_numbers"],
            "geography_label": "Counties in HMDA slice",
            "geography_value": 21,
            "as_of_label": "HMDA vintage",
            "as_of_value": "2025",
        },
        "hmda": hmda,
        "dobi": {
            "index_occurrences": acq["index_occurrences"],
            "unique_orders": acq["unique_order_numbers"],
            "unique_documents": acq["unique_hashes"],
            "multi_party_orders": acq["multi_party_orders"],
            "action_mix": events["class_counts"],
            "status_mix": events["status_counts"],
            "flags": {
                "revocations": events["revocations"],
                "suspensions": events["suspensions"],
                "surrenders": events["surrenders"],
                "penalties": events["penalties"],
            },
            "respondents": {
                "institutions": s001["respondents"]["institutions"],
                "mortgage_companies": s001["respondents"]["mortgage_companies"],
                "branches": s001["respondents"]["branches"],
                "individuals_held_internal": s001["respondents"]["internal_only_individuals"],
                "party_type_counts": s001["respondents"]["party_type_counts"],
            },
            "identity": {
                "exact_nmls_institution": ident["exact_nmls_institution"],
                "exact_nmls_branch": ident["exact_nmls_branch"],
                "exact_nmls_person_internal": ident["exact_nmls_person"],
                "exact_fdic": ident["exact_fdic"],
                "exact_state_reference": ident["exact_state_reference"],
                "unresolved": ident["unresolved"],
                "unsafe_rejected": ident["unsafe_rejected"],
            },
            "ocf_years": cov["ocf_years"],
            "caveat": "This is the acquired DOBI enforcement corpus, not every action ever issued. 2023–2026 OCF year pages were SOURCE_NOT_ACQUIRED and must not be read as zero actions. Unresolved respondents are not attached to public company profiles. Individuals stay internal-only.",
        },
        "financial_institutions": {
            "source_rows": fi["source_rows"],
            "source_url": "https://www.nj.gov/dobi/bankwebinfo.htm",
            "source_as_of": "2026-09-02",
            "classes": fi["classes"],
            "state_chartered_banks_and_savings": fi["state_chartered_banks"],
            "state_chartered_credit_unions": fi["state_chartered_credit_unions"],
            "federal_charters": fi["federal_charters"],
            "caveat": "Charter type is not a mortgage license, not a broker license, and not NJHMFA participation. Appearance on this list is not a consumer recommendation.",
        },
        "njhmfa": {
            "programs": programs,
            "dpa": {
                "source_effective_on": "2026-06-17",
                "source": "Smart Start Plus / First Generation fact sheet and current NJHMFA program pages",
                "high": {
                    "counties": high,
                    "standard_dpa": 15000,
                    "first_generation": 7000,
                    "combined": 22000,
                    "copy": "Eligible borrowers may qualify for up to $15,000 in NJHMFA Down Payment Assistance, plus $7,000 first-generation assistance where eligible (potential combined up to $22,000).",
                },
                "standard": {
                    "counties": standard,
                    "standard_dpa": 10000,
                    "first_generation": 7000,
                    "combined": 17000,
                    "copy": "Eligible borrowers may qualify for up to $10,000 in NJHMFA Down Payment Assistance, plus $7,000 first-generation assistance where eligible (potential combined up to $17,000).",
                },
                "caveat": "County of the property does not by itself qualify a borrower. Amounts are 'up to' and require program eligibility.",
            },
            "participating_lenders": {
                "count": len(names),
                "source_date": hmfa.get("source_date"),
                "source_url": hmfa.get("source_url"),
                "source_hash": hmfa.get("source_hash"),
                "consumer_safe_label": "Lenders appearing on NJHMFA's April 2026 participating-lender activity list",
                "grain": "Names printed on the official activity/listing PDF. Approved participants with zero sales in the prior six months are omitted. This is not the complete current approved-lender universe.",
                "exact_nmls_printed": 0,
                "review_required_alias_matches_withheld_from_profiles": hmfa.get("review_required"),
                "unresolved_names_list_only": hmfa.get("unresolved"),
                "names": names,
                "caveat": "Participation is not an endorsement, recommendation, or quality ranking. Source ordering by loans sold is not a recommendation. Names are not attached to NMLS profiles from this list.",
            },
            "bulletins": {
                "count": len(bulletins),
                "latest": bulletins[-1]["number"] if bulletins else None,
                "latest_title": bulletins[-1]["title"] if bulletins else None,
                "highlights": [
                    {"number": b["number"], "title": b["title"], "url": b["url"]}
                    for b in bulletins[-3:]
                ],
                "caveat": "A policy bulletin is not adverse evidence against participating lenders.",
            },
        },
        "servicer": {
            "roster_acquired": False,
            "annual_report_results_acquired": False,
            "classes_documented": s002["servicer"]["classes_documented"],
            "worksheet_fields": s002["servicer"].get("worksheet_fields") or [],
            "filing_due": s002["servicer"].get("filing_due"),
            "copy": "New Jersey maintains a mortgage-servicer framework separate from an RMLA lender license. The 2025 annual-report worksheet distinguishes mortgage-servicer licensees from RMLA-licensed mortgage-servicer registrants. Licensee-level annual-report results (loans serviced, delinquency, foreclosures commenced) have not been acquired as a public file.",
            "caveat": "Do not read a missing roster as zero servicers, zero delinquencies, or zero foreclosures. Delinquency is not misconduct. Foreclosure commenced is not a violation.",
        },
        "rmla": {
            "bulk_roster": False,
            "coverage_state": "SOURCE_AVAILABLE_BY_REQUEST",
            "copy": "The public RMLA pages describe how companies apply through NMLS. They are not a bulk licensee roster. Absence from an active-only search is not proof a company is unlicensed.",
        },
        "complaints": {
            "public_aggregates": False,
            "coverage_state": "SOURCE_AVAILABLE_BY_REQUEST",
            "caveat": "A complaint is not a violation. No complaint score is published.",
        },
        "coverage": [
            {"family": "HMDA", "coverage": "ACQUIRED_CURRENT_SNAPSHOT", "as_of": "HMDA 2025", "grain": "state and 21 counties, property location"},
            {"family": "NJDOBI enforcement", "coverage": "ACQUIRED_PARTIAL_HISTORY", "as_of": "OCF 2014–2022 complete; 2023–2026 not acquired", "grain": "index occurrences / orders / documents"},
            {"family": "NJDOBI financial institutions", "coverage": "ACQUIRED_CURRENT_SNAPSHOT", "as_of": "2026-09-02", "grain": "official current list, 114 rows"},
            {"family": "RMLA licensing framework", "coverage": "SOURCE_AVAILABLE_BY_REQUEST", "as_of": None, "grain": "application classes, not a roster"},
            {"family": "Mortgage servicer framework", "coverage": "SOURCE_AVAILABLE_BY_REQUEST", "as_of": "2025 worksheet / 2026 filing", "grain": "class distinction, not results"},
            {"family": "NJHMFA programs", "coverage": "ACQUIRED_CURRENT_SNAPSHOT", "as_of": "2026-06-17", "grain": "program families and county limits"},
            {"family": "NJHMFA lender source", "coverage": "ACQUIRED_CURRENT_SNAPSHOT", "as_of": "2026-04-01", "grain": "activity list, incomplete vs all approved"},
            {"family": "NJHMFA bulletins", "coverage": "ACQUIRED_CURRENT_SNAPSHOT", "as_of": "2026 portal index", "grain": "2026-1 through 2026-10"},
        ],
        "gaps": [
            "Complete machine-readable RMLA license roster",
            "Historical RMLA status file",
            "Complete mortgage-servicer roster",
            "Servicer annual-report results",
            "DOBI complaint aggregates",
            "Exact NMLS IDs for many NJHMFA names",
        ],
        "profile_modules": {
            "exact_nmls_institution_ids": len(exact["nmls_institution"]),
            "exact_fdic_certs": len(exact["fdic_cert"]),
            "exact_nj_state_references": len(exact["nj_state_reference"]),
            "high_confidence_attached": 0,
            "withheld_review_required": hmfa.get("review_required"),
            "withheld_unresolved": ident["unresolved"],
            "individuals_not_copied_to_employer": True,
            "populated_order_histories": 0,
            "note": "Profile modules may note an exact identifier match. They do not publish unresolved names, review-required aliases, or individual orders on a company profile. Full order histories remain on the state corpus until a later evidence module is populated.",
        },
        "invariants": [
            "UNAVAILABLE_NE_ZERO",
            "RMLA_ABSENCE_NE_UNLICENSED",
            "NJHMFA_NE_ENDORSEMENT",
            "NJHMFA_LIST_NE_COMPLETE_APPROVED_UNIVERSE",
            "COMPLAINT_NE_VIOLATION",
            "HMDA_DISPARITY_NE_DISCRIMINATION",
            "DELINQUENCY_NE_MISCONDUCT",
            "NO_RANKING",
            "NO_TRUST_SCORE",
            "NO_MLO_DIRECTORY",
            "NO_COUNTY_ROUTES",
        ],
    }
    fingerprint = sha({k: v for k, v in payload.items()})
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    payload["fingerprint"] = fingerprint
    payload["generated_at"] = generated_at

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "accepted-snapshot.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    (OUT_DIR / "exact-attachment-index.json").write_text(json.dumps(exact, indent=2), encoding="utf-8")
    (REPORTS / "nj-lend-003-publication-snapshot.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print("fingerprint", fingerprint)
    print("hmda", hmda["applications"], hmda["originations"], hmda["denials"], hmda["denial_rate_pct"])
    print("counties", hmda["county_count"], "hmfa names", len(names), "exact nmls", len(exact["nmls_institution"]))


if __name__ == "__main__":
    main()
